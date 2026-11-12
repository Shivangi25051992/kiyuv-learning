import { beforeEach, describe, expect, it } from 'vitest';
import type { KidProfile, TopicProgress } from '@kiyuv/shared';
import { DAILY_BONUS_STARS, dailyPool, dailyRunFor, hasDailyChallenge, todaysDaily } from './dailyChallenge.js';
import { dateKey, dayStreakOf, isDailyDone, loadDaily, markActiveToday, markDailyDone, saveDaily } from './dailyState.js';
import { RANKS, STARS_PER_RANK, rankOf } from './rank.js';

beforeEach(() => localStorage.clear());

const at = (iso: string) => new Date(`${iso}T10:00:00`);
const tp = (b: number): TopicProgress => ({ p: 1, c: b, b, m: b >= 10 });
const kid = (topics: KidProfile['topics'] = {}, over: Partial<KidProfile> = {}): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track: 'primary', stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics, resetEpoch: 0, ...over,
});

describe('rank from stars', () => {
  it('starts as a Seedling and moves up every 50 stars', () => {
    expect(rankOf(0)).toMatchObject({ index: 0, name: 'Seedling', into: 0, need: 50, pct: 0, next: 'Butterfly' });
    expect(rankOf(49)).toMatchObject({ index: 0, into: 49, pct: 98 });
    expect(rankOf(50)).toMatchObject({ index: 1, name: 'Butterfly', into: 0 });
    expect(rankOf(108)).toMatchObject({ index: 2, name: 'Shining Star', into: 8, pct: 16, next: 'Medalist' });
  });

  it('tops out at the last rank with a full bar', () => {
    const top = rankOf(STARS_PER_RANK * RANKS.length + 120);
    expect(top).toMatchObject({ name: 'Legend', maxed: true, pct: 100, next: null, need: 0 });
  });

  it('copes with odd input', () => {
    expect(rankOf(-5).index).toBe(0);
    expect(rankOf(12.9).into).toBe(12);
  });
});

describe('day streak', () => {
  it('uses the child\'s own calendar day', () => {
    expect(dateKey(new Date(2026, 10, 12, 23, 59))).toBe('2026-11-12');
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('starts at 1, does not grow twice in one day, and grows on the next day', () => {
    expect(markActiveToday('a', at('2026-11-10')).dayStreak).toBe(1);
    expect(markActiveToday('a', at('2026-11-10')).dayStreak).toBe(1);
    expect(markActiveToday('a', at('2026-11-11')).dayStreak).toBe(2);
    expect(markActiveToday('a', at('2026-11-12')).dayStreak).toBe(3);
  });

  it('crosses a month and a year end', () => {
    markActiveToday('a', at('2026-12-31'));
    expect(markActiveToday('a', at('2027-01-01')).dayStreak).toBe(2);
  });

  it('is still alive the day after, and gone after a missed day', () => {
    markActiveToday('a', at('2026-11-10'));
    const s = markActiveToday('a', at('2026-11-11'));
    expect(dayStreakOf(s, at('2026-11-11'))).toBe(2);
    expect(dayStreakOf(s, at('2026-11-12'))).toBe(2);
    expect(dayStreakOf(s, at('2026-11-13'))).toBe(0);
  });

  it('starts again at 1 after a missed day', () => {
    markActiveToday('a', at('2026-11-10'));
    markActiveToday('a', at('2026-11-11'));
    expect(markActiveToday('a', at('2026-11-14')).dayStreak).toBe(1);
  });

  it('keeps each child separate and survives bad saved data', () => {
    markActiveToday('a', at('2026-11-10'));
    expect(loadDaily('b')).toEqual({});
    localStorage.setItem('kiyuv.daily.c', '{not json');
    expect(loadDaily('c')).toEqual({});
    localStorage.setItem('kiyuv.daily.d', JSON.stringify({ dayStreak: 'x', doneDate: 5, pick: { date: 1 } }));
    expect(loadDaily('d')).toEqual({});
  });
});

describe('the daily challenge', () => {
  it('is done only for the day it was completed', () => {
    markDailyDone('a', at('2026-11-10'));
    expect(isDailyDone(loadDaily('a'), at('2026-11-10'))).toBe(true);
    expect(isDailyDone(loadDaily('a'), at('2026-11-11'))).toBe(false);
  });

  it('picks from open topics and free courses, and never from locked topics', () => {
    const ids = dailyPool(kid()).map((p) => p.id);
    expect(ids).toContain('y-add-e');
    expect(ids).toContain('c-space');
    expect(ids).not.toContain('y-add-h');
    expect(ids).not.toContain('c-animals'); // premium
  });

  it('gives the same challenge all day, even after the child opens more topics', () => {
    const first = todaysDaily('a', kid(), at('2026-11-10'))!;
    const later = todaysDaily('a', kid({ 'y-add-e': tp(9), 'y-sub-e': tp(9), 'y-mul-e': tp(9) }), at('2026-11-10'))!;
    expect(later.id).toBe(first.id);
  });

  it('is never the topic that is already "Up next", so the two cards differ', () => {
    for (let d = 10; d < 40; d++) {
      const pick = todaysDaily('a' + d, kid(), new Date(2026, 10, d, 10))!;
      expect(pick.id).not.toBe('y-add-e');
    }
  });

  it('changes from day to day, and covers more than one thing over a week', () => {
    const seen = new Set<string>();
    for (let d = 10; d < 24; d++) seen.add(todaysDaily('a', kid(), at(`2026-11-${d}`))!.id);
    expect(seen.size).toBeGreaterThanOrEqual(3);
    // the same day always gives the same answer for the same child
    expect(todaysDaily('z', kid(), at('2026-11-15'))!.id).toBe(todaysDaily('y', kid(), at('2026-11-15'))!.id);
  });

  it('has none for toddlers, who have Play time instead', () => {
    const toddler = kid({}, { track: 'early', age: 2, ageBand: '2-4' });
    expect(hasDailyChallenge(toddler)).toBe(false);
    expect(todaysDaily('a', toddler, at('2026-11-10'))).toBeNull();
    expect(hasDailyChallenge(kid({}, { track: 'early', age: 4, ageBand: '2-4' }))).toBe(true);
  });

  it('adds the bonus only to today\'s challenge, only until it is done', () => {
    const today = at('2026-11-10');
    const pick = todaysDaily('a', kid(), today)!;
    let done = 0;
    const run = dailyRunFor('a', pick.id, () => { done++; markDailyDone('a', today); }, today);
    expect(run?.bonus).toBe(DAILY_BONUS_STARS);
    run!.onComplete();
    expect(done).toBe(1);
    expect(dailyRunFor('a', pick.id, () => {}, today)).toBeUndefined();
    expect(dailyRunFor('a', 'y-add-h', () => {}, today)).toBeUndefined();
    expect(dailyRunFor('a', null, () => {}, today)).toBeUndefined();
    // a new day, a new challenge
    expect(dailyRunFor('a', pick.id, () => {}, at('2026-11-11'))).toBeUndefined();
  });

  it('forgets a stale pick when the course it named is no longer there', () => {
    saveDaily('a', { pick: { date: '2026-11-10', id: 'gone' } });
    const p = todaysDaily('a', kid(), at('2026-11-10'));
    expect(p).not.toBeNull();
    expect(p!.id).not.toBe('gone');
  });
});
