import {
  CHALLENGE_MIN_TOPICS,
  CURRICULUM,
  LEVEL_COUNT,
  PASS_MARK,
  challengePool,
  coursesForTrack,
  isCleared,
  isChallengeUnlocked,
  isTopicUnlocked,
  levelStatus,
  nextUnclearedTopic,
  topicsInLevel,
} from '@kiyuv/content';
import type { KidProfile } from '@kiyuv/shared';

export interface TopicInfo {
  id: string;
  name: string;
  subject: string;
  emoji: string;
}

/** Every topic of a track, by id, with the subject it belongs to. */
export function topicInfoMap(track: KidProfile['track']): Record<string, TopicInfo> {
  const map: Record<string, TopicInfo> = {};
  for (const subject of CURRICULUM[track].subjects) {
    for (const t of subject.topics) map[t.id] = { id: t.id, name: t.name, subject: subject.name, emoji: subject.emoji };
  }
  return map;
}

export type TopicState = 'cleared' | 'open' | 'locked';

export interface TopicRowData extends TopicInfo {
  state: TopicState;
  /** Best score out of 10, 0 when never played. */
  best: number;
}

export type LevelState = 'done' | 'now' | 'open' | 'locked';

export interface LevelStop {
  level: number;
  state: LevelState;
  topics: TopicRowData[];
  cleared: number;
}

/**
 * The adventure path: all levels with their topics and how far the child is.
 *  - done: every topic cleared
 *  - now: the level being worked on
 *  - open: not the current level, but a topic in it is already open
 *  - locked: nothing in it is open yet
 */
export function buildPath(profile: KidProfile): LevelStop[] {
  const info = topicInfoMap(profile.track);
  const { current, allCleared } = levelStatus(profile.track, profile.topics);
  return Array.from({ length: LEVEL_COUNT }, (_, i) => {
    const level = i + 1;
    const topics: TopicRowData[] = topicsInLevel(profile.track, level).flatMap((id) => {
      const base = info[id];
      if (!base) return [];
      const progress = profile.topics[id];
      const state: TopicState = isCleared(progress)
        ? 'cleared'
        : isTopicUnlocked(profile.track, profile.topics, id)
          ? 'open'
          : 'locked';
      return [{ ...base, state, best: progress?.b ?? 0 }];
    });
    const cleared = topics.filter((t) => t.state === 'cleared').length;
    const state: LevelState =
      topics.length > 0 && cleared === topics.length
        ? 'done'
        : level === current && !allCleared
          ? 'now'
          : topics.some((t) => t.state !== 'locked')
            ? 'open'
            : 'locked';
    return { level, state, topics, cleared };
  });
}

/** The one thing to do next: the first topic on the path that is not cleared. */
export function upNext(profile: KidProfile): TopicRowData | null {
  const id = nextUnclearedTopic(profile.track, profile.topics);
  if (!id) return null;
  const stop = buildPath(profile)
    .flatMap((l) => l.topics)
    .find((t) => t.id === id);
  return stop ?? null;
}

export interface Recommendation {
  kind: 'retry' | 'course';
  id: string;
  title: string;
  reason: string;
  emoji: string;
}

/**
 * Up to two gentle suggestions, besides "Up next":
 *  - a topic that was played but not cleared yet (the lowest score first)
 *  - a free bonus course that has never been played
 */
export function recommend(profile: KidProfile, skipId?: string): Recommendation[] {
  const out: Recommendation[] = [];
  const info = topicInfoMap(profile.track);
  const next = nextUnclearedTopic(profile.track, profile.topics);

  const retry = Object.entries(profile.topics)
    .filter(([id, p]) => p.p > 0 && !isCleared(p) && id !== next && id !== skipId && info[id] && isTopicUnlocked(profile.track, profile.topics, id))
    .sort((a, b) => a[1].b - b[1].b)[0];
  if (retry) {
    const [id, p] = retry;
    out.push({
      kind: 'retry',
      id,
      title: info[id]!.name,
      reason: `Your best is ${p.b} out of 10 first time. Get ${PASS_MARK} to clear it.`,
      emoji: '🔄',
    });
  }
  const fresh = coursesForTrack(profile.track).find((c) => c.free && !profile.topics[c.id] && c.id !== skipId);
  if (fresh) {
    out.push({ kind: 'course', id: fresh.id, title: fresh.name, reason: 'A free bonus course to try.', emoji: fresh.emoji });
  }
  return out.slice(0, 2);
}

export interface ChallengeProgress {
  unlocked: boolean;
  have: number;
  need: number;
}

export function challengeProgress(profile: KidProfile): ChallengeProgress {
  const have = challengePool(profile.track, profile.topics).length;
  return { unlocked: isChallengeUnlocked(profile.track, profile.topics), have: Math.min(have, CHALLENGE_MIN_TOPICS), need: CHALLENGE_MIN_TOPICS };
}
