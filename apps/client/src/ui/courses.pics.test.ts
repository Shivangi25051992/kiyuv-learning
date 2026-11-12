import { describe, expect, it } from 'vitest';
import { COURSES } from '@kiyuv/content';
import { picSrc } from './Pic.js';

const EMOJI = /\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic}️?)*/gu;

describe('course pictures', () => {
  it('every course has a picture, and every picture answer for little ones has a drawing', () => {
    for (const c of COURSES) {
      expect(picSrc(c.emoji), `${c.id} icon ${c.emoji}`).not.toBeNull();
      if (c.track !== 'early') continue;
      for (const item of c.items) {
        for (const o of item.opts) {
          for (const m of o.matchAll(EMOJI)) expect(picSrc(m[0]), `${c.id}: ${m[0]}`).not.toBeNull();
        }
      }
    }
  });
});
