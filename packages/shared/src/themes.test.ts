import { describe, expect, it } from 'vitest';
import { FAV_COLOR_THEMES } from './constants.js';

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('colour themes meet WCAG AA contrast (4.5:1)', () => {
  for (const [key, theme] of Object.entries(FAV_COLOR_THEMES)) {
    it(`${key}: white text on the main colour, and the main colour as text on its light tint`, () => {
      expect(contrast(theme.hex, '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.hex, theme.bgLight)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
