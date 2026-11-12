import { readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VEHICLES } from './playData.js';
import { ANIMALS } from './playTime.js';

const DIR = 'apps/client/public/sounds';
const files = new Set(readdirSync(DIR).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)));

describe('real sound recordings', () => {
  it('every animal or vehicle that names a recording has the file', () => {
    for (const a of ANIMALS) if (a.clip) expect(files.has(a.clip), a.name).toBe(true);
    for (const v of VEHICLES) if (v.clip) expect(files.has(v.clip), v.label).toBe(true);
  });

  it('no recording sits unused, so nothing is shipped for nothing', () => {
    const used = new Set([...ANIMALS.map((a) => a.clip), ...VEHICLES.map((v) => v.clip)].filter(Boolean));
    for (const f of files) expect(used.has(f), f).toBe(true);
  });

  it('the boat words match its sound', () => {
    expect(VEHICLES.find((v) => v.key === 'ship')!.say).toContain('Ding');
  });

  it('keeps each recording small, so the app stays quick to load', () => {
    for (const f of files) expect(statSync(`${DIR}/${f}.mp3`).size, f).toBeLessThan(40_000);
  });
});
