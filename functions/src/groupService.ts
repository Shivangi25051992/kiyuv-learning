import { createHmac } from 'node:crypto';
import {
  INVITE_ALPHABET,
  INVITE_CODE_LENGTH,
  MAX_FAMILIES_PER_GROUP,
  MAX_GROUPS_PER_FAMILY,
  isBoardNameAllowed,
  isGroupNameAllowed,
  isInviteCodeShape,
  nextWeekly,
  weekKey,
  type GroupTimezone,
  type SharedChildInput,
} from '@kiyuv/shared';
import { DELETE_FIELD, type Doc, type Store, type Tx } from './groupStore.js';

/**
 * Family groups (see docs/GROUPS_FEATURE.md). Every function here is a plain
 * async function over a `Store`, so the rules are unit tested without Firebase.
 * Callers check the parent's PIN before calling these.
 */

export type ServiceErrorCode =
  | 'invalid-argument'
  | 'not-found'
  | 'permission-denied'
  | 'failed-precondition'
  | 'already-exists'
  | 'resource-exhausted';

export class ServiceError extends Error {
  constructor(
    readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface GroupContext {
  store: Store;
  now: () => number;
  /** `bytes` random bytes as lowercase hex. */
  randomHex: (bytes: number) => string;
  randomIndex: (maxExclusive: number) => number;
  /** Secret used to hash invite codes, so a leaked database allows no offline guessing. */
  inviteKey: string;
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const JOIN_FAILS_PER_HOUR = 5;
const CODE_FAILS_BEFORE_REVOKE = 20;
const INACTIVE_GROUP_MS = 365 * DAY_MS;
const ACTIVITY_TOUCH_MS = DAY_MS;
const DELETE_CHUNK = 200;
const BAD_CODE = 'That code did not work. Check it, or ask for a new one.';

// ------------------------------------------------------------------- shapes

interface SharedEntry {
  entryId: string;
  boardName: string;
  childId: string;
  weekKey: string;
  weekBase: number;
}

const P = {
  group: (g: string) => `groups/${g}`,
  member: (g: string, u: string) => `groups/${g}/members/${u}`,
  members: (g: string) => `groups/${g}/members`,
  board: (g: string) => `groups/${g}/board/current`,
  request: (g: string, u: string) => `groups/${g}/requests/${u}`,
  requests: (g: string) => `groups/${g}/requests`,
  banned: (g: string, u: string) => `groups/${g}/banned/${u}`,
  bannedAll: (g: string) => `groups/${g}/banned`,
  invite: (hash: string) => `groupInvites/${hash}`,
  meta: (u: string) => `groupMeta/${u}`,
  myGroup: (u: string, g: string) => `users/${u}/groups/${g}`,
  kid: (u: string, k: string) => `users/${u}/kids/${k}`,
};

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const rec = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

function sharedOf(member: Doc): Record<string, SharedEntry> {
  const out: Record<string, SharedEntry> = {};
  for (const [kidId, raw] of Object.entries(rec(member['shared']))) {
    const e = rec(raw);
    out[kidId] = {
      entryId: str(e['entryId']),
      boardName: str(e['boardName']),
      childId: str(e['childId']),
      weekKey: str(e['weekKey']),
      weekBase: num(e['weekBase']),
    };
  }
  return out;
}

export function hashInviteCode(code: string, key: string): string {
  return createHmac('sha256', key).update(code).digest('hex');
}

function newInviteCode(ctx: GroupContext): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_ALPHABET[ctx.randomIndex(INVITE_ALPHABET.length)];
  }
  return code;
}

// ----------------------------------------------------------------- helpers

async function mustGroup(tx: Tx, groupId: string): Promise<Doc> {
  const group = await tx.get(P.group(groupId));
  if (!group) throw new ServiceError('not-found', 'Group not found.');
  return group;
}

function requireActive(group: Doc): void {
  if (group['status'] !== 'active') throw new ServiceError('not-found', 'Group not found.');
}

function requireOwner(group: Doc, uid: string): void {
  if (group['ownerUid'] !== uid) {
    throw new ServiceError('permission-denied', 'Only the group owner can do that.');
  }
}

function requireBoardNames(children: readonly SharedChildInput[]): void {
  for (const c of children) {
    if (!isBoardNameAllowed(c.boardName)) {
      throw new ServiceError('invalid-argument', 'Choose another board name.');
    }
  }
}

interface MemberBundle {
  uid: string;
  member: Doc;
  kids: Record<string, Doc | null>;
  meta: Doc | null;
}

async function readBundle(tx: Tx, uid: string, member: Doc): Promise<MemberBundle> {
  const kids: Record<string, Doc | null> = {};
  for (const kidId of Object.keys(sharedOf(member))) kids[kidId] = await tx.get(P.kid(uid, kidId));
  return { uid, member, kids, meta: await tx.get(P.meta(uid)) };
}

/** Writes that take one family out of a group. Call only after all reads are done. */
function planRemoval(tx: Tx, groupId: string, b: MemberBundle, opts: { keepBoard: boolean }): void {
  tx.delete(P.member(groupId, b.uid));
  tx.delete(P.myGroup(b.uid, groupId));
  for (const [kidId, entry] of Object.entries(sharedOf(b.member))) {
    if (!opts.keepBoard) tx.update(P.board(groupId), { [`entries.${entry.entryId}`]: DELETE_FIELD });
    const kid = b.kids[kidId];
    if (kid) tx.update(P.kid(b.uid, kidId), { sharedIn: list(kid['sharedIn']).filter((g) => g !== groupId) });
  }
  if (b.meta) tx.update(P.meta(b.uid), { groupCount: Math.max(0, num(b.meta['groupCount']) - 1) });
}

function touchMeta(tx: Tx, uid: string, meta: Doc | null, patch: Doc): void {
  if (meta) tx.update(P.meta(uid), patch);
  else tx.set(P.meta(uid), { groupCount: 0, ...patch });
}

// ------------------------------------------------------------ create group

export async function createGroup(
  ctx: GroupContext,
  uid: string,
  input: { name: string; timezone: GroupTimezone },
): Promise<{ groupId: string }> {
  if (!isGroupNameAllowed(input.name)) {
    throw new ServiceError('invalid-argument', 'Choose another group name.');
  }
  const groupId = ctx.randomHex(16);
  await ctx.store.transact(async (tx) => {
    const meta = await tx.get(P.meta(uid));
    const count = num(meta?.['groupCount']);
    if (count >= MAX_GROUPS_PER_FAMILY) {
      throw new ServiceError('failed-precondition', `You can be in up to ${MAX_GROUPS_PER_FAMILY} groups.`);
    }
    const now = ctx.now();
    tx.set(P.group(groupId), {
      name: input.name,
      ownerUid: uid,
      createdAt: now,
      memberCount: 1,
      timezone: input.timezone,
      status: 'active',
      activityAt: now,
    });
    tx.set(P.member(groupId, uid), { role: 'owner', joinedAt: now, shared: {} });
    tx.set(P.board(groupId), { entries: {} });
    tx.set(P.myGroup(uid, groupId), { name: input.name, role: 'owner' });
    touchMeta(tx, uid, meta, { groupCount: count + 1 });
  });
  return { groupId };
}

// ------------------------------------------------------------------ invites

export async function createInvite(
  ctx: GroupContext,
  uid: string,
  input: { groupId: string; days: number; uses: number },
): Promise<{ code: string; expiresAt: number; maxUses: number }> {
  const candidates = Array.from({ length: 3 }, () => newInviteCode(ctx));
  return ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, input.groupId);
    requireActive(group);
    requireOwner(group, uid);
    let chosen: string | null = null;
    for (const code of candidates) {
      const taken = await tx.get(P.invite(hashInviteCode(code, ctx.inviteKey)));
      if (!taken && chosen === null) chosen = code;
    }
    if (chosen === null) throw new ServiceError('failed-precondition', 'Please try again.');
    const now = ctx.now();
    const expiresAt = now + input.days * DAY_MS;
    tx.set(P.invite(hashInviteCode(chosen, ctx.inviteKey)), {
      groupId: input.groupId,
      createdBy: uid,
      expiresAt,
      maxUses: input.uses,
      uses: 0,
      failures: 0,
      revoked: false,
    });
    tx.update(P.group(input.groupId), { activityAt: now });
    return { code: chosen, expiresAt, maxUses: input.uses };
  });
}

export async function revokeInvites(ctx: GroupContext, uid: string, groupId: string): Promise<void> {
  const hashes = await ctx.store.where('groupInvites', 'groupId', '==', groupId);
  await ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, groupId);
    requireOwner(group, uid);
    for (const hash of hashes) tx.update(P.invite(hash), { revoked: true });
  });
}

// ------------------------------------------------------------------- joining

type JoinOutcome =
  | { kind: 'ok'; groupName: string }
  | { kind: 'invalid' | 'limited' | 'already-member' | 'full' | 'too-many-groups' };

export async function requestJoin(
  ctx: GroupContext,
  uid: string,
  input: { code: string; children: readonly SharedChildInput[] },
): Promise<{ groupName: string }> {
  requireBoardNames(input.children);
  const outcome = await ctx.store.transact<JoinOutcome>(async (tx) => {
    const now = ctx.now();
    const meta = await tx.get(P.meta(uid));
    const windowStart = num(meta?.['joinWindowStart']);
    const inWindow = now - windowStart < HOUR_MS;
    if (inWindow && num(meta?.['joinFails']) >= JOIN_FAILS_PER_HOUR) return { kind: 'limited' };

    const hash = hashInviteCode(input.code, ctx.inviteKey);
    const invite = isInviteCodeShape(input.code) ? await tx.get(P.invite(hash)) : null;
    const groupId = str(invite?.['groupId']);
    const group = groupId ? await tx.get(P.group(groupId)) : null;
    const banned = group ? await tx.get(P.banned(groupId, uid)) : null;
    const valid =
      invite !== null && group !== null && banned === null && group['status'] === 'active' &&
      invite['revoked'] !== true && num(invite['expiresAt']) > now &&
      num(invite['uses']) < num(invite['maxUses']);

    if (!valid) {
      touchMeta(tx, uid, meta, {
        joinWindowStart: inWindow ? windowStart : now,
        joinFails: inWindow ? num(meta?.['joinFails']) + 1 : 1,
      });
      if (invite) {
        const failures = num(invite['failures']) + 1;
        tx.update(P.invite(hash), {
          failures,
          revoked: invite['revoked'] === true || failures >= CODE_FAILS_BEFORE_REVOKE,
        });
      }
      return { kind: 'invalid' };
    }

    const member = await tx.get(P.member(groupId, uid));
    const kids: Array<Doc | null> = [];
    for (const c of input.children) kids.push(await tx.get(P.kid(uid, c.kidId)));
    if (member) return { kind: 'already-member' };
    if (num(group['memberCount']) >= MAX_FAMILIES_PER_GROUP) return { kind: 'full' };
    if (num(meta?.['groupCount']) >= MAX_GROUPS_PER_FAMILY) return { kind: 'too-many-groups' };

    const offered: Record<string, Doc> = {};
    input.children.forEach((c, i) => {
      const kid = kids[i];
      if (!kid) throw new ServiceError('invalid-argument', 'One of the children was not found.');
      let childId = str(kid['childId']);
      if (!childId) {
        childId = ctx.randomHex(16);
        tx.update(P.kid(uid, c.kidId), { childId });
      }
      offered[c.kidId] = { boardName: c.boardName, childId, avatar: str(kid['avatar']), favColor: str(kid['favColor']) };
    });
    tx.set(P.request(groupId, uid), { children: offered, requestedAt: now });
    tx.update(P.invite(hash), { uses: num(invite['uses']) + 1 });
    return { kind: 'ok', groupName: str(group['name']) };
  });

  switch (outcome.kind) {
    case 'ok':
      return { groupName: outcome.groupName };
    case 'limited':
      throw new ServiceError('resource-exhausted', 'Too many tries. Please wait an hour and try again.');
    case 'already-member':
      throw new ServiceError('already-exists', 'Your family is already in this group.');
    case 'full':
      throw new ServiceError('failed-precondition', 'This group is full.');
    case 'too-many-groups':
      throw new ServiceError('failed-precondition', `You can be in up to ${MAX_GROUPS_PER_FAMILY} groups.`);
    default:
      throw new ServiceError('not-found', BAD_CODE);
  }
}

export async function approveMember(
  ctx: GroupContext,
  ownerUid: string,
  groupId: string,
  targetUid: string,
): Promise<void> {
  await ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, groupId);
    requireActive(group);
    requireOwner(group, ownerUid);
    const request = await tx.get(P.request(groupId, targetUid));
    if (!request) throw new ServiceError('not-found', 'That request is no longer there.');
    const existing = await tx.get(P.member(groupId, targetUid));
    const meta = await tx.get(P.meta(targetUid));
    const offered = rec(request['children']);
    const kids: Record<string, Doc | null> = {};
    for (const kidId of Object.keys(offered)) kids[kidId] = await tx.get(P.kid(targetUid, kidId));

    if (existing) throw new ServiceError('already-exists', 'That family is already in the group.');
    if (num(group['memberCount']) >= MAX_FAMILIES_PER_GROUP) {
      throw new ServiceError('failed-precondition', 'This group is full.');
    }
    const groupCount = num(meta?.['groupCount']);
    if (groupCount >= MAX_GROUPS_PER_FAMILY) {
      throw new ServiceError('failed-precondition', 'That family is already in 3 groups.');
    }

    const now = ctx.now();
    const week = weekKey(now, str(group['timezone']));
    const shared: Record<string, SharedEntry> = {};
    for (const [kidId, raw] of Object.entries(offered)) {
      const kid = kids[kidId];
      const want = rec(raw);
      // A child replaced since the request was made does not carry over.
      if (!kid || str(kid['childId']) !== str(want['childId'])) continue;
      const entryId = ctx.randomHex(8);
      shared[kidId] = {
        entryId, boardName: str(want['boardName']), childId: str(want['childId']),
        weekKey: week, weekBase: num(kid['stars']),
      };
      tx.update(P.board(groupId), {
        [`entries.${entryId}`]: {
          boardName: str(want['boardName']), avatar: str(kid['avatar']), favColor: str(kid['favColor']),
          weekKey: week, weekStars: 0, sourceUpdatedAt: now,
        },
      });
      tx.update(P.kid(targetUid, kidId), { sharedIn: [...list(kid['sharedIn']), groupId] });
    }
    tx.set(P.member(groupId, targetUid), { role: 'member', joinedAt: now, shared });
    tx.set(P.myGroup(targetUid, groupId), { name: str(group['name']), role: 'member' });
    touchMeta(tx, targetUid, meta, { groupCount: groupCount + 1 });
    tx.update(P.group(groupId), { memberCount: num(group['memberCount']) + 1, activityAt: now });
    tx.delete(P.request(groupId, targetUid));
  });
}

export async function declineMember(
  ctx: GroupContext,
  ownerUid: string,
  groupId: string,
  targetUid: string,
): Promise<void> {
  await ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, groupId);
    requireOwner(group, ownerUid);
    tx.delete(P.request(groupId, targetUid));
    tx.set(P.banned(groupId, targetUid), { at: ctx.now() });
  });
}

// ----------------------------------------------------- children in a group

export async function setSharedChildren(
  ctx: GroupContext,
  uid: string,
  groupId: string,
  children: readonly SharedChildInput[],
): Promise<void> {
  requireBoardNames(children);
  await ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, groupId);
    requireActive(group);
    const member = await tx.get(P.member(groupId, uid));
    if (!member) throw new ServiceError('not-found', 'Group not found.');
    const current = sharedOf(member);
    const kidIds = new Set([...Object.keys(current), ...children.map((c) => c.kidId)]);
    const kids: Record<string, Doc | null> = {};
    for (const kidId of kidIds) kids[kidId] = await tx.get(P.kid(uid, kidId));

    const now = ctx.now();
    const week = weekKey(now, str(group['timezone']));
    const wanted = new Map(children.map((c) => [c.kidId, c.boardName]));
    const memberPatch: Record<string, unknown> = {};

    for (const [kidId, entry] of Object.entries(current)) {
      const kid = kids[kidId];
      const replaced = !kid || str(kid['childId']) !== entry.childId;
      if (wanted.has(kidId) && !replaced) continue;
      tx.update(P.board(groupId), { [`entries.${entry.entryId}`]: DELETE_FIELD });
      memberPatch[`shared.${kidId}`] = DELETE_FIELD;
      if (kid && !wanted.has(kidId)) {
        tx.update(P.kid(uid, kidId), { sharedIn: list(kid['sharedIn']).filter((g) => g !== groupId) });
      }
    }

    for (const [kidId, boardName] of wanted) {
      const kid = kids[kidId];
      if (!kid) throw new ServiceError('invalid-argument', 'One of the children was not found.');
      const entry = current[kidId];
      const kidChildId = str(kid['childId']);
      if (entry && kidChildId === entry.childId) {
        if (entry.boardName !== boardName) {
          tx.update(P.board(groupId), { [`entries.${entry.entryId}.boardName`]: boardName });
          memberPatch[`shared.${kidId}.boardName`] = boardName;
        }
        continue;
      }
      const childId = kidChildId || ctx.randomHex(16);
      const entryId = ctx.randomHex(8);
      const sharedIn = list(kid['sharedIn']);
      tx.update(P.kid(uid, kidId), {
        childId,
        sharedIn: sharedIn.includes(groupId) ? sharedIn : [...sharedIn, groupId],
      });
      tx.update(P.board(groupId), {
        [`entries.${entryId}`]: {
          boardName, avatar: str(kid['avatar']), favColor: str(kid['favColor']),
          weekKey: week, weekStars: 0, sourceUpdatedAt: now,
        },
      });
      memberPatch[`shared.${kidId}`] = { entryId, boardName, childId, weekKey: week, weekBase: num(kid['stars']) };
    }
    if (Object.keys(memberPatch).length > 0) tx.update(P.member(groupId, uid), memberPatch);
    tx.update(P.group(groupId), { activityAt: now });
  });
}

export async function leaveGroup(ctx: GroupContext, uid: string, groupId: string): Promise<void> {
  await ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, groupId);
    const member = await tx.get(P.member(groupId, uid));
    if (!member) throw new ServiceError('not-found', 'Group not found.');
    if (group['ownerUid'] === uid) {
      throw new ServiceError('failed-precondition', 'Pass ownership to another family, or close the group, before leaving.');
    }
    const bundle = await readBundle(tx, uid, member);
    planRemoval(tx, groupId, bundle, { keepBoard: false });
    tx.update(P.group(groupId), { memberCount: Math.max(0, num(group['memberCount']) - 1) });
  });
}

export async function removeMember(
  ctx: GroupContext,
  ownerUid: string,
  groupId: string,
  targetUid: string,
): Promise<void> {
  if (targetUid === ownerUid) {
    throw new ServiceError('invalid-argument', 'Use "close group" or pass ownership instead.');
  }
  await ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, groupId);
    requireOwner(group, ownerUid);
    const member = await tx.get(P.member(groupId, targetUid));
    if (!member) throw new ServiceError('not-found', 'That family is not in the group.');
    const bundle = await readBundle(tx, targetUid, member);
    planRemoval(tx, groupId, bundle, { keepBoard: false });
    tx.set(P.banned(groupId, targetUid), { at: ctx.now() });
    tx.update(P.group(groupId), { memberCount: Math.max(0, num(group['memberCount']) - 1) });
  });
}

/** The owner hides one child from the board. That child stops being shared in this group. */
export async function hideEntry(
  ctx: GroupContext,
  ownerUid: string,
  groupId: string,
  entryId: string,
): Promise<void> {
  const memberIds = await ctx.store.ids(P.members(groupId));
  await ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, groupId);
    requireOwner(group, ownerUid);
    const members: Array<[string, Doc]> = [];
    for (const id of memberIds) {
      const m = await tx.get(P.member(groupId, id));
      if (m) members.push([id, m]);
    }
    const hit = members.find(([, m]) => Object.values(sharedOf(m)).some((e) => e.entryId === entryId));
    if (!hit) throw new ServiceError('not-found', 'That entry is not on the board.');
    const [uid, member] = hit;
    const kidId = Object.keys(sharedOf(member)).find((k) => sharedOf(member)[k]!.entryId === entryId)!;
    const kid = await tx.get(P.kid(uid, kidId));
    tx.update(P.board(groupId), { [`entries.${entryId}`]: DELETE_FIELD });
    tx.update(P.member(groupId, uid), { [`shared.${kidId}`]: DELETE_FIELD });
    if (kid) tx.update(P.kid(uid, kidId), { sharedIn: list(kid['sharedIn']).filter((g) => g !== groupId) });
  });
}

export async function transferOwnership(
  ctx: GroupContext,
  ownerUid: string,
  groupId: string,
  targetUid: string,
): Promise<void> {
  await ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, groupId);
    requireOwner(group, ownerUid);
    const target = await tx.get(P.member(groupId, targetUid));
    if (!target || targetUid === ownerUid) {
      throw new ServiceError('invalid-argument', 'Choose another family in the group.');
    }
    tx.update(P.group(groupId), { ownerUid: targetUid });
    tx.update(P.member(groupId, ownerUid), { role: 'member' });
    tx.update(P.member(groupId, targetUid), { role: 'owner' });
    tx.update(P.myGroup(ownerUid, groupId), { role: 'member' });
    tx.update(P.myGroup(targetUid, groupId), { role: 'owner' });
  });
}

export async function renameGroup(
  ctx: GroupContext,
  ownerUid: string,
  groupId: string,
  name: string,
): Promise<void> {
  if (!isGroupNameAllowed(name)) throw new ServiceError('invalid-argument', 'Choose another group name.');
  const memberIds = await ctx.store.ids(P.members(groupId));
  await ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, groupId);
    requireOwner(group, ownerUid);
    const roles: Array<[string, string]> = [];
    for (const id of memberIds) {
      const m = await tx.get(P.member(groupId, id));
      if (m) roles.push([id, str(m['role'])]);
    }
    tx.update(P.group(groupId), { name });
    for (const [id, role] of roles) tx.set(P.myGroup(id, groupId), { name, role });
  });
}

// ------------------------------------------------------------------- closing

async function deleteAll(ctx: GroupContext, paths: string[]): Promise<void> {
  for (let i = 0; i < paths.length; i += DELETE_CHUNK) {
    const chunk = paths.slice(i, i + DELETE_CHUNK);
    await ctx.store.transact(async (tx) => {
      for (const p of chunk) tx.delete(p);
    });
  }
}

/** Closes a group and removes everything in it. `ownerUid` null means the system (clean-up job). */
export async function closeGroup(ctx: GroupContext, ownerUid: string | null, groupId: string): Promise<void> {
  const memberIds = await ctx.store.ids(P.members(groupId));
  await ctx.store.transact(async (tx) => {
    const group = await mustGroup(tx, groupId);
    if (ownerUid !== null) requireOwner(group, ownerUid);
    const bundles: MemberBundle[] = [];
    for (const id of memberIds) {
      const m = await tx.get(P.member(groupId, id));
      if (m) bundles.push(await readBundle(tx, id, m));
    }
    for (const b of bundles) planRemoval(tx, groupId, b, { keepBoard: true });
    tx.delete(P.board(groupId));
    tx.delete(P.group(groupId));
  });
  // Pending requests, removed families and invites can be many, so they go in chunks.
  const requestIds = await ctx.store.ids(P.requests(groupId));
  const bannedIds = await ctx.store.ids(P.bannedAll(groupId));
  const inviteHashes = await ctx.store.where('groupInvites', 'groupId', '==', groupId);
  await deleteAll(ctx, [
    ...requestIds.map((id) => P.request(groupId, id)),
    ...bannedIds.map((id) => P.banned(groupId, id)),
    ...inviteHashes.map((h) => P.invite(h)),
  ]);
}

export async function reportEntry(
  ctx: GroupContext,
  uid: string,
  groupId: string,
  entryId: string,
): Promise<void> {
  const reportId = ctx.randomHex(8);
  await ctx.store.transact(async (tx) => {
    await mustGroup(tx, groupId);
    const member = await tx.get(P.member(groupId, uid));
    if (!member) throw new ServiceError('not-found', 'Group not found.');
    // The reporter is not stored. The operator reads these from the console.
    tx.set(`reports/${reportId}`, { groupId, entryId, at: ctx.now() });
  });
}

// --------------------------------------------------- keeping the board fresh

export interface KidChange {
  uid: string;
  kidId: string;
  groupIds: readonly string[];
  starsBefore: number;
  after: { stars: number; avatar: string; favColor: string; childId: string };
  /** When the kid document was written; older writes never overwrite newer ones. */
  writtenAtMs: number;
}

/** Copies a child's weekly stars, avatar and colour to the boards they are shared on. */
export async function syncKidToGroups(ctx: GroupContext, change: KidChange): Promise<void> {
  for (const groupId of change.groupIds) {
    await ctx.store.transact(async (tx) => {
      const group = await tx.get(P.group(groupId));
      const member = group ? await tx.get(P.member(groupId, change.uid)) : null;
      const board = member ? await tx.get(P.board(groupId)) : null;
      if (!group || !member || !board) return;
      const entry = sharedOf(member)[change.kidId];
      if (!entry || entry.childId !== change.after.childId) return;
      const current = rec(rec(board['entries'])[entry.entryId]);
      if (Object.keys(current).length === 0) return;
      if (num(current['sourceUpdatedAt']) > change.writtenAtMs) return;

      const week = weekKey(ctx.now(), str(group['timezone']));
      const result = nextWeekly(
        { weekKey: entry.weekKey, weekBase: entry.weekBase },
        change.starsBefore, change.after.stars, week,
      );
      const unchanged =
        current['weekKey'] === week && num(current['weekStars']) === result.weekStars &&
        current['avatar'] === change.after.avatar && current['favColor'] === change.after.favColor;
      if (unchanged) return;

      tx.update(P.board(groupId), {
        [`entries.${entry.entryId}.avatar`]: change.after.avatar,
        [`entries.${entry.entryId}.favColor`]: change.after.favColor,
        [`entries.${entry.entryId}.weekKey`]: result.weekKey,
        [`entries.${entry.entryId}.weekStars`]: result.weekStars,
        [`entries.${entry.entryId}.sourceUpdatedAt`]: change.writtenAtMs,
      });
      tx.update(P.member(groupId, change.uid), {
        [`shared.${change.kidId}.weekKey`]: result.weekKey,
        [`shared.${change.kidId}.weekBase`]: result.weekBase,
      });
      if (ctx.now() - num(group['activityAt']) > ACTIVITY_TOUCH_MS) {
        tx.update(P.group(groupId), { activityAt: ctx.now() });
      }
    });
  }
}

/** A child profile was deleted: take it off every board it was on. */
export async function removeDeletedKid(
  ctx: GroupContext,
  uid: string,
  kidId: string,
  childId: string,
  groupIds: readonly string[],
): Promise<void> {
  for (const groupId of groupIds) {
    await ctx.store.transact(async (tx) => {
      const group = await tx.get(P.group(groupId));
      const member = group ? await tx.get(P.member(groupId, uid)) : null;
      const entry = member ? sharedOf(member)[kidId] : undefined;
      if (!member || !entry || (childId && entry.childId !== childId)) return;
      tx.update(P.board(groupId), { [`entries.${entry.entryId}`]: DELETE_FIELD });
      tx.update(P.member(groupId, uid), { [`shared.${kidId}`]: DELETE_FIELD });
    });
  }
}

// ----------------------------------------------------------------- clean-up

/** Daily job: forget old invites, and close groups nobody has used for 12 months. */
export async function cleanupGroups(ctx: GroupContext): Promise<{ invites: number; groups: number }> {
  const now = ctx.now();
  const oldInvites = await ctx.store.where('groupInvites', 'expiresAt', '<', now - 7 * DAY_MS);
  await deleteAll(ctx, oldInvites.map((h) => P.invite(h)));
  const idle = await ctx.store.where('groups', 'activityAt', '<', now - INACTIVE_GROUP_MS);
  for (const groupId of idle) await closeGroup(ctx, null, groupId);
  return { invites: oldInvites.length, groups: idle.length };
}
