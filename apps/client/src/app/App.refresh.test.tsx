import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PIN_FRESH_SESSION_MS } from '@kiyuv/shared';

// A signed-in parent whose session Firebase restores after a page refresh.
const h = vi.hoisted(() => ({
  pinConfigured: true,
  kids: [] as unknown[],
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
  migrateLegacyNames: vi.fn().mockResolvedValue(0),
  getCachedPlainName: () => '',
  clearNameCaches: vi.fn(),
  signOutParent: vi.fn().mockResolvedValue(undefined),
  callSetParentPinServer: vi.fn().mockRejectedValue(new Error('offline')),
  callVerifyParentPinServer: vi.fn().mockRejectedValue(new Error('offline')),
  ensureParentUserDocToday: vi.fn().mockResolvedValue(0),
  fetchFamilyDashboard: vi.fn(async () => ({ resetEpoch: 0, kids: h.kids })),
  fetchMyGroups: vi.fn().mockResolvedValue([]),
  fetchGroupStatus: vi.fn().mockResolvedValue({ memberCount: 1, waiting: 0 }),
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
    h.kids = [];
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

describe('a page refresh keeps the profile and tab in use', () => {
  const kid = (kidId: string, nickname: string) => ({
    kidId, name: '', nickname, age: 6, country: 'IN', state: '', favColor: 'blue', avatar: '👦',
    ageBand: '5-7', track: 'primary', stars: 0, streak: 0, bestStreak: 0, totalCorrect: 0,
    totalWrong: 0, badges: [], topics: {}, resetEpoch: 0,
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    h.pinConfigured = true;
    h.kids = [kid('k1', 'Ari'), kid('k2', 'Mia')];
    localStorage.setItem(UNLOCK_KEY, String(Date.now()));
  });

  afterEach(() => cleanup());

  it('goes back to the same child and tab instead of the profile picker', async () => {
    sessionStorage.setItem('kiyuv_view:u1', JSON.stringify({ mode: 'app', kidId: 'k2', tab: 'groups' }));
    render(<App />);
    const groups = await screen.findByRole('button', { name: 'Groups' });
    expect(groups.getAttribute('aria-current')).toBe('page');
    expect(screen.queryByText(/Who.?s learning/i)).toBeNull();
  });

  it('lands on the picker when the parent was on the picker', async () => {
    sessionStorage.setItem('kiyuv_view:u1', JSON.stringify({ mode: 'picker' }));
    render(<App />);
    expect(await screen.findByText(/Who.?s learning/i)).toBeTruthy();
  });

  it('lands on the picker when nothing was saved, or the saved child no longer exists', async () => {
    render(<App />);
    expect(await screen.findByText(/Who.?s learning/i)).toBeTruthy();
    cleanup();
    sessionStorage.setItem('kiyuv_view:u1', JSON.stringify({ mode: 'app', kidId: 'k5', tab: 'leader' }));
    render(<App />);
    expect(await screen.findByText(/Who.?s learning/i)).toBeTruthy();
  });

  it('goes back to the same question of a round that was in progress', async () => {
    sessionStorage.setItem(
      'kiyuv_view:u1',
      JSON.stringify({ mode: 'app', kidId: 'k1', tab: 'games', topicId: 'y-add-e' }),
    );
    sessionStorage.setItem(
      'kiyuv_round:u1:k1',
      JSON.stringify({ topicId: 'y-add-e', questionIndex: 3, sessionCorrect: 2, question: null, wrongTries: 0, helpStage: 'none' }),
    );
    render(<App />);
    expect((await screen.findByRole('heading', { level: 1, name: /question 3 of 10/ })).textContent).toContain('question 3');
  });

  it('goes to the topic list when there is no saved round for the topic', async () => {
    sessionStorage.setItem(
      'kiyuv_view:u1',
      JSON.stringify({ mode: 'app', kidId: 'k1', tab: 'games', topicId: 'y-add-e' }),
    );
    render(<App />);
    const play = await screen.findByRole('button', { name: 'Play' });
    expect(play.getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('heading', { level: 1, name: /question \d+ of 10/ })).toBeNull();
  });

  it('ignores a damaged saved view', async () => {
    sessionStorage.setItem('kiyuv_view:u1', '{"mode":"app","kidId":"k2","tab":"hacked"}');
    render(<App />);
    expect(await screen.findByText(/Who.?s learning/i)).toBeTruthy();
  });
});
