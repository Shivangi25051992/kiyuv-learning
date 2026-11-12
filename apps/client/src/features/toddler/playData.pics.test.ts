import { describe, expect, it } from 'vitest';
import { picSrc } from '../../ui/Pic.js';
import { ANIMALS, PLAY_ACTIVITIES } from './playTime.js';
import { BODY_PARTS, COLOURS, DAY_STEPS, FRUITS, OPPOSITES, VEHICLES } from './playData.js';

describe('Play time pictures', () => {
  it('every picture used has a drawing, so it looks the same on every phone', () => {
    const emoji = [
      ...PLAY_ACTIVITIES.map((a) => a.emoji),
      ...ANIMALS.map((a) => a.emoji),
      ...VEHICLES.map((v) => v.emoji),
      ...FRUITS.map((f) => f.emoji),
      ...DAY_STEPS.map((d) => d.emoji),
      ...COLOURS.map((c) => c.thingEmoji),
      ...OPPOSITES.flatMap((p) => [p.a.emoji, p.b.emoji]),
      ...BODY_PARTS.map((b) => b.emoji),
      '🎁',
    ];
    for (const e of emoji) expect(picSrc(e), e).not.toBeNull();
  });

  it('has no repeated names, so nothing is announced twice', () => {
    for (const list of [VEHICLES, FRUITS, DAY_STEPS]) {
      expect(new Set(list.map((i) => i.key)).size).toBe(list.length);
      expect(new Set(list.map((i) => i.label)).size).toBe(list.length);
    }
    expect(new Set(PLAY_ACTIVITIES.map((a) => a.id)).size).toBe(PLAY_ACTIVITIES.length);
  });
});
