import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentDeleted, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { z } from 'zod';
import {
  CreateGroupInputSchema,
  CreateInviteInputSchema,
  GroupIdInputSchema,
  GroupMemberInputSchema,
  HideEntryInputSchema,
  RenameGroupInputSchema,
  RequestJoinInputSchema,
  SetSharedChildrenInputSchema,
} from '@kiyuv/shared';
import { requireFreshPin } from './authGuard.js';
import * as svc from './groupService.js';
import { ServiceError, type GroupContext } from './groupService.js';
import { DELETE_FIELD, type Doc, type Store, type Tx } from './groupStore.js';
import { pinPepperSecret } from './secrets.js';

const REGION = 'asia-south1';
const JOIN_LINK = 'https://kiyuv-learning.web.app/join#';

// ------------------------------------------------------------ Firestore store

function createFirestoreStore(): Store {
  const db = getFirestore();
  const mapPatch = (patch: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [k, v === DELETE_FIELD ? FieldValue.delete() : v]),
    );
  return {
    transact: (fn) =>
      db.runTransaction(async (t) => {
        const tx: Tx = {
          get: async (path) => {
            const snap = await t.get(db.doc(path));
            return snap.exists ? (snap.data() as Doc) : null;
          },
          set: (path, data) => void t.set(db.doc(path), data),
          update: (path, patch) => void t.update(db.doc(path), mapPatch(patch)),
          delete: (path) => void t.delete(db.doc(path)),
        };
        return fn(tx);
      }),
    ids: async (collectionPath) =>
      (await db.collection(collectionPath).select().get()).docs.map((d) => d.id),
    where: async (collectionPath, field, op, value) =>
      (await db.collection(collectionPath).where(field, op, value).select().get()).docs.map((d) => d.id),
  };
}

/** The invite key is derived from the PIN pepper, so no extra secret has to be set up. */
function inviteKey(): string {
  const pepper = pinPepperSecret.value();
  if (!pepper || pepper.length < 32) {
    throw new HttpsError('failed-precondition', 'Groups are not configured.');
  }
  return createHmac('sha256', pepper).update('kiyuv-invite-v1').digest('hex');
}

function makeContext(): GroupContext {
  return {
    store: createFirestoreStore(),
    now: () => Date.now(),
    randomHex: (bytes) => randomBytes(bytes).toString('hex'),
    randomIndex: (max) => randomInt(max),
    inviteKey: inviteKey(),
  };
}

// ------------------------------------------------------------------ callables

function toHttpsError(err: unknown): HttpsError {
  if (err instanceof HttpsError) return err;
  if (err instanceof ServiceError) return new HttpsError(err.code, err.message);
  // Never log codes, links, board names or nicknames: only the error type.
  logger.error('group function failed', { type: err instanceof Error ? err.name : 'unknown' });
  return new HttpsError('internal', 'Something went wrong. Please try again.');
}

const CALLABLE = {
  region: REGION,
  invoker: 'public' as const,
  maxInstances: 10,
  enforceAppCheck: false, // Turned on for public launch (see the groups design, G10).
  secrets: [pinPepperSecret],
};

function groupCallable<S extends z.ZodTypeAny, R>(
  schema: S,
  run: (ctx: GroupContext, uid: string, input: z.output<S>) => Promise<R>,
) {
  return onCall(CALLABLE, async (request) => {
    const uid = requireFreshPin(request);
    const parsed = schema.safeParse(request.data ?? {});
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid request.');
    }
    try {
      return await run(makeContext(), uid, parsed.data);
    } catch (err) {
      throw toHttpsError(err);
    }
  });
}

const done = async (p: Promise<void>) => {
  await p;
  return { ok: true as const };
};

export const createGroup = groupCallable(CreateGroupInputSchema, (c, uid, i) => svc.createGroup(c, uid, i));

export const createInvite = groupCallable(CreateInviteInputSchema, async (c, uid, i) => {
  const r = await svc.createInvite(c, uid, i);
  return { ...r, link: `${JOIN_LINK}${r.code}` };
});

export const revokeInvites = groupCallable(GroupIdInputSchema, (c, uid, i) =>
  done(svc.revokeInvites(c, uid, i.groupId)),
);

export const requestJoin = groupCallable(RequestJoinInputSchema, (c, uid, i) => svc.requestJoin(c, uid, i));

export const approveMember = groupCallable(GroupMemberInputSchema, (c, uid, i) =>
  done(svc.approveMember(c, uid, i.groupId, i.uid)),
);

export const declineMember = groupCallable(GroupMemberInputSchema, (c, uid, i) =>
  done(svc.declineMember(c, uid, i.groupId, i.uid)),
);

export const setSharedChildren = groupCallable(SetSharedChildrenInputSchema, (c, uid, i) =>
  done(svc.setSharedChildren(c, uid, i.groupId, i.children)),
);

export const leaveGroup = groupCallable(GroupIdInputSchema, (c, uid, i) =>
  done(svc.leaveGroup(c, uid, i.groupId)),
);

export const removeMember = groupCallable(GroupMemberInputSchema, (c, uid, i) =>
  done(svc.removeMember(c, uid, i.groupId, i.uid)),
);

export const hideEntry = groupCallable(HideEntryInputSchema, (c, uid, i) =>
  done(svc.hideEntry(c, uid, i.groupId, i.entryId)),
);

export const reportEntry = groupCallable(HideEntryInputSchema, (c, uid, i) =>
  done(svc.reportEntry(c, uid, i.groupId, i.entryId)),
);

export const transferOwnership = groupCallable(GroupMemberInputSchema, (c, uid, i) =>
  done(svc.transferOwnership(c, uid, i.groupId, i.uid)),
);

export const renameGroup = groupCallable(RenameGroupInputSchema, (c, uid, i) =>
  done(svc.renameGroup(c, uid, i.groupId, i.name)),
);

export const closeGroup = groupCallable(GroupIdInputSchema, (c, uid, i) =>
  done(svc.closeGroup(c, uid, i.groupId)),
);

// ------------------------------------------------------------------- triggers

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/**
 * Keeps leaderboards current. It stops at once, with no reads, for a child who is
 * in no group, or when stars, avatar and colour did not change.
 */
export const syncGroupBoard = onDocumentUpdated(
  { document: 'users/{uid}/kids/{kidId}', region: REGION, secrets: [pinPepperSecret] },
  async (event) => {
    const before = event.data?.before.data();
    const afterSnap = event.data?.after;
    const after = afterSnap?.data();
    if (!before || !after) return;
    const groupIds = strings(after['sharedIn']);
    if (groupIds.length === 0) return;
    if (
      before['stars'] === after['stars'] &&
      before['avatar'] === after['avatar'] &&
      before['favColor'] === after['favColor']
    ) {
      return;
    }
    const childId = typeof after['childId'] === 'string' ? after['childId'] : '';
    if (!childId) return;
    try {
      await svc.syncKidToGroups(makeContext(), {
        uid: event.params.uid,
        kidId: event.params.kidId,
        groupIds,
        starsBefore: typeof before['stars'] === 'number' ? before['stars'] : 0,
        after: {
          stars: typeof after['stars'] === 'number' ? after['stars'] : 0,
          avatar: typeof after['avatar'] === 'string' ? after['avatar'] : '',
          favColor: typeof after['favColor'] === 'string' ? after['favColor'] : 'blue',
          childId,
        },
        writtenAtMs: afterSnap?.updateTime?.toMillis() ?? Date.now(),
      });
    } catch (err) {
      throw toHttpsError(err);
    }
  },
);

/** A deleted child profile disappears from every board straight away. */
export const removeDeletedKidFromGroups = onDocumentDeleted(
  { document: 'users/{uid}/kids/{kidId}', region: REGION, secrets: [pinPepperSecret] },
  async (event) => {
    const before = event.data?.data();
    const groupIds = strings(before?.['sharedIn']);
    if (groupIds.length === 0) return;
    const childId = typeof before?.['childId'] === 'string' ? before['childId'] : '';
    await svc.removeDeletedKid(makeContext(), event.params.uid, event.params.kidId, childId, groupIds);
  },
);

/** Daily: forget old invites and close groups nobody has used for 12 months. */
export const cleanupGroups = onSchedule(
  { schedule: 'every day 03:30', timeZone: 'Asia/Kolkata', region: REGION, secrets: [pinPepperSecret] },
  async () => {
    const result = await svc.cleanupGroups(makeContext());
    logger.info('group clean-up', result);
  },
);
