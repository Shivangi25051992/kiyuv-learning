import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';

// Only three different questions exist, handed out in a fixed order, then they start again.
let n = 0;
vi.mock('@kiyuv/content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@kiyuv/content')>();
  return {
    ...actual,
    generateQuestionForTopic: (topicId: string) => {
      const i = (n++ % 3) + 1;
      return {
        topicId,
        prompt: `Question number ${i}`,
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
        correctValue: 'a',
      };
    },
  };
});

import { TopicRunner } from './TopicRunner.js';

const kid: KidProfile = {
  kidId: 'k1', name: '', nickname: 'Ari', age: 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track: 'primary', stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0,
};

beforeEach(() => {
  vi.useFakeTimers();
  n = 0;
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('no repeated questions in a round', () => {
  it('never shows a question that was already asked while a new one can be made', () => {
    render(<TopicRunner profile={kid} topicId="y-add-e" onUpdateProfile={() => {}} onExitToMap={() => {}} />);
    const seen: string[] = [];
    seen.push(document.querySelector('.q')!.textContent!);
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'A' }));
      act(() => void vi.advanceTimersByTime(1400));
      seen.push(document.querySelector('.q')!.textContent!);
    }
    expect(new Set(seen).size).toBe(3);
  });
});
