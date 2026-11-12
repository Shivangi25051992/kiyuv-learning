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

describe('a refresh in the middle of a round', () => {
  const KEY = 'u1:k1';
  const stored = () => localStorage.getItem('kiyuv_round:' + KEY + ':y-add-e');

  function renderRound(profile = kid({ maxTries: 2 })) {
    const updates: KidProfile[] = [];
    const view = render(
      <TopicRunner
        profile={profile}
        topicId="y-add-e"
        onUpdateProfile={(p) => updates.push(p)}
        onExitToMap={() => {}}
        storageKey={KEY}
      />,
    );
    return { ...view, updates };
  }

  /** Leaving the round (refresh, another profile, back to topics) keeps what was saved. */
  function refresh(view: { unmount: () => void }) {
    view.unmount();
  }

  beforeEach(() => localStorage.clear());

  it('returns to the same question number, score and tries', () => {
    const first = renderRound();
    fireEvent.click(choice('A')); // right: moves on after a moment
    act(() => void vi.advanceTimersByTime(1300));
    fireEvent.click(choice('B')); // one wrong tap on question 2
    refresh(first);

    const { container } = renderRound();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('question 2');
    fireEvent.click(choice('C'));
    expect(status(container)).toContain('ask a parent'); // one try was already used
  });

  it('never lets a question that was already answered right be answered again', () => {
    const first = renderRound();
    fireEvent.click(choice('A')); // right, and the refresh comes straight away
    refresh(first);

    const { updates } = renderRound();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('question 2');
    expect(updates).toHaveLength(0); // nothing was counted twice
  });

  it('comes back blocked, and still needs the parent', () => {
    const first = renderRound(kid({ maxTries: 1 }));
    fireEvent.click(choice('B'));
    expect(screen.getByRole('region', { name: 'Ask a parent' })).toBeTruthy();
    refresh(first);

    renderRound(kid({ maxTries: 1 }));
    expect(screen.getByRole('region', { name: 'Ask a parent' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Parent help' })).toBeTruthy();
    expect(container_has_answer()).toBe(false);
  });

  it('keeps the round when the child leaves it, and forgets it once finished', () => {
    const first = renderRound();
    fireEvent.click(choice('B'));
    expect(stored()).not.toBeNull();
    first.unmount(); // leaving the round inside the app
    expect(stored()).not.toBeNull();
    expect(renderRound().container).toBeTruthy();
    cleanup();

    const second = renderRound();
    for (let i = 0; i < 10; i++) {
      fireEvent.click(choice('A'));
      act(() => void vi.advanceTimersByTime(1300));
    }
    expect(stored()).toBeNull();
    second.unmount();
  });
});

function container_has_answer(): boolean {
  return document.body.textContent?.includes('the answer is') ?? false;
}

describe('mixed challenge', () => {
  const cleared = (b: number) => ({ p: 1, c: b, b, m: false });
  const done = { 'y-add-e': cleared(8), 'y-sub-e': cleared(8), 'y-mul-e': cleared(8) };

  it('earns stars but never changes a topic score', () => {
    const updates: KidProfile[] = [];
    render(
      <TopicRunner
        profile={kid({ topics: done })}
        topicId="challenge"
        onUpdateProfile={(p) => updates.push(p)}
        onExitToMap={() => {}}
      />,
    );
    fireEvent.click(choice('B'));
    fireEvent.click(choice('A'));
    const last = updates.at(-1)!;
    expect(last.stars).toBeGreaterThan(0);
    expect(last.topics).toEqual(done);
    expect(Object.keys(last.topics)).not.toContain('challenge');
  });
});

describe('finish screen "Next up" tiles', () => {
  it('after a cleared round shows what to play next and starts it', () => {
    const played: string[] = [];
    let profile = kid();
    const { container } = render(
      <TopicRunner
        profile={profile}
        topicId="y-add-e"
        onUpdateProfile={(p) => (profile = p)}
        onExitToMap={() => {}}
        onPlayTopic={(id) => played.push(id)}
      />,
    );
    for (let i = 0; i < 10; i++) {
      fireEvent.click(choice('A'));
      act(() => void vi.advanceTimersByTime(1300));
    }
    expect(container.querySelector('.finish')).not.toBeNull();
    const tiles = container.querySelectorAll('.next-tile');
    expect(tiles.length).toBeGreaterThan(0);
    fireEvent.click(tiles[0]!);
    expect(played).toEqual(['y-sub-e']);
  });
});

describe('answer sizing', () => {
  it('shrinks long answers so they fit their button', async () => {
    const { answerSize } = await import('./TopicRunner.js');
    expect(answerSize('12')).toBe('');
    expect(answerSize('Mangalyaan')).toBe('op-md');
    expect(answerSize('Chandrayaan-3')).toBe('op-md');
    expect(answerSize('Wash our hands')).toBe('op-md');
    expect(answerSize('Brushing twice a day')).toBe('op-long');
    expect(answerSize('A mountain that can erupt hot lava')).toBe('op-xl');
  });
});

describe('daily challenge bonus', () => {
  // Like the real app: every update goes back into the runner as its new profile.
  const Live: React.FC<{ updates: KidProfile[]; daily?: { bonus: number; onComplete: () => void } }> = ({ updates, daily }) => {
    const [profile, setProfile] = React.useState(kid());
    return (
      <TopicRunner
        profile={profile}
        topicId="y-add-e"
        onUpdateProfile={(p) => {
          updates.push(p);
          setProfile(p);
        }}
        onExitToMap={() => {}}
        daily={daily}
      />
    );
  };
  const answer = (n: number) => {
    for (let i = 0; i < n; i++) {
      fireEvent.click(choice('A'));
      act(() => void vi.advanceTimersByTime(1300));
    }
  };

  it('adds the bonus stars once, marks the challenge done and says so', () => {
    const onComplete = vi.fn();
    const updates: KidProfile[] = [];
    const { container } = render(<Live updates={updates} daily={{ bonus: 5, onComplete }} />);
    answer(10);
    expect(container.querySelector('.finish')).not.toBeNull();
    expect(onComplete).toHaveBeenCalledTimes(1);
    // 10 right answers at 2 stars each, plus the 5 bonus stars
    expect(updates.at(-1)!.stars).toBe(25);
    expect(container.querySelector('.finish-daily')!.textContent).toMatch(/Daily challenge done! \+5 bonus stars/);
  });

  it('gives no bonus and no banner when it is not the daily challenge', () => {
    const updates: KidProfile[] = [];
    const { container } = render(<Live updates={updates} />);
    answer(10);
    expect(updates.at(-1)!.stars).toBe(20);
    expect(container.querySelector('.finish-daily')).toBeNull();
  });

  it('does not pay the bonus before the round is finished', () => {
    const onComplete = vi.fn();
    const updates: KidProfile[] = [];
    render(<Live updates={updates} daily={{ bonus: 5, onComplete }} />);
    answer(9);
    expect(onComplete).not.toHaveBeenCalled();
    expect(updates.at(-1)!.stars).toBe(18);
  });
});
