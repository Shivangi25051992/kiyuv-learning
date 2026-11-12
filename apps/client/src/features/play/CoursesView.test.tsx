import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { coursesForTrack } from '@kiyuv/content';
import type { KidProfile } from '@kiyuv/shared';
import { CoursesView } from './CoursesView.js';

afterEach(() => cleanup());

const kid = (track: 'primary' | 'early' = 'primary'): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track, stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0,
});

describe('bonus courses page', () => {
  it('lists every course for the child\'s track, grouped under headings', () => {
    render(<CoursesView profile={kid()} onBack={() => {}} onStart={() => {}} />);
    const list = coursesForTrack('primary');
    for (const c of list) expect(screen.getByRole('button', { name: new RegExp(`^${c.name}[.]`) })).toBeTruthy();
    for (const g of new Set(list.map((c) => c.group))) expect(screen.getByRole('heading', { name: g })).toBeTruthy();
  });

  it('shows the little ones only their own courses', () => {
    render(<CoursesView profile={kid('early')} onBack={() => {}} onStart={() => {}} />);
    expect(screen.getByRole('button', { name: /^Animal Sounds\./ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Space Explorers\./ })).toBeNull();
  });

  it('starts a free course', () => {
    const onStart = vi.fn();
    render(<CoursesView profile={kid()} onBack={() => {}} onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /^Space Explorers\./ }));
    expect(onStart).toHaveBeenCalledWith('c-space');
  });

  it('a premium course shows a notice for a parent and does not start', () => {
    const onStart = vi.fn();
    render(<CoursesView profile={kid()} onBack={() => {}} onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /^Animal Kingdom\./ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toMatch(/Premium is not open yet/);
    expect(dialog.textContent).not.toMatch(/[₹$£€]/); // no prices
    expect(onStart).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('goes back', () => {
    const onBack = vi.fn();
    render(<CoursesView profile={kid()} onBack={onBack} onStart={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Back/ }));
    expect(onBack).toHaveBeenCalled();
  });
});
