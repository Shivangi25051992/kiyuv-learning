import { beforeEach, describe, expect, it } from 'vitest';
import { PIN_FRESH_SESSION_MS } from '@kiyuv/shared';
import { clearDeviceUnlock, isDeviceStillUnlocked, markDeviceUnlocked } from './deviceUnlock.js';

describe('device unlock window (survives a page refresh)', () => {
  beforeEach(() => localStorage.clear());

  it('is locked until the parent unlocks', () => {
    expect(isDeviceStillUnlocked('alice')).toBe(false);
  });

  it('stays unlocked after a refresh, for 12 hours', () => {
    const t0 = 1_000_000;
    markDeviceUnlocked('alice', t0);
    expect(isDeviceStillUnlocked('alice', t0 + 60_000)).toBe(true);
    expect(isDeviceStillUnlocked('alice', t0 + PIN_FRESH_SESSION_MS - 1)).toBe(true);
  });

  it('asks for the PIN again after 12 hours', () => {
    const t0 = 1_000_000;
    markDeviceUnlocked('alice', t0);
    expect(isDeviceStillUnlocked('alice', t0 + PIN_FRESH_SESSION_MS)).toBe(false);
  });

  it('is per parent, and clears on sign-out', () => {
    markDeviceUnlocked('alice');
    markDeviceUnlocked('bob');
    expect(isDeviceStillUnlocked('bob')).toBe(true);
    clearDeviceUnlock('alice');
    expect(isDeviceStillUnlocked('alice')).toBe(false);
    expect(isDeviceStillUnlocked('bob')).toBe(true);
    clearDeviceUnlock();
    expect(isDeviceStillUnlocked('bob')).toBe(false);
  });

  it('ignores a corrupt or future value', () => {
    localStorage.setItem('kiyuv_unlockedAt:alice', 'nope');
    expect(isDeviceStillUnlocked('alice')).toBe(false);
    localStorage.setItem('kiyuv_unlockedAt:alice', String(Date.now() + 10 * 3600_000));
    expect(isDeviceStillUnlocked('alice')).toBe(false);
  });
});
