import { describe, expect, it } from 'vitest';
import { LEVEL_COUNT, TOPIC_LEVEL } from '@kiyuv/content';
import type { KidProfile, TopicProgress } from '@kiyuv/shared';
import { buildPath, challengeProgress, recommend, topicInfoMap, upNext } from './learnPath.js';
import { LEVEL_THEMES, themeOfLevel } from './levelThemes.js';

const tp = (b: number, p = 1): TopicProgress => ({ p, c: b, b, m: b >= 10 });
const kid = (topics: KidProfile['topics'] = {}, track: 'primary' | 'early' = 'primary'): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: track === 'early' ? 4 : 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track, stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics, resetEpoch: 0,
});

describe('adventure path', () => {
  it('has ten levels, each with a theme and at least one topic', () => {
    expect(LEVEL_THEMES).toHaveLength(LEVEL_COUNT);
    for (const track of ['early', 'primary'] as const) {
      const path = buildPath(kid({}, track));
      expect(path).toHaveLength(LEVEL_COUNT);
      for (const stop of path) expect(stop.topics.length, `${track} level ${stop.level}`).toBeGreaterThan(0);
      // every curriculum topic appears exactly once on the path
      const ids = path.flatMap((s) => s.topics.map((t) => t.id)).sort();
      expect(ids).toEqual(Object.keys(TOPIC_LEVEL[track]).sort());
    }
    expect(themeOfLevel(0).name).toBe(LEVEL_THEMES[0]!.name);
    expect(themeOfLevel(99).name).toBe(LEVEL_THEMES[9]!.name);
  });

  it('a new child is on level 1; level 1 is "now", the rest are locked, and two topics are open', () => {
    const path = buildPath(kid());
    expect(path[0]!.state).toBe('now');
    expect(path.slice(1).every((s) => s.state === 'locked')).toBe(true);
    expect(path[0]!.topics.every((t) => t.state === 'open')).toBe(true);
  });

  it('clearing one topic opens one more and moves nothing else', () => {
    const path = buildPath(kid({ 'y-add-e': tp(8) }));
    expect(path[0]!.state).toBe('now');
    expect(path[0]!.cleared).toBe(1);
    expect(path[0]!.topics.map((t) => t.state)).toEqual(['cleared', 'open']);
    // the first topic of level 2 is open already, so level 2 is "open" but not "now"
    expect(path[1]!.state).toBe('open');
    expect(path[1]!.topics[0]!.state).toBe('open');
    expect(path[1]!.topics[1]!.state).toBe('locked');
    expect(path[2]!.state).toBe('locked');
  });

  it('a finished level is "done" and the next one becomes "now"', () => {
    const path = buildPath(kid({ 'y-add-e': tp(8), 'y-sub-e': tp(9) }));
    expect(path[0]!.state).toBe('done');
    expect(path[1]!.state).toBe('now');
  });

  it('reports the best score of each topic', () => {
    const path = buildPath(kid({ 'y-add-e': tp(5) }));
    expect(path[0]!.topics[0]!.best).toBe(5);
    expect(path[0]!.topics[0]!.state).toBe('open');
  });
});

describe('up next', () => {
  it('is the first topic that is not cleared yet', () => {
    expect(upNext(kid())!.id).toBe('y-add-e');
    expect(upNext(kid({ 'y-add-e': tp(8) }))!.id).toBe('y-sub-e');
    expect(upNext(kid({ 'y-add-e': tp(8), 'y-sub-e': tp(7) }))!.id).toBe('y-mul-e');
  });

  it('is nothing once everything is cleared', () => {
    const all = Object.fromEntries(Object.keys(TOPIC_LEVEL.early).map((id) => [id, tp(10)]));
    expect(upNext(kid(all, 'early'))).toBeNull();
  });

  it('knows the name and subject of each topic', () => {
    const info = topicInfoMap('primary')['y-add-e']!;
    expect(info.name.length).toBeGreaterThan(0);
    expect(info.subject.length).toBeGreaterThan(0);
  });
});

describe('recommendations', () => {
  it('suggests nothing special for a brand new child except a free course', () => {
    const r = recommend(kid());
    expect(r.map((x) => x.kind)).toEqual(['course']);
  });

  it('suggests retrying a topic that was played but not cleared, lowest score first', () => {
    const r = recommend(kid({ 'y-add-e': tp(8), 'y-sub-e': tp(4), 'y-mul-e': tp(6) }));
    expect(r[0]).toMatchObject({ kind: 'retry', id: 'y-mul-e' });
    expect(r[0]!.reason).toMatch(/6 out of 10/);
  });

  it('never suggests the same topic that is already "Up next"', () => {
    const r = recommend(kid({ 'y-add-e': tp(4) }));
    expect(r.find((x) => x.kind === 'retry')).toBeUndefined();
  });

  it('never repeats the Mixed Challenge, which has its own card, and never gives more than two', () => {
    const topics = { 'y-add-e': tp(8), 'y-sub-e': tp(8), 'y-mul-e': tp(8), 'y-add-m': tp(3) };
    const r = recommend(kid(topics));
    expect(r.length).toBeLessThanOrEqual(2);
    expect(r.map((x) => x.kind)).toEqual(['retry', 'course']);
  });

  it('leaves out the topic or course that is the daily challenge', () => {
    const topics = { 'y-add-e': tp(8), 'y-sub-e': tp(8), 'y-mul-e': tp(8), 'y-add-m': tp(3) };
    expect(recommend(kid(topics), 'y-add-m').find((x) => x.id === 'y-add-m')).toBeUndefined();
    expect(recommend(kid(), 'c-space').find((x) => x.id === 'c-space')).toBeUndefined();
  });
});

describe('challenge progress', () => {
  it('counts cleared topics up to the number needed', () => {
    expect(challengeProgress(kid())).toEqual({ unlocked: false, have: 0, need: 3 });
    expect(challengeProgress(kid({ 'y-add-e': tp(8), 'y-sub-e': tp(8) }))).toMatchObject({ unlocked: false, have: 2 });
    const open = challengeProgress(kid({ 'y-add-e': tp(8), 'y-sub-e': tp(8), 'y-mul-e': tp(8), 'y-syn': tp(8) }));
    expect(open).toEqual({ unlocked: true, have: 3, need: 3 });
  });
});
