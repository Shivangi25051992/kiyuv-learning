import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';

const spoken: string[] = [];
vi.mock('../../lib/sound.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/sound.js')>();
  return {
    ...actual,
    initAudio: () => {},
    canSpeak: () => true,
    speak: (t: string) => spoken.push(t),
    sfx: new Proxy({}, { get: () => () => {} }),
  };
});
vi.mock('../../lib/effects.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/effects.js')>();
  return { ...actual, confettiBlast: () => {}, starBurst: () => {} };
});

import { HabitsScreen } from './HabitsScreen.js';
import { LearnHome } from '../learn/LearnHome.js';
import { CompanionProvider } from '../companion/CompanionProvider.js';
import { picSrc } from '../../ui/Pic.js';
import {
  BINS,
  FOODS,
  GREEN_MS,
  HABITS_PAGE_ID,
  HABIT_ACTIVITIES,
  HABIT_GROUPS,
  PLANT_STAGES,
  RED_MS,
  RUBBISH,
  SCRUB_SECONDS,
  WASH_STEPS,
  isHabitScreen,
} from './habits.js';

const kid = (over: Partial<KidProfile> = {}): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 6, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '5-7', track: 'primary', stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0, ...over,
});

beforeEach(() => {
  spoken.length = 0;
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const open = (id: string) => {
  const onOpen = vi.fn();
  const onClose = vi.fn();
  render(<HabitsScreen id={id} profile={kid()} onOpen={onOpen} onClose={onClose} />);
  return { onOpen, onClose };
};
const say = () => document.querySelector('.habit-say p')!.textContent;

describe('the habits page', () => {
  it('lists the activities under headings with their ages, and opens one', () => {
    const { onOpen, onClose } = open(HABITS_PAGE_ID);
    for (const g of HABIT_GROUPS) expect(screen.getByRole('region', { name: g })).toBeTruthy();
    expect(HABIT_ACTIVITIES).toHaveLength(5);
    expect(screen.getAllByText(/^Ages \d+ to \d+$/)).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: /Cross safely/ }));
    expect(onOpen).toHaveBeenCalledWith('habit-road');
    fireEvent.click(screen.getByRole('button', { name: 'Back to the learn page' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('every activity opens, and Back returns to the page', () => {
    for (const a of HABIT_ACTIVITIES) {
      const { onOpen } = open(a.id);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(a.name);
      fireEvent.click(screen.getByRole('button', { name: 'Back to good habits' }));
      expect(onOpen).toHaveBeenCalledWith(HABITS_PAGE_ID);
      cleanup();
    }
    expect(isHabitScreen(HABITS_PAGE_ID)).toBe(true);
    expect(isHabitScreen('habit-wash')).toBe(true);
    expect(isHabitScreen('y-add-e')).toBe(false);
  });

  it('the voice only speaks when the Listen button is pressed', () => {
    open('habit-wash');
    expect(spoken).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Read it out loud' }));
    expect(spoken).toEqual([WASH_STEPS[0]!.say]);
  });
});

describe('Wash your hands', () => {
  const stepBtn = (n: number) => screen.getByRole('button', { name: new RegExp(`^Step ${n}:`) });

  it('goes in order, hints kindly when the order is wrong, and needs the full 20 seconds to scrub', () => {
    open('habit-wash');
    expect(say()).toBe(WASH_STEPS[0]!.say);
    fireEvent.click(stepBtn(4));
    expect(say()).toBe('Next: Wet your hands!');
    fireEvent.click(stepBtn(1));
    fireEvent.click(stepBtn(2));
    expect(say()).toBe(WASH_STEPS[2]!.say);
    fireEvent.click(stepBtn(3));
    expect(screen.getByRole('timer').textContent).toMatch(String(SCRUB_SECONDS));
    // other steps are ignored while scrubbing
    fireEvent.click(stepBtn(4));
    act(() => void vi.advanceTimersByTime((SCRUB_SECONDS - 1) * 1000));
    expect(screen.getByRole('timer').getAttribute('aria-label')).toBe('1 second left');
    expect(stepBtn(3).getAttribute('aria-current')).toBe('step');
    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.queryByRole('timer')).toBeNull();
    expect(stepBtn(3).getAttribute('aria-label')).toMatch(/done/);
    expect(stepBtn(4).getAttribute('aria-current')).toBe('step');
  });

  it('finishes with a cheer, Kiyu joins in, and it can be done again', () => {
    render(
      <CompanionProvider>
        <HabitsScreen id="habit-wash" profile={kid()} onOpen={() => {}} onClose={() => {}} />
      </CompanionProvider>,
    );
    const step = (n: number) => screen.getByRole('button', { name: new RegExp(`^Step ${n}:`) });
    fireEvent.click(step(1));
    fireEvent.click(step(2));
    fireEvent.click(step(3));
    act(() => void vi.advanceTimersByTime(SCRUB_SECONDS * 1000 + 100));
    fireEvent.click(step(4));
    fireEvent.click(step(5));
    expect(say()).toBe('Clean hands! Hooray!');
    expect(document.querySelector('.companion-bubble')!.textContent).toMatch(/habit|Well done/);
    fireEvent.click(screen.getByRole('button', { name: 'Again!' }));
    expect(say()).toBe(WASH_STEPS[0]!.say);
  });
});

describe('Healthy plate', () => {
  const currentFood = () => {
    const name = document.querySelector('.plate-food b')!.textContent;
    return FOODS.find((f) => f.name === name)!;
  };
  const choice = (kind: 'daily' | 'treat') => screen.getByRole('button', { name: kind === 'daily' ? /Every day food/ : /Sometimes treat/ });

  it('a wrong choice gets a kind hint and the food stays; the right one gives a real fact', () => {
    open('habit-plate');
    const food = currentFood();
    const wrong = food.kind === 'daily' ? 'treat' : 'daily';
    fireEvent.click(choice(wrong));
    expect(say()).toBe('Hmm, try the other one!');
    expect(currentFood()).toBe(food);
    fireEvent.click(choice(food.kind));
    expect(say()).toBe(food.fact);
    // taps during the happy pause change nothing
    fireEvent.click(choice(wrong));
    expect(say()).toBe(food.fact);
    act(() => void vi.advanceTimersByTime(2000));
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  });

  it('sorting all eight finishes the game, with half every day foods and half treats', () => {
    open('habit-plate');
    const kinds: string[] = [];
    for (let i = 0; i < 8; i++) {
      const food = currentFood();
      kinds.push(food.kind);
      fireEvent.click(choice(food.kind));
      act(() => void vi.advanceTimersByTime(2000));
    }
    expect(kinds.filter((k) => k === 'daily')).toHaveLength(4);
    expect(kinds.filter((k) => k === 'treat')).toHaveLength(4);
    expect(say()).toMatch(/Well sorted/);
    fireEvent.click(screen.getByRole('button', { name: 'Again!' }));
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });
});

describe('Recycle sort', () => {
  const current = () => RUBBISH.find((r) => r.name === document.querySelector('.plate-food b')!.textContent)!;
  const bin = (key: string) => screen.getByRole('button', { name: BINS.find((b) => b.key === key)!.name });

  it('wrong bin gets a hint, the right bin gives a fact, and all six finish it', () => {
    open('habit-recycle');
    const first = current();
    const wrongBin = BINS.find((b) => b.key !== first.bin)!;
    fireEvent.click(screen.getByRole('button', { name: wrongBin.name }));
    expect(say()).toBe('Not that bin. Try another one!');
    expect(current()).toBe(first);
    for (let i = 0; i < 6; i++) {
      const item = current();
      fireEvent.click(bin(item.bin));
      expect(say()).toBe(item.fact);
      act(() => void vi.advanceTimersByTime(2100));
    }
    expect(say()).toMatch(/All sorted/);
  });
});

describe('Grow a plant', () => {
  const water = () => screen.getByRole('button', { name: /Give water/ });
  const sun = () => screen.getByRole('button', { name: /Give sunlight/ });

  it('needs both water and sunlight to grow, in either order, and shows each stage', () => {
    open('habit-grow');
    expect(say()).toBe(PLANT_STAGES[0]!.fact);
    fireEvent.click(water());
    act(() => void vi.advanceTimersByTime(1000));
    expect(say()).toBe(PLANT_STAGES[0]!.fact); // water alone is not enough
    fireEvent.click(sun());
    act(() => void vi.advanceTimersByTime(800));
    expect(say()).toBe(PLANT_STAGES[1]!.fact);
    fireEvent.click(sun());
    fireEvent.click(water());
    act(() => void vi.advanceTimersByTime(800));
    expect(say()).toBe(PLANT_STAGES[2]!.fact);
  });

  it('reaches a flower, then offers another seed', () => {
    open('habit-grow');
    for (let i = 0; i < 3; i++) {
      act(() => {
        water().click();
        sun().click();
      });
      act(() => void vi.advanceTimersByTime(800));
    }
    expect(say()).toBe(PLANT_STAGES[3]!.fact);
    expect(screen.queryByRole('button', { name: /Give water/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Plant another seed' }));
    expect(say()).toBe(PLANT_STAGES[0]!.fact);
  });
});

describe('Cross safely', () => {
  const crossBtn = () => screen.getByRole('button', { name: 'Cross the road' });
  const lamp = () => screen.getByRole('img', { name: /light/ }).getAttribute('aria-label');

  it('red means wait, green means look first, and then it is safe to cross', () => {
    open('habit-road');
    expect(lamp()).toBe('Red light. Stop');
    fireEvent.click(crossBtn());
    expect(say()).toBe('Wait for the green light. Stop means stop!');
    act(() => void vi.advanceTimersByTime(RED_MS + 50));
    expect(lamp()).toBe('Green light. Go');
    fireEvent.click(crossBtn());
    expect(say()).toBe('Look left and look right first!');
    fireEvent.click(screen.getByRole('button', { name: /Look left/ }));
    fireEvent.click(crossBtn());
    expect(say()).toBe('Look left and look right first!');
    fireEvent.click(screen.getByRole('button', { name: /Look right/ }));
    fireEvent.click(crossBtn());
    expect(say()).toMatch(/You crossed safely/);
    expect(document.querySelector('.walker.crossed')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Again!' }));
    expect(document.querySelector('.walker.crossed')).toBeNull();
  });

  it('the light keeps changing by itself and shows words, not only colours', () => {
    open('habit-road');
    expect(screen.getByText('STOP')).toBeTruthy();
    act(() => void vi.advanceTimersByTime(RED_MS + 50));
    expect(screen.getByText('GO')).toBeTruthy();
    act(() => void vi.advanceTimersByTime(GREEN_MS + 50));
    expect(screen.getByText('STOP')).toBeTruthy();
  });

  it('stops the light when the child leaves, so nothing runs in the background', () => {
    const { unmount } = render(<HabitsScreen id="habit-road" profile={kid()} onOpen={() => {}} onClose={() => {}} />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('the facts and pictures', () => {
  it('every picture has a drawing, and every item is sorted somewhere real', () => {
    const emoji = [
      ...HABIT_ACTIVITIES.map((a) => a.emoji),
      ...WASH_STEPS.map((s) => s.emoji),
      ...FOODS.map((f) => f.emoji),
      ...RUBBISH.map((r) => r.emoji),
      ...PLANT_STAGES.map((p) => p.emoji),
      '👈', '👉', '🚶', '💧', '🌞', '🥗', '🍬', '♻',
    ];
    for (const e of emoji) expect(picSrc(e), e).not.toBeNull();
    const binKeys = new Set(BINS.map((b) => b.key));
    for (const r of RUBBISH) expect(binKeys.has(r.bin), r.name).toBe(true);
    for (const b of BINS) expect(RUBBISH.some((r) => r.bin === b.key), b.name).toBe(true);
    expect(FOODS.filter((f) => f.kind === 'daily').length).toBeGreaterThanOrEqual(4);
    expect(FOODS.filter((f) => f.kind === 'treat').length).toBeGreaterThanOrEqual(4);
    expect(SCRUB_SECONDS).toBe(20);
  });
});

describe('the entry on the Learn page', () => {
  it('is offered to children from age 3, and not to the youngest', () => {
    const onStart = vi.fn();
    const { unmount } = render(<LearnHome profile={kid()} onStartTopic={onStart} />);
    const extras = screen.getByRole('region', { name: 'Challenges and extras' });
    fireEvent.click(within(extras).getByRole('button', { name: /Good habits/ }));
    expect(onStart).toHaveBeenCalledWith(HABITS_PAGE_ID);
    unmount();
    render(<LearnHome profile={kid({ track: 'early', age: 2, ageBand: '2-4' })} onStartTopic={() => {}} />);
    expect(screen.queryByRole('button', { name: /Good habits/ })).toBeNull();
  });
});
