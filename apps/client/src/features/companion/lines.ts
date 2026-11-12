import type { MascotMood } from '../../ui/Mascot.js';

/**
 * What Kiyu, the companion, says and does for each thing that happens.
 * The words are short, warm and about effort, never about being wrong. Kiyu is never sad,
 * and never makes a child feel bad for stopping.
 */
export type CompanionEvent =
  | 'greet'
  | 'streak3'
  | 'streak5'
  | 'streak10'
  | 'finish-great'
  | 'finish-ok'
  | 'level-up'
  | 'daily-done'
  | 'habit-done'
  | 'play-tap';

export interface LineContext {
  /** The child's nickname. */
  name?: string;
  /** The hour of the day, 0 to 23. */
  hour?: number;
  /** Days in a row the child has learned. */
  days?: number;
}

/** How Kiyu moves: stays in a corner, runs across the screen, or runs to something that was tapped. */
export type CompanionMove = 'home' | 'across' | 'to';

export interface Reaction {
  mood: MascotMood;
  line: string | null;
  move: CompanionMove;
  /** How long Kiyu stays on screen, in milliseconds. */
  ms: number;
}

const pickOne = <T,>(items: readonly T[], rand: () => number): T => items[Math.floor(rand() * items.length)]!;

const withName = (text: string, name: string): string => text.split('{name}').join(name);

/** The part of the day, for a greeting that fits. */
export function partOfDay(hour: number): 'night' | 'morning' | 'afternoon' | 'evening' {
  if (hour < 5 || hour >= 21) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const GREETINGS = {
  morning: ['Good morning, {name}!', 'Rise and shine, {name}!'],
  afternoon: ['Hello, {name}!', 'Good afternoon, {name}!'],
  evening: ['Good evening, {name}!', 'Hi {name}! Ready for a quick game?'],
  night: ['It is getting late, {name}. One short game, then sleep!', 'Yawn... a quick game and then bed, {name}!'],
} as const;

const PLAY_TAP_MOODS: readonly MascotMood[] = ['excited', 'laugh', 'wink', 'surprised'];

const LINES: Record<Exclude<CompanionEvent, 'greet' | 'play-tap'>, { mood: MascotMood; lines: readonly string[]; ms: number; move: CompanionMove }> = {
  streak3: { mood: 'excited', lines: ['3 in a row! Wow!', 'Three! You are on fire!'], ms: 3000, move: 'across' },
  streak5: { mood: 'laugh', lines: ['5 in a row! Amazing!', 'High five! Five in a row!'], ms: 3200, move: 'across' },
  streak10: { mood: 'cheer', lines: ['10 in a row! You are a superstar!'], ms: 3600, move: 'across' },
  'finish-great': { mood: 'cheer', lines: ['Brilliant, {name}!', 'Wow! You are a star!'], ms: 3600, move: 'across' },
  'finish-ok': { mood: 'proud', lines: ['Great work, {name}!', 'You should be proud!'], ms: 3400, move: 'across' },
  'level-up': { mood: 'cheer', lines: ['Level cleared! On to the next place!'], ms: 3800, move: 'across' },
  'daily-done': { mood: 'love', lines: ['Daily challenge done! Bonus stars for you!'], ms: 3800, move: 'across' },
  'habit-done': { mood: 'proud', lines: ['A great habit, {name}! Healthy and strong!', 'Well done, {name}! Good habits help you grow!'], ms: 3600, move: 'across' },
};

/** Works out what Kiyu does for an event. Pass a random function to make it predictable in tests. */
export function reactionFor(event: CompanionEvent, ctx: LineContext = {}, rand: () => number = Math.random): Reaction {
  const name = ctx.name?.trim() || 'friend';
  if (event === 'greet') {
    const part = partOfDay(ctx.hour ?? 12);
    const base = withName(pickOne(GREETINGS[part], rand), name);
    const streak = (ctx.days ?? 0) >= 3 ? ` You are on a ${ctx.days}-day streak!` : '';
    return { mood: part === 'night' ? 'sleepy' : 'wave', line: part === 'night' ? base : base + streak, move: 'home', ms: 4800 };
  }
  if (event === 'play-tap') {
    return { mood: pickOne(PLAY_TAP_MOODS, rand), line: null, move: 'to', ms: 1700 };
  }
  const e = LINES[event];
  return { mood: e.mood, line: withName(pickOne(e.lines, rand), name), move: e.move, ms: e.ms };
}
