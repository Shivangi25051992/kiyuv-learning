import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const validKidPayload = () => ({
  name: 'Aarav',
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

describe('Firestore Security Rules (Task 1.12 & Phase 3)', () => {
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
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  it('allows owner to create valid kid profile k1..k6 and rejects k7 or cross-user access', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDb = testEnv.authenticatedContext('bob').firestore();

    await assertSucceeds(setDoc(doc(aliceDb, 'users/alice/kids/k1'), validKidPayload()));
    await assertFails(setDoc(doc(aliceDb, 'users/alice/kids/k7'), validKidPayload()));
    await assertFails(getDoc(doc(bobDb, 'users/alice/kids/k1')));
  });

  it('rejects missing, oversized, or out-of-list onboarding fields and mismatched age/ageBand', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    // Mismatched age (6) and ageBand ('2-4')
    await assertFails(
      setDoc(doc(aliceDb, 'users/alice/kids/k1'), {
        ...validKidPayload(),
        age: 6,
        ageBand: '2-4',
      }),
    );

    // Invalid favColor
    await assertFails(
      setDoc(doc(aliceDb, 'users/alice/kids/k2'), {
        ...validKidPayload(),
        favColor: 'chartreuse',
      }),
    );

    // Invalid country code
    await assertFails(
      setDoc(doc(aliceDb, 'users/alice/kids/k3'), {
        ...validKidPayload(),
        country: 'india',
      }),
    );

    // Oversized nickname (> 20 chars)
    await assertFails(
      setDoc(doc(aliceDb, 'users/alice/kids/k4'), {
        ...validKidPayload(),
        nickname: 'A'.repeat(21),
      }),
    );
  });

  it('allows writing two different kid documents (k1 and k2) back-to-back without spacing conflict', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(aliceDb, 'users/alice/kids/k1'), validKidPayload()));
    await assertSucceeds(
      setDoc(doc(aliceDb, 'users/alice/kids/k2'), {
        ...validKidPayload(),
        nickname: 'Mia',
        age: 3,
        ageBand: '2-4',
        track: 'early',
        favColor: 'rose',
      }),
    );
    // Immediate second update to the SAME kid document (k1) without incrementing resetEpoch is rate-limited (5s)
    await assertFails(
      updateDoc(doc(aliceDb, 'users/alice/kids/k1'), {
        stars: 20,
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
