/** Screen ids for Play time: a hub, and one id per activity. Never stored as progress. */
export const PLAY_TIME_ID = 'play-time';

export interface PlayActivity {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
}

export const PLAY_ACTIVITIES: readonly PlayActivity[] = [
  { id: 'play-animals', name: 'Say hello', emoji: '🐄', blurb: 'Tap an animal to hear it' },
  { id: 'play-balloons', name: 'Pop the balloons', emoji: '🎈', blurb: 'Pop every balloon' },
  { id: 'play-count', name: 'Count with me', emoji: '🍎', blurb: 'Tap and count the apples' },
  { id: 'play-shapes', name: 'Dance shapes', emoji: '🔷', blurb: 'Tap a shape and watch it dance' },
  { id: 'play-music', name: 'Little xylophone', emoji: '🎹', blurb: 'Tap the bars to make music' },
];

export const isPlayActivity = (id: string): boolean => PLAY_ACTIVITIES.some((a) => a.id === id);

/** True for the hub or any activity. */
export const isPlayScreen = (id: string | null): boolean => id === PLAY_TIME_ID || (id !== null && isPlayActivity(id));

export interface Animal {
  emoji: string;
  name: string;
  sound: string;
}

/** Animals a toddler can tap. Every picture is in the app's picture set. */
export const ANIMALS: readonly Animal[] = [
  { emoji: '🐄', name: 'Cow', sound: 'Moo' },
  { emoji: '🐶', name: 'Dog', sound: 'Woof' },
  { emoji: '🐱', name: 'Cat', sound: 'Meow' },
  { emoji: '🦆', name: 'Duck', sound: 'Quack' },
  { emoji: '🐷', name: 'Pig', sound: 'Oink' },
  { emoji: '🐑', name: 'Sheep', sound: 'Baa' },
  { emoji: '🐴', name: 'Horse', sound: 'Neigh' },
  { emoji: '🦁', name: 'Lion', sound: 'Roar' },
  { emoji: '🐸', name: 'Frog', sound: 'Ribbit' },
];

export interface BalloonColour {
  name: string;
  hex: string;
}

export const BALLOON_COLOURS: readonly BalloonColour[] = [
  { name: 'Red', hex: '#e53935' },
  { name: 'Blue', hex: '#1e88e5' },
  { name: 'Yellow', hex: '#fdd835' },
  { name: 'Green', hex: '#43a047' },
  { name: 'Pink', hex: '#ec407a' },
  { name: 'Purple', hex: '#8e24aa' },
];

export interface ShapeDef {
  name: string;
  hex: string;
  /** CSS clip-path for the shape, or null for a plain rounded box. */
  clip: string | null;
  radius: string;
}

export const SHAPES: readonly ShapeDef[] = [
  { name: 'Circle', hex: '#e53935', clip: null, radius: '50%' },
  { name: 'Square', hex: '#1e88e5', clip: null, radius: '12%' },
  { name: 'Triangle', hex: '#fdd835', clip: 'polygon(50% 6%, 96% 92%, 4% 92%)', radius: '0' },
  {
    name: 'Star',
    hex: '#43a047',
    clip: 'polygon(50% 2%, 61% 36%, 98% 36%, 68% 57%, 79% 92%, 50% 71%, 21% 92%, 32% 57%, 2% 36%, 39% 36%)',
    radius: '0',
  },
  { name: 'Diamond', hex: '#8e24aa', clip: 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)', radius: '0' },
];

/** Colours of the xylophone bars, low note to high note. */
export const XYLOPHONE_COLOURS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'] as const;

/** The most apples the counting game shows. */
export const MAX_APPLES = 5;
