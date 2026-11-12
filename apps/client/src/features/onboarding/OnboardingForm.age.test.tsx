import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';
import { OnboardingForm } from './OnboardingForm.js';

afterEach(() => cleanup());

const kid = (over: Partial<KidProfile> = {}): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 6, country: 'IN', state: '', favColor: 'blue',
  avatar: '🧒', ageBand: '5-7', track: 'primary', stars: 40, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0, ...over,
});

/** Edits a saved profile to a new age and saves. Returns what was saved. */
async function editAge(profile: KidProfile, newAge: number) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<OnboardingForm existingProfile={profile} onSave={onSave} />);
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.click(screen.getByRole('button', { name: `${newAge} years old` }));
  const stage = screen.getByRole('status').textContent;
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  return { saved: onSave.mock.calls[0]![0] as Record<string, unknown>, stage };
}

describe('editing a child\'s age', () => {
  it('a profile made at 6 and edited to 2 becomes a Play time profile', async () => {
    const { saved, stage } = await editAge(kid(), 2);
    expect(stage).toMatch(/Play time \(ages 2 to 3\)/);
    expect(saved).toMatchObject({ age: 2, ageBand: '2-4', track: 'early' });
  });

  it('a 2-year-old edited up to 12 becomes a grades 6 to 8 profile', async () => {
    const { saved, stage } = await editAge(kid({ age: 2, ageBand: '2-4', track: 'early' }), 12);
    expect(stage).toMatch(/Grades 6 to 8/);
    expect(saved).toMatchObject({ age: 12, ageBand: '11-13', track: 'primary' });
  });

  it('shows the stage for every age, so a parent can see what the age does', () => {
    const expected: Record<number, RegExp> = {
      2: /Play time/, 3: /Play time/, 4: /Early years/, 5: /Early years/,
      6: /Grades 1 to 2/, 7: /Grades 1 to 2/, 8: /Grades 3 to 5/, 10: /Grades 3 to 5/, 11: /Grades 6 to 8/, 13: /Grades 6 to 8/,
    };
    render(<OnboardingForm existingProfile={kid()} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    for (const [age, re] of Object.entries(expected)) {
      fireEvent.click(screen.getByRole('button', { name: `${age} years old` }));
      expect(screen.getByRole('status').textContent, `age ${age}`).toMatch(re);
    }
  });

  it('no longer has a separate level box that could fall out of step with the age', () => {
    render(<OnboardingForm existingProfile={kid()} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.queryByText(/Change the learning level/)).toBeNull();
  });
});
