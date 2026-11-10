import {
  MAX_PIN_ATTEMPTS_HARD_LOCK,
  MAX_PIN_ATTEMPTS_SOFT_LOCK,
  PROVIDER_REAUTH_MAX_AGE_SEC,
  SOFT_LOCKOUT_DURATION_MS,
  SetPinRequestSchema,
  VerifyPinRequestSchema,
  type VerifyPinResponse,
} from '@kiyuv/shared';
import {
  DEFAULT_SCRYPT_PARAMS,
  hashParentPinServer,
  verifyParentPinServer,
  type PinHashRecord,
  type ScryptParams,
} from './pinCrypto.js';

export interface PinSecretDocument extends PinHashRecord {
  failedAttempts: number;
  lockedUntilMs: number;
  requiresReset: boolean;
  updatedAtMs: number;
}

export interface DecodedAuthContext {
  uid: string;
  authTimeSec: number;
  signInProvider: string;
  emailVerified: boolean;
}

export interface PinSecretsStore {
  getSecret(uid: string): Promise<PinSecretDocument | null>;
  saveSecret(uid: string, doc: PinSecretDocument): Promise<void>;
  /**
   * Atomically increments failedAttempts or checks lockout BEFORE scrypt comparison
   * so parallel requests cannot race past the 5/10 attempt limits.
   */
  reserveAttemptTransaction(
    uid: string,
    nowMs: number,
  ): Promise<
    | { allowed: true; record: PinSecretDocument; attemptNumber: number }
    | {
        allowed: false;
        reason: 'not_configured' | 'soft_locked' | 'hard_locked';
        lockedUntilMs?: number;
      }
  >;
  finalizeAttemptResult(
    uid: string,
    matched: boolean,
    attemptNumber: number,
    nowMs: number,
    rotatedRecord?: PinHashRecord,
  ): Promise<{ lockedUntilMs: number; requiresReset: boolean; remainingAttempts: number }>;
  mintPinTokenAndClaims(uid: string, pinAtSec: number): Promise<string>;
  revokeRefreshTokens(uid: string): Promise<void>;
}

export interface PepperConfig {
  currentVersion: number;
  currentPepper: string;
  previousPeppers?: ReadonlyMap<number, string>;
}

const REAL_PROVIDERS = new Set(['google.com', 'apple.com', 'password']);

export function isFreshProviderSignIn(
  ctx: DecodedAuthContext,
  nowSec: number,
): { ok: boolean; reason?: string } {
  if (!REAL_PROVIDERS.has(ctx.signInProvider)) {
    return {
      ok: false,
      reason: 'Changing or resetting your PIN requires signing in with Google, Apple, or Email first.',
    };
  }
  if (ctx.signInProvider === 'password' && !ctx.emailVerified) {
    return {
      ok: false,
      reason: 'Please verify your email address before setting a Parent PIN.',
    };
  }
  if (nowSec - ctx.authTimeSec > PROVIDER_REAUTH_MAX_AGE_SEC) {
    return {
      ok: false,
      reason: 'Please re-authenticate with your sign-in provider (within the last 5 minutes) to change your PIN.',
    };
  }
  return { ok: true };
}

export async function handleSetPin(
  ctx: DecodedAuthContext,
  rawInput: unknown,
  store: PinSecretsStore,
  pepperCfg: PepperConfig,
  nowMs = Date.now(),
  scryptParams: ScryptParams = DEFAULT_SCRYPT_PARAMS,
): Promise<{ ok: true; customToken: string; pinAt: number }> {
  const parsed = SetPinRequestSchema.parse(rawInput);
  const existing = await store.getSecret(ctx.uid);
  const nowSec = Math.floor(nowMs / 1000);

  // If a PIN already exists, require a real provider sign-in under 5 minutes old
  if (existing) {
    const check = isFreshProviderSignIn(ctx, nowSec);
    if (!check.ok) {
      throw new Error(check.reason);
    }
  } else if (ctx.signInProvider === 'password' && !ctx.emailVerified) {
    throw new Error('Please verify your email address before setting a Parent PIN.');
  }

  const hashed = await hashParentPinServer(
    ctx.uid,
    parsed.pin,
    pepperCfg.currentPepper,
    pepperCfg.currentVersion,
    scryptParams,
  );

  await store.saveSecret(ctx.uid, {
    ...hashed,
    failedAttempts: 0,
    lockedUntilMs: 0,
    requiresReset: false,
    updatedAtMs: nowMs,
  });

  if (existing) {
    // Revoke refresh tokens so other devices must re-authenticate after a PIN change
    await store.revokeRefreshTokens(ctx.uid);
  }

  const customToken = await store.mintPinTokenAndClaims(ctx.uid, nowSec);
  return {
    ok: true,
    customToken,
    pinAt: nowSec,
  };
}

export async function handleVerifyPin(
  ctx: DecodedAuthContext,
  rawInput: unknown,
  store: PinSecretsStore,
  pepperCfg: PepperConfig,
  nowMs = Date.now(),
  scryptParams: ScryptParams = DEFAULT_SCRYPT_PARAMS,
): Promise<VerifyPinResponse> {
  if (ctx.signInProvider === 'password' && !ctx.emailVerified) {
    return {
      ok: false,
      message: 'Please verify your email address first.',
    };
  }

  const parsed = VerifyPinRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Enter a 6-digit PIN',
    };
  }

  // Record the attempt in a transaction BEFORE running scrypt comparison
  const reservation = await store.reserveAttemptTransaction(ctx.uid, nowMs);
  if (!reservation.allowed) {
    if (reservation.reason === 'not_configured') {
      return {
        ok: false,
        message: 'No Parent PIN is configured for this account yet.',
      };
    }
    if (reservation.reason === 'hard_locked') {
      return {
        ok: false,
        requiresProviderSignIn: true,
        message: 'Too many failed PIN attempts. Sign in with Google, Apple, or Email to set a new PIN.',
      };
    }
    return {
      ok: false,
      lockedUntilMs: reservation.lockedUntilMs,
      message: 'Too many failed attempts. Please wait 15 minutes or sign in again to reset your PIN.',
    };
  }

  const { record, attemptNumber } = reservation;
  const activePepper =
    record.pepperVersion === pepperCfg.currentVersion
      ? pepperCfg.currentPepper
      : (pepperCfg.previousPeppers?.get(record.pepperVersion) ?? pepperCfg.currentPepper);

  const matched = await verifyParentPinServer(ctx.uid, parsed.data.pin, record, activePepper);

  let rotatedRecord: PinHashRecord | undefined;
  if (matched && record.pepperVersion !== pepperCfg.currentVersion) {
    rotatedRecord = await hashParentPinServer(
      ctx.uid,
      parsed.data.pin,
      pepperCfg.currentPepper,
      pepperCfg.currentVersion,
      scryptParams,
    );
  }

  const outcome = await store.finalizeAttemptResult(
    ctx.uid,
    matched,
    attemptNumber,
    nowMs,
    rotatedRecord,
  );

  if (!matched) {
    if (outcome.requiresReset) {
      return {
        ok: false,
        requiresProviderSignIn: true,
        remainingAttempts: 0,
        message: '10 failed PIN attempts. Please sign in with your provider to set a new PIN.',
      };
    }
    if (outcome.lockedUntilMs > nowMs) {
      return {
        ok: false,
        lockedUntilMs: outcome.lockedUntilMs,
        remainingAttempts: 0,
        message: '5 failed PIN attempts. Locked for 15 minutes.',
      };
    }
    return {
      ok: false,
      remainingAttempts: outcome.remainingAttempts,
      message: `Incorrect PIN. ${outcome.remainingAttempts} attempt(s) remaining before temporary lockout.`,
    };
  }

  const nowSec = Math.floor(nowMs / 1000);
  const customToken = await store.mintPinTokenAndClaims(ctx.uid, nowSec);
  return {
    ok: true,
    customToken,
    pinAt: nowSec,
  };
}

export function computeLockoutOutcome(
  attemptNumber: number,
  nowMs: number,
): {
  lockedUntilMs: number;
  requiresReset: boolean;
  remainingAttempts: number;
} {
  if (attemptNumber >= MAX_PIN_ATTEMPTS_HARD_LOCK) {
    return {
      lockedUntilMs: 0,
      requiresReset: true,
      remainingAttempts: 0,
    };
  }
  if (attemptNumber === MAX_PIN_ATTEMPTS_SOFT_LOCK) {
    return {
      lockedUntilMs: nowMs + SOFT_LOCKOUT_DURATION_MS,
      requiresReset: false,
      remainingAttempts: 0,
    };
  }
  const nextThreshold =
    attemptNumber < MAX_PIN_ATTEMPTS_SOFT_LOCK
      ? MAX_PIN_ATTEMPTS_SOFT_LOCK
      : MAX_PIN_ATTEMPTS_HARD_LOCK;
  return {
    lockedUntilMs: 0,
    requiresReset: false,
    remainingAttempts: Math.max(0, nextThreshold - attemptNumber),
  };
}
