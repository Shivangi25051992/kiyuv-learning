import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';

vi.mock('../lib/firebase/index.js', () => ({
  getCurrentAuthUser: () => null,
  loadChildNames: vi.fn().mockResolvedValue({}),
  getCachedPlainName: () => '',
  clearNameCaches: vi.fn(),
  callSetParentPinServer: vi.fn().mockRejectedValue(new Error('offline')),
  callVerifyParentPinServer: vi.fn().mockRejectedValue(new Error('offline')),
}));

import { PinPromptModal } from '../features/auth/PinModal.js';
import { ProfilePicker } from '../features/profiles/ProfilePicker.js';
import { OnboardingForm } from '../features/onboarding/OnboardingForm.js';
import { TopicRunner } from '../features/play/TopicRunner.js';
import { MusicControl } from './MusicControl.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const kid: KidProfile = {
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
  stars: 3,
  streak: 0,
  bestStreak: 0,
  totalCorrect: 0,
  totalWrong: 0,
  badges: [],
  topics: {},
  resetEpoch: 0,
};

const Harness: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open parent check
      </button>
      {open && <PinPromptModal uid="u1" onVerified={() => {}} onCancel={() => setOpen(false)} />}
    </>
  );
};

describe('pop-up dialogs', () => {
  it('trap focus, close on Escape, and give focus back to the button that opened them', () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open parent check' });
    opener.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Parent Verification' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const input = screen.getByLabelText('6-digit parent PIN');
    expect(document.activeElement).toBe(input);

    // Shift+Tab from the first control wraps to the last one, inside the dialog.
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Unlock' }));

    // Tab from the last control wraps to the first.
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(input);

    // Escape closes it and focus returns to the opener.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});

describe('page landmarks and headings', () => {
  it('the picker and the onboarding steps each have a main area and one level-1 heading', () => {
    const { unmount } = render(
      <ProfilePicker
        profiles={[kid]}
        activeKidId="k1"
        onSelectProfile={() => {}}
        onRequestAddProfile={() => {}}
        onRequestEditProfile={() => {}}
      />,
    );
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    unmount();

    render(<OnboardingForm isFirstProfile onSave={async () => {}} />);
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('onboarding moves the reader to the new step and flags a missing nickname', () => {
    render(<OnboardingForm isFirstProfile onSave={async () => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const nickname = screen.getByLabelText(/Nickname/);
    expect(nickname.getAttribute('aria-invalid')).toBe('true');
    expect(nickname.getAttribute('aria-describedby')).toContain('ob-error');

    fireEvent.change(nickname, { target: { value: 'Leo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
  });
});

describe('music panel', () => {
  it('has honest semantics and returns focus to its button on Escape', () => {
    render(<MusicControl />);
    const trigger = screen.getByRole('button', { name: 'Music settings' });
    expect(trigger.getAttribute('aria-haspopup')).toBeNull();
    trigger.focus();
    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const toggle = screen.getByRole('switch', { name: /Music/ });
    expect(toggle).toBeTruthy();
    expect(screen.getByRole('slider', { name: /Volume/ })).toBeTruthy();

    (screen.getByRole('slider', { name: /Volume/ }) as HTMLElement).focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Music settings' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('game feedback', () => {
  const status = (c: HTMLElement) => c.querySelector('.msg')?.textContent ?? '';
  const options = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('.ops button'));

  it('keeps a wrong-answer message on screen, naming the choice', () => {
    vi.useFakeTimers();
    let seenWrong = false;
    // The right answer is random, so retry until the first tap is a wrong one.
    for (let attempt = 0; attempt < 15 && !seenWrong; attempt++) {
      const { container, unmount } = render(
        <TopicRunner profile={kid} topicId="y-add-e" onUpdateProfile={() => {}} onExitToMap={() => {}} />,
      );
      fireEvent.click(options(container)[0]!);
      if (status(container).includes('is not right')) {
        seenWrong = true;
        act(() => {
          vi.advanceTimersByTime(5000);
        });
        expect(status(container)).toContain('is not right');
        expect(status(container)).toContain('Try again');
      }
      unmount();
    }
    expect(seenWrong).toBe(true);
  });

  it('says how many stars were earned, then moves focus to the next question', () => {
    vi.useFakeTimers();
    const { container } = render(
      <TopicRunner profile={kid} topicId="y-add-e" onUpdateProfile={() => {}} onExitToMap={() => {}} />,
    );
    for (const option of options(container)) {
      fireEvent.click(option);
      if (status(container).includes('You earned')) break;
    }
    expect(status(container)).toMatch(/You earned \d+ stars?\./);

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(document.activeElement).toBe(container.querySelector('.q'));
    expect(container.querySelector('h1.sr-only')?.textContent).toContain('question 2');
  });
});
