import { describe, expect, it } from 'vitest';
import {
  BADGES,
  CURRICULUM,
  MultipleChoiceItemSchema,
  PRIMARY_GK_INDIA,
  PRIMARY_GK_WORLD,
  PRIMARY_GRAMMAR,
  PRIMARY_OLYMPIAD_LOGIC,
  PRIMARY_SCIENCE,
  evaluateEarnedBadgeIds,
  generateQuestionForTopic,
} from './index.js';

describe('@kiyuv/content curriculum, question banks, and generators', () => {
  it('validates all multiple-choice banks against MultipleChoiceItemSchema and ensures answer is in opts', () => {
    const banks = [
      PRIMARY_GK_INDIA,
      PRIMARY_GK_WORLD,
      PRIMARY_SCIENCE,
      PRIMARY_GRAMMAR,
      PRIMARY_OLYMPIAD_LOGIC,
    ];
    for (const bank of banks) {
      expect(bank.length).toBeGreaterThan(0);
      for (const item of bank) {
        const parsed = MultipleChoiceItemSchema.safeParse(item);
        expect(parsed.success).toBe(true);
        expect(item.opts).toContain(item.a);
      }
    }
  });

  it('generates valid questions with options containing the correct answer for every topic in early and primary tracks', () => {
    const allTopics = [
      ...CURRICULUM.early.subjects.flatMap((s) => s.topics),
      ...CURRICULUM.primary.subjects.flatMap((s) => s.topics),
    ];
    expect(allTopics.length).toBeGreaterThanOrEqual(40);

    for (const topic of allTopics) {
      const q = generateQuestionForTopic(topic.id);
      expect(q.topicId).toBe(topic.id);
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      const values = q.options.map((o) => o.value);
      expect(values).toContain(q.correctValue);
    }
  });

  it('evaluates badges accurately from progress snapshot', () => {
    const badges = evaluateEarnedBadgeIds({
      stars: 55,
      bestStreak: 6,
      topics: {
        'k-count5': { p: 2, c: 18, b: 10, m: true },
        'k-count10': { p: 1, c: 5, b: 5, m: false },
        'k-letter': { p: 1, c: 5, b: 5, m: false },
        'k-color8': { p: 1, c: 5, b: 5, m: false },
        'k-shape6': { p: 1, c: 5, b: 5, m: false },
      },
    });
    expect(badges).toContain('first');
    expect(badges).toContain('ten');
    expect(badges).toContain('fifty');
    expect(badges).toContain('streak3');
    expect(badges).toContain('streak5');
    expect(badges).toContain('tried5');
    expect(badges).toContain('master1');
    expect(BADGES.length).toBe(14);
  });
});
