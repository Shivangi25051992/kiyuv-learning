import { describe, expect, it } from 'vitest';
import { picSrc } from '../../ui/Pic.js';
import { ANIMALS, ANIMAL_GROUPS, PLAY_ACTIVITIES, animalsInGroup } from './playTime.js';
import { BODY_PARTS, COLOURS, DAY_STEPS, FOODS, OPPOSITES, VEHICLES } from './playData.js';
import { HOME_THINGS, SKY_THINGS, WEATHER } from './playMore.js';

describe('Play time pictures', () => {
  it('every picture used has a drawing, so it looks the same on every phone', () => {
    const emoji = [
      ...PLAY_ACTIVITIES.map((a) => a.emoji),
      ...ANIMALS.map((a) => a.emoji),
      ...VEHICLES.map((v) => v.emoji),
      ...FOODS.map((f) => f.emoji),
      ...SKY_THINGS.map((f) => f.emoji),
      ...WEATHER.map((f) => f.emoji),
      ...HOME_THINGS.map((f) => f.emoji),
      ...DAY_STEPS.map((d) => d.emoji),
      ...COLOURS.map((c) => c.thingEmoji),
      ...OPPOSITES.flatMap((p) => [p.a.emoji, p.b.emoji]),
      ...BODY_PARTS.map((b) => b.emoji),
      '🎁',
      '🐄', '🐶', '🦁', '🦜', '🐝', '🐟',
    ];
    for (const e of emoji) expect(picSrc(e), e).not.toBeNull();
  });

  it('has no repeated names, so nothing is announced twice', () => {
    for (const list of [VEHICLES, FOODS, DAY_STEPS, SKY_THINGS, WEATHER, HOME_THINGS]) {
      expect(new Set(list.map((i) => i.key)).size).toBe(list.length);
      expect(new Set(list.map((i) => i.label)).size).toBe(list.length);
    }
    expect(new Set(PLAY_ACTIVITIES.map((a) => a.id)).size).toBe(PLAY_ACTIVITIES.length);
    expect(new Set(ANIMALS.map((a) => a.name)).size).toBe(ANIMALS.length);
    expect(new Set(ANIMALS.map((a) => a.emoji)).size).toBe(ANIMALS.length);
  });
});

describe('plenty to tap, in sensible groups', () => {
  it('has many animals, birds, bugs and sea animals, not just nine', () => {
    expect(ANIMALS.length).toBeGreaterThanOrEqual(60);
    for (const g of ANIMAL_GROUPS) expect(animalsInGroup(g).length, g).toBeGreaterThanOrEqual(6);
  });

  it('every animal has a short true line to say, and nothing is a sound read out as text', () => {
    for (const a of ANIMALS) {
      expect(a.fact.length, a.name).toBeGreaterThan(5);
      expect(a.fact.length, a.name).toBeLessThanOrEqual(45);
      expect(a.fact, a.name).toMatch(/[.!]$/);
    }
  });

  it('puts the right animal in the right group', () => {
    const group = (name: string) => ANIMALS.find((a) => a.name === name)?.group;
    expect(group('Cow')).toBe('Farm');
    expect(group('Dog')).toBe('Pets');
    expect(group('Tiger')).toBe('Wild');
    expect(group('Owl')).toBe('Birds');
    expect(group('Butterfly')).toBe('Bugs');
    expect(group('Dolphin')).toBe('Water');
    expect(group('Frog')).toBe('Water');
  });

  it('has more food, vehicles, sky, weather and home things', () => {
    expect(VEHICLES.length).toBeGreaterThanOrEqual(15);
    expect(FOODS.length).toBeGreaterThanOrEqual(20);
    expect(SKY_THINGS.length).toBeGreaterThanOrEqual(8);
    expect(WEATHER.length).toBeGreaterThanOrEqual(8);
    expect(HOME_THINGS.length).toBeGreaterThanOrEqual(12);
    expect(COLOURS.length).toBeGreaterThanOrEqual(10);
  });

  it('keeps the simplest activities for the youngest, and a little more for age 3', () => {
    const at = (age: number) => PLAY_ACTIVITIES.filter((a) => age >= (a.minAge ?? 0)).map((a) => a.id);
    expect(at(2)).toContain('play-animals');
    expect(at(2)).toContain('play-colours');
    expect(at(2)).not.toContain('play-song');
    expect(at(3)).toContain('play-song');
    expect(at(3).length).toBeGreaterThan(at(2).length);
  });
});
