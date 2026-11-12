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
import { PLAY_ACTIVITIES, PLAY_GROUPS, PLAY_TIME_ID } from './playTime.js';
import { BODY_PARTS, LAMB_SONG } from './playData.js';

const kid = (): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 2, country: 'IN', state: '', favColor: 'blue',
  avatar: '🧒', ageBand: '2-4', track: 'early', stars: 0, streak: 0, bestStreak: 0,
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

const open = (id: string, age = 3) => {
  const onOpen = vi.fn();
  render(<ToddlerScreen id={id} profile={{ ...kid(), age }} onOpen={onOpen} onClose={() => {}} />);
  return { onOpen };
};

describe('Play time sections', () => {
  it('lists the activities under their headings, and opens any of them', () => {
    const { onOpen } = open(PLAY_TIME_ID);
    for (const g of PLAY_GROUPS) expect(screen.getByRole('region', { name: g })).toBeTruthy();
    expect(PLAY_ACTIVITIES.length).toBeGreaterThanOrEqual(13);
    expect(screen.getByText(/There are no wrong answers/)).toBeTruthy();
    fireEvent.click(within(screen.getByRole('region', { name: 'Music' })).getByRole('button', { name: /Sing along/ }));
    expect(onOpen).toHaveBeenCalledWith('play-song');
  });

  it('every activity has a screen that opens', () => {
    for (const a of PLAY_ACTIVITIES) {
      const { unmount } = render(<ToddlerScreen id={a.id} profile={kid()} onOpen={() => {}} onClose={() => {}} />);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(a.name);
      unmount();
    }
  });
});

describe('Go go go, Yummy fruits and My day', () => {
  it('a vehicle says its sound, a fruit says yum, and a day step says what to do', () => {
    open('play-vehicles');
    fireEvent.click(screen.getByRole('button', { name: 'Train' }));
    expect(screen.getByRole('status').textContent).toBe('Train says choo choo!');
    expect(spoken).toEqual(['Train! Choo choo!']);
    cleanup();
    open('play-fruit');
    fireEvent.click(screen.getByRole('button', { name: 'Banana' }));
    expect(screen.getByRole('status').textContent).toBe('Banana! Yum!');
    cleanup();
    open('play-day');
    expect(screen.getAllByRole('button').length).toBe(1 + 6);
    fireEvent.click(screen.getByRole('button', { name: 'Brush teeth' }));
    expect(screen.getByRole('status').textContent).toBe('Brush your teeth!');
    expect(spoken.at(-1)).toBe('Brush, brush, brush your teeth!');
  });
});

describe('Peekaboo presents', () => {
  it('opens presents, even several at the same moment, then cheers and starts again', () => {
    open('play-peekaboo');
    const presents = screen.getAllByRole('button', { name: /^Present/ }) as HTMLButtonElement[];
    expect(presents).toHaveLength(6);
    act(() => {
      presents[0]!.click();
      presents[3]!.click();
    });
    expect(screen.queryAllByRole('button', { name: /^Present/ })).toHaveLength(4);
    expect(spoken.filter((s) => s.startsWith('Peekaboo!'))).toHaveLength(2);
    for (const p of screen.getAllByRole('button', { name: /^Present/ })) fireEvent.click(p);
    expect(screen.getByRole('status').textContent).toBe('Hooray!');
    act(() => void vi.advanceTimersByTime(1600));
    expect(spoken.at(-1)).toBe('Hooray!');
    act(() => void vi.advanceTimersByTime(3000));
    expect(screen.getAllByRole('button', { name: /^Present/ })).toHaveLength(6);
  });
});

describe('Colour splash', () => {
  it('says the colour and links it to a real thing', () => {
    open('play-colours');
    fireEvent.click(screen.getByRole('button', { name: 'Red' }));
    expect(screen.getByRole('status').textContent).toBe('Red! Like an apple!');
    expect(spoken).toEqual(['Red! Like an apple!']);
    fireEvent.click(screen.getByRole('button', { name: 'Blue' }));
    expect(screen.getByRole('status').textContent).toBe('Blue! Like a whale!');
  });
});

describe('Big and small', () => {
  it('says each word that is tapped', () => {
    open('play-opposites');
    fireEvent.click(screen.getByRole('button', { name: 'Small' }));
    expect(spoken).toEqual(['Small!']);
    fireEvent.click(screen.getByRole('button', { name: 'Hot' }));
    expect(screen.getByRole('status').textContent).toBe('Hot!');
    expect(screen.getAllByRole('button').length).toBe(1 + 8);
  });
});

describe('Where is my nose?', () => {
  const PARTS = BODY_PARTS.map((p) => p.name);
  const targetOf = () => /^Touch the (\w+)!$/.exec(spoken.at(-1) ?? '')![1]!;
  const options = () => screen.getAllByRole('button').filter((b) => PARTS.includes(b.getAttribute('aria-label') ?? ''));

  it('asks for a body part, hints gently when it is wrong, and cheers when it is found', () => {
    open('play-body');
    expect(spoken).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Let us play!' }));
    const target = targetOf();
    expect(options()).toHaveLength(3);
    const wrong = options().find((o) => o.getAttribute('aria-label') !== target)!;
    fireEvent.click(wrong);
    expect(spoken.at(-1)).toBe(`That is the ${wrong.getAttribute('aria-label')}. Find the ${target}!`);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: target }));
    expect(spoken.at(-1)).toBe(`Yes! ${target}!`);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  });

  it('after six finds it cheers and offers another go', () => {
    open('play-body');
    fireEvent.click(screen.getByRole('button', { name: 'Let us play!' }));
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByRole('button', { name: targetOf() }));
      act(() => void vi.advanceTimersByTime(1500));
    }
    expect(screen.getByRole('status').textContent).toBe('Hooray!');
    fireEvent.click(screen.getByRole('button', { name: 'Again!' }));
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });
});

describe('Sing along', () => {
  const glowing = () => screen.getByRole('button', { name: /glowing/ }) as HTMLButtonElement;

  it('only the glowing bar moves the song on, and every bar makes its sound', () => {
    open('play-song');
    const bars = screen.getAllByRole('button', { name: /^Bar/ }) as HTMLButtonElement[];
    expect(bars).toHaveLength(4);
    const first = LAMB_SONG[0]!;
    const notGlowing = bars.find((_, i) => i !== first)!;
    fireEvent.click(notGlowing);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    expect(notes).toEqual([bars.indexOf(notGlowing)]);
    fireEvent.click(glowing());
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  });

  it('plays the whole song, cheers, and can start again', () => {
    open('play-song');
    for (let i = 0; i < LAMB_SONG.length; i++) fireEvent.click(glowing());
    expect(screen.getByRole('status').textContent).toMatch(/You played the song/);
    expect(notes).toEqual([...LAMB_SONG]);
    act(() => void vi.advanceTimersByTime(800));
    expect(spoken.at(-1)).toBe('Hooray! You played the song!');
    fireEvent.click(screen.getByRole('button', { name: 'Again!' }));
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('the song only needs the four bars it has', () => {
    expect(Math.max(...LAMB_SONG)).toBeLessThan(4);
    expect(Math.min(...LAMB_SONG)).toBeGreaterThanOrEqual(0);
    expect(LAMB_SONG).toHaveLength(26);
  });
});
