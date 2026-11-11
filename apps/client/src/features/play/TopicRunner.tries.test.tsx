import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';

// One fixed question, so the right and wrong answers are known: "A" is right.
vi.mock('@kiyuv/content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@kiyuv/content')>();
  return {
    ...actual,
    generateQuestionForTopic: (topicId: string) => ({
      topicId,
      prompt: 'Pick A',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' },
        { value: 'd', label: 'D' },
      ],
      correctValue: 'a',
    }),
  };
});

import { TopicRunner } from './TopicRunner.js';

const kid = (over: Partial<KidProfile> = {}): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track: 'primary', stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0, ...over,
});

const choice = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}$`) });
const status = (c: HTMLElement) => c.querySelector('.msg')?.textContent ?? '';

function setup(profile: KidProfile) {
  const updates: KidProfile[] = [];
  const view = render(
    <TopicRunner profile={profile} topicId="y-add-e" onUpdateProfile={(p) => updates.push(p)} onExitToMap={() => {}} />,
  );
  return { ...view, updates };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('tries per question', () => {
  it('is unlimited by default: wrong taps keep the question open until it is right', () => {
    const view = setup(kid());
    const { container } = view;
    for (const wrong of ['B', 'C', 'D', 'B', 'C']) {
      fireEvent.click(choice(wrong));
      act(() => void vi.advanceTimersByTime(1000));
    }
    expect(status(container)).toContain('Try again');
    expect(status(container)).not.toContain('left');
    const { updates } = view;
    fireEvent.click(choice('A'));
    expect(updates.at(-1)!.stars).toBe(2);
  });

  it('counts down the tries left', () => {
    const { container } = setup(kid({ maxTries: 3 }));
    fireEvent.click(choice('B'));
    expect(status(container)).toContain('2 tries left');
    act(() => void vi.advanceTimersByTime(1000));
    fireEvent.click(choice('C'));
    expect(status(container)).toContain('1 try left');
  });

  it('shows the answer and moves on, with no stars, when the tries run out', () => {
    const { container, updates } = setup(kid({ maxTries: 2 }));
    fireEvent.click(choice('B'));
    act(() => void vi.advanceTimersByTime(1000));
    fireEvent.click(choice('C'));

    expect(status(container)).toContain('The answer was A');
    expect(choice('A').className).toContain('correct');
    // The question is closed: tapping the right answer now earns nothing.
    fireEvent.click(choice('A'));
    expect(updates).toHaveLength(2);
    expect(updates.every((u) => u.stars === 0)).toBe(true);

    act(() => void vi.advanceTimersByTime(2300));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('question 2');
    // The next question starts with fresh tries.
    fireEvent.click(choice('B'));
    expect(status(container)).toContain('1 try left');
  });

  it('with one try, the first wrong tap ends the question', () => {
    const { container } = setup(kid({ maxTries: 1 }));
    fireEvent.click(choice('D'));
    expect(status(container)).toContain('The answer was A');
  });

  it('a right answer within the limit still earns the stars', () => {
    const { updates } = setup(kid({ maxTries: 2 }));
    fireEvent.click(choice('B'));
    act(() => void vi.advanceTimersByTime(1000));
    fireEvent.click(choice('A'));
    expect(updates.at(-1)!.stars).toBe(2);
  });
});
