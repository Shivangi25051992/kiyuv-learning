import { describe, expect, it } from 'vitest';
import type { TopicProgress, Track } from '@kiyuv/shared';
import { CURRICULUM } from './curriculum.js';
import {
  challengePool,
  isChallengeUnlocked,
  isCleared,
  isTopicUnlocked,
  LEVEL_COUNT,
  levelOf,
  levelStatus,
  PASS_MARK,
  TOPIC_LEVEL,
} from './levels.js';

const tp = (b: number, over: Partial<TopicProgress> = {}): TopicProgress => ({ p: 1, c: b, b, m: false, ...over });
const TRACKS: Track[] = ['early', 'primary'];

describe('level map', () => {
  it.each(TRACKS)('%s: every topic has a level, and no unknown topic is listed', (track) => {
    const ids = CURRICULUM[track].subjects.flatMap((s) => s.topics.map((t) => t.id));
    expect(Object.keys(TOPIC_LEVEL[track]).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      const l = TOPIC_LEVEL[track][id]!;
      expect(l).toBeGreaterThanOrEqual(1);
      expect(l).toBeLessThanOrEqual(LEVEL_COUNT);
    }
  });

  it.each(TRACKS)('%s: no level is empty', (track) => {
    for (let l = 1; l <= LEVEL_COUNT; l++) {
      expect(Object.values(TOPIC_LEVEL[track]).filter((x) => x === l).length, `level ${l}`).toBeGreaterThan(0);
    }
  });

  it('treats a topic without a level as level 1', () => {
    expect(levelOf('early', 'nope')).toBe(1);
  });
});

describe('clearing and unlocking', () => {
  it('a new child starts on level 1 and only level 1 is open', () => {
    expect(levelStatus('primary', {})).toEqual({ current: 1, allCleared: false, clearedInCurrent: 0, totalInCurrent: 2 });
    expect(isTopicUnlocked('primary', {}, 'y-add-e')).toBe(true);
    expect(isTopicUnlocked('primary', {}, 'y-mul-e')).toBe(false);
  });

  it('clears at the pass mark, or when mastered', () => {
    expect(isCleared(tp(PASS_MARK - 1))).toBe(false);
    expect(isCleared(tp(PASS_MARK))).toBe(true);
    expect(isCleared(tp(0, { m: true }))).toBe(true);
    expect(isCleared(undefined)).toBe(false);
  });

  it('opens the next level only when every topic of this level is cleared', () => {
    const one = { 'y-add-e': tp(8) };
    expect(levelStatus('primary', one).current).toBe(1);
    expect(levelStatus('primary', one).clearedInCurrent).toBe(1);
    expect(isTopicUnlocked('primary', one, 'y-mul-e')).toBe(false);

    const both = { 'y-add-e': tp(8), 'y-sub-e': tp(7) };
    expect(levelStatus('primary', both).current).toBe(2);
    expect(isTopicUnlocked('primary', both, 'y-mul-e')).toBe(true);
    expect(isTopicUnlocked('primary', both, 'y-add-m')).toBe(false);
  });

  it('a score below the pass mark does not open the next level', () => {
    const t = { 'y-add-e': tp(6), 'y-sub-e': tp(9) };
    expect(levelStatus('primary', t).current).toBe(1);
  });

  it('never locks a topic the child has already played', () => {
    const played = { 'y-mul-h': tp(3) };
    expect(isTopicUnlocked('primary', played, 'y-mul-h')).toBe(true);
    expect(isTopicUnlocked('primary', { 'y-mul-h': { p: 1, c: 0, b: 0, m: false } }, 'y-mul-h')).toBe(true);
  });

  it('reports all levels cleared', () => {
    const all: Record<string, TopicProgress> = {};
    for (const id of Object.keys(TOPIC_LEVEL.early)) all[id] = tp(10);
    const s = levelStatus('early', all);
    expect(s.allCleared).toBe(true);
    expect(s.current).toBe(LEVEL_COUNT);
  });
});

describe('challenge', () => {
  it('opens after enough topics are cleared and draws only from cleared topics', () => {
    const two = { 'y-add-e': tp(8), 'y-sub-e': tp(7) };
    expect(isChallengeUnlocked('primary', two)).toBe(false);
    const three = { ...two, 'y-mul-e': tp(9), 'y-syn': tp(5) };
    expect(isChallengeUnlocked('primary', three)).toBe(true);
    expect(challengePool('primary', three).sort()).toEqual(['y-add-e', 'y-mul-e', 'y-sub-e']);
  });
});
