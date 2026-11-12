import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';
import { CurriculumView } from './CurriculumView.js';

afterEach(() => cleanup());

const kid = (topics: KidProfile['topics'] = {}): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track: 'primary', stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics, resetEpoch: 0,
});
const done = (b: number) => ({ p: 1, c: b, b, m: false });

describe('levels on the topic list', () => {
  it('a new child is on Level 1, with later topics locked', () => {
    render(<CurriculumView profile={kid()} onStartTopic={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Level 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Addition \(1-40\)\. Difficulty/ })).toBeTruthy();
    const locked = screen.getByRole('button', { name: /^Multiplication \(Tables 1-5\)\. Locked/ });
    expect((locked as HTMLButtonElement).disabled).toBe(true);
  });

  it('a locked topic does not start when pressed', () => {
    const onStart = vi.fn();
    render(<CurriculumView profile={kid()} onStartTopic={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /^Multiplication \(Tables 1-5\)\. Locked/ }));
    expect(onStart).not.toHaveBeenCalled();
  });

  it('clearing every topic of a level at 7+ opens the next level', () => {
    render(<CurriculumView profile={kid({ 'y-add-e': done(8), 'y-sub-e': done(7) })} onStartTopic={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Level 2' })).toBeTruthy();
    const open = screen.getByRole('button', { name: /^Multiplication \(Tables 1-5\)\. Difficulty/ });
    expect((open as HTMLButtonElement).disabled).toBe(false);
  });

  it('6 out of 10 is not enough to clear a topic', () => {
    render(<CurriculumView profile={kid({ 'y-add-e': done(6), 'y-sub-e': done(10) })} onStartTopic={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Level 1' })).toBeTruthy();
  });

  it('keeps a topic open that was already played before levels existed', () => {
    render(<CurriculumView profile={kid({ 'y-mul-h': done(3) })} onStartTopic={() => {}} />);
    const chip = screen.getByRole('button', { name: /^Multiplication \(Harder\)\. Difficulty/ });
    expect((chip as HTMLButtonElement).disabled).toBe(false);
  });

  it('"Play next challenge" only picks an open topic', () => {
    const onStart = vi.fn();
    render(<CurriculumView profile={kid()} onStartTopic={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /Play next challenge/ }));
    expect(['y-add-e', 'y-sub-e']).toContain(onStart.mock.calls[0]![0]);
  });

  it('in Play mode a subject with nothing open yet is locked', () => {
    render(<CurriculumView profile={kid()} mode="play" onStartTopic={() => {}} />);
    const logic = screen.getByRole('button', { name: /^Olympiad Logic\. Locked/ });
    expect((logic as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Play Math — Core' })).toBeTruthy();
  });

  it('says so when every level is cleared', () => {
    const all: KidProfile['topics'] = {};
    for (const id of [
      'y-add-e', 'y-sub-e', 'y-mul-e', 'y-syn', 'y-add-m', 'y-ant', 'y-gk-india', 'y-sub-m', 'y-div-e',
      'y-spell-g3', 'y-mul-m', 'y-wp-e', 'y-grammar', 'y-div-m', 'y-time', 'y-science', 'y-wp-m',
      'y-round', 'y-gk-world', 'y-add-h', 'y-sub-h', 'y-spell-bee', 'y-mul-h', 'y-div-h', 'y-wp-h', 'y-logic',
    ]) all[id] = done(9);
    render(<CurriculumView profile={kid(all)} onStartTopic={() => {}} />);
    expect(screen.getByRole('heading', { name: 'All levels cleared!' })).toBeTruthy();
  });
});

describe('bonus courses', () => {
  it('shows bonus courses for the primary track and starts one', () => {
    const onStart = vi.fn();
    render(<CurriculumView profile={kid()} onStartTopic={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /Space Explorers/ }));
    expect(onStart).toHaveBeenCalledWith('c-space');
  });
});
