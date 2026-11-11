import type { GeneratedQuestion } from '@kiyuv/content';

/**
 * A round in progress, kept in session storage (this browser tab only) so a page
 * refresh puts the child back on the same question. It holds only the question,
 * the counts for this round and the "ask a parent" step. Nothing personal.
 */
export type HelpStage = 'none' | 'blocked' | 'parent';

export interface RoundState {
  topicId: string;
  /** 1 to 10. */
  questionIndex: number;
  sessionCorrect: number;
  /** Null means "make a new question" (the last one was already answered). */
  question: GeneratedQuestion | null;
  wrongTries: number;
  helpStage: HelpStage;
}

const KEY_PREFIX = 'kiyuv_round:';
const QUESTIONS_PER_ROUND = 10;

function storage(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

export function saveRound(key: string, state: RoundState): void {
  try {
    storage()?.setItem(`${KEY_PREFIX}${key}`, JSON.stringify(state));
  } catch {
    // storage unavailable: a refresh then returns to the topic list
  }
}

export function clearRound(key: string): void {
  try {
    storage()?.removeItem(`${KEY_PREFIX}${key}`);
  } catch {
    // nothing to clear
  }
}

export function clearAllRounds(): void {
  try {
    const store = storage();
    if (!store) return;
    for (let i = store.length - 1; i >= 0; i--) {
      const k = store.key(i);
      if (k && k.startsWith(KEY_PREFIX)) store.removeItem(k);
    }
  } catch {
    // nothing to clear
  }
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

function validQuestion(q: unknown): q is GeneratedQuestion {
  if (typeof q !== 'object' || q === null) return false;
  const x = q as Partial<GeneratedQuestion>;
  if (typeof x.prompt !== 'string' || typeof x.topicId !== 'string') return false;
  if (typeof x.correctValue !== 'string' || !Array.isArray(x.options)) return false;
  if (x.options.length < 2 || x.options.length > 8) return false;
  const values = x.options.map((o) => (o as { value?: unknown }).value);
  if (!x.options.every((o) => typeof (o as { value?: unknown }).value === 'string' && typeof (o as { label?: unknown }).label === 'string')) {
    return false;
  }
  return values.includes(x.correctValue);
}

/** The saved round for this topic, or null if there is none, or it is not valid. */
export function loadRound(key: string, topicId: string): RoundState | null {
  try {
    const raw = storage()?.getItem(`${KEY_PREFIX}${key}`);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<RoundState>;
    if (v.topicId !== topicId) return null;
    if (!isInt(v.questionIndex, 1, QUESTIONS_PER_ROUND)) return null;
    if (!isInt(v.sessionCorrect, 0, QUESTIONS_PER_ROUND)) return null;
    if (!isInt(v.wrongTries, 0, 50)) return null;
    if (v.helpStage !== 'none' && v.helpStage !== 'blocked' && v.helpStage !== 'parent') return null;
    if (v.question !== null && !validQuestion(v.question)) return null;
    return {
      topicId,
      questionIndex: v.questionIndex,
      sessionCorrect: v.sessionCorrect,
      question: v.question ?? null,
      wrongTries: v.wrongTries,
      helpStage: v.helpStage,
    };
  } catch {
    return null;
  }
}
