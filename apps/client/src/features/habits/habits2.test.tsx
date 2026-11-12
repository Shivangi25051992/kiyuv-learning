import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';

vi.mock('../../lib/sound.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/sound.js')>();
  return { ...actual, initAudio: () => {}, canSpeak: () => false, speak: () => {}, sfx: new Proxy({}, { get: () => () => {} }) };
});
vi.mock('../../lib/effects.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/effects.js')>();
  return { ...actual, confettiBlast: () => {}, starBurst: () => {} };
});

import { HabitsScreen } from './HabitsScreen.js';
import { BREATH_CYCLES, BREATH_MS } from './activities2.js';
import { KIND_SCENARIOS, ONLINE_SCENARIOS, SCREEN_SCENARIOS } from './scenarios.js';
import { DIGEST_STEPS, HEART_GOAL_JUMPS, WATER_STEPS } from './sequences.js';
import { HABIT_ACTIVITIES } from './habits.js';
import { picSrc } from '../../ui/Pic.js';

const kid = (): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 10, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track: 'primary', stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const open = (id: string) => render(<HabitsScreen id={id} profile={kid()} onOpen={() => {}} onClose={() => {}} />);
const say = () => document.querySelector('.habit-say p')!.textContent!;
const feedback = () => document.querySelector('.scenario-feedback')!.textContent!;

describe('the scenario content', () => {
  it('every situation has exactly one good choice, a kind reason for each choice, and no blaming words', () => {
    for (const [name, list] of [['kind', KIND_SCENARIOS], ['online', ONLINE_SCENARIOS], ['screen', SCREEN_SCENARIOS]] as const) {
      expect(list.length, name).toBeGreaterThanOrEqual(6);
      const prompts = list.map((s) => s.prompt);
      expect(new Set(prompts).size, name).toBe(prompts.length);
      for (const s of list) {
        expect(s.options.filter((o) => o.good), s.prompt).toHaveLength(1);
        expect(new Set(s.options.map((o) => o.text)).size, s.prompt).toBe(3);
        for (const o of s.options) {
          expect(o.feedback.length, s.prompt).toBeGreaterThan(10);
          expect(o.feedback.toLowerCase(), s.prompt).not.toMatch(/stupid|idiot|dumb|bad kid/);
          if (!o.good) expect(o.feedback, s.prompt).toMatch(/Try another choice\.$/);
        }
      }
    }
  });

  it('the online-safety advice always includes telling a trusted grown-up where it matters', () => {
    const good = ONLINE_SCENARIOS.flatMap((s) => s.options.filter((o) => o.good).map((o) => o.text.toLowerCase()));
    expect(good.filter((t) => t.includes('grown-up') || t.includes('parent')).length).toBeGreaterThanOrEqual(5);
    // never advice that shares private details
    for (const t of good) expect(t).not.toMatch(/tell them your|give it to|type your password/);
  });

  it('every picture used has a drawing, and the steps are real and complete', () => {
    const emoji = [...HABIT_ACTIVITIES.map((a) => a.emoji), ...DIGEST_STEPS.map((s) => s.emoji), ...WATER_STEPS.map((s) => s.emoji), '🤸', '😌', '🫀'];
    for (const e of emoji) expect(picSrc(e), e).not.toBeNull();
    expect(DIGEST_STEPS.map((s) => s.name)).toEqual(['Mouth', 'Food pipe', 'Stomach', 'Small intestine', 'Large intestine']);
    expect(WATER_STEPS.map((s) => s.name)).toEqual(['Evaporation', 'Condensation', 'Precipitation', 'Collection']);
    expect(HABIT_ACTIVITIES).toHaveLength(12);
    expect(new Set(HABIT_ACTIVITIES.map((a) => a.id)).size).toBe(12);
  });
});

describe('Be kind, Stay safe online and Sleep and screens', () => {
  const goodTexts = (list: typeof KIND_SCENARIOS) => new Map(list.map((s) => [s.prompt, s.options.find((o) => o.good)!.text]));

  it('a less good choice gets a kind reason and stays on the same situation; the good one moves on', () => {
    open('habit-kind');
    const prompt = say();
    const scenario = KIND_SCENARIOS.find((s) => s.prompt === prompt)!;
    const bad = scenario.options.find((o) => !o.good)!;
    fireEvent.click(screen.getByRole('button', { name: bad.text }));
    expect(feedback()).toBe(bad.feedback);
    expect(say()).toBe(prompt);
    expect(screen.getByRole('button', { name: bad.text }).getAttribute('aria-disabled')).toBe('true');
    const good = scenario.options.find((o) => o.good)!;
    fireEvent.click(screen.getByRole('button', { name: good.text }));
    expect(feedback()).toBe(good.feedback);
    act(() => void vi.advanceTimersByTime(2400));
    expect(say()).not.toBe(prompt);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  });

  it('finishing every situation gives a cheer, and Again starts a fresh set', () => {
    for (const [id, list] of [['habit-kind', KIND_SCENARIOS], ['habit-online', ONLINE_SCENARIOS], ['habit-screen', SCREEN_SCENARIOS]] as const) {
      open(id);
      const good = goodTexts(list);
      for (let i = 0; i < list.length; i++) {
        fireEvent.click(screen.getByRole('button', { name: good.get(say())! }));
        act(() => void vi.advanceTimersByTime(2400));
      }
      expect(screen.getByRole('button', { name: 'Again!' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Again!' }));
      expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
      cleanup();
    }
  });
});

describe('Journey of food and The water cycle', () => {
  it.each([['habit-digest', DIGEST_STEPS], ['habit-water', WATER_STEPS]] as const)('%s: only the next step in order works, and each step teaches a fact', (id, steps) => {
    open(id);
    const wrong = steps[steps.length - 1]!;
    fireEvent.click(screen.getByRole('button', { name: wrong.name }));
    expect(say()).toBe('That one comes later. Which comes next?');
    expect(screen.queryByRole('button', { name: new RegExp(`${wrong.name}, number`) })).toBeNull();
    steps.forEach((s, i) => {
      fireEvent.click(screen.getByRole('button', { name: s.name }));
      if (i < steps.length - 1) expect(say()).toBe(s.fact);
    });
    expect(say()).toMatch(/Again|journey|water cycle|round and round/);
    expect(screen.getByRole('button', { name: 'Again!' })).toBeTruthy();
  });
});

describe('Calm breathing', () => {
  it('guides three slow breaths in and out, then finishes calmly and can be repeated', () => {
    open('habit-breathe');
    fireEvent.click(screen.getByRole('button', { name: 'Start breathing' }));
    expect(say()).toBe('Breathe in... slowly...');
    expect(document.querySelector('.breath-count')!.textContent).toBe('Breath 1 of 3');
    act(() => void vi.advanceTimersByTime(BREATH_MS));
    expect(say()).toBe('Breathe out... slowly...');
    act(() => void vi.advanceTimersByTime(BREATH_MS));
    expect(say()).toBe('Breathe in... slowly...');
    expect(document.querySelector('.breath-count')!.textContent).toBe('Breath 2 of 3');
    act(() => void vi.advanceTimersByTime(BREATH_MS * (BREATH_CYCLES * 2 - 2)));
    expect(say()).toMatch(/Well done/);
    fireEvent.click(screen.getByRole('button', { name: 'Again' }));
    expect(say()).toBe('Breathe in... slowly...');
  });

  it('stops all its timers when the child leaves', () => {
    const { unmount } = open('habit-breathe');
    fireEvent.click(screen.getByRole('button', { name: 'Start breathing' }));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('Your heart', () => {
  const jump = () => screen.getByRole('button', { name: /Jump/ });
  const rest = () => screen.getByRole('button', { name: /Rest/ });
  const bpm = () => Number(document.querySelector('.heart-bpm')!.textContent);

  it('jumping speeds the heart up, resting slows it down, and 10 jumps then rest finishes it', () => {
    open('habit-heart');
    expect(bpm()).toBe(80);
    fireEvent.click(jump());
    expect(bpm()).toBe(90);
    expect(say()).toMatch(/oxygen/);
    for (let i = 1; i < HEART_GOAL_JUMPS; i++) fireEvent.click(jump());
    expect(bpm()).toBe(160);
    expect(say()).toMatch(/Rest/);
    fireEvent.click(rest());
    expect(say()).toMatch(/slows down/);
    act(() => void vi.advanceTimersByTime(400 * 20));
    expect(say()).toMatch(/70 to 100/);
    expect(bpm()).toBeLessThanOrEqual(90);
    fireEvent.click(screen.getByRole('button', { name: 'Again!' }));
    expect(bpm()).toBe(80);
  });

  it('resting after only a few jumps slows the heart but does not finish, and the heart never goes above 160', () => {
    open('habit-heart');
    for (let i = 0; i < 14; i++) fireEvent.click(jump());
    expect(bpm()).toBe(160);
    cleanup();
    open('habit-heart');
    fireEvent.click(jump());
    fireEvent.click(rest());
    act(() => void vi.advanceTimersByTime(2000));
    // resting stops once the heart is back in the calm range, and one jump is not a finished game
    expect(bpm()).toBeLessThanOrEqual(90);
    expect(bpm()).toBeGreaterThanOrEqual(80);
    expect(screen.queryByRole('button', { name: 'Again!' })).toBeNull();
  });

  it('stops its timer when the child leaves', () => {
    const { unmount } = open('habit-heart');
    fireEvent.click(jump());
    fireEvent.click(rest());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
