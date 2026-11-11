import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PIN_FRESH_SESSION_MS } from '@kiyuv/shared';

// A signed-in parent whose session Firebase restores after a page refresh.
const h = vi.hoisted(() => ({
  pinConfigured: true,
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
    cb(h.user);
    return () => {};
  },
  getCurrentAuthUser: () => h.user,
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

import { App } from './App.js';

const UNLOCK_KEY = 'kiyuv_unlockedAt:u1';

describe('a page refresh keeps a parent unlocked (the logout-on-refresh bug)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // The server says this parent already has a PIN.
    h.pinConfigured = true;
  });

  afterEach(() => cleanup());

  it('goes straight back in when the parent unlocked within the last 12 hours', async () => {
    localStorage.setItem(UNLOCK_KEY, String(Date.now() - 60 * 60 * 1000)); // 1 hour ago
    render(<App />);

    // Signed in, so we should reach the app (a first-time family sees the setup steps).
    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeTruthy();
    expect(screen.queryByLabelText('6-digit parent PIN')).toBeNull();
  });

  it('asks for the PIN when the device was never unlocked', async () => {
    render(<App />);
    expect(await screen.findByLabelText('6-digit parent PIN')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
  });

  it('asks for the PIN again after 12 hours', async () => {
    localStorage.setItem(UNLOCK_KEY, String(Date.now() - PIN_FRESH_SESSION_MS - 1000));
    render(<App />);
    expect(await screen.findByLabelText('6-digit parent PIN')).toBeTruthy();
  });

  it('does not skip the PIN if the parent has not set one yet', async () => {
    h.pinConfigured = false;
    localStorage.setItem(UNLOCK_KEY, String(Date.now()));
    render(<App />);
    // With no PIN set yet the parent is asked to create one, not let in.
    expect(await screen.findByLabelText('New 6-digit parent PIN')).toBeTruthy();
  });
});
