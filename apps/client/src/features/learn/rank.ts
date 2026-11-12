/**
 * Stars turn into a rank. Every 50 stars is a new rank, so there is always something
 * close to reach. (Called "rank" so it is never mixed up with the 10 adventure levels.)
 */
export const STARS_PER_RANK = 50;

export const RANKS = [
  { name: 'Seedling', emoji: '🌱' },
  { name: 'Butterfly', emoji: '🦋' },
  { name: 'Shining Star', emoji: '🌟' },
  { name: 'Medalist', emoji: '🏅' },
  { name: 'Champion', emoji: '🏆' },
  { name: 'Rocket', emoji: '🚀' },
  { name: 'Legend', emoji: '👑' },
] as const;

export interface RankInfo {
  /** 0-based position in RANKS. */
  index: number;
  name: string;
  emoji: string;
  /** Stars earned inside this rank. */
  into: number;
  /** Stars needed for the next rank, 0 at the top. */
  need: number;
  /** How full the bar is, 0 to 100. */
  pct: number;
  /** Name of the next rank, null at the top. */
  next: string | null;
  maxed: boolean;
}

export function rankOf(stars: number): RankInfo {
  const safe = Math.max(0, Math.floor(stars));
  const last = RANKS.length - 1;
  const index = Math.min(Math.floor(safe / STARS_PER_RANK), last);
  const current = RANKS[index]!;
  if (index === last) {
    return { index, name: current.name, emoji: current.emoji, into: safe - last * STARS_PER_RANK, need: 0, pct: 100, next: null, maxed: true };
  }
  const into = safe - index * STARS_PER_RANK;
  return {
    index,
    name: current.name,
    emoji: current.emoji,
    into,
    need: STARS_PER_RANK,
    pct: Math.round((into / STARS_PER_RANK) * 100),
    next: RANKS[index + 1]!.name,
    maxed: false,
  };
}
