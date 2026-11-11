import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearRound, loadRound, saveRound, type RoundState } from './roundState.js';

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

const question = {
  topicId: 'y-add-e',
  prompt: '2 + 3 = ?',
  options: [
    { value: '5', label: '5' },
    { value: '6', label: '6' },
  ],
  correctValue: '5',
};

const round = (over: Partial<RoundState> = {}): RoundState => ({
  topicId: 'y-add-e', questionIndex: 4, sessionCorrect: 3, question, wrongTries: 1, helpStage: 'none', ...over,
});

describe('saved round', () => {
  it('round-trips, and only for the same topic', () => {
    saveRound('u1:k1', round());
    expect(loadRound('u1:k1', 'y-add-e')).toEqual(round());
    expect(loadRound('u1:k1', 'y-sub-e')).toBeNull();
    expect(loadRound('u1:k2', 'y-add-e')).toBeNull();
  });

  it('can say "make a new question"', () => {
    saveRound('u1:k1', round({ question: null }));
    expect(loadRound('u1:k1', 'y-add-e')?.question).toBeNull();
  });

  it('keeps a separate round for each topic of the same child', () => {
    saveRound('u1:k1', round());
    saveRound('u1:k1', round({ topicId: 'y-sub-e', questionIndex: 7 }));
    expect(loadRound('u1:k1', 'y-add-e')?.questionIndex).toBe(4);
    expect(loadRound('u1:k1', 'y-sub-e')?.questionIndex).toBe(7);
  });

  it('clears only the round asked for', () => {
    saveRound('u1:k1', round());
    saveRound('u1:k2', round());
    clearRound('u1:k1', 'y-add-e');
    expect(loadRound('u1:k1', 'y-add-e')).toBeNull();
    expect(loadRound('u1:k2', 'y-add-e')).not.toBeNull();
  });

  it('forgets a round after two weeks', () => {
    vi.useFakeTimers();
    saveRound('u1:k1', round());
    vi.advanceTimersByTime(13 * 24 * 3600 * 1000);
    expect(loadRound('u1:k1', 'y-add-e')).not.toBeNull();
    vi.advanceTimersByTime(2 * 24 * 3600 * 1000);
    expect(loadRound('u1:k1', 'y-add-e')).toBeNull();
  });

  it('refuses anything damaged', () => {
    const bad: unknown[] = [
      round({ questionIndex: 0 }),
      round({ questionIndex: 11 }),
      round({ sessionCorrect: 11 }),
      round({ wrongTries: -1 }),
      round({ helpStage: 'x' as never }),
      round({ question: { ...question, correctValue: 'nope' } }),
      round({ question: { ...question, options: [] } }),
      round({ question: { ...question, prompt: 5 as never } }),
    ];
    for (const b of bad) {
      localStorage.setItem('kiyuv_round:u1:k1:y-add-e', JSON.stringify({ ...(b as object), savedAt: Date.now() }));
      expect(loadRound('u1:k1', 'y-add-e'), JSON.stringify(b)).toBeNull();
    }
    localStorage.setItem('kiyuv_round:u1:k1:y-add-e', 'not json');
    expect(loadRound('u1:k1', 'y-add-e')).toBeNull();
  });
});
