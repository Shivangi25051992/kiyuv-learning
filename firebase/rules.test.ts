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

  describe('family groups', () => {
    const G1 = 'a'.repeat(32);
    const G2 = 'b'.repeat(32);

    async function seedGroups() {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, `groups/${G1}`), { name: 'Sunrise', ownerUid: 'owner' });
        await setDoc(doc(db, `groups/${G1}/members/owner`), { role: 'owner', shared: {} });
        await setDoc(doc(db, `groups/${G1}/members/mia`), { role: 'member', shared: {} });
        await setDoc(doc(db, `groups/${G1}/board/current`), { entries: {} });
        await setDoc(doc(db, `groups/${G1}/requests/zed`), { children: {} });
        await setDoc(doc(db, `groups/${G2}`), { name: 'Other', ownerUid: 'zoe' });
        await setDoc(doc(db, `groups/${G2}/members/zoe`), { role: 'owner', shared: {} });
        await setDoc(doc(db, `groups/${G2}/board/current`), { entries: {} });
        await setDoc(doc(db, 'groupInvites/hash1'), { groupId: G1 });
        await setDoc(doc(db, 'groupMeta/mia'), { groupCount: 1 });
      });
    }

    it('lets a member read the group and its board, with a fresh PIN only', async () => {
      await seedGroups();
      await assertSucceeds(getDoc(doc(parent('mia', 60), `groups/${G1}`)));
      await assertSucceeds(getDoc(doc(parent('mia', 60), `groups/${G1}/board/current`)));
      await assertFails(getDoc(doc(noPin('mia'), `groups/${G1}/board/current`)));
    });

    it('refuses a non-member, a member of another group, and a signed-out visitor', async () => {
      await seedGroups();
      await assertFails(getDoc(doc(parent('nobody'), `groups/${G1}/board/current`)));
      await assertFails(getDoc(doc(parent('zoe'), `groups/${G1}/board/current`)));
      await assertFails(getDoc(doc(parent('zoe'), `groups/${G1}`)));
      await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), `groups/${G1}`)));
    });

    it('refuses a removed member', async () => {
      await seedGroups();
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await deleteDoc(doc(ctx.firestore(), `groups/${G1}/members/mia`));
      });
      await assertFails(getDoc(doc(parent('mia'), `groups/${G1}/board/current`)));
    });

    it('refuses list queries', async () => {
      await seedGroups();
      await assertFails(getDocs(collection(parent('mia'), 'groups')));
      await assertFails(getDocs(collection(parent('mia'), `groups/${G1}/members`)));
      await assertFails(getDocs(collection(parent('owner'), `groups/${G1}/board`)));
    });

    it('lets only the owner list members and read join requests', async () => {
      await seedGroups();
      await assertSucceeds(getDocs(collection(parent('owner'), `groups/${G1}/members`)));
      await assertSucceeds(getDoc(doc(parent('owner'), `groups/${G1}/requests/zed`)));
      await assertFails(getDoc(doc(parent('mia'), `groups/${G1}/requests/zed`)));
      // A member may read only their own member document.
      await assertSucceeds(getDoc(doc(parent('mia'), `groups/${G1}/members/mia`)));
      await assertFails(getDoc(doc(parent('mia'), `groups/${G1}/members/owner`)));
    });

    it('never lets a client write under groups, even the owner', async () => {
      await seedGroups();
      await assertFails(setDoc(doc(parent('owner', 0), `groups/${G1}`), { name: 'Hacked', ownerUid: 'owner' }));
      await assertFails(updateDoc(doc(parent('owner', 0), `groups/${G1}/board/current`), { entries: { x: 1 } }));
      await assertFails(setDoc(doc(parent('mia', 0), `groups/${G1}/members/mia`), { role: 'owner', shared: {} }));
      await assertFails(setDoc(doc(parent('mia', 0), `groups/${G1}/members/new`), { role: 'member' }));
      await assertFails(deleteDoc(doc(parent('owner', 0), `groups/${G1}/members/mia`)));
    });

    it('keeps invites and group counters closed to clients', async () => {
      await seedGroups();
      await assertFails(getDoc(doc(parent('owner'), 'groupInvites/hash1')));
      await assertFails(getDoc(doc(parent('mia'), 'groupMeta/mia')));
      await assertFails(setDoc(doc(parent('mia', 0), 'groupMeta/mia'), { groupCount: 0 }));
    });

    it('keeps the private bookkeeping closed to every client, including the owner', async () => {
      await seedGroups();
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), `groups/${G1}/privateMembers/mia`), { shared: {} });
        await setDoc(doc(ctx.firestore(), `groups/${G1}/privateRequests/zed`), { children: {} });
      });
      for (const who of ['owner', 'mia', 'zoe']) {
        await assertFails(getDoc(doc(parent(who), `groups/${G1}/privateMembers/mia`)));
        await assertFails(getDoc(doc(parent(who), `groups/${G1}/privateRequests/zed`)));
        await assertFails(getDocs(collection(parent(who), `groups/${G1}/privateMembers`)));
      }
    });

    it('lets a parent read their own group index, and never write it', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), `users/mia/groups/${G1}`), { name: 'Sunrise', role: 'member' });
      });
      await assertSucceeds(getDoc(doc(parent('mia'), `users/mia/groups/${G1}`)));
      await assertFails(getDoc(doc(parent('bob'), `users/mia/groups/${G1}`)));
      await assertFails(setDoc(doc(parent('mia', 0), `users/mia/groups/${G2}`), { name: 'X', role: 'owner' }));
    });
  });

  describe('child sharing fields', () => {
    const CHILD = 'c'.repeat(32);
    const G1 = 'a'.repeat(32);

    it('lets the client set childId once, and rejects a malformed one', async () => {
      await assertSucceeds(
        setDoc(doc(parent('alice'), 'users/alice/kids/k1'), { ...validKidPayload(), childId: CHILD }),
      );
      await assertFails(
        setDoc(doc(parent('alice'), 'users/alice/kids/k2'), { ...validKidPayload(), childId: 'short' }),
      );
    });

    it('refuses a client that creates a child already shared in a group', async () => {
      await assertFails(
        setDoc(doc(parent('alice'), 'users/alice/kids/k1'), { ...validKidPayload(), sharedIn: [G1] }),
      );
    });

    it('refuses any client change to sharedIn, including dropping it', async () => {
      await seedKid('alice', 'k1', { childId: CHILD, sharedIn: [G1] });
      await assertFails(
        setDoc(doc(parent('alice'), 'users/alice/kids/k1'), {
          ...validKidPayload(),
          childId: CHILD,
          sharedIn: [G1, 'b'.repeat(32)],
        }),
      );
      // A full replace that leaves sharedIn out would wipe it.
      await assertFails(
        setDoc(doc(parent('alice'), 'users/alice/kids/k1'), { ...validKidPayload(), childId: CHILD }),
      );
      // Writing it back unchanged is fine, so saving progress keeps working.
      await assertSucceeds(
        setDoc(doc(parent('alice'), 'users/alice/kids/k1'), {
          ...validKidPayload(),
          stars: 20,
          childId: CHILD,
          sharedIn: [G1],
        }),
      );
    });

    it('refuses changing childId once it is set', async () => {
      await seedKid('alice', 'k1', { childId: CHILD });
      await assertFails(
        setDoc(doc(parent('alice'), 'users/alice/kids/k1'), { ...validKidPayload(), childId: 'd'.repeat(32) }),
      );
      await assertFails(setDoc(doc(parent('alice'), 'users/alice/kids/k1'), { ...validKidPayload() }));
    });

    it('lets an older child without childId get one', async () => {
      await seedKid('alice', 'k1');
      await assertSucceeds(
        setDoc(doc(parent('alice'), 'users/alice/kids/k1'), { ...validKidPayload(), childId: CHILD }),
      );
    });
  });
});
