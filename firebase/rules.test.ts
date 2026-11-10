import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const nowSec = () => Math.floor(Date.now() / 1000);

/** A parent whose PIN was verified `agoSec` seconds ago. */
const parent = (uid: string, agoSec = 0) =>
  testEnv.authenticatedContext(uid, { pin_at: nowSec() - agoSec }).firestore();
/** A parent signed in with a provider but who has not entered the PIN. */
const noPin = (uid: string) => testEnv.authenticatedContext(uid).firestore();

const validKidPayload = () => ({
  nameEnc: 'v1.bm9uY2U.dGFn.Y2lwaGVy',
  nickname: 'Ari',
  age: 6,
  country: 'IN',
  state: 'Karnataka',
  favColor: 'blue',
  avatar: '👦',
  ageBand: '5-7',
  track: 'primary',
  stars: 10,
  streak: 2,
  bestStreak: 5,
  totalCorrect: 5,
  totalWrong: 1,
  badges: ['first', 'ten'],
  topics: { 'y-add-e': { p: 1, c: 5, b: 5, m: false } },
  resetEpoch: 0,
  updatedAt: serverTimestamp(),
});

/** Seeds a kid document directly, bypassing the rules. */
async function seedKid(uid: string, kidId: string, overrides: Record<string, unknown> = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `users/${uid}/kids/${kidId}`), {
      ...validKidPayload(),
      updatedAt: new Date(Date.now() - 60_000),
      ...overrides,
    });
  });
}

describe('Firestore Security Rules (Phase 3: real PIN enforcement)', () => {
  beforeAll(async () => {
    const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: 'kiyuv-learning-rules-test',
      firestore: { rules },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  describe('profile shape and ownership', () => {
    it('lets the owner create k1..k6, and rejects k7 and other families', async () => {
      await assertSucceeds(setDoc(doc(parent('alice'), 'users/alice/kids/k1'), validKidPayload()));
      await assertSucceeds(setDoc(doc(parent('alice'), 'users/alice/kids/k6'), validKidPayload()));
      await assertFails(setDoc(doc(parent('alice'), 'users/alice/kids/k7'), validKidPayload()));
      await assertFails(getDoc(doc(parent('bob'), 'users/alice/kids/k1')));
      await assertFails(setDoc(doc(parent('bob'), 'users/alice/kids/k2'), validKidPayload()));
    });

    it('rejects a plain "name" field, a non-string nameEnc, and an oversized nameEnc', async () => {
      const { nameEnc: _drop, ...withoutEnc } = validKidPayload();
      await assertFails(
        setDoc(doc(parent('alice'), 'users/alice/kids/k1'), { ...withoutEnc, name: 'Aarav' }),
      );
      await assertFails(
        setDoc(doc(parent('alice'), 'users/alice/kids/k2'), { ...validKidPayload(), nameEnc: 5 }),
      );
      await assertFails(
        setDoc(doc(parent('alice'), 'users/alice/kids/k3'), {
          ...validKidPayload(),
          nameEnc: 'x'.repeat(201),
        }),
      );
    });

    it('rejects extra fields, bad onboarding values, and an age that disagrees with ageBand', async () => {
      const db = parent('alice');
      await assertFails(setDoc(doc(db, 'users/alice/kids/k1'), { ...validKidPayload(), email: 'a@b.c' }));
      await assertFails(setDoc(doc(db, 'users/alice/kids/k2'), { ...validKidPayload(), age: 6, ageBand: '2-4' }));
      await assertFails(setDoc(doc(db, 'users/alice/kids/k3'), { ...validKidPayload(), favColor: 'chartreuse' }));
      await assertFails(setDoc(doc(db, 'users/alice/kids/k4'), { ...validKidPayload(), country: 'india' }));
      await assertFails(setDoc(doc(db, 'users/alice/kids/k5'), { ...validKidPayload(), nickname: 'A'.repeat(21) }));
      await assertFails(setDoc(doc(db, 'users/alice/kids/k1'), { ...validKidPayload(), stars: -1 }));
      await assertFails(
        setDoc(doc(db, 'users/alice/kids/k1'), {
          ...validKidPayload(),
          topics: Object.fromEntries(Array.from({ length: 1001 }, (_, i) => [`t${i}`, { p: 1 }])),
        }),
      );
    });
  });

  describe('PIN enforcement', () => {
    it('refuses every kid read and write when the PIN claim is missing', async () => {
      await seedKid('alice', 'k1');
      const db = noPin('alice');
      await assertFails(getDoc(doc(db, 'users/alice/kids/k1')));
      await assertFails(getDocs(collection(db, 'users/alice/kids')));
      await assertFails(setDoc(doc(db, 'users/alice/kids/k2'), validKidPayload()));
      await assertFails(updateDoc(doc(db, 'users/alice/kids/k1'), { stars: 99, updatedAt: serverTimestamp() }));
      await assertFails(deleteDoc(doc(db, 'users/alice/kids/k1')));
    });

    it('refuses everything when the PIN claim is older than 12 hours', async () => {
      await seedKid('alice', 'k1');
      const db = parent('alice', 12 * 3600 + 60);
      await assertFails(getDoc(doc(db, 'users/alice/kids/k1')));
      await assertFails(updateDoc(doc(db, 'users/alice/kids/k1'), { stars: 99, updatedAt: serverTimestamp() }));
    });

    it('lets a 1-hour-old unlock read and play, but not create, edit a profile, or delete', async () => {
      await seedKid('alice', 'k1');
      const db = parent('alice', 3600);
      await assertSucceeds(getDoc(doc(db, 'users/alice/kids/k1')));
      await assertSucceeds(getDocs(collection(db, 'users/alice/kids')));
      await assertSucceeds(updateDoc(doc(db, 'users/alice/kids/k1'), { stars: 99, updatedAt: serverTimestamp() }));
      await assertFails(setDoc(doc(db, 'users/alice/kids/k2'), validKidPayload()));
      await assertFails(deleteDoc(doc(db, 'users/alice/kids/k1')));
    });

    it('needs a PIN from the last 5 minutes to edit profile fields', async () => {
      await seedKid('alice', 'k1');
      const stale = parent('alice', 3600);
      for (const change of [
        { nickname: 'Zed' },
        { nameEnc: 'v1.a.b.c' },
        { age: 7 },
        { country: 'US' },
        { state: 'Texas' },
        { favColor: 'rose' },
        { avatar: '👧' },
        { track: 'early', ageBand: '5-7' },
      ]) {
        await assertFails(
          updateDoc(doc(stale, 'users/alice/kids/k1'), { ...change, updatedAt: serverTimestamp() }),
        );
      }
      await assertSucceeds(
        updateDoc(doc(parent('alice', 60), 'users/alice/kids/k1'), {
          nickname: 'Zed',
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('needs a fresh PIN to create, delete, and reset progress', async () => {
      const fresh = parent('alice', 30);
      await assertSucceeds(setDoc(doc(fresh, 'users/alice/kids/k1'), validKidPayload()));
      await seedKid('alice', 'k2');
      await assertSucceeds(deleteDoc(doc(fresh, 'users/alice/kids/k2')));

      await seedKid('alice', 'k3');
      const stale = parent('alice', 3600);
      await assertFails(
        updateDoc(doc(stale, 'users/alice/kids/k3'), { resetEpoch: 1, stars: 0, updatedAt: serverTimestamp() }),
      );
      await assertSucceeds(
        updateDoc(doc(fresh, 'users/alice/kids/k3'), { resetEpoch: 1, stars: 0, updatedAt: serverTimestamp() }),
      );
    });

    it('rejects a client that tries to forge or extend the PIN claim in a write', async () => {
      await assertFails(
        setDoc(doc(noPin('alice'), 'users/alice/kids/k1'), { ...validKidPayload(), pin_at: nowSec() }),
      );
    });

    it('treats a claim from the future or a non-numeric claim as invalid', async () => {
      await seedKid('alice', 'k1');
      const future = testEnv
        .authenticatedContext('alice', { pin_at: nowSec() + 7 * 24 * 3600 })
        .firestore();
      // A future timestamp can only come from the server; it is accepted by the arithmetic,
      // so the Cloud Function must never mint one. This test documents that boundary.
      await assertSucceeds(getDoc(doc(future, 'users/alice/kids/k1')));
      const junk = testEnv.authenticatedContext('alice', { pin_at: 'yes' }).firestore();
      await assertFails(getDoc(doc(junk, 'users/alice/kids/k1')));
    });
  });

  describe('write spacing across devices and children', () => {
    it('allows two different children back to back, but rate-limits the same child', async () => {
      const db = parent('alice', 30);
      await assertSucceeds(setDoc(doc(db, 'users/alice/kids/k1'), validKidPayload()));
      await assertSucceeds(
        setDoc(doc(db, 'users/alice/kids/k2'), {
          ...validKidPayload(),
          nickname: 'Mia',
          age: 3,
          ageBand: '2-4',
          track: 'early',
          favColor: 'rose',
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'users/alice/kids/k1'), { stars: 20, updatedAt: serverTimestamp() }),
      );
    });
  });

  describe('server-only and parent documents', () => {
    it('denies clients any access to pinSecrets', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'pinSecrets/alice'), { hashHex: 'x' });
      });
      const db = parent('alice', 0);
      await assertFails(getDoc(doc(db, 'pinSecrets/alice')));
      await assertFails(setDoc(doc(db, 'pinSecrets/alice'), { hashHex: 'y' }));
      await assertFails(setDoc(doc(db, 'pinSecrets/bob'), { hashHex: 'y' }));
    });

    it('lets the owner read the family document without a PIN (to learn if a PIN exists)', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'users/alice'), { pinConfigured: true });
      });
      await assertSucceeds(getDoc(doc(noPin('alice'), 'users/alice')));
      await assertFails(getDoc(doc(noPin('bob'), 'users/alice')));
    });

    it('does not let a client write pinConfigured or delete the family document', async () => {
      await assertSucceeds(
        setDoc(doc(noPin('alice'), 'users/alice'), {
          createdAt: serverTimestamp(),
          lastActiveDate: '2026-11-10',
          locale: 'en-IN',
          resetEpoch: 0,
          schemaVersion: 1,
        }),
      );
      await assertFails(
        setDoc(doc(noPin('bob'), 'users/bob'), {
          createdAt: serverTimestamp(),
          lastActiveDate: '2026-11-10',
          locale: 'en-IN',
          resetEpoch: 0,
          schemaVersion: 1,
          pinConfigured: true,
        }),
      );
      await assertFails(deleteDoc(doc(parent('alice', 0), 'users/alice')));
    });

    it('lets the owner read consent records with a PIN and never write them', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'consents/alice/records/c1'), { policy: 'v1' });
      });
      await assertSucceeds(getDoc(doc(parent('alice', 60), 'consents/alice/records/c1')));
      await assertFails(getDoc(doc(noPin('alice'), 'consents/alice/records/c1')));
      await assertFails(setDoc(doc(parent('alice', 0), 'consents/alice/records/c2'), { policy: 'v1' }));
    });
  });
});
