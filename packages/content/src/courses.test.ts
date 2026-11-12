import { describe, expect, it } from 'vitest';
import { MultipleChoiceItemSchema } from './banks.js';
import { COURSES, isCourseId } from './courses.js';
import { generateQuestionForTopic } from './generators.js';

describe('bonus courses', () => {
  it('has distinct ids that cannot clash with curriculum topics', () => {
    const ids = COURSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith('c-')).toBe(true);
  });

  it.each(COURSES.map((c) => [c.name, c] as const))('%s: every question is well formed', (_n, course) => {
    expect(course.items.length).toBeGreaterThanOrEqual(15);
    const prompts = course.items.map((i) => i.q);
    expect(new Set(prompts).size).toBe(prompts.length);
    for (const item of course.items) {
      expect(MultipleChoiceItemSchema.safeParse(item).success).toBe(true);
      expect(item.opts).toHaveLength(4);
      expect(new Set(item.opts).size).toBe(4);
      expect(item.opts).toContain(item.a);
    }
  });

  it('serves a question for every course', () => {
    for (const c of COURSES) {
      expect(isCourseId(c.id)).toBe(true);
      const g = generateQuestionForTopic(c.id);
      expect(g.options.map((o) => o.value)).toContain(g.correctValue);
    }
  });
});
