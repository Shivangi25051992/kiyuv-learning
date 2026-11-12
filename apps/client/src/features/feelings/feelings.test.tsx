import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';
import { FeelingsCard } from './FeelingsCard.js';
import { FEELINGS, GROWN_UP_LINE, feelingOf, replyFor } from './feelings.js';
import { answeredToday, feelingToday, feelingsEnabled, saveFeeling, setFeelingsEnabled } from './feelingsState.js';
import { LearnHome } from '../learn/LearnHome.js';
import { CompanionProvider } from '../companion/CompanionProvider.js';
import { CompanionSettings } from '../companion/CompanionSettings.js';
import { reactionFor } from '../companion/lines.js';
import { picSrc } from '../../ui/Pic.js';

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

const NOW = new Date(2026, 10, 12, 10, 0);
const kid = (over: Partial<KidProfile> = {}): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track: 'primary', stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0, ...over,
});

describe('what Kiyu says about feelings', () => {
  it('has six feelings, each with a drawing, a kind reply and a face for Kiyu', () => {
    expect(FEELINGS).toHaveLength(6);
    for (const f of FEELINGS) {
      expect(picSrc(f.emoji), f.key).not.toBeNull();
      expect(replyFor(f, 'Ari')).toContain('Ari');
      expect(replyFor(f, '')).toContain('friend');
    }
    expect(feelingOf('sad')?.label).toBe('Sad');
    expect(feelingOf('nope')).toBeNull();
  });

  it('never tells a child how to feel, diagnoses, or says anything unkind', () => {
    const banned = ['should not', 'stop feeling', 'silly', 'wrong', 'just ', 'get over', 'ill', 'sick'];
    for (const f of FEELINGS) {
      const text = (replyFor(f, 'Ari') + ' ' + GROWN_UP_LINE).toLowerCase();
      for (const w of banned) expect(text, `${f.key}: ${w}`).not.toContain(w);
    }
    expect(GROWN_UP_LINE).toMatch(/grown-up you trust/);
  });

  it('only the big feelings offer breathing and mention a grown-up', () => {
    expect(FEELINGS.filter((f) => f.big).map((f) => f.key).sort()).toEqual(['angry', 'sad', 'worried']);
  });

  it('Kiyu\'s hello is gentle when the child said they feel tired, worried, sad or angry', () => {
    for (const feeling of ['tired', 'worried', 'sad', 'angry']) {
      const r = reactionFor('greet', { name: 'Ari', hour: 9, days: 5, feeling }, () => 0);
      expect(r.line).toMatch(/^Hi Ari\./);
      expect(r.line).not.toMatch(/streak|Ready for a quick game/);
    }
    expect(reactionFor('greet', { name: 'Ari', hour: 9, feeling: 'happy' }, () => 0).line).toBe('Good morning, Ari!');
  });
});

describe('what is remembered', () => {
  it('only the day and the feeling, only for today, and only on this device', () => {
    expect(feelingToday('k', NOW)).toBeNull();
    saveFeeling('k', 'sad', NOW);
    expect(feelingToday('k', NOW)).toBe('sad');
    expect(JSON.parse(localStorage.getItem('kiyuv.feeling.k')!)).toEqual({ date: '2026-11-12', value: 'sad' });
    expect(feelingToday('k', new Date(2026, 10, 13, 9))).toBeNull();
    expect(answeredToday('k', new Date(2026, 10, 13, 9))).toBe(false);
  });

  it('"Not now" counts as answered for the day but is not a feeling', () => {
    saveFeeling('k', 'skip', NOW);
    expect(answeredToday('k', NOW)).toBe(true);
    expect(feelingToday('k', NOW)).toBeNull();
  });

  it('ignores damaged saved data', () => {
    localStorage.setItem('kiyuv.feeling.k', '{oops');
    expect(feelingToday('k', NOW)).toBeNull();
    localStorage.setItem('kiyuv.feeling.k', JSON.stringify({ date: '2026-11-12', value: 'nonsense' }));
    expect(answeredToday('k', NOW)).toBe(false);
  });

  it('is on by default, and a parent can turn it off', () => {
    expect(feelingsEnabled()).toBe(true);
    setFeelingsEnabled(false);
    expect(feelingsEnabled()).toBe(false);
  });
});

describe('the daily check-in card', () => {
  it('asks once, answers kindly, and saves only the feeling', () => {
    render(<FeelingsCard name="Ari" storeKey="u1:k1" now={NOW} onBreathe={() => {}} />);
    expect(screen.getByRole('heading', { name: 'How are you feeling today?' })).toBeTruthy();
    expect(screen.getAllByRole('button').filter((b) => FEELINGS.some((f) => f.label === b.getAttribute('aria-label')))).toHaveLength(6);
    fireEvent.click(screen.getByRole('button', { name: 'Happy' }));
    expect(screen.getByRole('status').textContent).toBe('I am so glad, Ari! Let us have a great day!');
    expect(screen.queryByRole('button', { name: /Breathe with Kiyu/ })).toBeNull();
    expect(feelingToday('u1:k1', NOW)).toBe('happy');
    fireEvent.click(screen.getByRole('button', { name: 'Thanks, Kiyu' }));
    expect(document.querySelector('.feelings-card')).toBeNull();
  });

  it('a big feeling gets breathing and a reminder about a trusted grown-up', () => {
    const onBreathe = vi.fn();
    render(<FeelingsCard name="Ari" storeKey="u1:k1" now={NOW} onBreathe={onBreathe} />);
    fireEvent.click(screen.getByRole('button', { name: 'Worried' }));
    expect(screen.getByText(GROWN_UP_LINE)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Breathe with Kiyu/ }));
    expect(onBreathe).toHaveBeenCalled();
  });

  it('"Not now" hides it for the day without saving a feeling', () => {
    render(<FeelingsCard name="Ari" storeKey="u1:k1" now={NOW} onBreathe={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(document.querySelector('.feelings-card')).toBeNull();
    expect(feelingToday('u1:k1', NOW)).toBeNull();
    cleanup();
    render(<FeelingsCard name="Ari" storeKey="u1:k1" now={NOW} onBreathe={() => {}} />);
    expect(document.querySelector('.feelings-card')).toBeNull();
  });

  it('is not shown again today once answered, and is shown again tomorrow', () => {
    saveFeeling('u1:k1', 'okay', NOW);
    render(<FeelingsCard name="Ari" storeKey="u1:k1" now={NOW} onBreathe={() => {}} />);
    expect(document.querySelector('.feelings-card')).toBeNull();
    cleanup();
    render(<FeelingsCard name="Ari" storeKey="u1:k1" now={new Date(2026, 10, 13, 9)} onBreathe={() => {}} />);
    expect(document.querySelector('.feelings-card')).not.toBeNull();
  });

  it('is not shown at all when a parent has turned it off', () => {
    setFeelingsEnabled(false);
    render(<FeelingsCard name="Ari" storeKey="u1:k1" now={NOW} onBreathe={() => {}} />);
    expect(document.querySelector('.feelings-card')).toBeNull();
  });
});

describe('on the Learn page and in the parent area', () => {
  it('is on the Learn page for school-age children and not for the youngest', () => {
    render(<LearnHome profile={kid()} roundKey="u1:k1" now={NOW} onStartTopic={() => {}} />);
    expect(screen.getByRole('heading', { name: 'How are you feeling today?' })).toBeTruthy();
    cleanup();
    render(<LearnHome profile={kid({ track: 'early', age: 2, ageBand: '2-4' })} now={NOW} onStartTopic={() => {}} />);
    expect(screen.queryByRole('heading', { name: 'How are you feeling today?' })).toBeNull();
  });

  it('breathing opens from the check-in', () => {
    const onStart = vi.fn();
    render(<LearnHome profile={kid()} roundKey="u1:k1" now={NOW} onStartTopic={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sad' }));
    fireEvent.click(screen.getByRole('button', { name: /Breathe with Kiyu/ }));
    expect(onStart).toHaveBeenCalledWith('habit-breathe');
  });

  it('a parent can switch the check-in off from the parent area, and the page then leaves it out', () => {
    render(
      <CompanionProvider>
        <CompanionSettings />
      </CompanionProvider>,
    );
    const box = screen.getByRole('checkbox', { name: /how the child is feeling/ }) as HTMLInputElement;
    expect(box.checked).toBe(true);
    expect(screen.getByText(/stays on this device/)).toBeTruthy();
    fireEvent.click(box);
    expect(feelingsEnabled()).toBe(false);
    cleanup();
    render(<LearnHome profile={kid()} roundKey="u1:k1" now={NOW} onStartTopic={() => {}} />);
    expect(screen.queryByRole('heading', { name: 'How are you feeling today?' })).toBeNull();
  });
});
