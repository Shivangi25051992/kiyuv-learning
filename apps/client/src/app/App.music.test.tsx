import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

// A signed-in parent whose session Firebase restores after a page refresh.
const h = vi.hoisted(() => ({
  pinConfigured: true,
  signedIn: false,
  user: {
    uid: 'u1',
    email: 'parent@example.com',
    displayName: 'Parent One',
    photoURL: null,
    emailVerified: true,
    providerId: 'google.com',
  },
}));

vi.mock('../lib/firebase/index.js', () => ({
  subscribeAuthState: (cb: (u: typeof h.user | null) => void) => {
    cb(h.signedIn ? h.user : null);
    return () => {};
  },
  getCurrentAuthUser: () => (h.signedIn ? h.user : null),
  signInWithGoogle: vi.fn(),
  signInWithApple: vi.fn(),
  signInOrRegisterWithEmail: vi.fn(),
  fetchPinConfigured: vi.fn(async () => h.pinConfigured),
  loadChildNames: vi.fn().mockResolvedValue({}),
  getCachedPlainName: () => '',
  clearNameCaches: vi.fn(),
  signOutParent: vi.fn().mockResolvedValue(undefined),
  callSetParentPinServer: vi.fn().mockRejectedValue(new Error('offline')),
  callVerifyParentPinServer: vi.fn().mockRejectedValue(new Error('offline')),
  ensureParentUserDocToday: vi.fn().mockResolvedValue(0),
  fetchFamilyDashboard: vi.fn().mockResolvedValue({ resetEpoch: 0, kids: [] }),
  fetchSingleKidProfile: vi.fn().mockResolvedValue(null),
  writeKidProfileDirect: vi.fn().mockResolvedValue(undefined),
  flushKidProfileTransaction: vi.fn(),
  removeKidProfileFromCloud: vi.fn().mockResolvedValue(undefined),
  resetCloudKidsProgressBatch: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/sound.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/sound.js')>();
  return { ...actual, startMusic: vi.fn(), stopMusic: vi.fn(), initAudio: vi.fn() };
});

import { App } from './App.js';
import { startMusic } from '../lib/sound.js';

const UNLOCK_KEY = 'kiyuv_unlockedAt:u1';

describe('background music', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.mocked(startMusic).mockClear();
  });

  afterEach(() => cleanup());

  it('stays silent on the sign-in page, even when buttons are pressed', async () => {
    h.signedIn = false;
    render(<App />);
    const button = await screen.findByRole('button', { name: /Continue with Google/ });
    fireEvent.pointerDown(button);
    expect(startMusic).not.toHaveBeenCalled();
  });

  it('starts once the parent is signed in and unlocked', async () => {
    h.signedIn = true;
    localStorage.setItem(UNLOCK_KEY, String(Date.now()));
    render(<App />);
    await screen.findByRole('button', { name: 'Sign out' });
    expect(startMusic).toHaveBeenCalled();
  });
});
