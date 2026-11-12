import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { CHALLENGE_ID, COURSES_PAGE_ID, TOPIC_LEVEL } from '@kiyuv/content';
import type { KidProfile, TopicProgress } from '@kiyuv/shared';
import { LearnHome } from './LearnHome.js';
import { SubjectsView } from './SubjectsView.js';
import { SUBJECTS_PAGE_ID } from './pages.js';
import { saveRound } from '../play/roundState.js';

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

const tp = (b: number): TopicProgress => ({ p: 1, c: b, b, m: b >= 10 });
const kid = (topics: KidProfile['topics'] = {}, over: Partial<KidProfile> = {}): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track: 'primary', stars: 12, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics, resetEpoch: 0, ...over,
});

const upnext = () => document.querySelector('.upnext') as HTMLElement;

describe('Up next', () => {
  it('a new child gets one clear next step with a big Play button', () => {
    const onStart = vi.fn();
    render(<LearnHome profile={kid()} onStartTopic={onStart} />);
    expect(within(upnext()).getByText('Up next')).toBeTruthy();
    expect(within(upnext()).getByRole('heading').textContent).toMatch(/Addition|Add/i);
    fireEvent.click(within(upnext()).getByRole('button', { name: /Play/ }));
    expect(onStart).toHaveBeenCalledWith('y-add-e');
  });

  it('says why it is next, in plain words', () => {
    render(<LearnHome profile={kid()} onStartTopic={() => {}} />);
    expect(upnext().textContent).toMatch(/Score 7 or more out of 10 to clear it/);
  });

  it('moves on to the next topic after one is cleared', () => {
    const onStart = vi.fn();
    render(<LearnHome profile={kid({ 'y-add-e': tp(8) })} onStartTopic={onStart} />);
    fireEvent.click(within(upnext()).getByRole('button', { name: /Play/ }));
    expect(onStart).toHaveBeenCalledWith('y-sub-e');
  });

  it('6 out of 10 is not enough: the same topic comes back as "Try again"', () => {
    const onStart = vi.fn();
    render(<LearnHome profile={kid({ 'y-add-e': tp(6) })} onStartTopic={onStart} />);
    fireEvent.click(within(upnext()).getByRole('button', { name: /Try again/ }));
    expect(onStart).toHaveBeenCalledWith('y-add-e');
  });

  it('offers "Continue" with the question number when a round was left half way', () => {
    saveRound('u1:k1', {
      topicId: 'y-add-e', questionIndex: 4, sessionCorrect: 3, question: null, wrongTries: 0, helpStage: 'none', asked: [],
    });
    render(<LearnHome profile={kid()} roundKey="u1:k1" onStartTopic={() => {}} />);
    expect(within(upnext()).getByRole('button', { name: /Continue · Question 4/ })).toBeTruthy();
  });

  it('celebrates when every level is cleared', () => {
    const all = Object.fromEntries(Object.keys(TOPIC_LEVEL.primary).map((id) => [id, tp(10)]));
    render(<LearnHome profile={kid(all)} onStartTopic={() => {}} />);
    expect(screen.getByRole('heading', { name: 'You cleared all 10 levels!' })).toBeTruthy();
    expect(within(upnext()).queryByRole('button')).toBeNull();
  });
});

describe('the adventure path', () => {
  it('lists ten levels, the current one is open and marked "You are here"', () => {
    render(<LearnHome profile={kid()} onStartTopic={() => {}} />);
    const path = screen.getByRole('list', { name: /Adventure path/ });
    expect(within(path).getAllByRole('button', { name: /^Level \d+,/ })).toHaveLength(10);
    expect(within(path).getByText('You are here')).toBeTruthy();
    const level1 = within(path).getByRole('button', { name: /^Level 1, Sunny Meadow/ });
    expect(level1.getAttribute('aria-expanded')).toBe('true');
    expect(within(path).getByRole('button', { name: /^Level 2,/ }).getAttribute('aria-expanded')).toBe('false');
  });

  it('locked levels say exactly why', () => {
    render(<LearnHome profile={kid()} onStartTopic={() => {}} />);
    const path = screen.getByRole('list', { name: /Adventure path/ });
    const head = within(path).getByRole('button', { name: /^Level 3,/ });
    expect(head.textContent).toMatch(/Locked/);
    fireEvent.click(head);
    expect(within(path).getByText('Finish Level 2 to unlock this place.')).toBeTruthy();
  });

  it('tapping a level peeks inside it, and tapping again closes it', () => {
    render(<LearnHome profile={kid()} onStartTopic={() => {}} />);
    const path = screen.getByRole('list', { name: /Adventure path/ });
    const head = within(path).getByRole('button', { name: /^Level 3,/ });
    fireEvent.click(head);
    expect(head.getAttribute('aria-expanded')).toBe('true');
    expect(within(path).getByRole('button', { name: /^Level 1,/ }).getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(head);
    expect(head.getAttribute('aria-expanded')).toBe('false');
  });

  it('a locked topic cannot be started and explains itself', () => {
    const onStart = vi.fn();
    render(<LearnHome profile={kid()} onStartTopic={onStart} />);
    const path = screen.getByRole('list', { name: /Adventure path/ });
    fireEvent.click(within(path).getByRole('button', { name: /^Level 3,/ }));
    const locked = within(path).getAllByRole('button').filter((b) => (b as HTMLButtonElement).disabled);
    expect(locked.length).toBeGreaterThan(0);
    expect(locked[0]!.getAttribute('aria-label')).toMatch(/Locked. Clear the topic before it/);
    fireEvent.click(locked[0]!);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('clearing every topic of a level finishes it and moves "You are here" to the next', () => {
    render(<LearnHome profile={kid({ 'y-add-e': tp(8), 'y-sub-e': tp(7) })} onStartTopic={() => {}} />);
    const path = screen.getByRole('list', { name: /Adventure path/ });
    expect(within(path).getByRole('button', { name: /^Level 1,/ }).textContent).toMatch(/All done/);
    expect(within(path).getByRole('button', { name: /^Level 2,/ }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/You are in Level 2/)).toBeTruthy();
  });

  it('keeps a topic open that was already played, and starts it when tapped', () => {
    const onStart = vi.fn();
    render(<LearnHome profile={kid({ 'y-mul-h': tp(3) })} onStartTopic={onStart} />);
    const path = screen.getByRole('list', { name: /Adventure path/ });
    fireEvent.click(within(path).getByRole('button', { name: /^Level 9,/ }));
    const row = within(path).getAllByRole('button').find((b) => /Multiplication.*Best 3 out of 10/.test(b.getAttribute('aria-label') ?? ''));
    expect(row).toBeTruthy();
    fireEvent.click(row!);
    expect(onStart).toHaveBeenCalledWith('y-mul-h');
  });
});

describe('challenges and extras', () => {
  it('the Mixed Challenge is locked at first, shows progress and says what unlocks it', () => {
    render(<LearnHome profile={kid({ 'y-add-e': tp(8), 'y-sub-e': tp(8) })} onStartTopic={() => {}} />);
    const bar = screen.getByRole('progressbar', { name: /Mixed Challenge/ });
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(bar.getAttribute('aria-valuemax')).toBe('3');
    expect(screen.getByText(/Clear 1 more topic to unlock it/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Mixed Challenge/ })).toBeNull();
  });

  it('the Mixed Challenge starts once three topics are cleared', () => {
    const onStart = vi.fn();
    const topics = { 'y-add-e': tp(8), 'y-sub-e': tp(8), 'y-mul-e': tp(8) };
    render(<LearnHome profile={kid(topics)} onStartTopic={onStart} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    const extras = screen.getByRole('region', { name: 'Challenges and extras' });
    fireEvent.click(within(extras).getByRole('button', { name: /Mixed Challenge/ }));
    expect(onStart).toHaveBeenCalledWith(CHALLENGE_ID);
  });

  it('opens the bonus courses and the subject browser', () => {
    const onStart = vi.fn();
    render(<LearnHome profile={kid()} onStartTopic={onStart} />);
    const extras = screen.getByRole('region', { name: 'Challenges and extras' });
    fireEvent.click(within(extras).getByRole('button', { name: /Bonus courses/ }));
    expect(onStart).toHaveBeenCalledWith(COURSES_PAGE_ID);
    fireEvent.click(within(extras).getByRole('button', { name: /Browse by subject/ }));
    expect(onStart).toHaveBeenCalledWith(SUBJECTS_PAGE_ID);
  });

  it('recommends a topic to retry and starts it', () => {
    const onStart = vi.fn();
    const topics = { 'y-add-e': tp(8), 'y-sub-e': tp(8), 'y-mul-e': tp(8), 'y-add-m': tp(3) };
    render(<LearnHome profile={kid(topics)} onStartTopic={onStart} />);
    const rec = screen.getByRole('region', { name: 'Recommended for you' });
    expect(within(rec).getAllByRole('button').length).toBeLessThanOrEqual(2);
    fireEvent.click(within(rec).getByRole('button', { name: /3 out of 10/ }));
    expect(onStart).toHaveBeenCalledWith('y-add-m');
  });
});

describe('who sees what', () => {
  it('shows stars and a streak only when there is one', () => {
    const { unmount } = render(<LearnHome profile={kid({}, { stars: 108, streak: 0 })} onStartTopic={() => {}} />);
    expect(screen.getByText('108')).toBeTruthy();
    expect(screen.queryByText(/in a row/)).toBeNull();
    unmount();
    render(<LearnHome profile={kid({}, { stars: 1, streak: 4 })} onStartTopic={() => {}} />);
    expect(screen.getByText(/in a row/)).toBeTruthy();
  });

  it('the little ones get Play time first; older children do not', () => {
    const onStart = vi.fn();
    const { container, unmount } = render(
      <LearnHome profile={kid({}, { track: 'early', age: 2, ageBand: '2-4' })} onStartTopic={onStart} />,
    );
    expect((container.querySelector('.learn2 > :first-child') as HTMLElement).textContent).toMatch(/Play time/);
    unmount();
    render(<LearnHome profile={kid()} onStartTopic={() => {}} />);
    expect(screen.queryByText('Play time')).toBeNull();
  });
});

describe('Browse by subject', () => {
  it('shows every subject, goes back, and still locks topics that are not open', () => {
    const onBack = vi.fn();
    const onStart = vi.fn();
    render(<SubjectsView profile={kid()} onBack={onBack} onStartTopic={onStart} />);
    expect(screen.getByRole('heading', { name: 'Browse by subject' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(3);
    const locked = screen.getAllByRole('button').filter((b) => (b as HTMLButtonElement).disabled);
    expect(locked.length).toBeGreaterThan(10);
    fireEvent.click(screen.getByRole('button', { name: /Back/ }));
    expect(onBack).toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button').find((b) => /Difficulty/.test(b.getAttribute('aria-label') ?? ''))!);
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
