import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { COURSES_PAGE_ID } from '@kiyuv/content';
import { computeAgeBand, suggestTrack, type KidProfile } from '@kiyuv/shared';
import { LearnHome } from './LearnHome.js';
import { PLAY_TIME_ID } from '../toddler/playTime.js';

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

const kid = (age: number, over: Partial<KidProfile> = {}): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: computeAgeBand(age), track: suggestTrack(age), stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0, ...over,
});

const upNextTitle = () => within(document.querySelector('.upnext') as HTMLElement).getByRole('heading').textContent;

describe('each age sees content for its own stage', () => {
  it.each([
    [4, /Count to 5/],
    [5, /Count to 5/],
    [6, /Add within 10/],
    [7, /Add within 10/],
    [8, /Addition/],
    [10, /Addition/],
    [11, /Negative numbers/],
    [13, /Negative numbers/],
  ])('age %i starts with %s', (age, title) => {
    render(<LearnHome profile={kid(age)} onStartTopic={() => {}} />);
    expect(upNextTitle()).toMatch(title);
  });

  it('a profile edited from 6 to 2 stops showing the quiz path at once, even with the old track saved', () => {
    const edited = kid(2, { track: 'primary', ageBand: '2-4' });
    render(<LearnHome profile={edited} onStartTopic={() => {}} />);
    expect(document.querySelector('.upnext')).toBeNull();
    expect(screen.queryByText(/cleared all 10 levels/)).toBeNull();
    expect(screen.queryByText(/Add within 10/)).toBeNull();
    expect(screen.getByRole('button', { name: /Play time/ })).toBeTruthy();
  });

  it('and one edited from 2 up to 12 gets the grade 6 to 8 path, not Play time', () => {
    render(<LearnHome profile={kid(12, { track: 'early', ageBand: '11-13' })} onStartTopic={() => {}} />);
    expect(upNextTitle()).toMatch(/Negative numbers/);
    expect(screen.queryByRole('button', { name: /^Play time/ })).toBeNull();
  });
});

describe('ages 2 and 3', () => {
  it('get Play time, a wardrobe, and no scores, levels or questions', () => {
    const onStart = vi.fn();
    render(<LearnHome profile={kid(2)} onStartTopic={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /Play time/ }));
    expect(onStart).toHaveBeenCalledWith(PLAY_TIME_ID);
    expect(screen.queryByText(/Mixed Challenge/)).toBeNull();
    expect(screen.queryByText(/Your adventure/)).toBeNull();
    expect(screen.queryByText(/Recommended for you/)).toBeNull();
    expect(screen.getByText(/Age 2 · Play time/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Kiyu's wardrobe/ })).toBeTruthy();
  });

  it('a 2-year-old has no reading games, and a 3-year-old gets the picture games', () => {
    const onStart = vi.fn();
    const { unmount } = render(<LearnHome profile={kid(2)} onStartTopic={onStart} />);
    expect(screen.queryByRole('button', { name: /Look and pick/ })).toBeNull();
    unmount();
    render(<LearnHome profile={kid(3)} onStartTopic={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /Look and pick/ }));
    expect(onStart).toHaveBeenCalledWith(COURSES_PAGE_ID);
  });
});
