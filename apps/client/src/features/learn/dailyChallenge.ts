import { coursesForChild, isTopicUnlocked, nextUnclearedTopic, pathwayOf } from '@kiyuv/content';
import type { KidProfile } from '@kiyuv/shared';
import { dateKey, loadDaily, saveDaily, type DailyState } from './dailyState.js';
import { topicInfoMap } from './learnPath.js';

/** Bonus stars for finishing today's daily challenge with a pass. */
export const DAILY_BONUS_STARS = 5;

export interface DailyPick {
  id: string;
  name: string;
  emoji: string;
  /** The subject, or the course group. */
  subject: string;
}

/** A small, steady number from text, so the same day always gives the same pick. */
function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h;
}

function describe(profile: KidProfile, id: string): DailyPick | null {
  const topic = topicInfoMap(pathwayOf(profile))[id];
  if (topic) return { id, name: topic.name, emoji: topic.emoji, subject: topic.subject };
  const course = coursesForChild(profile).find((c) => c.id === id);
  return course ? { id, name: course.name, emoji: course.emoji, subject: course.group } : null;
}

/**
 * Everything a daily challenge can be: the topics the child has open, plus the free bonus
 * courses, so the challenge changes subject from day to day.
 */
export function dailyPool(profile: KidProfile): DailyPick[] {
  const info = topicInfoMap(pathwayOf(profile));
  const topics = Object.keys(info).filter((id) => isTopicUnlocked(pathwayOf(profile), profile.topics, id));
  const courses = coursesForChild(profile).filter((c) => c.free).map((c) => c.id);
  return [...topics, ...courses].flatMap((id) => {
    const p = describe(profile, id);
    return p ? [p] : [];
  });
}

/** The toddlers' Play time has no scores, so it has no daily challenge. */
export const hasDailyChallenge = (profile: KidProfile): boolean => pathwayOf(profile) !== 'tots';

/**
 * Today's daily challenge. It is chosen from the date, once, and remembered, so it stays the
 * same all day even as the child clears topics and opens new ones.
 */
export function todaysDaily(key: string, profile: KidProfile, now: Date = new Date()): DailyPick | null {
  if (!hasDailyChallenge(profile)) return null;
  const today = dateKey(now);
  const state = loadDaily(key);
  if (state.pick?.date === today) {
    const kept = describe(profile, state.pick.id);
    if (kept) return kept;
  }
  // Not the topic that is already "Up next", so the two cards never say the same thing.
  const upNext = nextUnclearedTopic(pathwayOf(profile), profile.topics);
  const all = dailyPool(profile);
  const pool = all.length > 1 ? all.filter((p) => p.id !== upNext) : all;
  if (pool.length === 0) return null;
  const chosen = pool[hash(`${today}:${pathwayOf(profile)}`) % pool.length]!;
  const next: DailyState = { ...state, pick: { date: today, id: chosen.id } };
  saveDaily(key, next);
  return chosen;
}

export interface DailyRun {
  bonus: number;
  /** Called when the round is passed, to mark the challenge done for today. */
  onComplete: () => void;
}

/**
 * If this topic is today's daily challenge and it is not done yet, what to do when it is passed.
 * It counts however the child got there: from the daily card, the path or the subjects page.
 */
export function dailyRunFor(
  key: string,
  topicId: string | null,
  markDone: () => void,
  now: Date = new Date(),
): DailyRun | undefined {
  if (!topicId) return undefined;
  const today = dateKey(now);
  const state = loadDaily(key);
  if (state.pick?.date !== today || state.pick.id !== topicId || state.doneDate === today) return undefined;
  return { bonus: DAILY_BONUS_STARS, onComplete: markDone };
}
