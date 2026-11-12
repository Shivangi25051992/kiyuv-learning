/**
 * What is remembered, on this device only, about each child's days: the day streak,
 * today's daily challenge and whether it is done. It holds no names or personal details.
 * (The bonus stars from a daily challenge go into the child's normal, synced star count.)
 */
export interface DailyState {
  /** The last day the child learned something, as YYYY-MM-DD. */
  lastActive?: string;
  /** How many days in a row, counting that last day. */
  dayStreak?: number;
  /** The day the daily challenge was completed. */
  doneDate?: string;
  /** Today's challenge, kept so it never changes during the day. */
  pick?: { date: string; id: string };
}

const slot = (key: string): string => `kiyuv.daily.${key}`;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** The day, in the child's own time zone, as YYYY-MM-DD. */
export function dateKey(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

function yesterdayKey(now: Date): string {
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return dateKey(y);
}

export function loadDaily(key: string): DailyState {
  try {
    const raw = storage()?.getItem(slot(key));
    if (!raw) return {};
    const v = JSON.parse(raw) as Record<string, unknown>;
    const out: DailyState = {};
    if (typeof v.lastActive === 'string') out.lastActive = v.lastActive;
    if (typeof v.dayStreak === 'number' && v.dayStreak >= 0) out.dayStreak = Math.floor(v.dayStreak);
    if (typeof v.doneDate === 'string') out.doneDate = v.doneDate;
    const pick = v.pick as { date?: unknown; id?: unknown } | undefined;
    if (pick && typeof pick.date === 'string' && typeof pick.id === 'string') out.pick = { date: pick.date, id: pick.id };
    return out;
  } catch {
    return {};
  }
}

export function saveDaily(key: string, state: DailyState): void {
  try {
    storage()?.setItem(slot(key), JSON.stringify(state));
  } catch {
    // Without storage the streak and the daily challenge simply start fresh each visit.
  }
}

/** Counts today as a day of learning. Safe to call often: it only writes once a day. */
export function markActiveToday(key: string, now: Date = new Date()): DailyState {
  const state = loadDaily(key);
  const today = dateKey(now);
  if (state.lastActive === today) return state;
  const continues = state.lastActive === yesterdayKey(now);
  const next: DailyState = { ...state, lastActive: today, dayStreak: continues ? (state.dayStreak ?? 0) + 1 : 1 };
  saveDaily(key, next);
  return next;
}

/** Days in a row. It is still alive if the child learned yesterday, and gone after a missed day. */
export function dayStreakOf(state: DailyState, now: Date = new Date()): number {
  if (!state.lastActive || !state.dayStreak) return 0;
  return state.lastActive === dateKey(now) || state.lastActive === yesterdayKey(now) ? state.dayStreak : 0;
}

export function isDailyDone(state: DailyState, now: Date = new Date()): boolean {
  return state.doneDate === dateKey(now);
}

export function markDailyDone(key: string, now: Date = new Date()): DailyState {
  const next: DailyState = { ...loadDaily(key), doneDate: dateKey(now) };
  saveDaily(key, next);
  return next;
}
