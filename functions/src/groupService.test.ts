import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_FAMILIES_PER_GROUP, weekKey } from '@kiyuv/shared';
import { MemoryStore } from './groupStore.js';
import {
  ServiceError,
  approveMember,
  cleanupGroups,
  closeGroup,
  createGroup,
  createInvite,
  declineMember,
  hideEntry,
  leaveGroup,
  removeDeletedKid,
  removeMember,
  renameGroup,
  requestJoin,
  revokeInvites,
  setSharedChildren,
  syncKidToGroups,
  transferOwnership,
  type GroupContext,
} from './groupService.js';

const DAY = 86_400_000;
const T0 = Date.parse('2026-11-11T08:00:00Z'); // a Wednesday
const WEEK = weekKey(T0, 'Asia/Kolkata');

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
    randomIndex: (max) => {
      counter += 1;
      return (counter * 7) % max;
    },
    inviteKey: 'test-invite-key-test-invite-key-0000',
  };
});

const CHILD = (n: string) => n.repeat(32).slice(0, 32);

function seedKid(uid: string, kidId = 'k1', over: Record<string, unknown> = {}) {
  store.put(`users/${uid}/kids/${kidId}`, {
    nickname: 'Secret Nick', age: 7, country: 'IN', state: 'KA',
    nameEnc: 'v1.x.y.z', childId: CHILD(uid[0]!), avatar: '🐼', favColor: 'blue', stars: 10, sharedIn: [],
    ...over,
  });
}

async function newGroup(owner = 'owner'): Promise<string> {
  seedKid(owner);
  return (await createGroup(ctx, owner, { name: 'Sunrise Club', timezone: 'Asia/Kolkata' })).groupId;
}

async function join(groupId: string, uid: string, boardName = 'Brave Otter', approve = true): Promise<string> {
  seedKid(uid);
  const { code } = await createInvite(ctx, 'owner', { groupId, days: 3, uses: 10 });
  await requestJoin(ctx, uid, { code, children: [{ kidId: 'k1', boardName }] });
  if (approve) await approveMember(ctx, 'owner', groupId, uid);
  return code;
}

const group = (g: string) => store.read(`groups/${g}`)!;
const entries = (g: string) => store.read(`groups/${g}/board/current`)!['entries'] as Record<string, Record<string, unknown>>;
const kid = (uid: string, k = 'k1') => store.read(`users/${uid}/kids/${k}`)!;
const count = (uid: string) => store.read(`groupMeta/${uid}`)?.['groupCount'];
const errCode = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    if (e instanceof ServiceError) return `${e.code}: ${e.message}`;
    throw e;
  }
  return 'no error';
};

describe('creating groups', () => {
  it('makes the caller the owner, with an empty board and an index entry', async () => {
    const g = await newGroup();
    expect(group(g)).toMatchObject({ ownerUid: 'owner', memberCount: 1, status: 'active', timezone: 'Asia/Kolkata' });
    expect(store.read(`groups/${g}/members/owner`)).toMatchObject({ role: 'owner' });
    expect(entries(g)).toEqual({});
    expect(store.read(`users/owner/groups/${g}`)).toEqual({ name: 'Sunrise Club', role: 'owner' });
    expect(count('owner')).toBe(1);
  });

  it('allows 3 groups per family and refuses a 4th', async () => {
    await newGroup();
    await createGroup(ctx, 'owner', { name: 'Class Five', timezone: 'UTC' });
    await createGroup(ctx, 'owner', { name: 'Cousins Club', timezone: 'UTC' });
    expect(await errCode(createGroup(ctx, 'owner', { name: 'Fourth One', timezone: 'UTC' }))).toMatch(/failed-precondition/);
    expect(count('owner')).toBe(3);
  });

  it('refuses a rude group name', async () => {
    expect(await errCode(createGroup(ctx, 'owner', { name: 'fuck club', timezone: 'UTC' }))).toMatch(/invalid-argument/);
  });
});

describe('joining', () => {
  it('needs the owner to approve, and then shares only the board name, avatar and colour', async () => {
    const g = await newGroup();
    await join(g, 'mia', 'Brave Otter', false);
    expect(store.read(`groups/${g}/members/mia`)).toBeUndefined();
    expect(kid('mia')['sharedIn']).toEqual([]);

    await approveMember(ctx, 'owner', g, 'mia');
    expect(group(g)['memberCount']).toBe(2);
    expect(kid('mia')['sharedIn']).toEqual([g]);
    expect(count('mia')).toBe(1);
    expect(store.read(`groups/${g}/requests/mia`)).toBeUndefined();

    const all = Object.values(entries(g));
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ boardName: 'Brave Otter', avatar: '🐼', favColor: 'blue', weekKey: WEEK, weekStars: 0 });
  });

  it('never puts a name, nickname, age, place or total on the board', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    await join(g, 'noah', 'Happy Fox');
    const allowed = new Set(['boardName', 'avatar', 'favColor', 'weekKey', 'weekStars', 'sourceUpdatedAt']);
    for (const entry of Object.values(entries(g))) {
      for (const key of Object.keys(entry)) expect(allowed.has(key)).toBe(true);
    }
    const text = JSON.stringify(store.read(`groups/${g}/board/current`));
    for (const secret of ['Secret Nick', 'nameEnc', 'KA', 'country', 'age']) expect(text).not.toContain(secret);
  });

  it('gives the same answer for unknown, expired and revoked codes', async () => {
    const g = await newGroup();
    seedKid('mia');
    const unknown = await errCode(requestJoin(ctx, 'mia', { code: 'ZZZZZZZZ', children: [{ kidId: 'k1', boardName: 'Brave Otter' }] }));
    const bad = await errCode(requestJoin(ctx, 'mia', { code: 'nope', children: [{ kidId: 'k1', boardName: 'Brave Otter' }] }));

    const { code: oldCode } = await createInvite(ctx, 'owner', { groupId: g, days: 1, uses: 5 });
    clock += 2 * DAY;
    const expired = await errCode(requestJoin(ctx, 'mia', { code: oldCode, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] }));

    clock = T0;
    const { code: revokedCode } = await createInvite(ctx, 'owner', { groupId: g, days: 3, uses: 5 });
    await revokeInvites(ctx, 'owner', g);
    store.put('groupMeta/mia', { groupCount: 0 });
    const revoked = await errCode(requestJoin(ctx, 'mia', { code: revokedCode, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] }));

    expect(new Set([unknown, bad, expired, revoked]).size).toBe(1);
    expect(unknown).toMatch(/not-found/);
  });

  it('stops an account after 5 wrong codes in an hour', async () => {
    await newGroup();
    seedKid('mia');
    const tryBad = () => errCode(requestJoin(ctx, 'mia', { code: 'ZZZZZZZZ', children: [{ kidId: 'k1', boardName: 'Brave Otter' }] }));
    for (let i = 0; i < 5; i++) expect(await tryBad()).toMatch(/not-found/);
    expect(await tryBad()).toMatch(/resource-exhausted/);
    clock += 61 * 60_000;
    expect(await tryBad()).toMatch(/not-found/);
  });

  it('revokes a code after 20 failed tries on it', async () => {
    const g = await newGroup();
    const { code } = await createInvite(ctx, 'owner', { groupId: g, days: 3, uses: 1 });
    seedKid('first');
    await requestJoin(ctx, 'first', { code, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] }); // uses it up
    seedKid('late');
    for (let i = 0; i < 20; i++) {
      store.put('groupMeta/late', { groupCount: 0 });
      await errCode(requestJoin(ctx, 'late', { code, children: [{ kidId: 'k1', boardName: 'Happy Fox' }] }));
    }
    const hash = [...store.data.keys()].find((k) => k.startsWith('groupInvites/'))!;
    expect(store.read(hash)).toMatchObject({ revoked: true });
  });

  it('a banned family cannot burn or revoke a code that belongs to others', async () => {
    const g = await newGroup();
    const { code } = await createInvite(ctx, 'owner', { groupId: g, days: 3, uses: 5 });
    store.put(`groups/${g}/banned/pest`, { at: 1 });
    seedKid('pest');
    for (let i = 0; i < 25; i++) {
      store.put('groupMeta/pest', { groupCount: 0 });
      await errCode(requestJoin(ctx, 'pest', { code, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] }));
    }
    const hash = [...store.data.keys()].find((k) => k.startsWith('groupInvites/'))!;
    expect(store.read(hash)).toMatchObject({ revoked: false, failures: 0, uses: 0 });
  });

  it('asking again before an answer replaces the request and costs no extra use', async () => {
    const g = await newGroup();
    const { code } = await createInvite(ctx, 'owner', { groupId: g, days: 3, uses: 2 });
    seedKid('mia');
    await requestJoin(ctx, 'mia', { code, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] });
    await requestJoin(ctx, 'mia', { code, children: [{ kidId: 'k1', boardName: 'Happy Fox' }] });
    const hash = [...store.data.keys()].find((k) => k.startsWith('groupInvites/'))!;
    expect(store.read(hash)).toMatchObject({ uses: 1 });
    expect(JSON.stringify(store.read(`groups/${g}/requests/mia`))).toContain('Happy Fox');
  });

  it('counts uses and refuses once an invite is used up', async () => {
    const g = await newGroup();
    const { code } = await createInvite(ctx, 'owner', { groupId: g, days: 3, uses: 1 });
    seedKid('mia');
    seedKid('noah');
    await requestJoin(ctx, 'mia', { code, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] });
    expect(await errCode(requestJoin(ctx, 'noah', { code, children: [{ kidId: 'k1', boardName: 'Happy Fox' }] }))).toMatch(/not-found/);
  });

  it('refuses a declined family on the same link, with the generic answer', async () => {
    const g = await newGroup();
    const code = await join(g, 'mia', 'Brave Otter', false);
    await declineMember(ctx, 'owner', g, 'mia');
    expect(await errCode(requestJoin(ctx, 'mia', { code, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] }))).toMatch(/not-found: That code did not work/);
  });

  it('stops at 30 families, also when two are approved back to back', async () => {
    const g = await newGroup();
    store.put(`groups/${g}`, { ...group(g), memberCount: MAX_FAMILIES_PER_GROUP - 1 });
    await join(g, 'a1', 'Brave Otter', false);
    await join(g, 'a2', 'Happy Fox', false);
    await approveMember(ctx, 'owner', g, 'a1');
    expect(await errCode(approveMember(ctx, 'owner', g, 'a2'))).toMatch(/failed-precondition: This group is full/);
    expect(group(g)['memberCount']).toBe(MAX_FAMILIES_PER_GROUP);
  });

  it('refuses a family already in 3 groups', async () => {
    const g = await newGroup();
    seedKid('mia');
    store.put('groupMeta/mia', { groupCount: 3 });
    const { code } = await createInvite(ctx, 'owner', { groupId: g, days: 3, uses: 5 });
    expect(await errCode(requestJoin(ctx, 'mia', { code, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] }))).toMatch(/up to 3 groups/);
  });

  it('only the owner can approve, and a child replaced since the request does not carry over', async () => {
    const g = await newGroup();
    await join(g, 'mia', 'Brave Otter', false);
    expect(await errCode(approveMember(ctx, 'mia', g, 'mia'))).toMatch(/permission-denied/);
    store.put('users/mia/kids/k1', { ...kid('mia'), childId: CHILD('f') });
    await approveMember(ctx, 'owner', g, 'mia');
    expect(entries(g)).toEqual({});
    expect(kid('mia')['sharedIn']).toEqual([]);
  });
});

describe('children in a group', () => {
  it('adds, renames and removes a shared child', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    seedKid('mia', 'k2', { childId: CHILD('9'), avatar: '🦊', stars: 4 });

    await setSharedChildren(ctx, 'mia', g, [
      { kidId: 'k1', boardName: 'Happy Fox' },
      { kidId: 'k2', boardName: 'Lucky Owl' },
    ]);
    expect(Object.values(entries(g)).map((e) => e['boardName']).sort()).toEqual(['Happy Fox', 'Lucky Owl']);
    expect(kid('mia', 'k2')['sharedIn']).toEqual([g]);

    await setSharedChildren(ctx, 'mia', g, [{ kidId: 'k2', boardName: 'Lucky Owl' }]);
    expect(Object.values(entries(g)).map((e) => e['boardName'])).toEqual(['Lucky Owl']);
    expect(kid('mia', 'k1')['sharedIn']).toEqual([]);
  });

  it('refuses a rude board name and a non-member', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    expect(await errCode(setSharedChildren(ctx, 'mia', g, [{ kidId: 'k1', boardName: 'shit head' }]))).toMatch(/invalid-argument/);
    seedKid('outsider');
    expect(await errCode(setSharedChildren(ctx, 'outsider', g, []))).toMatch(/not-found/);
  });

  it('a replaced child in the same slot is not shared', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    store.put('users/mia/kids/k1', { ...kid('mia'), childId: CHILD('e'), sharedIn: [g] });
    await setSharedChildren(ctx, 'mia', g, []);
    expect(entries(g)).toEqual({});
  });
});

describe('leaving, removal and closing', () => {
  it('leaving takes the family off the board and clears every trace', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    await leaveGroup(ctx, 'mia', g);
    expect(entries(g)).toEqual({});
    expect(store.read(`groups/${g}/members/mia`)).toBeUndefined();
    expect(store.read(`users/mia/groups/${g}`)).toBeUndefined();
    expect(kid('mia')['sharedIn']).toEqual([]);
    expect(count('mia')).toBe(0);
    expect(group(g)['memberCount']).toBe(1);
  });

  it('the owner must hand over ownership before leaving', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    expect(await errCode(leaveGroup(ctx, 'owner', g))).toMatch(/failed-precondition/);
    await transferOwnership(ctx, 'owner', g, 'mia');
    expect(group(g)['ownerUid']).toBe('mia');
    await leaveGroup(ctx, 'owner', g);
    expect(group(g)['memberCount']).toBe(1);
  });

  it('removal also bans, so the old link cannot be reused', async () => {
    const g = await newGroup();
    const code = await join(g, 'mia');
    await removeMember(ctx, 'owner', g, 'mia');
    expect(entries(g)).toEqual({});
    store.put('groupMeta/mia', { groupCount: 0 });
    expect(await errCode(requestJoin(ctx, 'mia', { code, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] }))).toMatch(/not-found/);
    expect(await errCode(removeMember(ctx, 'mia', g, 'owner'))).toMatch(/permission-denied/);
  });

  it('the owner can hide one entry, which stops that child being shared', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    const [entryId] = Object.keys(entries(g));
    expect(await errCode(hideEntry(ctx, 'mia', g, entryId!))).toMatch(/permission-denied/);
    await hideEntry(ctx, 'owner', g, entryId!);
    expect(entries(g)).toEqual({});
    expect(kid('mia')['sharedIn']).toEqual([]);
  });

  it('renaming updates every member index', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    await renameGroup(ctx, 'owner', g, 'Sunset Club');
    expect(store.read(`users/mia/groups/${g}`)).toEqual({ name: 'Sunset Club', role: 'member' });
    expect(store.read(`users/owner/groups/${g}`)).toEqual({ name: 'Sunset Club', role: 'owner' });
  });

  it('closing leaves no group data behind', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    await join(g, 'noah', 'Happy Fox', false);
    await declineMember(ctx, 'owner', g, 'noah');
    await closeGroup(ctx, 'owner', g);

    const leftovers = [...store.data.keys()].filter((k) => k.startsWith('groups/') || k.startsWith('groupInvites/') || k.startsWith(`users/mia/groups/`));
    expect(leftovers).toEqual([]);
    expect(kid('mia')['sharedIn']).toEqual([]);
    expect(count('mia')).toBe(0);
    expect(count('owner')).toBe(0);
  });

  it('only the owner can close', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    expect(await errCode(closeGroup(ctx, 'mia', g))).toMatch(/permission-denied/);
  });
});

describe('weekly stars on the board', () => {
  const change = (over: Partial<Parameters<typeof syncKidToGroups>[1]> = {}) => ({
    uid: 'mia', kidId: 'k1', groupIds: [] as string[], starsBefore: 10,
    after: { stars: 13, avatar: '🐼', favColor: 'blue', childId: CHILD('m') },
    writtenAtMs: T0 + 1000, ...over,
  });

  async function setup() {
    const g = await newGroup();
    await join(g, 'mia'); // child has 10 stars when shared
    return g;
  }
  const stars = (g: string) => Object.values(entries(g))[0]!['weekStars'];

  it('counts the first round after sharing', async () => {
    const g = await setup();
    await syncKidToGroups(ctx, change({ groupIds: [g] }));
    expect(stars(g)).toBe(3);
    await syncKidToGroups(ctx, change({ groupIds: [g], starsBefore: 13, after: { stars: 18, avatar: '🐼', favColor: 'blue', childId: CHILD('m') }, writtenAtMs: T0 + 2000 }));
    expect(stars(g)).toBe(8);
  });

  it('starts a new week from the stars before the first save of that week', async () => {
    const g = await setup();
    await syncKidToGroups(ctx, change({ groupIds: [g] }));
    clock += 7 * DAY;
    await syncKidToGroups(ctx, change({ groupIds: [g], starsBefore: 13, after: { stars: 15, avatar: '🐼', favColor: 'blue', childId: CHILD('m') }, writtenAtMs: T0 + 3000 }));
    expect(stars(g)).toBe(2);
    expect(Object.values(entries(g))[0]!['weekKey']).toBe(weekKey(clock, 'Asia/Kolkata'));
  });

  it('recovers after a progress reset', async () => {
    const g = await setup();
    await syncKidToGroups(ctx, change({ groupIds: [g] }));
    await syncKidToGroups(ctx, change({ groupIds: [g], starsBefore: 13, after: { stars: 0, avatar: '🐼', favColor: 'blue', childId: CHILD('m') }, writtenAtMs: T0 + 2000 }));
    expect(stars(g)).toBe(0);
    await syncKidToGroups(ctx, change({ groupIds: [g], starsBefore: 0, after: { stars: 4, avatar: '🐼', favColor: 'blue', childId: CHILD('m') }, writtenAtMs: T0 + 3000 }));
    expect(stars(g)).toBe(4);
  });

  it('ignores an older write, a replaced child, and a removed member', async () => {
    const g = await setup();
    await syncKidToGroups(ctx, change({ groupIds: [g], writtenAtMs: T0 + 5000 }));
    const before = stars(g);
    await syncKidToGroups(ctx, change({ groupIds: [g], starsBefore: 13, after: { stars: 99, avatar: '🐼', favColor: 'blue', childId: CHILD('m') }, writtenAtMs: T0 + 100 }));
    expect(stars(g)).toBe(before);

    await syncKidToGroups(ctx, change({ groupIds: [g], after: { stars: 50, avatar: '🐼', favColor: 'blue', childId: CHILD('z') }, writtenAtMs: T0 + 9000 }));
    expect(stars(g)).toBe(before);

    await removeMember(ctx, 'owner', g, 'mia');
    await syncKidToGroups(ctx, change({ groupIds: [g], writtenAtMs: T0 + 9999 }));
    expect(entries(g)).toEqual({});
  });

  it('copies a changed avatar and colour', async () => {
    const g = await setup();
    await syncKidToGroups(ctx, change({ groupIds: [g], after: { stars: 10, avatar: '🦁', favColor: 'red', childId: CHILD('m') } }));
    expect(Object.values(entries(g))[0]).toMatchObject({ avatar: '🦁', favColor: 'red' });
  });

  it('a deleted child profile leaves the board', async () => {
    const g = await setup();
    await removeDeletedKid(ctx, 'mia', 'k1', CHILD('m'), [g]);
    expect(entries(g)).toEqual({});
    expect(store.read(`groups/${g}/members/mia`)!['shared']).toEqual({});
  });
});

describe('clean-up job', () => {
  it('removes old invites and groups with no activity for a year', async () => {
    const g = await newGroup();
    const idle = (await createGroup(ctx, 'owner', { name: 'Old Club', timezone: 'UTC' })).groupId;
    store.put(`groups/${idle}`, { ...group(idle), activityAt: T0 - 400 * DAY });
    const { code } = await createInvite(ctx, 'owner', { groupId: g, days: 1, uses: 2 });
    expect(code).toHaveLength(8);
    clock += 30 * DAY;
    const result = await cleanupGroups(ctx);
    expect(result).toEqual({ invites: 1, groups: 1 });
    expect(store.read(`groups/${idle}`)).toBeUndefined();
    expect(store.read(`groups/${g}`)).toBeDefined();
  });
});

describe('what a client can read', () => {
  it('keeps child ids, the week base and write times out of every readable document', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    await join(g, 'noah', 'Happy Fox', false);
    const readable = [...store.data.entries()].filter(
      ([path]) =>
        path.startsWith(`groups/${g}`) &&
        !path.includes('/privateMembers/') && !path.includes('/privateRequests/') && !path.includes('/banned/'),
    );
    expect(readable.length).toBeGreaterThan(4);
    for (const [path, doc] of readable) {
      const text = JSON.stringify(doc);
      for (const secret of ['childId', 'weekBase', 'sourceUpdatedAt', CHILD('m'), CHILD('n')]) {
        expect(text, `${path} holds ${secret}`).not.toContain(secret);
      }
    }
    expect(JSON.stringify(store.read(`groups/${g}/privateMembers/mia`))).toContain('weekBase');
  });

  it('only avatars from the app list reach a board', async () => {
    const g = await newGroup();
    seedKid('mia', 'k1', { avatar: 'Call 98765 now' });
    const { code } = await createInvite(ctx, 'owner', { groupId: g, days: 3, uses: 5 });
    await requestJoin(ctx, 'mia', { code, children: [{ kidId: 'k1', boardName: 'Brave Otter' }] });
    await approveMember(ctx, 'owner', g, 'mia');
    expect(Object.values(entries(g))[0]!['avatar']).toBe('🧒');
  });

  it('refuses a board name written with look-alike letters from another script', async () => {
    const g = await newGroup();
    seedKid('mia');
    const { code } = await createInvite(ctx, 'owner', { groupId: g, days: 3, uses: 5 });
    // "ѕһіt" uses Cyrillic look-alikes.
    expect(await errCode(requestJoin(ctx, 'mia', { code, children: [{ kidId: 'k1', boardName: 'ѕһіt' }] }))).toMatch(/invalid-argument/);
  });

  it('refuses to approve a banned family, and a report about an entry that is not there', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    await join(g, 'noah', 'Happy Fox', false);
    store.put(`groups/${g}/banned/noah`, { at: 1 });
    expect(await errCode(approveMember(ctx, 'owner', g, 'noah'))).toMatch(/permission-denied/);
    const { reportEntry } = await import('./groupService.js');
    expect(await errCode(reportEntry(ctx, 'mia', g, 'deadbeefdeadbeef'))).toMatch(/not-found/);
  });

  it('the daily job finishes closing a group that was left half closed', async () => {
    const g = await newGroup();
    await join(g, 'mia');
    store.put(`groups/${g}`, { ...group(g), status: 'closed' });
    await cleanupGroups(ctx);
    expect([...store.data.keys()].filter((k) => k.startsWith('groups/'))).toEqual([]);
    expect(kid('mia')['sharedIn']).toEqual([]);
  });
});
