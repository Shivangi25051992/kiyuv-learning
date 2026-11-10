import { beforeEach, describe, expect, it } from 'vitest';
import type { KidProfile } from '@kiyuv/shared';
import {
  detectLegacyLocalProgress,
  getActiveKidForDevice,
  mergeKidProfiles,
  purgeLegacyLocalKeys,
  setActiveKidForDevice,
} from './index.js';

const baseKid: KidProfile = {
  kidId: 'k1',
  name: 'Aarav',
  nickname: 'Ari',
  age: 6,
  country: 'IN',
  state: 'Karnataka',
  favColor: 'blue',
  avatar: '👦',
  ageBand: '5-7',
  track: 'primary',
  stars: 20,
  streak: 2,
  bestStreak: 5,
  totalCorrect: 10,
  totalWrong: 2,
  badges: ['first', 'ten'],
  topics: {
    'y-add-e': { p: 1, c: 8, b: 8, m: false },
  },
  resetEpoch: 1,
};

describe('sync engine merge, per-device activeKid, and legacy migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('merges two offline sessions for the same child monotonically without losing topics or decreasing stats', () => {
    const deviceA: KidProfile = {
      ...baseKid,
      stars: 40,
      bestStreak: 9,
      totalCorrect: 20,
      topics: {
        'y-add-e': { p: 2, c: 18, b: 10, m: true },
        'y-science': { p: 1, c: 7, b: 7, m: false },
      },
    };
    const deviceB: KidProfile = {
      ...baseKid,
      stars: 35,
      bestStreak: 12,
      totalCorrect: 18,
      topics: {
        'y-add-e': { p: 1, c: 9, b: 9, m: false },
        'y-gk-world': { p: 1, c: 10, b: 10, m: true },
      },
    };

    const merged = mergeKidProfiles(deviceA, deviceB);
    expect(merged.stars).toBe(40);
    expect(merged.bestStreak).toBe(12);
    expect(merged.totalCorrect).toBe(20);
    expect(merged.topics['y-add-e']).toEqual({ p: 2, c: 18, b: 10, m: true });
    expect(merged.topics['y-science']).toEqual({ p: 1, c: 7, b: 7, m: false });
    expect(merged.topics['y-gk-world']).toEqual({ p: 1, c: 10, b: 10, m: true });
    expect(merged.badges).toContain('master1');
    expect(merged.badges).toContain('streak10');
  });

  it('discards stale local progress when remote has a higher resetEpoch', () => {
    const staleLocal: KidProfile = {
      ...baseKid,
      stars: 200,
      resetEpoch: 1,
    };
    const resetRemote: KidProfile = {
      ...baseKid,
      stars: 0,
      streak: 0,
      bestStreak: 0,
      totalCorrect: 0,
      totalWrong: 0,
      badges: [],
      topics: {},
      resetEpoch: 2,
    };

    const merged = mergeKidProfiles(staleLocal, resetRemote);
    expect(merged.stars).toBe(0);
    expect(merged.resetEpoch).toBe(2);
    expect(Object.keys(merged.topics)).toHaveLength(0);
  });

  it('stores activeKid per device only in localStorage', () => {
    expect(getActiveKidForDevice('uid-123')).toBeNull();
    setActiveKidForDevice('uid-123', 'k2');
    expect(getActiveKidForDevice('uid-123')).toBe('k2');
    expect(getActiveKidForDevice('uid-other')).toBeNull();
  });

  it('detects legacy kidsAcad_* progress and purges legacy keys including kidsAcad_session', () => {
    localStorage.setItem('kidsAcad_session', JSON.stringify({ email: 'a@b.com', pin: '1234' }));
    localStorage.setItem(
      'kidsAcad_legacy1',
      JSON.stringify({
        stars: 30,
        streak: 4,
        bestStreak: 6,
        totalCorrect: 15,
        totalWrong: 1,
        games: { 'k-count5': { played: 2, correct: 15, best: 10 } },
      }),
    );

    const detected = detectLegacyLocalProgress();
    expect(detected).toHaveLength(1);
    expect(detected[0]?.stars).toBe(30);
    expect(detected[0]?.suggestedTrack).toBe('early');
    expect(detected[0]?.topics['k-count5']?.m).toBe(true);

    purgeLegacyLocalKeys();
    expect(localStorage.getItem('kidsAcad_session')).toBeNull();
    expect(localStorage.getItem('kidsAcad_legacy1')).toBeNull();
  });
});
