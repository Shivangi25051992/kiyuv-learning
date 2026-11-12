import {
  P,
  ServiceError,
  closeGroup,
  deleteAll,
  leaveGroup,
  transferOwnership,
  type GroupContext,
} from './groupService.js';
import type { Doc } from './groupStore.js';

/**
 * Deleting a family's account, and exporting what is stored about it.
 * Both work on the same small database interface as the groups, so the rules
 * (what is removed, what happens to a group the family owns) are tested without
 * a database. The Firebase Auth user is deleted by the caller, last of all.
 */

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const userPath = (uid: string) => `users/${uid}`;
const kidsPath = (uid: string) => `users/${uid}/kids`;
const myGroupsPath = (uid: string) => `users/${uid}/groups`;
const consentsPath = (uid: string) => `consents/${uid}/records`;

/**
 * Takes the family out of every group. A group they own goes to the family that
 * joined first. If nobody else is in it, the group is closed.
 */
async function leaveAllGroups(ctx: GroupContext, uid: string): Promise<void> {
  for (const groupId of await ctx.store.ids(myGroupsPath(uid))) {
    const group = await ctx.store.transact((tx) => tx.get(P.group(groupId)));
    if (!group) continue;
    if (group['ownerUid'] === uid) {
      const successor = await firstOtherMember(ctx, groupId, uid);
      if (successor === null) {
        await closeGroup(ctx, uid, groupId);
        continue;
      }
      await transferOwnership(ctx, uid, groupId, successor);
    }
    try {
      await leaveGroup(ctx, uid, groupId);
    } catch (err) {
      // Already gone from the group: nothing left to do for it.
      if (!(err instanceof ServiceError && err.code === 'not-found')) throw err;
    }
  }
}

async function firstOtherMember(ctx: GroupContext, groupId: string, uid: string): Promise<string | null> {
  const others = (await ctx.store.ids(P.members(groupId))).filter((id) => id !== uid);
  if (others.length === 0) return null;
  const joined = await ctx.store.transact(async (tx) => {
    const out: Array<[string, number]> = [];
    for (const id of others) out.push([id, num((await tx.get(P.member(groupId, id)))?.['joinedAt'])]);
    return out;
  });
  joined.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
  return joined[0]![0];
}

/** Join requests this family made that nobody has answered yet. */
async function pendingRequestPaths(ctx: GroupContext, uid: string): Promise<string[]> {
  const requests = await ctx.store.whereAnywhere('requests', 'uid', uid);
  return requests.flatMap((path) => [path, path.replace(/\/requests\/([^/]+)$/, '/privateRequests/$1')]);
}

/**
 * Removes the family's groups, join requests, child profiles, consent records,
 * PIN record and account document. Safe to run again if it stopped half way.
 */
export async function deleteFamilyData(ctx: GroupContext, uid: string): Promise<void> {
  await leaveAllGroups(ctx, uid);
  const kids = await ctx.store.ids(kidsPath(uid));
  const records = await ctx.store.ids(consentsPath(uid));
  const leftoverGroups = await ctx.store.ids(myGroupsPath(uid));
  await deleteAll(ctx, [
    ...(await pendingRequestPaths(ctx, uid)),
    ...kids.map((id) => P.kid(uid, id)),
    ...leftoverGroups.map((id) => P.myGroup(uid, id)),
    ...records.map((id) => `${consentsPath(uid)}/${id}`),
    P.meta(uid),
    `pinSecrets/${uid}`,
    userPath(uid),
  ]);
}

// ------------------------------------------------------------------- export

export interface ExportedChild {
  profile: string;
  firstName: string;
  nickname: string;
  age: number;
  country: string;
  state: string;
  stars: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalWrong: number;
  badges: unknown[];
  topics: unknown;
}

export interface FamilyExport {
  exportedAt: string;
  email: string | null;
  account: Doc;
  children: ExportedChild[];
  groups: Array<{ name: string; role: string }>;
  consents: Doc[];
}

/** Firestore timestamps and other objects become plain text, so the file reads easily. */
function plain(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(plain);
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe.toDate === 'function') return maybe.toDate().toISOString();
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
}

/**
 * Everything stored for the family, as the parent would want to read it. Server-only
 * secrets (the PIN record) are left out. `decryptName` turns a stored name back
 * into the child's first name.
 */
export async function exportFamilyData(
  ctx: GroupContext,
  uid: string,
  email: string | null,
  decryptName: (kidId: string, nameEnc: string) => string,
): Promise<FamilyExport> {
  const kidIds = (await ctx.store.ids(kidsPath(uid))).sort();
  const groupIds = (await ctx.store.ids(myGroupsPath(uid))).sort();
  const consentIds = (await ctx.store.ids(consentsPath(uid))).sort();
  const read = await ctx.store.transact(async (tx) => ({
    account: await tx.get(userPath(uid)),
    kids: await Promise.all(kidIds.map(async (id) => [id, await tx.get(P.kid(uid, id))] as const)),
    groups: await Promise.all(groupIds.map((id) => tx.get(P.myGroup(uid, id)))),
    consents: await Promise.all(consentIds.map((id) => tx.get(`${consentsPath(uid)}/${id}`))),
  }));

  const children = read.kids.flatMap(([id, kid]) => {
    if (!kid) return [];
    let firstName = '';
    try {
      firstName = decryptName(id, str(kid['nameEnc']));
    } catch {
      firstName = '';
    }
    return [
      {
        profile: id,
        firstName,
        nickname: str(kid['nickname']),
        age: num(kid['age']),
        country: str(kid['country']),
        state: str(kid['state']),
        stars: num(kid['stars']),
        streak: num(kid['streak']),
        bestStreak: num(kid['bestStreak']),
        totalCorrect: num(kid['totalCorrect']),
        totalWrong: num(kid['totalWrong']),
        badges: Array.isArray(kid['badges']) ? kid['badges'] : [],
        topics: plain(kid['topics'] ?? {}),
      },
    ];
  });

  const { pinConfigured: _pin, ...account } = (plain(read.account ?? {}) as Doc);
  void _pin;
  return {
    exportedAt: new Date(ctx.now()).toISOString(),
    email,
    account,
    children,
    groups: read.groups.flatMap((g) => (g ? [{ name: str(g['name']), role: str(g['role']) }] : [])),
    consents: read.consents.flatMap((c) => (c ? [plain(c) as Doc] : [])),
  };
}
