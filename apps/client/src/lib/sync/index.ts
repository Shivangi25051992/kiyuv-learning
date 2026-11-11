import { evaluateEarnedBadgeIds } from '@kiyuv/content';
import {
  KID_IDS,
  KidProfileSchema,
  WRITE_SPACING_MS,
  type KidId,
  type KidOnboardingInput,
  type KidProfile,
  type TopicProgress,
} from '@kiyuv/shared';
import {
  fetchFamilyDashboard,
  fetchSingleKidProfile,
  flushKidProfileTransaction,
  getCurrentAuthUser,
  removeKidProfileFromCloud,
  resetCloudKidsProgressBatch,
  writeKidMaxTries,
  writeKidProfileDirect,
} from '../firebase/index.js';

const ACTIVE_KID_PREFIX = 'activeKid:';
const PROFILES_KEY_PREFIX = 'kiyuv_profiles:';
const DIRTY_QUEUE_PREFIX = 'kiyuv_dirty:';
const RESET_EPOCH_PREFIX = 'kiyuv_resetEpoch:';

const lastKidWriteAt: Record<string, number> = {};
const syncTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function getActiveKidForDevice(uid: string): KidId | null {
  const val = localStorage.getItem(`${ACTIVE_KID_PREFIX}${uid}`);
  if (val && KID_IDS.includes(val as KidId)) {
    return val as KidId;
  }
  return null;
}

export function setActiveKidForDevice(uid: string, kidId: KidId | null): void {
  if (!kidId) {
    localStorage.removeItem(`${ACTIVE_KID_PREFIX}${uid}`);
  } else {
    localStorage.setItem(`${ACTIVE_KID_PREFIX}${uid}`, kidId);
  }
}

export function getLocalResetEpoch(uid: string): number {
  const raw = parseInt(localStorage.getItem(`${RESET_EPOCH_PREFIX}${uid}`) ?? '0', 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

export function setLocalResetEpoch(uid: string, epoch: number): number {
  const safe = Math.max(0, Math.trunc(epoch));
  localStorage.setItem(`${RESET_EPOCH_PREFIX}${uid}`, String(safe));
  return safe;
}

export function loadLocalProfiles(uid: string): KidProfile[] {
  try {
    const raw = localStorage.getItem(`${PROFILES_KEY_PREFIX}${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    const valid: KidProfile[] = [];
    for (const item of parsed) {
      if (item && typeof item === 'object' && 'kidId' in item) {
        const kidId = (item as { kidId: string }).kidId;
        if (KID_IDS.includes(kidId as KidId)) {
          const check = KidProfileSchema.safeParse(item);
          if (check.success) {
            valid.push({ kidId: kidId as KidId, ...check.data });
          }
        }
      }
    }
    valid.sort((a, b) => a.kidId.localeCompare(b.kidId));
    return valid;
  } catch {
    return [];
  }
}

export function saveLocalProfiles(uid: string, profiles: readonly KidProfile[]): void {
  // The child's name is never written to this device's storage; it exists only
  // encrypted in the cloud and in memory after a parent decrypts it.
  const sorted = [...profiles]
    .map((p) => ({ ...p, name: '' }))
    .sort((a, b) => a.kidId.localeCompare(b.kidId));
  localStorage.setItem(`${PROFILES_KEY_PREFIX}${uid}`, JSON.stringify(sorted));
}

export function getDirtyQueue(uid: string): Set<KidId> {
  try {
    const raw = localStorage.getItem(`${DIRTY_QUEUE_PREFIX}${uid}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr.filter((id): id is KidId => KID_IDS.includes(id as KidId)));
  } catch {
    return new Set();
  }
}

function saveDirtyQueue(uid: string, queue: Set<KidId>): void {
  localStorage.setItem(`${DIRTY_QUEUE_PREFIX}${uid}`, JSON.stringify([...queue]));
}

export function markKidDirty(uid: string, kidId: KidId): void {
  const q = getDirtyQueue(uid);
  q.add(kidId);
  saveDirtyQueue(uid, q);
}

export function clearKidDirty(uid: string, kidId: KidId): void {
  const q = getDirtyQueue(uid);
  q.delete(kidId);
  saveDirtyQueue(uid, q);
}

export function mergeKidProfiles(local: KidProfile, remote: KidProfile | null): KidProfile {
  if (!remote) return local;

  // Higher resetEpoch always wins and discards stale pre-reset stats
  if (remote.resetEpoch > local.resetEpoch) {
    return remote;
  }
  if (local.resetEpoch > remote.resetEpoch) {
    return local;
  }

  const mergedTopics: Record<string, TopicProgress> = {};
  const allTopicIds = new Set([
    ...Object.keys(local.topics),
    ...Object.keys(remote.topics),
  ]);

  for (const topicId of allTopicIds) {
    const l = local.topics[topicId];
    const r = remote.topics[topicId];
    const p = Math.max(l?.p ?? 0, r?.p ?? 0);
    const c = Math.max(l?.c ?? 0, r?.c ?? 0);
    const b = Math.max(l?.b ?? 0, r?.b ?? 0);
    mergedTopics[topicId] = {
      p,
      c,
      b,
      m: b >= 10 || Boolean(l?.m) || Boolean(r?.m),
    };
  }

  const stars = Math.max(local.stars, remote.stars);
  const bestStreak = Math.max(local.bestStreak, remote.bestStreak);
  const totalCorrect = Math.max(local.totalCorrect, remote.totalCorrect);
  const totalWrong = Math.max(local.totalWrong, remote.totalWrong);
  const streak = local.streak;
  // A parent's choice on this device wins; otherwise take what the cloud has.
  const maxTries = local.maxTries ?? remote.maxTries;

  const badgeSet = new Set([
    ...local.badges,
    ...remote.badges,
    ...evaluateEarnedBadgeIds({ stars, bestStreak, topics: mergedTopics }),
  ]);

  return {
    ...local,
    stars,
    streak,
    bestStreak,
    totalCorrect,
    totalWrong,
    topics: mergedTopics,
    badges: [...badgeSet].slice(0, 100),
    resetEpoch: Math.max(local.resetEpoch, remote.resetEpoch),
    ...(maxTries !== undefined ? { maxTries } : {}),
  };
}

export async function flushKidToCloud(uid: string, kidId: KidId): Promise<boolean> {
  const timerKey = `${uid}:${kidId}`;
  if (syncTimers[timerKey]) {
    clearTimeout(syncTimers[timerKey]);
    delete syncTimers[timerKey];
  }

  const dirty = getDirtyQueue(uid);
  if (!dirty.has(kidId)) return true;

  const authUser = getCurrentAuthUser();
  if (!authUser || authUser.uid !== uid) return false;

  const now = Date.now();
  const lastWrite = lastKidWriteAt[timerKey] ?? 0;
  if (now - lastWrite < WRITE_SPACING_MS) {
    const waitMs = WRITE_SPACING_MS - (now - lastWrite) + 250;
    syncTimers[timerKey] = setTimeout(() => {
      void flushKidToCloud(uid, kidId);
    }, waitMs);
    return false;
  }

  const profiles = loadLocalProfiles(uid);
  const localProfile = profiles.find((p) => p.kidId === kidId);
  if (!localProfile) {
    clearKidDirty(uid, kidId);
    return true;
  }

  try {
    lastKidWriteAt[timerKey] = Date.now();
    const merged = await flushKidProfileTransaction(uid, localProfile, mergeKidProfiles);
    const updatedProfiles = loadLocalProfiles(uid).map((p) =>
      p.kidId === kidId ? merged : p,
    );
    saveLocalProfiles(uid, updatedProfiles);
    clearKidDirty(uid, kidId);
    return true;
  } catch {
    syncTimers[timerKey] = setTimeout(() => {
      void flushKidToCloud(uid, kidId);
    }, 6000);
    return false;
  }
}

export function scheduleKidSync(uid: string, kidId: KidId, flushImmediately = false): void {
  markKidDirty(uid, kidId);
  const timerKey = `${uid}:${kidId}`;
  if (flushImmediately) {
    void flushKidToCloud(uid, kidId);
    return;
  }
  if (!syncTimers[timerKey]) {
    syncTimers[timerKey] = setTimeout(() => {
      void flushKidToCloud(uid, kidId);
    }, 30_000);
  }
}

export async function flushAllDirtyKidsForUser(uid: string): Promise<void> {
  const dirty = getDirtyQueue(uid);
  for (const kidId of dirty) {
    await flushKidToCloud(uid, kidId);
  }
}

export async function syncFamilyFromCloud(uid: string): Promise<KidProfile[]> {
  const localProfiles = loadLocalProfiles(uid);
  const localEpoch = getLocalResetEpoch(uid);

  try {
    const cloud = await fetchFamilyDashboard(uid);
    const effectiveEpoch = Math.max(localEpoch, cloud.resetEpoch);
    setLocalResetEpoch(uid, effectiveEpoch);

    const byId = new Map<KidId, KidProfile>();
    for (const lp of localProfiles) {
      if (lp.resetEpoch >= effectiveEpoch) {
        byId.set(lp.kidId, lp);
      }
    }
    for (const cp of cloud.kids) {
      const existingLocal = byId.get(cp.kidId) ?? null;
      byId.set(cp.kidId, existingLocal ? mergeKidProfiles(existingLocal, cp) : cp);
    }

    const mergedList = [...byId.values()].sort((a, b) => a.kidId.localeCompare(b.kidId));
    saveLocalProfiles(uid, mergedList);

    // Flush any queued offline writes that survived a restart
    void flushAllDirtyKidsForUser(uid);

    return mergedList;
  } catch {
    return localProfiles;
  }
}

export async function refreshActiveKidFromCloud(
  uid: string,
  kidId: KidId,
): Promise<KidProfile | null> {
  const profiles = loadLocalProfiles(uid);
  const local = profiles.find((p) => p.kidId === kidId) ?? null;
  try {
    const remote = await fetchSingleKidProfile(uid, kidId);
    if (!remote) return local;
    const merged = local ? mergeKidProfiles(local, remote) : remote;
    const nextList = local
      ? profiles.map((p) => (p.kidId === kidId ? merged : p))
      : [...profiles, merged];
    saveLocalProfiles(uid, nextList);
    if (merged.resetEpoch > getLocalResetEpoch(uid)) {
      setLocalResetEpoch(uid, merged.resetEpoch);
    }
    return merged;
  } catch {
    return local;
  }
}

export async function createOrSaveProfile(
  uid: string,
  kidId: KidId,
  input: KidOnboardingInput,
  initialProgress?: Partial<Pick<KidProfile, 'stars' | 'streak' | 'bestStreak' | 'totalCorrect' | 'totalWrong' | 'badges' | 'topics'>>,
): Promise<KidProfile> {
  const profiles = loadLocalProfiles(uid);
  const existing = profiles.find((p) => p.kidId === kidId);
  const resetEpoch = getLocalResetEpoch(uid);

  const profile: KidProfile = {
    kidId,
    name: input.name,
    nickname: input.nickname,
    age: input.age,
    country: input.country,
    state: input.state,
    favColor: input.favColor,
    avatar: input.avatar,
    ageBand: input.ageBand,
    track: input.track,
    stars: existing?.stars ?? initialProgress?.stars ?? 0,
    streak: existing?.streak ?? initialProgress?.streak ?? 0,
    bestStreak: existing?.bestStreak ?? initialProgress?.bestStreak ?? 0,
    totalCorrect: existing?.totalCorrect ?? initialProgress?.totalCorrect ?? 0,
    totalWrong: existing?.totalWrong ?? initialProgress?.totalWrong ?? 0,
    badges: existing?.badges ?? initialProgress?.badges ?? [],
    topics: existing?.topics ?? initialProgress?.topics ?? {},
    resetEpoch,
    // Editing a profile must not undo the parent's tries setting.
    ...(existing?.maxTries !== undefined ? { maxTries: existing.maxTries } : {}),
  };

  KidProfileSchema.parse(profile);
  const nextProfiles = existing
    ? profiles.map((p) => (p.kidId === kidId ? profile : p))
    : [...profiles, profile];
  saveLocalProfiles(uid, nextProfiles);

  try {
    lastKidWriteAt[`${uid}:${kidId}`] = Date.now();
    await writeKidProfileDirect(uid, profile, resetEpoch);
    clearKidDirty(uid, kidId);
  } catch {
    markKidDirty(uid, kidId);
  }
  return profile;
}

/**
 * Changes how many tries a child gets per question (0 = unlimited). Needs a PIN from
 * the last 5 minutes, so it is saved straight away and rolled back if that fails.
 */
export async function setProfileMaxTries(
  uid: string,
  kidId: KidId,
  maxTries: number,
): Promise<KidProfile[]> {
  const profiles = loadLocalProfiles(uid);
  const existing = profiles.find((p) => p.kidId === kidId);
  if (!existing) return profiles;
  const updated: KidProfile = { ...existing, maxTries };
  KidProfileSchema.parse(updated);
  await writeKidMaxTries(uid, kidId, maxTries);
  const next = profiles.map((p) => (p.kidId === kidId ? updated : p));
  saveLocalProfiles(uid, next);
  return next;
}

export async function deleteChildProfile(uid: string, kidId: KidId): Promise<KidProfile[]> {
  const next = loadLocalProfiles(uid).filter((p) => p.kidId !== kidId);
  saveLocalProfiles(uid, next);
  clearKidDirty(uid, kidId);
  if (getActiveKidForDevice(uid) === kidId) {
    setActiveKidForDevice(uid, next[0]?.kidId ?? null);
  }
  try {
    await removeKidProfileFromCloud(uid, kidId);
  } catch {
    // Offline deletion; local profile already removed
  }
  return next;
}

export async function resetFamilyProgress(
  uid: string,
  targetKidId?: KidId,
): Promise<KidProfile[]> {
  const nextEpoch = setLocalResetEpoch(uid, getLocalResetEpoch(uid) + 1);
  const current = loadLocalProfiles(uid);
  const updated = current.map((p) => {
    if (targetKidId && p.kidId !== targetKidId) {
      return { ...p, resetEpoch: nextEpoch };
    }
    clearKidDirty(uid, p.kidId);
    return {
      ...p,
      stars: 0,
      streak: 0,
      bestStreak: 0,
      totalCorrect: 0,
      totalWrong: 0,
      badges: [],
      topics: {},
      resetEpoch: nextEpoch,
    };
  });
  saveLocalProfiles(uid, updated);

  try {
    await resetCloudKidsProgressBatch(uid, updated, nextEpoch);
    for (const p of updated) {
      lastKidWriteAt[`${uid}:${p.kidId}`] = Date.now();
    }
  } catch {
    for (const p of updated) {
      markKidDirty(uid, p.kidId);
    }
  }
  return updated;
}

// Task 2.10: Detect & import legacy kidsAcad_* local progress once, then purge legacy keys
export interface LegacyImportCandidate {
  legacyKey: string;
  suggestedTrack: 'early' | 'primary';
  stars: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalWrong: number;
  topics: Record<string, TopicProgress>;
  badges: string[];
}

export function detectLegacyLocalProgress(): LegacyImportCandidate[] {
  const candidates: LegacyImportCandidate[] = [];
  if (typeof localStorage === 'undefined') return candidates;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('kidsAcad_')) continue;
    if (
      key === 'kidsAcad_session' ||
      key === 'kidsAcad_resetEpoch' ||
      key === 'kidsAcad_installDismissed' ||
      key === 'kidsAcad_iosHintDismissed' ||
      key.startsWith('kidsAcad_lastActive_')
    ) {
      continue;
    }
    try {
      const raw = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (!raw || typeof raw !== 'object') continue;
      const stars = Math.max(0, Math.trunc(Number(raw.stars) || 0));
      const totalCorrect = Math.max(0, Math.trunc(Number(raw.totalCorrect) || 0));
      if (stars === 0 && totalCorrect === 0) continue;

      const topics: Record<string, TopicProgress> = {};
      const games = raw.games && typeof raw.games === 'object' ? raw.games : {};
      for (const [topicId, g] of Object.entries(games as Record<string, Record<string, unknown>>)) {
        const p = Math.max(0, Math.trunc(Number(g?.['played']) || 0));
        const c = Math.max(0, Math.trunc(Number(g?.['correct']) || 0));
        const b = Math.max(0, Math.trunc(Number(g?.['best']) || 0));
        topics[topicId] = { p, c, b, m: b >= 10 };
      }

      const bestStreak = Math.max(0, Math.trunc(Number(raw.bestStreak) || 0));
      const hasEarlyTopics = Object.keys(topics).some((id) => id.startsWith('k-'));
      candidates.push({
        legacyKey: key,
        suggestedTrack: hasEarlyTopics ? 'early' : 'primary',
        stars,
        streak: Math.max(0, Math.trunc(Number(raw.streak) || 0)),
        bestStreak,
        totalCorrect,
        totalWrong: Math.max(0, Math.trunc(Number(raw.totalWrong) || 0)),
        topics,
        badges: evaluateEarnedBadgeIds({ stars, bestStreak, topics }),
      });
    } catch {
      // Ignore malformed legacy entry
    }
  }
  return candidates;
}

export function purgeLegacyLocalKeys(specificKey?: string): void {
  if (typeof localStorage === 'undefined') return;
  // Always remove legacy session that stored plaintext PIN
  localStorage.removeItem('kidsAcad_session');
  if (specificKey) {
    localStorage.removeItem(specificKey);
    return;
  }
  const toDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('kidsAcad_')) {
      toDelete.push(k);
    }
  }
  for (const k of toDelete) {
    localStorage.removeItem(k);
  }
}
