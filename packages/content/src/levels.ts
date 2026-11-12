import type { TopicProgress } from '@kiyuv/shared';
import type { Pathway } from './pathway.js';

/** A child's journey is Level 1 to Level 10. Clearing every topic of a level opens the next. */
export const LEVEL_COUNT = 10;

/** Correct answers (out of 10) a round needs to count as "cleared". */
export const PASS_MARK = 7;

/**
 * Which level each topic belongs to. Two or three topics per level, mixing subjects so
 * a level never feels like one long drill. Easy ideas come first, the hardest last.
 */
export const TOPIC_LEVEL: Record<Pathway, Readonly<Record<string, number>>> = {
  // Ages 2 and 3 have no quiz path. They play.
  tots: {},
  young: {
    'g-add10': 1, 'g-animals': 1,
    'g-sub10': 2, 'g-cvc': 2,
    'g-compare': 3, 'g-rhyme': 3,
    'g-add20': 4, 'g-plants': 4,
    'g-sub20': 5, 'g-nouns': 5, 'g-habits': 5,
    'g-tens': 6, 'g-shapes': 6,
    'g-skip': 7, 'g-weather': 7,
    'g-evenodd': 8, 'g-body': 8, 'g-days': 8,
    'g-time': 9, 'g-opp': 9, 'g-india': 9,
    'g-add2d': 10, 'g-groups': 10, 'g-times': 10,
  },
  senior: {
    's-int': 1, 's-powers': 1,
    's-bodmas': 2, 's-affix': 2,
    's-hcf': 3, 's-fsimp': 3, 's-life': 3,
    's-dec': 4, 's-grammar': 4,
    's-fadd': 5, 's-area': 5, 's-earth': 5,
    's-percent': 6, 's-idioms': 6, 's-physics': 6,
    's-fmul': 7, 's-ratio': 7, 's-spell': 7,
    's-alg1': 8, 's-stats': 8, 's-computing': 8,
    's-angles': 9, 's-speed': 9, 's-world': 9,
    's-alg2': 10, 's-wp': 10, 's-logic': 10,
  },
  early: {
    'k-count5': 1, 'k-color8': 1,
    'k-letter': 2, 'k-shape6': 2,
    'k-animal6': 3, 'k-fruit': 3,
    'k-count10': 4, 'k-body': 4,
    'k-color10': 5, 'k-starts': 5, 'k-animal-bird': 5,
    'k-shape8': 6, 'k-hindi-vowel': 6, 'k-veg': 6,
    'k-animal-sound': 7, 'k-match': 7, 'k-animal-water': 7,
    'k-upper': 8, 'k-opp': 8, 'k-sky': 8,
    'k-count20': 9, 'k-hindi-cons': 9,
    'k-animal-wild': 10, 'k-biggerN': 10,
  },
  primary: {
    'y-add-e': 1, 'y-sub-e': 1,
    'y-mul-e': 2, 'y-syn': 2,
    'y-add-m': 3, 'y-ant': 3, 'y-gk-india': 3,
    'y-sub-m': 4, 'y-div-e': 4, 'y-spell-g3': 4,
    'y-mul-m': 5, 'y-wp-e': 5, 'y-grammar': 5,
    'y-div-m': 6, 'y-time': 6, 'y-science': 6,
    'y-wp-m': 7, 'y-round': 7, 'y-gk-world': 7,
    'y-add-h': 8, 'y-sub-h': 8, 'y-spell-bee': 8,
    'y-mul-h': 9, 'y-div-h': 9, 'y-wp-h': 9,
    'y-logic': 10,
  },
};

type Topics = Readonly<Record<string, TopicProgress>>;

/** The level of a topic. A topic with no level set is treated as Level 1, so it is never hidden. */
export function levelOf(track: Pathway, topicId: string): number {
  return TOPIC_LEVEL[track][topicId] ?? 1;
}

/** Cleared means the best round reached the pass mark (or the topic was mastered). */
export function isCleared(progress: TopicProgress | undefined): boolean {
  return (progress?.b ?? 0) >= PASS_MARK || Boolean(progress?.m);
}

export interface LevelStatus {
  /** The level the child is working on now, 1 to LEVEL_COUNT. */
  current: number;
  /** Every topic of every level is cleared. */
  allCleared: boolean;
  /** Topics cleared in the current level. */
  clearedInCurrent: number;
  /** Topics in the current level. */
  totalInCurrent: number;
}

/** The topics of one level, in the order a child works through them. */
export function topicsInLevel(track: Pathway, level: number): string[] {
  return Object.entries(TOPIC_LEVEL[track])
    .filter(([, l]) => l === level)
    .map(([id]) => id);
}

export function levelStatus(track: Pathway, topics: Topics): LevelStatus {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const ids = topicsInLevel(track, level);
    const cleared = ids.filter((id) => isCleared(topics[id])).length;
    if (cleared < ids.length) {
      return { current: level, allCleared: false, clearedInCurrent: cleared, totalInCurrent: ids.length };
    }
  }
  const last = topicsInLevel(track, LEVEL_COUNT).length;
  return { current: LEVEL_COUNT, allCleared: true, clearedInCurrent: last, totalInCurrent: last };
}

/** Topics in the order a child works through them: level by level. */
function topicOrder(track: Pathway): string[] {
  return Object.entries(TOPIC_LEVEL[track])
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
}

/**
 * The topic to work on now: the first one in order that is not cleared yet.
 * Returns null once everything is cleared.
 */
export function nextUnclearedTopic(track: Pathway, topics: Topics): string | null {
  return topicOrder(track).find((id) => !isCleared(topics[id])) ?? null;
}

/**
 * The topics to suggest after a round: open and not cleared yet, in the order a child
 * works through them. The topic just played is left out.
 */
export function upNextTopics(track: Pathway, topics: Topics, justPlayed: string, limit = 2): string[] {
  return topicOrder(track)
    .filter((id) => id !== justPlayed && !isCleared(topics[id]) && isTopicUnlocked(track, topics, id))
    .slice(0, limit);
}

/**
 * A topic is open when it is the next one to clear, the one right after it, or any level
 * already reached. So clearing a topic always opens the next one straight away.
 * A topic the child has already played stays open, so nobody who started before levels
 * existed is locked out of their own work.
 */
export function isTopicUnlocked(track: Pathway, topics: Topics, topicId: string): boolean {
  if ((topics[topicId]?.p ?? 0) > 0 || (topics[topicId]?.b ?? 0) > 0) return true;
  if (levelOf(track, topicId) <= levelStatus(track, topics).current) return true;
  const order = topicOrder(track);
  const frontier = order.findIndex((id) => !isCleared(topics[id]));
  return frontier >= 0 && order.indexOf(topicId) <= frontier + 1;
}

/** Special topic id for a mixed challenge round (not a real topic, never stored in progress). */
export const CHALLENGE_ID = 'challenge';

/** Correct answers (out of 10) that win a challenge. */
export const CHALLENGE_WIN = 9;

/** A challenge opens once the child has cleared this many topics. */
export const CHALLENGE_MIN_TOPICS = 3;

/** The topics a challenge draws from: every topic the child has cleared. */
export function challengePool(track: Pathway, topics: Topics): string[] {
  return Object.keys(TOPIC_LEVEL[track]).filter((id) => isCleared(topics[id]));
}

export function isChallengeUnlocked(track: Pathway, topics: Topics): boolean {
  return challengePool(track, topics).length >= CHALLENGE_MIN_TOPICS;
}
