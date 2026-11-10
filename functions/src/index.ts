import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
  computeLockoutOutcome,
  handleSetPin,
  handleVerifyPin,
  type DecodedAuthContext,
  type PinSecretDocument,
  type PinSecretsStore,
} from './pinService.js';

if (getApps().length === 0) {
  initializeApp();
}

const pinPepperSecret = defineSecret('PIN_PEPPER');

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
      const batch = db.batch();
      batch.set(db.doc(`pinSecrets/${uid}`), {
        ...docData,
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(
        db.doc(`users/${uid}`),
        { pinConfigured: true },
        { merge: true },
      );
      await batch.commit();
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
    maxInstances: 10,
    enforceAppCheck: false, // Monitor mode in 3.6; switched to true once App Check metrics pass
    secrets: [pinPepperSecret],
  },
  async (request) => {
    const ctx = extractAuthContext(request);
    const pepper = pinPepperSecret.value() || 'dev-fallback-pepper-do-not-use-in-prod';
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

export const verifyPin = onCall(
  {
    region: 'asia-south1',
    maxInstances: 10,
    enforceAppCheck: false,
    secrets: [pinPepperSecret],
  },
  async (request) => {
    const ctx = extractAuthContext(request);
    const pepper = pinPepperSecret.value() || 'dev-fallback-pepper-do-not-use-in-prod';
    const store = createFirestorePinStore();
    return handleVerifyPin(ctx, request.data, store, {
      currentVersion: 1,
      currentPepper: pepper,
    });
  },
);
