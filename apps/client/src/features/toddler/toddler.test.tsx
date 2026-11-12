import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';

const spoken: string[] = [];
const notes: number[] = [];
vi.mock('../../lib/sound.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/sound.js')>();
  return {
    ...actual,
    initAudio: () => {},
    speak: (t: string) => spoken.push(t),
    playClip: (_clip: string, _name: string, fallback: string) => spoken.push(fallback),
    playNote: (i: number) => notes.push(i),
    sfx: new Proxy({}, { get: () => () => {} }),
  };
});
vi.mock('../../lib/effects.js', () => ({ confettiBlast: () => {}, starBurst: () => {} }));

import { ToddlerScreen } from './ToddlerScreen.js';
import { CurriculumView } from '../play/CurriculumView.js';
import { isPlayActivity, isPlayScreen, PLAY_ACTIVITIES, PLAY_TIME_ID } from './playTime.js';

const kid = (age = 2, track: 'early' | 'primary' = 'early'): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age, country: 'IN', state: '', favColor: 'blue',
  avatar: '🧒', ageBand: age <= 4 ? '2-4' : '8-10', track, stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0,
});

beforeEach(() => {
  spoken.length = 0;
  notes.length = 0;
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const open = (id: string, age = 2) => {
  const onOpen = vi.fn();
  const onClose = vi.fn();
  render(<ToddlerScreen id={id} profile={kid(age)} onOpen={onOpen} onClose={onClose} />);
  return { onOpen, onClose };
};

describe('Play time screens', () => {
  it('knows which ids belong to Play time', () => {
    expect(isPlayScreen(PLAY_TIME_ID)).toBe(true);
    expect(isPlayScreen('play-animals')).toBe(true);
    expect(isPlayScreen('y-add-e')).toBe(false);
    expect(isPlayScreen(null)).toBe(false);
    expect(isPlayActivity(PLAY_TIME_ID)).toBe(false);
  });

  it('the hub lists every activity for a 3-year-old and opens the one tapped', () => {
    const { onOpen } = open(PLAY_TIME_ID, 3);
    for (const a of PLAY_ACTIVITIES) expect(screen.getByRole('button', { name: new RegExp(a.name) })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Pop the balloons/ }));
    expect(onOpen).toHaveBeenCalledWith('play-balloons');
  });

  it('the hub keeps the three trickier activities for age 3, so a 2-year-old sees only the simplest', () => {
    open(PLAY_TIME_ID, 2);
    for (const a of PLAY_ACTIVITIES) {
      const shown = screen.queryByRole('button', { name: new RegExp(a.name) }) !== null;
      expect(shown, a.name).toBe((a.minAge ?? 0) <= 2);
    }
    expect(screen.queryByRole('button', { name: /Sing along/ })).toBeNull();
  });

  it('Back leaves Play time from the hub, and returns to the hub from an activity', () => {
    const hub = open(PLAY_TIME_ID);
    fireEvent.click(screen.getByRole('button', { name: 'Leave play time' }));
    expect(hub.onClose).toHaveBeenCalled();
    cleanup();
    const act1 = open('play-shapes');
    fireEvent.click(screen.getByRole('button', { name: 'Back to play time' }));
    expect(act1.onOpen).toHaveBeenCalledWith(PLAY_TIME_ID);
  });
});

describe('Say hello', () => {
  it('shows and says the animal that was tapped, and says nothing before a tap', () => {
    open('play-animals');
    expect(spoken).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Cow' }));
    expect(screen.getByRole('status').textContent).toBe('Cow says Moo!');
    // The real recording plays; the words are only a backup, and they are never a sound read as text.
    expect(spoken).toEqual(['Cow! Cows give us milk.']);
    fireEvent.click(screen.getByRole('button', { name: 'Duck' }));
    expect(screen.getByRole('status').textContent).toBe('Duck says Quack!');
  });

  it('has many animals in six groups, and each group shows its own', () => {
    open('play-animals');
    const group = screen.getByRole('group', { name: 'Kinds of animals' });
    expect(within(group).getAllByRole('button')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: 'Tiger' })).toBeNull();
    fireEvent.click(within(group).getByRole('button', { name: /Wild/ }));
    expect(within(group).getByRole('button', { name: /Wild/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Tiger' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cow' })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Tap an animal!');
  });

  it('an animal with no recording says its name and a fact, not a sound word', () => {
    open('play-animals');
    fireEvent.click(within(screen.getByRole('group', { name: 'Kinds of animals' })).getByRole('button', { name: /Wild/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Tiger' }));
    expect(screen.getByRole('status').textContent).toBe('Tiger! Tigers have stripes.');
    expect(spoken.at(-1)).toBe('Tiger! Tigers have stripes.');
    // An animal with a real recording shows its sound word, and the recording plays.
    fireEvent.click(screen.getByRole('button', { name: 'Elephant' }));
    expect(screen.getByRole('status').textContent).toBe('Elephant says Toot!');
  });
});

describe('Pop the balloons', () => {
  it('pops each balloon with its colour, celebrates when all are gone, then starts again', () => {
    open('play-balloons');
    const balloons = screen.getAllByRole('button', { name: /balloon$/ });
    expect(balloons).toHaveLength(6);
    fireEvent.click(balloons[0]!);
    expect(spoken).toEqual(['Red!']);
    expect((balloons[0] as HTMLButtonElement).disabled).toBe(true);
    for (const b of balloons.slice(1)) fireEvent.click(b);
    expect(screen.getByRole('status').textContent).toBe('Hooray!');
    act(() => void vi.advanceTimersByTime(800));
    expect(spoken.at(-1)).toBe('Hooray!');
    act(() => void vi.advanceTimersByTime(3000));
    expect(screen.getByRole('status').textContent).toBe('Pop the balloons!');
    expect((screen.getAllByRole('button', { name: /balloon$/ })[0] as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('fast taps', () => {
  it('counts every balloon when several are popped in the same moment', () => {
    open('play-balloons');
    const balloons = screen.getAllByRole('button', { name: /balloon$/ }) as HTMLButtonElement[];
    act(() => {
      balloons[1]!.click();
      balloons[4]!.click();
    });
    expect(balloons[1]!.disabled).toBe(true);
    expect(balloons[4]!.disabled).toBe(true);
    expect(spoken).toEqual(['Blue!', 'Pink!']);
  });

  it('numbers every apple when several are tapped in the same moment', () => {
    open('play-count');
    const apples = screen.getAllByRole('button', { name: /^Apple/ });
    act(() => apples.forEach((a) => a.click()));
    expect(screen.getAllByRole('button', { name: /counted$/ })).toHaveLength(apples.length);
  });
});

describe('Count with me', () => {
  it('counts the apples one by one in the order tapped, then offers another go', () => {
    open('play-count');
    const apples = screen.getAllByRole('button', { name: /^Apple/ });
    expect(apples.length).toBeGreaterThanOrEqual(1);
    expect(apples.length).toBeLessThanOrEqual(5);
    const words = ['one', 'two', 'three', 'four', 'five'];
    // tap in reverse order: the numbers follow the taps, not the positions
    [...apples].reverse().forEach((a, i) => {
      fireEvent.click(a);
      expect(spoken.at(-1)).toBe(words[i]);
    });
    fireEvent.click(apples[0]!); // tapping a counted apple again changes nothing
    expect(spoken.filter((s) => words.includes(s))).toHaveLength(apples.length);
    act(() => void vi.advanceTimersByTime(1000));
    expect(spoken.at(-1)).toMatch(/Hooray/);
    expect(screen.getByRole('button', { name: 'Again!' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Again!' }));
    expect(screen.queryByRole('button', { name: 'Again!' })).toBeNull();
    for (const a of screen.getAllByRole('button', { name: /^Apple/ })) {
      expect(a.getAttribute('aria-label')).toBe('Apple');
    }
  });
});

describe('Dance shapes', () => {
  it('says the shape that was tapped', () => {
    open('play-shapes');
    fireEvent.click(screen.getByRole('button', { name: 'Triangle' }));
    expect(spoken).toEqual(['Triangle!']);
    expect(screen.getByRole('status').textContent).toBe('Triangle!');
    expect(screen.getAllByRole('button')).toHaveLength(1 + 5); // Back + five shapes
  });
});

describe('Little xylophone', () => {
  it('plays the note of the bar that was tapped', () => {
    open('play-music');
    const bars = screen.getAllByRole('button', { name: /^Note/ });
    expect(bars).toHaveLength(6);
    fireEvent.click(bars[0]!);
    fireEvent.click(bars[5]!);
    expect(notes).toEqual([0, 5]);
  });
});

describe('the Play time button', () => {
  it('is the first thing a 2 year old sees on the Learn page', () => {
    const onStart = vi.fn();
    const { container } = render(<CurriculumView profile={kid(2)} onStartTopic={onStart} />);
    const first = container.querySelector('.learn2 > :first-child') as HTMLElement;
    expect(first.textContent).toMatch(/Play time/);
    fireEvent.click(screen.getByRole('button', { name: /Play time/ }));
    expect(onStart).toHaveBeenCalledWith(PLAY_TIME_ID);
  });

  it('is on the Play page for little ones, and not for primary children', () => {
    render(<CurriculumView profile={kid(4)} mode="play" onStartTopic={() => {}} />);
    expect(screen.getByRole('button', { name: /Play time/ })).toBeTruthy();
    cleanup();
    render(<CurriculumView profile={kid(8, 'primary')} mode="play" onStartTopic={() => {}} />);
    expect(screen.queryByRole('button', { name: /Play time/ })).toBeNull();
    cleanup();
    render(<CurriculumView profile={kid(8, 'primary')} onStartTopic={() => {}} />);
    expect(screen.queryByRole('button', { name: /Play time/ })).toBeNull();
  });
});
