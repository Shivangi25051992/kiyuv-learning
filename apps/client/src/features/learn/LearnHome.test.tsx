import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { CHALLENGE_ID, COURSES_PAGE_ID, TOPIC_LEVEL } from '@kiyuv/content';
import type { KidProfile, TopicProgress } from '@kiyuv/shared';
import { LearnHome } from './LearnHome.js';
import { SubjectsView } from './SubjectsView.js';
import { SUBJECTS_PAGE_ID } from './pages.js';
import { saveRound } from '../play/roundState.js';
import { markActiveToday, markDailyDone } from './dailyState.js';

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
    expect(screen.getByRole('region', { name: 'Your profile' }).textContent).toMatch(/Level 2 of 10 · Busy Farm/);
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
    expect(screen.queryByRole('progressbar', { name: /Mixed Challenge/ })).toBeNull();
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
    // a fixed day, so the day's challenge cannot be the same topic as the one being retried
    render(<LearnHome profile={kid(topics)} now={new Date(2026, 10, 15, 10)} onStartTopic={onStart} />);
    const rec = screen.getByRole('region', { name: 'Recommended for you' });
    expect(within(rec).getAllByRole('button').length).toBeLessThanOrEqual(2);
    fireEvent.click(within(rec).getByRole('button', { name: /3 out of 10/ }));
    expect(onStart).toHaveBeenCalledWith('y-add-m');
  });
});

describe('profile banner', () => {
  it('shows the child, where they are, their rank and a bar toward the next rank', () => {
    render(<LearnHome profile={kid({ 'y-add-e': tp(10) }, { stars: 108, age: 6 })} onStartTopic={() => {}} />);
    const banner = screen.getByRole('region', { name: 'Your profile' });
    expect(within(banner).getByRole('heading', { name: 'Ari' })).toBeTruthy();
    expect(banner.textContent).toMatch(/Age 6 · Level 1 of 10 · Sunny Meadow/);
    expect(within(banner).getByText('Shining Star')).toBeTruthy();
    expect(banner.textContent).toMatch(/1\s*mastered/);
    const bar = within(banner).getByRole('progressbar', { name: 'Stars toward the next rank' });
    expect(bar.getAttribute('aria-valuenow')).toBe('8');
    expect(bar.getAttribute('aria-valuemax')).toBe('50');
    expect(bar.getAttribute('aria-valuetext')).toBe('8 of 50 stars toward Medalist');
  });

  it('counts the days in a row, and shows 0 days for a child who has not started', () => {
    const now = new Date(2026, 10, 12, 10);
    const { unmount } = render(<LearnHome profile={kid()} roundKey="u1:k1" now={now} onStartTopic={() => {}} />);
    expect(within(screen.getByRole('region', { name: 'Your profile' })).getByText('days', { exact: false }).textContent).toMatch(/0/);
    unmount();
    markActiveToday('u1:k1', new Date(2026, 10, 11, 10));
    markActiveToday('u1:k1', now);
    render(<LearnHome profile={kid()} roundKey="u1:k1" now={now} onStartTopic={() => {}} />);
    expect(screen.getByRole('region', { name: 'Your profile' }).textContent).toMatch(/2\s*days/);
  });

  it('says "1 day" for a single day', () => {
    const now = new Date(2026, 10, 12, 10);
    markActiveToday('u1:k1', now);
    render(<LearnHome profile={kid()} roundKey="u1:k1" now={now} onStartTopic={() => {}} />);
    expect(screen.getByRole('region', { name: 'Your profile' }).textContent).toMatch(/1\s*day(?!s)/);
  });

  it('shows a full bar at the top rank', () => {
    render(<LearnHome profile={kid({}, { stars: 999 })} onStartTopic={() => {}} />);
    const bar = screen.getByRole('progressbar', { name: 'Stars toward the next rank' });
    expect(bar.getAttribute('aria-valuetext')).toMatch(/top rank/);
  });
});

describe('daily challenge', () => {
  const now = new Date(2026, 10, 12, 10);

  it('is one card with the challenge of the day, between the next step and the recommendations', () => {
    const onStart = vi.fn();
    const { container } = render(<LearnHome profile={kid()} roundKey="u1:k1" now={now} onStartTopic={onStart} />);
    const card = screen.getByRole('button', { name: /^Daily challenge for Thursday:/ });
    expect(card.textContent).toMatch(/Daily challenge · Thu/);
    expect(card.textContent).toMatch(/5 bonus stars/);
    const order = [...container.querySelectorAll('.upnext, .daily-card, .rec-list')].map((n) => n.className.split(' ')[0]);
    expect(order.slice(0, 2)).toEqual(['upnext', 'daily-card']);
    fireEvent.click(card);
    const pickId = JSON.parse(localStorage.getItem('kiyuv.daily.u1:k1')!).pick.id as string;
    expect(onStart).toHaveBeenCalledWith(pickId);
  });

  it('is the same challenge all day, and shows "done" once it is completed', () => {
    const first = render(<LearnHome profile={kid()} roundKey="u1:k1" now={now} onStartTopic={() => {}} />);
    const name = first.container.querySelector('.daily-body b')!.textContent;
    first.unmount();
    markDailyDone('u1:k1', now);
    const second = render(<LearnHome profile={kid({ 'y-add-e': tp(9) })} roundKey="u1:k1" now={now} onStartTopic={() => {}} />);
    expect(second.container.querySelector('.daily-card.done')).not.toBeNull();
    expect(screen.getByText('Done for today!')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Daily challenge for/ })).toBeNull();
    expect(name!.length).toBeGreaterThan(0);
  });

  it('is a new challenge the next day', () => {
    markDailyDone('u1:k1', now);
    const tomorrow = new Date(2026, 10, 13, 10);
    render(<LearnHome profile={kid()} roundKey="u1:k1" now={tomorrow} onStartTopic={() => {}} />);
    expect(screen.getByRole('button', { name: /^Daily challenge for Friday:/ })).toBeTruthy();
  });

  it('is not shown to a 2 year old, who has Play time instead', () => {
    render(<LearnHome profile={kid({}, { track: 'early', age: 2, ageBand: '2-4' })} now={now} onStartTopic={() => {}} />);
    expect(screen.queryByText(/Daily challenge/)).toBeNull();
    expect(screen.getAllByText(/Play time/).length).toBeGreaterThan(0);
  });
});

describe('who sees what', () => {
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
