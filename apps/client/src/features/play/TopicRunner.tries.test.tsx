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

  it('blocks the question and sends the child to a parent when the tries run out', () => {
    const { container, updates } = setup(kid({ maxTries: 2 }));
    fireEvent.click(choice('B'));
    act(() => void vi.advanceTimersByTime(1000));
    fireEvent.click(choice('C'));

    expect(status(container)).toContain('ask a parent');
    expect(screen.getByRole('region', { name: 'Ask a parent' })).toBeTruthy();
    // The child is not shown the answer.
    expect(container.textContent).not.toContain('the answer is');
    expect(choice('A').className).not.toContain('correct');
    // The question stays blocked: tapping the right answer does nothing, and it does not move on.
    fireEvent.click(choice('A'));
    act(() => void vi.advanceTimersByTime(5000));
    expect(updates).toHaveLength(2);
    expect(updates.every((u) => u.stars === 0)).toBe(true);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('question 1');
  });

  it('needs the parent PIN before the parent sees the answer', () => {
    const asked = vi.fn();
    const pending: Array<() => void> = [];
    render(
      <TopicRunner
        profile={kid({ maxTries: 1 })}
        topicId="y-add-e"
        onUpdateProfile={() => {}}
        onExitToMap={() => {}}
        requireParentPin={(action) => {
          asked();
          pending.push(action);
        }}
      />,
    );
    fireEvent.click(choice('B'));
    fireEvent.click(screen.getByRole('button', { name: 'Parent help' }));
    expect(asked).toHaveBeenCalled();
    expect(screen.queryByText('A', { selector: 'strong' })).toBeNull(); // PIN not entered yet

    act(() => pending[0]!()); // the parent enters the PIN
    expect(screen.getByText('A', { selector: 'strong' })).toBeTruthy();
    expect(choice('A').className).toContain('correct');
  });

  it('after the parent helps, the child gets fresh tries and can earn the stars', () => {
    const { container, updates } = setup(kid({ maxTries: 1 }));
    fireEvent.click(choice('D'));
    fireEvent.click(screen.getByRole('button', { name: 'Parent help' }));
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.queryByRole('region', { name: 'Ask a parent' })).toBeNull();
    expect(status(container)).toContain('Try again');
    fireEvent.click(choice('A'));
    expect(updates.at(-1)!.stars).toBe(2);
  });

  it('starts the next question with fresh tries and no block', () => {
    const { container } = setup(kid({ maxTries: 1 }));
    fireEvent.click(choice('B'));
    fireEvent.click(screen.getByRole('button', { name: 'Parent help' }));
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    fireEvent.click(choice('A'));
    act(() => void vi.advanceTimersByTime(1300));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('question 2');
    expect(screen.queryByRole('region', { name: 'Ask a parent' })).toBeNull();
    fireEvent.click(choice('C'));
    expect(status(container)).toContain('ask a parent');
  });

  it('a right answer within the limit still earns the stars', () => {
    const { updates } = setup(kid({ maxTries: 2 }));
    fireEvent.click(choice('B'));
    act(() => void vi.advanceTimersByTime(1000));
    fireEvent.click(choice('A'));
    expect(updates.at(-1)!.stars).toBe(2);
  });
});
