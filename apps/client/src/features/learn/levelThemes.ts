/**
 * Each of the 10 levels is a place on the adventure path, so climbing a level feels like
 * going somewhere. The colours are dark enough for white text (at least 4.5 to 1).
 */
export interface LevelTheme {
  name: string;
  /** A picture from the app's picture set. */
  emoji: string;
  color: string;
}

export const LEVEL_THEMES: readonly LevelTheme[] = [
  { name: 'Sunny Meadow', emoji: '🌸', color: '#2e7d32' },
  { name: 'Busy Farm', emoji: '🐄', color: '#b45309' },
  { name: 'Blue Lagoon', emoji: '🐟', color: '#0277bd' },
  { name: 'Rainbow Hills', emoji: '🌈', color: '#6a1b9a' },
  { name: 'Green Forest', emoji: '🌳', color: '#1b5e20' },
  { name: 'Butterfly Garden', emoji: '🦋', color: '#ad1457' },
  { name: 'Snowy Peaks', emoji: '❄', color: '#455a64' },
  { name: 'Fire Mountain', emoji: '🔥', color: '#c62828' },
  { name: 'Moon Base', emoji: '🌙', color: '#283593' },
  { name: 'Star Castle', emoji: '🏆', color: '#8a6100' },
];

export const themeOfLevel = (level: number): LevelTheme =>
  LEVEL_THEMES[Math.min(Math.max(level, 1), LEVEL_THEMES.length) - 1]!;
