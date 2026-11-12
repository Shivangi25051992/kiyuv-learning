import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';

const motion = { reduced: false };
vi.mock('../../lib/effects.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/effects.js')>();
  return { ...actual, prefersReducedMotion: () => motion.reduced, confettiBlast: () => {}, starBurst: () => {} };
});
// One fixed question, so the right answer is always "A".
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

import { CompanionProvider, useCompanion } from './CompanionProvider.js';
import { CompanionSettings } from './CompanionSettings.js';
import { partOfDay, reactionFor } from './lines.js';
import { LearnHome } from '../learn/LearnHome.js';
import { ToddlerScreen } from '../toddler/ToddlerScreen.js';
import { TopicRunner } from '../play/TopicRunner.js';

const kid = (over: Partial<KidProfile> = {}): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track: 'primary', stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0, ...over,
});

beforeEach(() => {
  localStorage.clear();
  motion.reduced = false;
  // Always the first line in each list, so the wording in these tests is predictable.
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const actor = () => document.querySelector('.companion-actor') as HTMLElement | null;
const bubble = () => document.querySelector('.companion-bubble')?.textContent ?? null;

describe('what Kiyu says', () => {
  const first = () => 0;

  it('greets by the time of day, in the child\'s name', () => {
    expect(partOfDay(8)).toBe('morning');
    expect(partOfDay(13)).toBe('afternoon');
    expect(partOfDay(18)).toBe('evening');
    expect(partOfDay(22)).toBe('night');
    expect(partOfDay(3)).toBe('night');
    expect(reactionFor('greet', { name: 'Ari', hour: 8 }, first)).toMatchObject({ line: 'Good morning, Ari!', mood: 'wave', move: 'home' });
    expect(reactionFor('greet', { name: 'Ari', hour: 14 }, first).line).toBe('Hello, Ari!');
  });

  it('is sleepy late at night and nudges toward bed, never toward more screen time', () => {
    const r = reactionFor('greet', { name: 'Ari', hour: 22, days: 9 }, first);
    expect(r.mood).toBe('sleepy');
    expect(r.line).toMatch(/sleep|bed/);
    expect(r.line).not.toMatch(/streak/);
  });

  it('mentions a streak of three days or more in the daytime only', () => {
    expect(reactionFor('greet', { name: 'Ari', hour: 9, days: 4 }, first).line).toMatch(/4-day streak/);
    expect(reactionFor('greet', { name: 'Ari', hour: 9, days: 2 }, first).line).not.toMatch(/streak/);
  });

  it('uses "friend" when there is no name', () => {
    expect(reactionFor('finish-great', {}, first).line).toBe('Brilliant, friend!');
    expect(reactionFor('finish-great', { name: '  ' }, first).line).toBe('Brilliant, friend!');
  });

  it('runs across the screen for the big moments, and to the tapped thing in Play time', () => {
    for (const e of ['streak3', 'streak5', 'streak10', 'finish-great', 'finish-ok', 'level-up', 'daily-done', 'habit-done'] as const) {
      const r = reactionFor(e, { name: 'Ari' }, first);
      expect(r.move, e).toBe('across');
      expect(r.line, e).toBeTruthy();
      expect(r.ms, e).toBeGreaterThan(2000);
    }
    expect(reactionFor('play-tap', {}, first)).toMatchObject({ line: null, move: 'to' });
  });

  it('never says anything unkind, and never sounds sad', () => {
    const words = ['wrong', 'bad', 'fail', 'sad', 'stupid', 'lose', 'lost'];
    for (const e of ['greet', 'streak3', 'streak5', 'streak10', 'finish-great', 'finish-ok', 'level-up', 'daily-done', 'habit-done'] as const) {
      for (let i = 0; i < 6; i++) {
        const r = reactionFor(e, { name: 'Ari', hour: (i * 5) % 24, days: i }, () => i / 6);
        for (const w of words) expect((r.line ?? '').toLowerCase()).not.toContain(w);
      }
    }
  });
});

const Trigger: React.FC<{ event: Parameters<ReturnType<typeof useCompanion>['react']>[0]; opts?: Parameters<ReturnType<typeof useCompanion>['react']>[1] }> = ({ event, opts }) => {
  const { react } = useCompanion();
  return <button onClick={() => react(event, opts)}>go</button>;
};

describe('Kiyu on screen', () => {
  it('appears with its words, then fades and is gone', () => {
    render(<CompanionProvider><Trigger event="streak3" opts={{ ctx: { name: 'Ari' } }} /></CompanionProvider>);
    expect(actor()).toBeNull();
    fireEvent.click(screen.getByText('go'));
    expect(actor()).not.toBeNull();
    expect(actor()!.className).toMatch(/move-across/);
    expect(bubble()).toMatch(/in a row|Three/);
    expect(screen.getByRole('status').textContent).toBe(bubble());
    act(() => void vi.advanceTimersByTime(3100));
    expect(actor()!.className).toMatch(/leaving/);
    act(() => void vi.advanceTimersByTime(400));
    expect(actor()).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('never takes a tap: taps go straight through to what is underneath', () => {
    render(<CompanionProvider><Trigger event="streak3" /></CompanionProvider>);
    fireEvent.click(screen.getByText('go'));
    // the layer is not a button or a link, so nothing in it can be focused or pressed
    expect(document.querySelector('.companion button, .companion a, .companion [tabindex]')).toBeNull();
    // and the stylesheet lets every tap through, on the layer and on Kiyu itself
    const css = readFileSync('apps/client/src/features/companion/companion.css', 'utf8');
    const rule = (selector: string) => new RegExp(selector.replace(/[.]/g, '[.]') + '\\s*\\{[^}]*pointer-events:\\s*none').test(css);
    expect(rule('.companion')).toBe(true);
    expect(rule('.companion-actor')).toBe(true);
    expect(/pointer-events:\s*auto/.test(css)).toBe(false);
  });

  it('says nothing and shows nothing when a parent turns Kiyu off, and remembers it', () => {
    render(
      <CompanionProvider>
        <CompanionSettings />
        <Trigger event="streak3" />
      </CompanionProvider>,
    );
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.checked).toBe(true);
    fireEvent.click(screen.getByText('go'));
    expect(actor()).not.toBeNull();
    fireEvent.click(box);
    expect(box.checked).toBe(false);
    expect(actor()).toBeNull();
    expect(localStorage.getItem('kiyuv.companion')).toBe('0');
    fireEvent.click(screen.getByText('go'));
    expect(actor()).toBeNull();
    cleanup();
    render(<CompanionProvider><CompanionSettings /></CompanionProvider>);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });

  it('a greeting is shown once while the app is open, not every time', () => {
    render(<CompanionProvider><Trigger event="greet" opts={{ once: true, ctx: { name: 'Ari', hour: 9 } }} /></CompanionProvider>);
    fireEvent.click(screen.getByText('go'));
    expect(bubble()).toBe('Good morning, Ari!');
    act(() => void vi.advanceTimersByTime(6000));
    expect(actor()).toBeNull();
    fireEvent.click(screen.getByText('go'));
    expect(actor()).toBeNull();
  });

  it('runs to a tapped thing, but only one run at a time', () => {
    vi.setSystemTime(new Date(2026, 10, 12, 10, 0, 0));
    render(<CompanionProvider><Trigger event="play-tap" opts={{ at: { x: 120, y: 300 } }} /></CompanionProvider>);
    fireEvent.click(screen.getByText('go'));
    expect(actor()!.className).toMatch(/move-to/);
    expect(actor()!.style.getPropertyValue('--tx')).toBe('120');
    const first = actor();
    fireEvent.click(screen.getByText('go'));
    expect(actor()).toBe(first); // too soon: ignored
    vi.setSystemTime(new Date(2026, 10, 12, 10, 0, 5));
    fireEvent.click(screen.getByText('go'));
    expect(actor()).not.toBe(first);
  });

  it('with reduced motion Kiyu does not run: words stay in a corner, wordless runs are skipped', () => {
    motion.reduced = true;
    render(
      <CompanionProvider>
        <Trigger event="streak3" />
        <Trigger event="play-tap" opts={{ at: { x: 10, y: 10 } }} />
      </CompanionProvider>,
    );
    fireEvent.click(screen.getAllByText('go')[1]!);
    expect(actor()).toBeNull();
    fireEvent.click(screen.getAllByText('go')[0]!);
    expect(actor()!.className).toMatch(/move-home/);
  });
});

describe('where Kiyu shows up', () => {
  it('greets the child on the Learn page', () => {
    render(
      <CompanionProvider>
        <LearnHome profile={kid()} now={new Date(2026, 10, 12, 9, 0)} onStartTopic={() => {}} />
      </CompanionProvider>,
    );
    expect(bubble()).toBe('Good morning, Ari!');
    expect(actor()!.className).toMatch(/above-tabbar/);
  });

  it('runs to whatever a little one taps in Play time', () => {
    render(
      <CompanionProvider>
        <ToddlerScreen id="play-animals" profile={kid({ track: 'early', age: 2, ageBand: '2-4' })} onOpen={() => {}} onClose={() => {}} />
      </CompanionProvider>,
    );
    expect(actor()).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cow' }));
    expect(actor()!.className).toMatch(/move-to/);
  });

  const Live: React.FC<{ updates: KidProfile[] }> = ({ updates }) => {
    const [profile, setProfile] = React.useState(kid());
    return (
      <CompanionProvider>
        <TopicRunner
          profile={profile}
          topicId="y-add-e"
          onUpdateProfile={(p) => {
            updates.push(p);
            setProfile(p);
          }}
          onExitToMap={() => {}}
        />
      </CompanionProvider>
    );
  };
  const answer = (n: number) => {
    for (let i = 0; i < n; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'A' }));
      act(() => void vi.advanceTimersByTime(1300));
    }
  };

  it('cheers three right answers in a row, and again at the end of the round', () => {
    render(<Live updates={[]} />);
    answer(2);
    expect(actor()).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(bubble()).toMatch(/3 in a row|Three/);
    act(() => void vi.advanceTimersByTime(1300));
    answer(7);
    expect(document.querySelector('.finish')).not.toBeNull();
    expect(bubble()).toMatch(/Brilliant, Ari|star/);
  });

  it('is quiet for a wrong answer: no running, no words (the question says it kindly)', () => {
    render(<Live updates={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(actor()).toBeNull();
  });
});
