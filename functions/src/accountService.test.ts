import { beforeEach, describe, expect, it } from 'vitest';
import { deleteFamilyData, exportFamilyData } from './accountService.js';
import {
  approveMember,
  createGroup,
  createInvite,
  requestJoin,
  type GroupContext,
} from './groupService.js';
import { MemoryStore } from './groupStore.js';

const T0 = Date.parse('2026-11-11T08:00:00Z');
let store: MemoryStore;
let clock: number;
let counter: number;
let ctx: GroupContext;

beforeEach(() => {
  store = new MemoryStore();
  clock = T0;
  counter = 0;
  ctx = {
    store,
    now: () => clock,
    randomHex: (bytes) => {
      counter += 1;
      return counter.toString(16).padStart(bytes * 2, '0');
    },
    randomIndex: (max) => (++counter * 7) % max,
    inviteKey: 'test-invite-key-test-invite-key-0000',
  };
});

function seedFamily(uid: string): void {
  store.put(`users/${uid}`, { createdAt: T0, lastActiveDate: '2026-11-11', locale: 'en', resetEpoch: 0, schemaVersion: 1, pinConfigured: true });
  store.put(`pinSecrets/${uid}`, { hash: 'secret' });
  store.put(`consents/${uid}/records/c1`, { type: 'terms', at: T0 });
  for (const k of ['k1', 'k2']) {
    store.put(`users/${uid}/kids/${k}`, {
      nickname: `Nick ${k}`, age: 7, country: 'IN', state: 'KA', nameEnc: `enc-${k}`, childId: (uid[0] ?? 'a').repeat(32),
      avatar: '🐼', favColor: 'blue', stars: 12, streak: 2, bestStreak: 3, totalCorrect: 20, totalWrong: 4, badges: ['first'], topics: { 'g-add10': { best: 9 } }, sharedIn: [],
    });
  }
}

async function joinGroup(groupId: string, uid: string): Promise<void> {
  seedFamily(uid);
  const { code } = await createInvite(ctx, 'owner', { groupId, days: 3, uses: 10 });
  await requestJoin(ctx, uid, { code, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] });
  await approveMember(ctx, 'owner', groupId, uid);
}

const paths = (prefix: string) => [...store.data.keys()].filter((k) => k.includes(prefix));

describe('deleteFamilyData', () => {
  it('removes the account, children, consent records and PIN record', async () => {
    seedFamily('fam');
    seedFamily('other');
    await deleteFamilyData(ctx, 'fam');
    expect(paths('fam')).toEqual([]);
    expect(store.read('users/other/kids/k1')).toBeDefined();
    expect(store.read('pinSecrets/other')).toBeDefined();
  });

  it('takes a member family off a group and off the board', async () => {
    seedFamily('owner');
    const g = (await createGroup(ctx, 'owner', { name: 'Sunrise Club', timezone: 'Asia/Kolkata' })).groupId;
    await joinGroup(g, 'fam');
    await deleteFamilyData(ctx, 'fam');
    expect(paths('/fam')).toEqual([]);
    expect(store.read(`groups/${g}/members/fam`)).toBeUndefined();
    expect(store.read(`groups/${g}/privateMembers/fam`)).toBeUndefined();
    const board = store.read(`groups/${g}/board/current`)!['entries'] as Record<string, unknown>;
    expect(Object.keys(board)).toHaveLength(0);
    expect(store.read(`groups/${g}`)!['memberCount']).toBe(1);
  });

  it('gives a group to the family that joined first, then leaves it', async () => {
    seedFamily('owner');
    const g = (await createGroup(ctx, 'owner', { name: 'Sunrise Club', timezone: 'Asia/Kolkata' })).groupId;
    clock += 1000;
    await joinGroup(g, 'first');
    clock += 1000;
    await joinGroup(g, 'second');
    await deleteFamilyData(ctx, 'owner');
    expect(store.read(`groups/${g}`)!['ownerUid']).toBe('first');
    expect(store.read(`groups/${g}/members/first`)!['role']).toBe('owner');
    expect(store.read(`groups/${g}/members/owner`)).toBeUndefined();
    expect(paths('users/owner')).toEqual([]);
  });

  it('closes a group nobody else is in', async () => {
    seedFamily('owner');
    const g = (await createGroup(ctx, 'owner', { name: 'Sunrise Club', timezone: 'Asia/Kolkata' })).groupId;
    await deleteFamilyData(ctx, 'owner');
    expect(store.read(`groups/${g}`)).toBeUndefined();
    expect(paths('groups/')).toEqual([]);
  });

  it('withdraws a join request that nobody has answered', async () => {
    seedFamily('owner');
    const g = (await createGroup(ctx, 'owner', { name: 'Sunrise Club', timezone: 'Asia/Kolkata' })).groupId;
    seedFamily('fam');
    const { code } = await createInvite(ctx, 'owner', { groupId: g, days: 3, uses: 10 });
    await requestJoin(ctx, 'fam', { code, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] });
    expect(store.read(`groups/${g}/requests/fam`)).toBeDefined();
    await deleteFamilyData(ctx, 'fam');
    expect(store.read(`groups/${g}/requests/fam`)).toBeUndefined();
    expect(store.read(`groups/${g}/privateRequests/fam`)).toBeUndefined();
  });

  it('can be run again after a partial run', async () => {
    seedFamily('fam');
    await deleteFamilyData(ctx, 'fam');
    await expect(deleteFamilyData(ctx, 'fam')).resolves.toBeUndefined();
  });
});

describe('exportFamilyData', () => {
  it('returns children with first names, groups and consents, without the PIN record', async () => {
    seedFamily('owner');
    seedFamily('fam');
    await createGroup(ctx, 'fam', { name: 'Sunrise Club', timezone: 'Asia/Kolkata' });
    const out = await exportFamilyData(ctx, 'fam', 'a@b.com', (id, enc) => `name-of-${id}-${enc}`);
    expect(out.email).toBe('a@b.com');
    expect(out.children.map((c) => c.profile)).toEqual(['k1', 'k2']);
    expect(out.children[0]).toMatchObject({ firstName: 'name-of-k1-enc-k1', nickname: 'Nick k1', age: 7, stars: 12 });
    expect(out.groups).toEqual([{ name: 'Sunrise Club', role: 'owner' }]);
    expect(out.consents).toHaveLength(1);
    expect(out.account).not.toHaveProperty('pinConfigured');
    expect(JSON.stringify(out)).not.toContain('secret');
  });

  it('leaves the first name empty when it cannot be read', async () => {
    seedFamily('fam');
    const out = await exportFamilyData(ctx, 'fam', null, () => {
      throw new Error('bad key');
    });
    expect(out.children[0]!.firstName).toBe('');
  });

  it('never includes another family', async () => {
    seedFamily('fam');
    seedFamily('other');
    const out = await exportFamilyData(ctx, 'fam', null, () => '');
    expect(JSON.stringify(out)).not.toContain('other');
  });
});
