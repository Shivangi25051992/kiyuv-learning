import { describe, expect, it } from 'vitest';
import { SOFT_LOCKOUT_DURATION_MS } from '@kiyuv/shared';
import type { ScryptParams } from './pinCrypto.js';
import {
  computeLockoutOutcome,
  handleSetPin,
  handleVerifyPin,
  type DecodedAuthContext,
  type PepperConfig,
  type PinSecretDocument,
  type PinSecretsStore,
} from './pinService.js';

// Fast scrypt params for unit tests while testing the exact scrypt + HMAC + timingSafeEqual pipeline
const TEST_SCRYPT_PARAMS: ScryptParams = {
  N: 1024,
  r: 8,
  p: 1,
  keylen: 64,
};

function createInMemoryPinStore(): PinSecretsStore & {
  docs: Map<string, PinSecretDocument>;
  revokedUids: string[];
  claims: Map<string, number>;
} {
  const docs = new Map<string, PinSecretDocument>();
  const revokedUids: string[] = [];
  const claims = new Map<string, number>();

  return {
    docs,
    revokedUids,
    claims,
    async getSecret(uid) {
      return docs.get(uid) ?? null;
    },
    async saveSecret(uid, doc) {
      docs.set(uid, { ...doc });
    },
    async reserveAttemptTransaction(uid, nowMs) {
      const data = docs.get(uid);
      if (!data) return { allowed: false, reason: 'not_configured' };
      if (data.requiresReset || data.failedAttempts >= 10) {
        return { allowed: false, reason: 'hard_locked' };
      }
      if (data.lockedUntilMs && data.lockedUntilMs > nowMs) {
        return {
          allowed: false,
          reason: 'soft_locked',
          lockedUntilMs: data.lockedUntilMs,
        };
      }
      const attemptNumber = data.failedAttempts + 1;
      const pre = computeLockoutOutcome(attemptNumber, nowMs);
      docs.set(uid, {
        ...data,
        failedAttempts: attemptNumber,
        lockedUntilMs: pre.lockedUntilMs,
        requiresReset: pre.requiresReset,
        updatedAtMs: nowMs,
      });
      return {
        allowed: true,
        record: data,
        attemptNumber,
      };
    },
    async finalizeAttemptResult(uid, matched, attemptNumber, nowMs, rotatedRecord) {
      const data = docs.get(uid);
      if (matched && data) {
        docs.set(uid, {
          ...data,
          ...(rotatedRecord ?? {}),
          failedAttempts: 0,
          lockedUntilMs: 0,
          requiresReset: false,
          updatedAtMs: nowMs,
        });
        return { lockedUntilMs: 0, requiresReset: false, remainingAttempts: 5 };
      }
      return computeLockoutOutcome(attemptNumber, nowMs);
    },
    async mintPinTokenAndClaims(uid, pinAtSec) {
      claims.set(uid, pinAtSec);
      return `custom-token:${uid}:${pinAtSec}`;
    },
    async revokeRefreshTokens(uid) {
      revokedUids.push(uid);
    },
  };
}

const basePepperCfg: PepperConfig = {
  currentVersion: 1,
  currentPepper: 'pepper-v1-secret',
};

describe('Phase 3 Server PIN Service (Task 3.1 & 3.3)', () => {
  it('creates a 6-digit PIN, verifies it with timingSafeEqual, and mints pin_at claim', async () => {
    const store = createInMemoryPinStore();
    const nowMs = 1_760_000_000_000;
    const ctx: DecodedAuthContext = {
      uid: 'parent-1',
      authTimeSec: Math.floor(nowMs / 1000) - 10,
      signInProvider: 'google.com',
      emailVerified: true,
    };

    const setRes = await handleSetPin(
      ctx,
      { pin: '482917' },
      store,
      basePepperCfg,
      nowMs,
      TEST_SCRYPT_PARAMS,
    );
    expect(setRes.ok).toBe(true);
    expect(setRes.pinAt).toBe(Math.floor(nowMs / 1000));

    const verifyRes = await handleVerifyPin(
      ctx,
      { pin: '482917' },
      store,
      basePepperCfg,
      nowMs + 5000,
      TEST_SCRYPT_PARAMS,
    );
    expect(verifyRes.ok).toBe(true);
    expect(verifyRes.customToken).toContain('custom-token:parent-1:');
  });

  it('enforces 15-minute soft lockout at 5 failures and hard reset lockout at 10 failures, including parallel attempts', async () => {
    const store = createInMemoryPinStore();
    const nowMs = 1_760_000_000_000;
    const ctx: DecodedAuthContext = {
      uid: 'parent-lock',
      authTimeSec: Math.floor(nowMs / 1000),
      signInProvider: 'google.com',
      emailVerified: true,
    };

    await handleSetPin(
      ctx,
      { pin: '482917' },
      store,
      basePepperCfg,
      nowMs,
      TEST_SCRYPT_PARAMS,
    );

    // 5 parallel wrong guesses race against the transaction
    const parallelGuesses = await Promise.all(
      Array.from({ length: 6 }, () =>
        handleVerifyPin(
          ctx,
          { pin: '904182' },
          store,
          basePepperCfg,
          nowMs + 1000,
          TEST_SCRYPT_PARAMS,
        ),
      ),
    );

    // The 5th attempt triggers soft lock; the 6th is immediately blocked by soft_locked
    const lockedResponses = parallelGuesses.filter((r) => Boolean(r.lockedUntilMs));
    expect(lockedResponses.length).toBeGreaterThanOrEqual(2);
    expect(store.docs.get('parent-lock')?.failedAttempts).toBe(5);

    // Even the correct PIN is rejected while inside the 15-minute lockout window
    const duringLock = await handleVerifyPin(
      ctx,
      { pin: '482917' },
      store,
      basePepperCfg,
      nowMs + 60_000,
      TEST_SCRYPT_PARAMS,
    );
    expect(duringLock.ok).toBe(false);
    expect(duringLock.lockedUntilMs).toBe(nowMs + 1000 + SOFT_LOCKOUT_DURATION_MS);

    // After 15 minutes expire, 5 more wrong attempts trigger the 10-attempt hard lock
    const afterSoftLockMs = nowMs + SOFT_LOCKOUT_DURATION_MS + 5000;
    for (let i = 0; i < 5; i++) {
      await handleVerifyPin(
        ctx,
        { pin: '904182' },
        store,
        basePepperCfg,
        afterSoftLockMs + i * 100,
        TEST_SCRYPT_PARAMS,
      );
    }

    const hardLocked = await handleVerifyPin(
      ctx,
      { pin: '482917' },
      store,
      basePepperCfg,
      afterSoftLockMs + 2000,
      TEST_SCRYPT_PARAMS,
    );
    expect(hardLocked.ok).toBe(false);
    expect(hardLocked.requiresProviderSignIn).toBe(true);
  });

  it('rotates the PIN hash transparently when pepperVersion increases', async () => {
    const store = createInMemoryPinStore();
    const nowMs = 1_760_000_000_000;
    const ctx: DecodedAuthContext = {
      uid: 'parent-rotate',
      authTimeSec: Math.floor(nowMs / 1000),
      signInProvider: 'google.com',
      emailVerified: true,
    };

    await handleSetPin(
      ctx,
      { pin: '739204' },
      store,
      { currentVersion: 1, currentPepper: 'old-pepper-v1' },
      nowMs,
      TEST_SCRYPT_PARAMS,
    );
    expect(store.docs.get('parent-rotate')?.pepperVersion).toBe(1);

    const rotatedCfg: PepperConfig = {
      currentVersion: 2,
      currentPepper: 'new-pepper-v2',
      previousPeppers: new Map([[1, 'old-pepper-v1']]),
    };

    const verifyRes = await handleVerifyPin(
      ctx,
      { pin: '739204' },
      store,
      rotatedCfg,
      nowMs + 1000,
      TEST_SCRYPT_PARAMS,
    );
    expect(verifyRes.ok).toBe(true);
    expect(store.docs.get('parent-rotate')?.pepperVersion).toBe(2);
  });

  it('requires a fresh real provider sign-in (Spike S2) and revokes refresh tokens when changing an existing PIN', async () => {
    const store = createInMemoryPinStore();
    const nowMs = 1_760_000_000_000;
    const nowSec = Math.floor(nowMs / 1000);

    await handleSetPin(
      {
        uid: 'parent-s2',
        authTimeSec: nowSec,
        signInProvider: 'google.com',
        emailVerified: true,
      },
      { pin: '482917' },
      store,
      basePepperCfg,
      nowMs,
      TEST_SCRYPT_PARAMS,
    );

    // Custom token sign-in (signInProvider = 'custom') cannot change an existing PIN even if auth_time is recent
    await expect(
      handleSetPin(
        {
          uid: 'parent-s2',
          authTimeSec: nowSec + 10,
          signInProvider: 'custom',
          emailVerified: true,
        },
        { pin: '739204' },
        store,
        basePepperCfg,
        nowMs + 10_000,
        TEST_SCRYPT_PARAMS,
      ),
    ).rejects.toThrow(/signing in with Google, Apple, or Email/);

    // Stale provider sign-in (> 5 minutes old) cannot change an existing PIN
    await expect(
      handleSetPin(
        {
          uid: 'parent-s2',
          authTimeSec: nowSec - 600,
          signInProvider: 'google.com',
          emailVerified: true,
        },
        { pin: '739204' },
        store,
        basePepperCfg,
        nowMs,
        TEST_SCRYPT_PARAMS,
      ),
    ).rejects.toThrow(/within the last 5 minutes/);

    // Fresh Google re-authentication succeeds and revokes refresh tokens on other devices
    const changed = await handleSetPin(
      {
        uid: 'parent-s2',
        authTimeSec: nowSec + 20,
        signInProvider: 'google.com',
        emailVerified: true,
      },
      { pin: '739204' },
      store,
      basePepperCfg,
      nowMs + 20_000,
      TEST_SCRYPT_PARAMS,
    );
    expect(changed.ok).toBe(true);
    expect(store.revokedUids).toContain('parent-s2');
  });
});
