import { describe, expect, it } from 'vitest';
import {
  CURRICULUM,
  LEVEL_COUNT,
  PATHWAYS,
  SENIOR_AFFIXES,
  SENIOR_COMPUTING,
  SENIOR_EARTH,
  SENIOR_GRAMMAR,
  SENIOR_IDIOMS,
  SENIOR_LIFE,
  SENIOR_PHYSICS,
  SENIOR_SPELLING,
  SENIOR_WORLD,
  TOPIC_LEVEL,
  YOUNG_ANIMALS,
  YOUNG_BODY,
  YOUNG_DAYS,
  YOUNG_HABITS,
  YOUNG_INDIA,
  YOUNG_OPPOSITES,
  YOUNG_PLANTS,
  YOUNG_RHYMES,
  YOUNG_SHAPES,
  YOUNG_SPELLING,
  YOUNG_WEATHER,
  YOUNG_WORDS,
  coursesForChild,
  generateQuestionForTopic,
  pathwayOf,
  topicsInLevel,
} from './index.js';

const topicIds = (p: (typeof PATHWAYS)[number]): string[] =>
  CURRICULUM[p].subjects.flatMap((s) => s.topics.map((t) => t.id));

describe('which path a child is on', () => {
  it('follows the age, so editing the age changes the content', () => {
    const at = (age: number) => pathwayOf({ age });
    expect([2, 3].map((a) => at(a))).toEqual(['tots', 'tots']);
    expect([4, 5].map((a) => at(a))).toEqual(['early', 'early']);
    expect([6, 7].map((a) => at(a))).toEqual(['young', 'young']);
    expect([8, 9, 10].map((a) => at(a))).toEqual(['primary', 'primary', 'primary']);
    expect([11, 12, 13].map((a) => at(a))).toEqual(['senior', 'senior', 'senior']);
  });

  it('ignores a stale stored track, so a profile saved at age 6 and edited to 2 plays like a 2-year-old', () => {
    const stale = { track: 'primary', age: 2 };
    expect(pathwayOf(stale)).toBe('tots');
    const stale2 = { track: 'early', age: 12 };
    expect(pathwayOf(stale2)).toBe('senior');
  });
});

describe('every path is complete', () => {
  it.each(PATHWAYS)('%s: topics and levels match, with no gaps', (p) => {
    const ids = topicIds(p);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(TOPIC_LEVEL[p]).sort()).toEqual([...ids].sort());
    if (p === 'tots') return;
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      // The original primary path ends on a single Olympiad logic topic.
      const least = p === 'primary' && level === LEVEL_COUNT ? 1 : 2;
      expect(topicsInLevel(p, level).length, `${p} level ${level}`).toBeGreaterThanOrEqual(least);
    }
  });

  it('has a real amount to learn at each stage', () => {
    expect(topicIds('early').length).toBeGreaterThanOrEqual(20);
    expect(topicIds('young').length).toBeGreaterThanOrEqual(22);
    expect(topicIds('primary').length).toBeGreaterThanOrEqual(24);
    expect(topicIds('senior').length).toBeGreaterThanOrEqual(26);
  });

  it('shares no topic between the young, junior and senior paths except where intended', () => {
    const young = new Set(topicIds('young'));
    const senior = new Set(topicIds('senior'));
    const primary = new Set(topicIds('primary'));
    for (const id of young) expect(primary.has(id) || senior.has(id), id).toBe(false);
    for (const id of senior) expect(primary.has(id), id).toBe(false);
  });
});

describe('every question is sound', () => {
  const ROUNDS = 250;
  for (const p of PATHWAYS) {
    for (const id of topicIds(p)) {
      it(`${p} / ${id}: the right answer is always offered, once`, () => {
        for (let i = 0; i < ROUNDS; i++) {
          const q = generateQuestionForTopic(id);
          const values = q.options.map((o) => o.value);
          expect(values, `${id}: ${q.prompt}`).toContain(q.correctValue);
          expect(new Set(values).size, `${id}: ${q.prompt} -> ${values.join(' | ')}`).toBe(values.length);
          expect(values.length).toBeGreaterThanOrEqual(2);
          expect(values.length).toBeLessThanOrEqual(4);
          expect(q.prompt.trim().length).toBeGreaterThan(0);
          expect(q.prompt).not.toMatch(/NaN|undefined|Infinity/);
          for (const v of values) expect(v).not.toMatch(/NaN|undefined|Infinity/);
        }
      });
    }
  }

  it('the new questions never repeat across banks and offer four different answers', () => {
    const banks = {
      YOUNG_ANIMALS, YOUNG_PLANTS, YOUNG_RHYMES, YOUNG_WORDS, YOUNG_SHAPES, YOUNG_WEATHER, YOUNG_BODY, YOUNG_DAYS, YOUNG_INDIA, YOUNG_HABITS,
      SENIOR_GRAMMAR, SENIOR_IDIOMS, SENIOR_AFFIXES, SENIOR_LIFE, SENIOR_EARTH, SENIOR_PHYSICS, SENIOR_COMPUTING, SENIOR_WORLD,
    };
    for (const [name, bank] of Object.entries(banks)) {
      expect(bank.length, name).toBeGreaterThanOrEqual(14);
      const seen = new Set<string>();
      for (const item of bank) {
        expect(item.opts, `${name}: ${item.q}`).toContain(item.a);
        expect(new Set(item.opts).size, `${name}: ${item.q}`).toBe(item.opts.length);
        expect(item.opts.length).toBe(4);
        expect(seen.has(item.q + item.a), `${name}: repeated ${item.q}`).toBe(false);
        seen.add(item.q + item.a);
      }
    }
  });

  it('spelling and opposite word lists have no repeats and only plain letters', () => {
    for (const list of [YOUNG_SPELLING, SENIOR_SPELLING]) {
      expect(new Set(list).size).toBe(list.length);
      for (const w of list) expect(w).toMatch(/^[A-Z]+$/);
    }
    const pairs = YOUNG_OPPOSITES.map((p) => [...p].sort().join('|'));
    expect(new Set(pairs).size).toBe(pairs.length);
  });
});

describe('the early path keeps each topic to its own picture list', () => {
  const names = (id: string, rounds = 200) => {
    const asked = new Set<string>();
    for (let i = 0; i < rounds; i++) {
      const q = generateQuestionForTopic(id);
      for (const o of q.options) asked.add(o.value);
    }
    return asked;
  };

  it('never mixes a hen into Wild Animals or a lion into Pet and Farm Animals', () => {
    const wild = names('k-animal-wild');
    const home = names('k-animal6');
    expect(wild.has('Hen')).toBe(false);
    expect(wild.has('Lion')).toBe(true);
    expect(home.has('Lion')).toBe(false);
    expect(home.has('Hen')).toBe(true);
  });

  it('asks about birds and bugs, water animals, vegetables and the sky in their own topics', () => {
    expect(names('k-animal-bird').has('Butterfly')).toBe(true);
    expect(names('k-animal-water').has('Dolphin')).toBe(true);
    expect(names('k-veg').has('Carrot')).toBe(true);
    expect(names('k-sky').has('Moon')).toBe(true);
    expect(names('k-fruit').has('Cherry')).toBe(true);
  });
});

describe('courses suit the age', () => {
  const ids = (age: number) => coursesForChild({ age }).map((c) => c.id);

  it('gives age 2 none, and age 3 the picture courses', () => {
    expect(ids(2)).toEqual([]);
    expect(ids(3).length).toBeGreaterThan(0);
    for (const id of ids(3)) expect(id.startsWith('c-e-')).toBe(true);
  });

  it('keeps picture courses away from the older children, and grown-up ones away from the young', () => {
    expect(ids(7).some((id) => id.startsWith('c-e-'))).toBe(false);
    expect(ids(6)).not.toContain('c-history');
    expect(ids(12)).toContain('c-history');
    expect(ids(12)).not.toContain('c-money');
  });

  it('never leaves a school-age child with an empty page', () => {
    for (let age = 4; age <= 13; age++) {
      expect(ids(age).length, `age ${age}`).toBeGreaterThanOrEqual(3);
    }
  });
});
