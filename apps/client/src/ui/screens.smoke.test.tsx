import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';
import { Mascot } from './Mascot.js';
import { ProfilePicker } from '../features/profiles/ProfilePicker.js';
import { OnboardingForm } from '../features/onboarding/OnboardingForm.js';
import { CurriculumView } from '../features/play/CurriculumView.js';
import { TopicRunner } from '../features/play/TopicRunner.js';
import { LeaderboardView } from '../features/progress/LeaderboardView.js';

afterEach(() => cleanup());

const kid = (over: Partial<KidProfile> = {}): KidProfile => ({
  kidId: 'k1',
  name: '',
  nickname: 'Ari',
  age: 6,
  country: 'IN',
  state: '',
  favColor: 'blue',
  avatar: '👦',
  ageBand: '5-7',
  track: 'primary',
  stars: 12,
  streak: 1,
  bestStreak: 4,
  totalCorrect: 8,
  totalWrong: 2,
  badges: [],
  topics: {},
  resetEpoch: 0,
  ...over,
});

describe('redesigned screens render and respond', () => {
  it('draws the mascot in every mood without a label (decorative)', () => {
    for (const mood of ['happy', 'cheer', 'oops', 'think', 'sleepy'] as const) {
      const { container, unmount } = render(<Mascot mood={mood} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      unmount();
    }
  });

  it('profile picker lists learners and starts the chosen one', () => {
    const onSelect = vi.fn();
    render(
      <ProfilePicker
        profiles={[kid(), kid({ kidId: 'k2', nickname: 'Mia', avatar: '👧' })]}
        activeKidId="k1"
        onSelectProfile={onSelect}
        onRequestAddProfile={() => {}}
        onRequestEditProfile={() => {}}
      />,
    );
    expect(screen.getByText("Who's learning today?")).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start learning as Mia' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Add a learner/ })).toBeTruthy();
  });

  it('onboarding is three short steps and saves the right values', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<OnboardingForm isFirstProfile onSave={onSave} />);

    // Step 1 needs a nickname before moving on
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert').textContent).toMatch(/nickname/i);

    fireEvent.change(screen.getByLabelText(/Nickname/), { target: { value: 'Leo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Step 2: age
    fireEvent.click(screen.getByRole('button', { name: '9 years old' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Step 3: finish
    fireEvent.click(screen.getByRole('button', { name: 'Start learning!' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0]![0];
    expect(saved).toMatchObject({ nickname: 'Leo', age: 9, ageBand: '8-10', track: 'primary' });
  });

  it('learn tab offers a clear next step and the play tab a surprise', () => {
    const onStart = vi.fn();
    const { unmount } = render(<CurriculumView profile={kid()} onStartTopic={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /^Play$/ }));
    expect(onStart).toHaveBeenCalledTimes(1);
    unmount();

    const onStart2 = vi.fn();
    render(<CurriculumView profile={kid()} mode="play" onStartTopic={onStart2} />);
    fireEvent.click(screen.getByRole('button', { name: /Surprise me/ }));
    expect(onStart2).toHaveBeenCalledTimes(1);
  });

  it('a game round shows a question with answers and records an answer', () => {
    const onUpdate = vi.fn();
    const { container } = render(
      <TopicRunner profile={kid()} topicId="y-add-e" onUpdateProfile={onUpdate} onExitToMap={() => {}} />,
    );
    expect(container.querySelector('.question-card')).not.toBeNull();
    const answers = container.querySelectorAll('.ops button');
    expect(answers.length).toBeGreaterThan(1);
    fireEvent.click(answers[0]!);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('trophies screen renders learners and badges', () => {
    render(<LeaderboardView profiles={[kid(), kid({ kidId: 'k2', nickname: 'Mia' })]} onOpenParentReset={() => {}} />);
    expect(screen.getAllByText(/Ari/).length).toBeGreaterThan(0);
  });
});
