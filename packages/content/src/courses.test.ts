import { describe, expect, it } from 'vitest';
import { MultipleChoiceItemSchema } from './banks.js';
import { COURSES, coursesForTrack, freeCourseCount, isCourseId } from './courses.js';
import { generateQuestionForTopic, isPictureOnly } from './generators.js';

describe('bonus courses', () => {
  it('has distinct ids that cannot clash with curriculum topics', () => {
    const ids = COURSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith('c-')).toBe(true);
  });

  it('has plenty of courses on both tracks', () => {
    expect(coursesForTrack('early').length).toBeGreaterThanOrEqual(6);
    expect(coursesForTrack('primary').length).toBeGreaterThanOrEqual(15);
    const total = COURSES.reduce((n, c) => n + c.items.length, 0);
    expect(total).toBeGreaterThanOrEqual(300);
  });

  it('keeps a free taste on each track and the rest premium', () => {
    for (const track of ['early', 'primary'] as const) {
      const free = freeCourseCount(coursesForTrack(track));
      expect(free).toBeGreaterThanOrEqual(3);
      expect(free).toBeLessThan(coursesForTrack(track).length);
    }
  });

  it.each(COURSES.map((c) => [c.name, c] as const))('%s: every question is well formed', (_n, course) => {
    expect(course.items.length).toBeGreaterThanOrEqual(10);
    expect(course.name.length).toBeGreaterThan(0);
    expect(course.ages).toMatch(/^Ages \d+ to \d+$/);
    const prompts = course.items.map((i) => i.q);
    expect(new Set(prompts).size).toBe(prompts.length);
    for (const item of course.items) {
      expect(MultipleChoiceItemSchema.safeParse(item).success).toBe(true);
      expect(item.opts).toHaveLength(4);
      expect(new Set(item.opts).size).toBe(4);
      expect(item.opts).toContain(item.a);
    }
  });

  it('little-kids courses use pictures only for answers, so no reading is needed', () => {
    for (const c of coursesForTrack('early')) {
      for (const item of c.items) {
        for (const o of item.opts) expect(isPictureOnly(o), `${c.id}: ${o}`).toBe(true);
      }
    }
  });

  it('primary courses use words and numbers', () => {
    for (const c of coursesForTrack('primary')) {
      for (const item of c.items) expect(item.opts.every(isPictureOnly)).toBe(false);
    }
  });

  it('serves a question for every course, as picture buttons for the little ones', () => {
    for (const c of COURSES) {
      expect(isCourseId(c.id)).toBe(true);
      const g = generateQuestionForTopic(c.id);
      expect(g.options.map((o) => o.value)).toContain(g.correctValue);
      expect(g.options.every((o) => o.isLargeEmoji === true)).toBe(c.track === 'early');
    }
  });
});
