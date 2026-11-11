import { z } from 'zod';
import { MAX_KIDS_PER_FAMILY } from './constants.js';

/**
 * Family groups: limits, week maths, invite codes and name filtering.
 * Everything here is pure, so the app and the Cloud Functions share one copy.
 * See docs/GROUPS_FEATURE.md for the design.
 */

export const MAX_FAMILIES_PER_GROUP = 30;
export const MAX_GROUPS_PER_FAMILY = 3;

export const INVITE_CODE_LENGTH = 8;
/** No 0/O, 1/I/L, so a code read aloud or from a screenshot is not mistyped. */
export const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_DEFAULT_DAYS = 3;
export const INVITE_DEFAULT_USES = 10;
export const INVITE_MAX_DAYS = 14;
export const INVITE_MAX_USES = 30;

export const GROUP_NAME_MAX = 30;
export const BOARD_NAME_MAX = 20;
/** A child cannot plausibly earn more than this in one week. Caps inflated boards. */
export const MAX_WEEKLY_STARS = 2000;

export const GROUP_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
] as const;
export type GroupTimezone = (typeof GROUP_TIMEZONES)[number];
export const DEFAULT_GROUP_TIMEZONE: GroupTimezone = 'Asia/Kolkata';

export type GroupRole = 'owner' | 'member';

// ---------------------------------------------------------------- week maths

/** The Monday (as YYYY-MM-DD) of the week that `nowMs` falls in, in `timeZone`. */
export function weekKey(nowMs: number, timeZone: string = DEFAULT_GROUP_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date(nowMs));
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  const dayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'));
  const localMidnightUtc = Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day')));
  const monday = new Date(localMidnightUtc - Math.max(dayIndex, 0) * 86_400_000);
  return monday.toISOString().slice(0, 10);
}

export interface WeekState {
  weekKey: string;
  weekBase: number;
}

export interface WeeklyResult extends WeekState {
  weekStars: number;
}

/**
 * Works out a child's stars for the current week.
 * - First save of a new week: the base is the stars *before* that save, so the
 *   first round of the week counts.
 * - Stars went down (progress was reset): the base drops with them.
 * - Never negative, and capped at MAX_WEEKLY_STARS.
 */
export function nextWeekly(
  previous: WeekState | null,
  starsBefore: number,
  starsAfter: number,
  currentWeek: string,
): WeeklyResult {
  let base: number;
  if (!previous || previous.weekKey !== currentWeek) {
    base = Math.min(starsBefore, starsAfter);
  } else {
    base = Math.min(previous.weekBase, starsBefore, starsAfter);
  }
  const weekStars = Math.min(Math.max(0, starsAfter - base), MAX_WEEKLY_STARS);
  return { weekKey: currentWeek, weekBase: base, weekStars };
}

/** What a reader shows: an entry from an earlier week counts as 0. */
export function visibleWeekStars(
  entry: { weekKey: string; weekStars: number },
  currentWeek: string,
): number {
  return entry.weekKey === currentWeek ? entry.weekStars : 0;
}

// -------------------------------------------------------------- invite codes

/** Uppercases and strips spaces and dashes, so "abcd-2345" and "ABCD 2345" both work. */
export function normalizeInviteCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '');
}

export function isInviteCodeShape(code: string): boolean {
  if (code.length !== INVITE_CODE_LENGTH) return false;
  for (const ch of code) if (!INVITE_ALPHABET.includes(ch)) return false;
  return true;
}

/** Pulls the code out of a pasted link (`.../join#CODE`) or a bare code. */
export function extractInviteCode(input: string): string {
  const hash = input.includes('#') ? input.slice(input.lastIndexOf('#') + 1) : input;
  return normalizeInviteCode(hash);
}

// -------------------------------------------------------------- name filters

const ADJECTIVES = [
  'Happy', 'Brave', 'Clever', 'Sunny', 'Swift', 'Gentle', 'Lucky', 'Jolly',
  'Mighty', 'Bright', 'Cosmic', 'Zippy', 'Cheery', 'Bold', 'Merry', 'Witty',
] as const;
const ANIMALS = [
  'Panda', 'Tiger', 'Otter', 'Koala', 'Falcon', 'Dolphin', 'Bunny', 'Fox',
  'Penguin', 'Lion', 'Turtle', 'Owl', 'Zebra', 'Parrot', 'Whale', 'Gecko',
] as const;

/** Preset board names, "Brave Otter" style, so a child never needs to type a name. */
export function presetBoardNames(): string[] {
  const out: string[] = [];
  for (const a of ADJECTIVES) for (const n of ANIMALS) out.push(`${a} ${n}`);
  return out;
}

const PRESET_SET: ReadonlySet<string> = new Set(presetBoardNames());
export function isPresetBoardName(name: string): boolean {
  return PRESET_SET.has(name);
}

// A deliberately small list. Filters can be bypassed, so a Report button and an
// owner "hide" action also exist (see the design doc).
const BLOCKED_FRAGMENTS = [
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'nigg',
  'fag', 'rape', 'porn', 'sex', 'nazi', 'hitler', 'kill', 'suicide', 'nude', 'boob',
  'penis', 'vagina', 'bastard', 'asshole', 'idiot', 'stupid', 'hate', 'drug',
];

function squash(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    .replace(/[^a-z]/g, '');
}

export function cleanDisplayName(input: string): string {
  return input.normalize('NFKC').trim().replace(/\s+/g, ' ');
}

function isSafeText(name: string, min: number, max: number): boolean {
  if (name.length < min || name.length > max) return false;
  if (!/^[\p{L}\p{N} ]+$/u.test(name)) return false;
  // Four or more digits could be a phone number or a house number.
  if ((name.match(/\p{N}/gu) ?? []).length >= 4) return false;
  const squashed = squash(name);
  return !BLOCKED_FRAGMENTS.some((bad) => squashed.includes(bad));
}

/** A board name: a preset, or 2 to 20 letters, digits and spaces that pass the filter. */
export function isBoardNameAllowed(raw: string): boolean {
  const name = cleanDisplayName(raw);
  return isPresetBoardName(name) || isSafeText(name, 2, BOARD_NAME_MAX);
}

export function isGroupNameAllowed(raw: string): boolean {
  return isSafeText(cleanDisplayName(raw), 3, GROUP_NAME_MAX);
}

// ------------------------------------------------------------ input schemas

const GroupIdSchema = z.string().regex(/^[0-9a-f]{32}$/);
const BoardNameSchema = z
  .string()
  .transform(cleanDisplayName)
  .refine(isBoardNameAllowed, 'Choose another board name.');
const KidIdSchema = z.string().regex(/^k[1-6]$/);

export const SharedChildInputSchema = z.object({
  kidId: KidIdSchema,
  boardName: BoardNameSchema,
});
export type SharedChildInput = z.infer<typeof SharedChildInputSchema>;

const sharedChildren = (min: number) =>
  z
    .array(SharedChildInputSchema)
    .min(min)
    .max(MAX_KIDS_PER_FAMILY)
    .refine(
      (list) => new Set(list.map((c) => c.kidId)).size === list.length,
      'A child can only be shared once.',
    );

export const CreateGroupInputSchema = z.object({
  name: z
    .string()
    .transform(cleanDisplayName)
    .refine(isGroupNameAllowed, 'Choose another group name.'),
  timezone: z.enum(GROUP_TIMEZONES).default(DEFAULT_GROUP_TIMEZONE),
});
export const CreateInviteInputSchema = z.object({
  groupId: GroupIdSchema,
  days: z.number().int().min(1).max(INVITE_MAX_DAYS).default(INVITE_DEFAULT_DAYS),
  uses: z.number().int().min(1).max(INVITE_MAX_USES).default(INVITE_DEFAULT_USES),
});
export const RequestJoinInputSchema = z.object({
  code: z.string().max(80).transform(extractInviteCode),
  children: sharedChildren(1),
});
export const GroupMemberInputSchema = z.object({ groupId: GroupIdSchema, uid: z.string().min(1).max(128) });
export const GroupIdInputSchema = z.object({ groupId: GroupIdSchema });
export const SetSharedChildrenInputSchema = z.object({
  groupId: GroupIdSchema,
  children: sharedChildren(0),
});
export const HideEntryInputSchema = z.object({ groupId: GroupIdSchema, entryId: z.string().regex(/^[0-9a-f]{16,32}$/) });
export const RenameGroupInputSchema = z.object({
  groupId: GroupIdSchema,
  name: CreateGroupInputSchema.shape.name,
});
