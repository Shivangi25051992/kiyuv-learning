import { readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VEHICLES } from './playData.js';
import { ANIMALS, animalClip } from './playTime.js';

const DIR = 'apps/client/public/sounds';
const files = new Set(readdirSync(DIR).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)));

describe('real sound recordings', () => {
  it('every animal has its own recording', () => {
    for (const a of ANIMALS) expect(files.has(animalClip(a)), a.name).toBe(true);
  });

  it('every vehicle that names a recording has the file, and the words match the sound', () => {
    for (const v of VEHICLES) if (v.clip) expect(files.has(v.clip), v.label).toBe(true);
    expect(VEHICLES.find((v) => v.key === 'ship')!.say).toContain('Ding');
  });

  it('keeps each recording small, so the app stays quick to load', () => {
    for (const f of files) expect(statSync(`${DIR}/${f}.mp3`).size, f).toBeLessThan(40_000);
  });
});
