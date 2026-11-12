import { RANKS, STARS_PER_RANK } from '../learn/rank.js';
import type { AccessoryKey } from './lookStore.js';

/** Screen id for Kiyu's wardrobe page. Not a topic, never stored as progress. */
export const WARDROBE_PAGE_ID = 'kiyu';

export interface Look {
  key: AccessoryKey;
  name: string;
  /** The rank (position in RANKS) that unlocks it. */
  rankIndex: number;
}

/** One accessory for each rank after the first, so Kiyu grows with the child. */
export const LOOKS: readonly Look[] = [
  { key: 'butterfly', name: 'Butterfly friend', rankIndex: 1 },
  { key: 'star', name: 'Gold star', rankIndex: 2 },
  { key: 'medal', name: 'Hero medal', rankIndex: 3 },
  { key: 'cape', name: 'Super cape', rankIndex: 4 },
  { key: 'jetpack', name: 'Rocket pack', rankIndex: 5 },
  { key: 'crown', name: 'Royal crown', rankIndex: 6 },
];

/** The child's choice: the newest unlocked look ("auto"), nothing extra ("none"), or one look. */
export type LookChoice = 'auto' | 'none' | AccessoryKey;

export const starsNeeded = (look: Look): number => look.rankIndex * STARS_PER_RANK;
export const rankNameOf = (look: Look): string => RANKS[look.rankIndex]!.name;

export const isUnlocked = (look: Look, stars: number): boolean => stars >= starsNeeded(look);
export const unlockedLooks = (stars: number): Look[] => LOOKS.filter((l) => isUnlocked(l, stars));

const slot = (key: string): string => `kiyuv.look.${key}`;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const isChoice = (v: unknown): v is LookChoice =>
  v === 'auto' || v === 'none' || LOOKS.some((l) => l.key === v);

export function loadLookChoice(key: string): LookChoice {
  try {
    const raw = storage()?.getItem(slot(key));
    return isChoice(raw) ? raw : 'auto';
  } catch {
    return 'auto';
  }
}

export function saveLookChoice(key: string, choice: LookChoice): void {
  try {
    storage()?.setItem(slot(key), choice);
  } catch {
    // The choice then lasts only until the app is closed.
  }
}

/**
 * What Kiyu actually wears: the child's choice, but never something that is still locked
 * (for example after their stars were reset), in which case it is the newest unlocked look.
 */
export function resolveLook(key: string, stars: number): AccessoryKey | null {
  const unlocked = unlockedLooks(stars);
  const choice = loadLookChoice(key);
  if (choice === 'none') return null;
  if (choice !== 'auto') {
    const picked = unlocked.find((l) => l.key === choice);
    if (picked) return picked.key;
  }
  return unlocked.at(-1)?.key ?? null;
}
