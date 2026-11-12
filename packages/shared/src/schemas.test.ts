import { describe, expect, it } from 'vitest';
import {
  KidOnboardingInputSchema,
  KidProfileSchema,
  ageBandOk,
  computeAgeBand,
  nextAvailableKidId,
  starsPerCorrectForTrack,
  suggestTrack,
} from './schemas.js';

describe('@kiyuv/shared onboarding & kid schema validation', () => {
  it('computes ageBand and track accurately from age 2..13', () => {
    expect(computeAgeBand(2)).toBe('2-4');
    expect(computeAgeBand(4)).toBe('2-4');
    expect(computeAgeBand(5)).toBe('5-7');
    expect(computeAgeBand(7)).toBe('5-7');
    expect(computeAgeBand(8)).toBe('8-10');
    expect(computeAgeBand(10)).toBe('8-10');
    expect(computeAgeBand(11)).toBe('11-13');
    expect(computeAgeBand(13)).toBe('11-13');

    expect(suggestTrack(3)).toBe('early');
    expect(suggestTrack(5)).toBe('early');
    expect(suggestTrack(6)).toBe('primary');
    expect(starsPerCorrectForTrack('early')).toBe(3);
    expect(starsPerCorrectForTrack('primary')).toBe(2);
  });

  it('validates a well-formed onboarding input and rejects invalid fields', () => {
    const valid = KidOnboardingInputSchema.safeParse({
      name: 'Aarav',
      nickname: 'Ari',
      age: 6,
      country: 'IN',
      state: 'Karnataka',
      favColor: 'blue',
      avatar: '👦',
      ageBand: '5-7',
      track: 'primary',
    });
    expect(valid.success).toBe(true);

    // Empty nickname rejected
    expect(
      KidOnboardingInputSchema.safeParse({
        name: '',
        nickname: '   ',
        age: 6,
        country: 'IN',
        state: '',
        favColor: 'blue',
        avatar: '👦',
        ageBand: '5-7',
        track: 'primary',
      }).success,
    ).toBe(false);

    // Age outside 2..13 rejected
    expect(
      KidOnboardingInputSchema.safeParse({
        name: '',
        nickname: 'Ari',
        age: 15,
        country: 'IN',
        state: '',
        favColor: 'blue',
        avatar: '👦',
        ageBand: '11-13',
        track: 'primary',
      }).success,
    ).toBe(false);

    // Unknown country rejected
    expect(
      KidOnboardingInputSchema.safeParse({
        name: '',
        nickname: 'Ari',
        age: 6,
        country: 'ZZ',
        state: '',
        favColor: 'blue',
        avatar: '👦',
        ageBand: '5-7',
        track: 'primary',
      }).success,
    ).toBe(false);

    // Free-text colour rejected
    expect(
      KidOnboardingInputSchema.safeParse({
        name: '',
        nickname: 'Ari',
        age: 6,
        country: 'IN',
        state: '',
        favColor: 'magenta',
        avatar: '👦',
        ageBand: '5-7',
        track: 'primary',
      }).success,
    ).toBe(false);

    // Mismatched age and ageBand rejected
    expect(
      KidOnboardingInputSchema.safeParse({
        name: '',
        nickname: 'Ari',
        age: 6,
        country: 'IN',
        state: '',
        favColor: 'blue',
        avatar: '👦',
        ageBand: '2-4',
        track: 'primary',
      }).success,
    ).toBe(false);
  });

  it('allocates the lowest free kidId slot k1..k6 and caps at 6', () => {
    expect(nextAvailableKidId([])).toBe('k1');
    expect(nextAvailableKidId(['k1', 'k3'])).toBe('k2');
    expect(nextAvailableKidId(['k1', 'k2', 'k3', 'k4', 'k5', 'k6'])).toBeNull();
  });

  it('validates KidProfileSchema and enforces ageBandOk', () => {
    expect(ageBandOk(3, '2-4')).toBe(true);
    expect(ageBandOk(3, '5-7')).toBe(false);
    const profile = KidProfileSchema.safeParse({
      name: '',
      nickname: 'Milo',
      age: 4,
      country: 'US',
      state: 'California',
      favColor: 'green',
      avatar: '🦁',
      ageBand: '2-4',
      track: 'early',
      stars: 12,
      streak: 3,
      bestStreak: 5,
      totalCorrect: 4,
      totalWrong: 1,
      badges: ['first', 'ten'],
      topics: { 'k-count5': { p: 1, c: 4, b: 4, m: false } },
      resetEpoch: 0,
    });
    expect(profile.success).toBe(true);
  });
});
