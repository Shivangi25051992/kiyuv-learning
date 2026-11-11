import { describe, expect, it } from 'vitest';
import {
  INVITE_ALPHABET,
  MAX_WEEKLY_STARS,
  CreateGroupInputSchema,
  RequestJoinInputSchema,
  extractInviteCode,
  isBoardNameAllowed,
  isGroupNameAllowed,
  isInviteCodeShape,
  isPresetBoardName,
  nextWeekly,
  normalizeInviteCode,
  presetBoardNames,
  visibleWeekStars,
  weekKey,
} from './groups.js';

const at = (iso: string) => Date.parse(iso);

describe('weekKey', () => {
  it('returns the Monday of the week', () => {
    // Wed 2026-11-11 (UTC) -> Monday 2026-11-09
    expect(weekKey(at('2026-11-11T12:00:00Z'), 'UTC')).toBe('2026-11-09');
    expect(weekKey(at('2026-11-09T00:00:00Z'), 'UTC')).toBe('2026-11-09');
    expect(weekKey(at('2026-11-15T23:59:00Z'), 'UTC')).toBe('2026-11-09');
    expect(weekKey(at('2026-11-16T00:00:00Z'), 'UTC')).toBe('2026-11-16');
  });

  it('uses the group time zone, not UTC', () => {
    // Sunday 20:00 UTC is already Monday 01:30 in India.
    const t = at('2026-11-15T20:00:00Z');
    expect(weekKey(t, 'UTC')).toBe('2026-11-09');
    expect(weekKey(t, 'Asia/Kolkata')).toBe('2026-11-16');
  });
});

describe('nextWeekly', () => {
  const week = '2026-11-09';

  it('counts the first round of a new week', () => {
    // 40 stars before, 43 after: 3 this week.
    expect(nextWeekly(null, 40, 43, week)).toEqual({ weekKey: week, weekBase: 40, weekStars: 3 });
  });

  it('keeps the base within the same week', () => {
    const prev = { weekKey: week, weekBase: 40 };
    expect(nextWeekly(prev, 43, 47, week).weekStars).toBe(7);
  });

  it('starts again when the stored week is old', () => {
    const prev = { weekKey: '2026-11-02', weekBase: 10 };
    expect(nextWeekly(prev, 50, 52, week)).toEqual({ weekKey: week, weekBase: 50, weekStars: 2 });
  });

  it('recovers after a progress reset and is never negative', () => {
    const prev = { weekKey: week, weekBase: 40 };
    expect(nextWeekly(prev, 47, 0, week)).toEqual({ weekKey: week, weekBase: 0, weekStars: 0 });
    expect(nextWeekly(prev, 0, 5, week).weekStars).toBe(5);
  });

  it('caps an implausible total', () => {
    expect(nextWeekly(null, 0, 1_000_000, week).weekStars).toBe(MAX_WEEKLY_STARS);
  });

  it('reads an old week as 0', () => {
    expect(visibleWeekStars({ weekKey: '2026-11-02', weekStars: 30 }, week)).toBe(0);
    expect(visibleWeekStars({ weekKey: week, weekStars: 30 }, week)).toBe(30);
  });
});

describe('invite codes', () => {
  it('has no look-alike characters', () => {
    for (const bad of ['0', 'O', '1', 'I', 'L']) expect(INVITE_ALPHABET).not.toContain(bad);
  });

  it('accepts a code however it is typed or pasted', () => {
    expect(normalizeInviteCode('abcd-2345')).toBe('ABCD2345');
    expect(extractInviteCode('https://kiyuv-learning.web.app/join#abcd2345')).toBe('ABCD2345');
    expect(extractInviteCode(' abcd 2345 ')).toBe('ABCD2345');
    expect(isInviteCodeShape('ABCD2345')).toBe(true);
    expect(isInviteCodeShape('ABCD234')).toBe(false);
    expect(isInviteCodeShape('ABCD234O')).toBe(false);
  });
});

describe('names', () => {
  it('accepts presets and plain short names', () => {
    expect(isPresetBoardName('Brave Otter')).toBe(true);
    expect(presetBoardNames().every(isBoardNameAllowed)).toBe(true);
    expect(isBoardNameAllowed('Star Kid')).toBe(true);
  });

  it('rejects rude, contact-like and odd names', () => {
    expect(isBoardNameAllowed('f u c k')).toBe(false);
    expect(isBoardNameAllowed('Sh1t')).toBe(false);
    expect(isBoardNameAllowed('call 98765')).toBe(false);
    expect(isBoardNameAllowed('me@mail')).toBe(false);
    expect(isBoardNameAllowed('A')).toBe(false);
    expect(isBoardNameAllowed('x'.repeat(21))).toBe(false);
    expect(isGroupNameAllowed('Sunrise Apartments')).toBe(true);
    expect(isGroupNameAllowed('Hi')).toBe(false);
  });
});

describe('input schemas', () => {
  it('cleans names and defaults the time zone', () => {
    const parsed = CreateGroupInputSchema.parse({ name: '  Sunrise   Club ' });
    expect(parsed.name).toBe('Sunrise Club');
    expect(parsed.timezone).toBe('Asia/Kolkata');
  });

  it('refuses a join with no children, or the same child twice', () => {
    expect(RequestJoinInputSchema.safeParse({ code: 'ABCD2345', children: [] }).success).toBe(false);
    const dup = { kidId: 'k1', boardName: 'Brave Otter' };
    expect(RequestJoinInputSchema.safeParse({ code: 'ABCD2345', children: [dup, dup] }).success).toBe(false);
    expect(RequestJoinInputSchema.safeParse({ code: 'x', children: [dup] }).success).toBe(true);
  });
});
