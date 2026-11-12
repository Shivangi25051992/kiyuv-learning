import { describe, expect, it } from 'vitest';
import {
  CURRICULUM,
  EARLY_ALPHABET_WORDS,
  EARLY_ANIMALS,
  EARLY_BIRDS_BUGS,
  EARLY_BODY,
  EARLY_FRUITS,
  EARLY_HOME_ANIMALS,
  EARLY_MORE_FRUITS,
  EARLY_SKY,
  EARLY_VEGETABLES,
  EARLY_WATER_ANIMALS,
  EARLY_WILD_ANIMALS,
  YOUNG_ANIMALS,
  generateQuestionForTopic,
  isPictureOnly,
} from '@kiyuv/content';
import { picSrc } from './Pic.js';

describe('pictures for every stage', () => {
  it('every early-years list uses pictures that have a drawing', () => {
    const lists = [
      EARLY_HOME_ANIMALS, EARLY_WILD_ANIMALS, EARLY_BIRDS_BUGS, EARLY_WATER_ANIMALS, EARLY_VEGETABLES,
      EARLY_SKY, EARLY_MORE_FRUITS, EARLY_FRUITS, EARLY_ANIMALS, EARLY_BODY,
    ];
    for (const list of lists) for (const item of list) expect(picSrc(item.emoji), `${item.name} ${item.emoji}`).not.toBeNull();
    for (const [, [, emoji]] of Object.entries(EARLY_ALPHABET_WORDS)) expect(picSrc(emoji), emoji).not.toBeNull();
  });

  it('every subject on every path has a picture', () => {
    for (const c of Object.values(CURRICULUM)) for (const s of c.subjects) expect(picSrc(s.emoji), `${c.pathway} ${s.name} ${s.emoji}`).not.toBeNull();
  });

  it('picture answers in the early topics are all drawn', () => {
    const ids = CURRICULUM.early.subjects.flatMap((s) => s.topics.map((t) => t.id));
    for (const id of ids) {
      for (let i = 0; i < 40; i++) {
        const q = generateQuestionForTopic(id);
        for (const o of q.options) if (isPictureOnly(o.label)) expect(picSrc(o.label), `${id} ${o.label}`).not.toBeNull();
      }
    }
    expect(YOUNG_ANIMALS.length).toBeGreaterThan(0);
  });
});
