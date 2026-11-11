import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';

const speak = vi.fn();
vi.mock('../../lib/sound.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/sound.js')>();
  return { ...actual, speak: (t: string) => speak(t), canSpeak: () => true };
});

import { TopicRunner } from './TopicRunner.js';

const kid = (track: 'early' | 'primary'): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 4, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '2-4', track, stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0,
});

afterEach(() => {
  cleanup();
  speak.mockClear();
});

describe('voice', () => {
  for (const track of ['early', 'primary'] as const) {
    it(`stays silent until Listen is pressed (${track} track)`, () => {
      render(<TopicRunner profile={kid(track)} topicId="y-add-e" onUpdateProfile={() => {}} onExitToMap={() => {}} />);
      expect(speak).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Read the question out loud' }));
      expect(speak).toHaveBeenCalledTimes(1);
    });
  }
});
