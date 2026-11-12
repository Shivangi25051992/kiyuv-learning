import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
  computeLockoutOutcome,
  handleSetPin,
  handleVerifyPin,
  type DecodedAuthContext,
  type PinSecretDocument,
  type PinSecretsStore,
} from './pinService.js';
import {
  decryptKidName,
  encryptKidName,
  MAX_ENCRYPTED_LENGTH,
} from './nameCrypto.js';
import { requireFreshPin } from './authGuard.js';
import { nameKeySecret, pinPepperSecret } from './secrets.js';

export * from './groupFunctions.js';
export * from './accountFunctions.js';

if (getApps().length === 0) {
  initializeApp();
}


/** Fails closed: there is no built-in default pepper. */
function requirePepper(): string {
  const value = pinPepperSecret.value();
  if (!value || value.length < 32) {
    throw new HttpsError('failed-precondition', 'PIN service is not configured.');
  }
  return value;
}

function createFirestorePinStore(): PinSecretsStore {
  const db = getFirestore();
  const auth = getAuth();

  return {
    async getSecret(uid: string): Promise<PinSecretDocument | null> {
      const snap = await db.doc(`pinSecrets/${uid}`).get();
      if (!snap.exists) return null;
      return snap.data() as PinSecretDocument;
    },

    async saveSecret(uid: string, docData: PinSecretDocument): Promise<void> {
      const userRef = db.doc(`users/${uid}`);
      await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        tx.set(db.doc(`pinSecrets/${uid}`), {
          ...docData,
          updatedAt: FieldValue.serverTimestamp(),
        });
        if (userSnap.exists) {
          tx.update(userRef, { pinConfigured: true });
        } else {
          // Create the full baseline document the client rules expect, so the
          // client's later "update" passes validation on a brand-new account.
          tx.set(userRef, {
            createdAt: FieldValue.serverTimestamp(),
            lastActiveDate: new Date().toISOString().slice(0, 10),
            locale: 'en',
            resetEpoch: 0,
            schemaVersion: 1,
            pinConfigured: true,
          });
        }
      });
    },

    async reserveAttemptTransaction(uid: string, nowMs: number) {
      const ref = db.doc(`pinSecrets/${uid}`);
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) {
          return { allowed: false as const, reason: 'not_configured' as const };
        }
        const data = snap.data() as PinSecretDocument;
        if (data.requiresReset || data.failedAttempts >= 10) {
          return { allowed: false as const, reason: 'hard_locked' as const };
        }
        if (data.lockedUntilMs && data.lockedUntilMs > nowMs) {
          return {
            allowed: false as const,
            reason: 'soft_locked' as const,
            lockedUntilMs: data.lockedUntilMs,
          };
        }

        const attemptNumber = (data.failedAttempts || 0) + 1;
        const preOutcome = computeLockoutOutcome(attemptNumber, nowMs);
        tx.update(ref, {
          failedAttempts: attemptNumber,
          lockedUntilMs: preOutcome.lockedUntilMs,
          requiresReset: preOutcome.requiresReset,
          updatedAtMs: nowMs,
        });

        return {
          allowed: true as const,
          record: data,
          attemptNumber,
        };
      });
    },

    async finalizeAttemptResult(uid, matched, attemptNumber, nowMs, rotatedRecord) {
      const ref = db.doc(`pinSecrets/${uid}`);
      if (matched) {
        await ref.update({
          ...(rotatedRecord ?? {}),
          failedAttempts: 0,
          lockedUntilMs: 0,
          requiresReset: false,
          updatedAtMs: nowMs,
        });
        return {
          lockedUntilMs: 0,
          requiresReset: false,
          remainingAttempts: 5,
        };
      }
      return computeLockoutOutcome(attemptNumber, nowMs);
    },

    async mintPinTokenAndClaims(uid: string, pinAtSec: number): Promise<string> {
      await auth.setCustomUserClaims(uid, { pin_at: pinAtSec });
      return auth.createCustomToken(uid, { pin_at: pinAtSec });
    },

    async revokeRefreshTokens(uid: string): Promise<void> {
      await auth.revokeRefreshTokens(uid);
    },
  };
}

function extractAuthContext(request: {
  auth?: {
    uid: string;
    token: Record<string, unknown>;
  };
}): DecodedAuthContext {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Parent authentication is required.');
  }
  const token = request.auth.token;
  const firebaseClaim =
    token['firebase'] && typeof token['firebase'] === 'object'
      ? (token['firebase'] as Record<string, unknown>)
      : {};
  const signInProvider =
    typeof firebaseClaim['sign_in_provider'] === 'string'
      ? firebaseClaim['sign_in_provider']
      : 'custom';
  const authTimeSec =
    typeof token['auth_time'] === 'number' ? token['auth_time'] : 0;
  const emailVerified = Boolean(token['email_verified']);

  return {
    uid: request.auth.uid,
    authTimeSec,
    signInProvider,
    emailVerified,
  };
}

export const setPin = onCall(
  {
    region: 'asia-south1',
    invoker: 'public',
    maxInstances: 10,
    enforceAppCheck: false, // Monitor mode in 3.6; switched to true once App Check metrics pass
    secrets: [pinPepperSecret],
  },
  async (request) => {
    const ctx = extractAuthContext(request);
    const pepper = requirePepper();
    const store = createFirestorePinStore();
    try {
      return await handleSetPin(ctx, request.data, store, {
        currentVersion: 1,
        currentPepper: pepper,
      });
    } catch (err) {
      throw new HttpsError(
        'failed-precondition',
        (err as Error)?.message || 'Unable to set PIN.',
      );
    }
  },
);


const KID_ID_PATTERN = /^k[1-6]$/;

export const encryptProfileName = onCall(
  {
    region: 'asia-south1',
    invoker: 'public',
    maxInstances: 10,
    enforceAppCheck: false,
    secrets: [nameKeySecret],
  },
  (request) => {
    const uid = requireFreshPin(request);
    const data = (request.data ?? {}) as { kidId?: unknown; name?: unknown };
    if (typeof data.kidId !== 'string' || !KID_ID_PATTERN.test(data.kidId)) {
      throw new HttpsError('invalid-argument', 'Invalid profile.');
    }
    if (typeof data.name !== 'string') {
      throw new HttpsError('invalid-argument', 'Invalid name.');
    }
    try {
      return { nameEnc: encryptKidName(nameKeySecret.value(), uid, data.kidId, data.name) };
    } catch {
      throw new HttpsError('invalid-argument', 'Name could not be saved.');
    }
  },
);

export const decryptProfileNames = onCall(
  {
    region: 'asia-south1',
    invoker: 'public',
    maxInstances: 10,
    enforceAppCheck: false,
    secrets: [nameKeySecret],
  },
  (request) => {
    const uid = requireFreshPin(request);
    const data = (request.data ?? {}) as { items?: unknown };
    if (!Array.isArray(data.items) || data.items.length > 6) {
      throw new HttpsError('invalid-argument', 'Invalid request.');
    }
    const names: Record<string, string> = {};
    for (const item of data.items as Array<{ kidId?: unknown; nameEnc?: unknown }>) {
      if (
        typeof item?.kidId !== 'string' ||
        !KID_ID_PATTERN.test(item.kidId) ||
        typeof item.nameEnc !== 'string' ||
        item.nameEnc.length > MAX_ENCRYPTED_LENGTH
      ) {
        continue;
      }
      try {
        names[item.kidId] = decryptKidName(
          nameKeySecret.value(),
          uid,
          item.kidId,
          item.nameEnc,
        );
      } catch {
        names[item.kidId] = '';
      }
    }
    return { names };
  },
);

export const verifyPin = onCall(
  {
    region: 'asia-south1',
    invoker: 'public',
    maxInstances: 10,
    enforceAppCheck: false,
    secrets: [pinPepperSecret],
  },
  async (request) => {
    const ctx = extractAuthContext(request);
    const pepper = requirePepper();
    const store = createFirestorePinStore();
    return handleVerifyPin(ctx, request.data, store, {
      currentVersion: 1,
      currentPepper: pepper,
    });
  },
);
