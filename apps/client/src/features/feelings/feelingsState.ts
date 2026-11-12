import { dateKey } from '../learn/dailyState.js';
import { feelingOf, type FeelingKey } from './feelings.js';

/**
 * Today's answer to the check-in, kept on this device only, per child. Only the day and the
 * feeling are stored: no text, no name, no history beyond today.
 */
interface Saved {
  date: string;
  /** A feeling, or "skip" when the child chose "Not now". */
  value: FeelingKey | 'skip';
}

const slot = (key: string): string => `kiyuv.feeling.${key}`;
const SWITCH = 'kiyuv.feelings';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function read(key: string, now: Date): Saved | null {
  try {
    const raw = storage()?.getItem(slot(key));
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Saved>;
    if (v.date !== dateKey(now)) return null;
    if (v.value === 'skip' || feelingOf(v.value)) return v as Saved;
    return null;
  } catch {
    return null;
  }
}

/** The feeling chosen today, or null (none yet, or "Not now"). */
export function feelingToday(key: string, now: Date = new Date()): FeelingKey | null {
  const v = read(key, now);
  return v && v.value !== 'skip' ? v.value : null;
}

/** True once the child has answered, or chosen "Not now", today. */
export function answeredToday(key: string, now: Date = new Date()): boolean {
  return read(key, now) !== null;
}

export function saveFeeling(key: string, value: FeelingKey | 'skip', now: Date = new Date()): void {
  try {
    storage()?.setItem(slot(key), JSON.stringify({ date: dateKey(now), value } satisfies Saved));
  } catch {
    // Without storage the question is simply asked again next time.
  }
}

/** A parent can turn the daily check-in off. It is on by default. */
export function feelingsEnabled(): boolean {
  try {
    return storage()?.getItem(SWITCH) !== '0';
  } catch {
    return true;
  }
}

export function setFeelingsEnabled(on: boolean): void {
  try {
    storage()?.setItem(SWITCH, on ? '1' : '0');
  } catch {
    // The choice then lasts only until the app is closed.
  }
}
