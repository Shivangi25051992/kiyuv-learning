import { MORE_FOODS, MORE_VEHICLES } from './playMore.js';

/**
 * The things the age 2 activities show and say. Every emoji here has a drawing in the
 * app's picture set, and every line is short enough for a very young child to follow.
 */

/** Something to tap, see and hear. Used by the simple "tap and hear" activities. */
export interface TapItem {
  key: string;
  emoji: string;
  /** The name used as the button name. */
  label: string;
  /** What the voice says. */
  say: string;
  /** What is shown after the tap. */
  caption: string;
  /** A real recording in /sounds. Without one, the voice says the words. */
  clip?: string;
}

const BASE_VEHICLES: readonly TapItem[] = [
  { key: 'car', emoji: '🚗', label: 'Car', say: 'Car! Beep beep!', caption: 'Car says beep beep!', clip: 'car' },
  { key: 'bus', emoji: '🚌', label: 'Bus', say: 'Bus! Beep beep!', caption: 'Bus says beep beep!', clip: 'bus' },
  { key: 'train', emoji: '🚆', label: 'Train', say: 'Train! Choo choo!', caption: 'Train says choo choo!', clip: 'train' },
  { key: 'ship', emoji: '🚢', label: 'Boat', say: 'Boat! Ding ding!', caption: 'Boat says ding ding!', clip: 'ship' },
  { key: 'heli', emoji: '🚁', label: 'Helicopter', say: 'Helicopter! Whirr whirr!', caption: 'Helicopter says whirr!', clip: 'heli' },
  { key: 'fire', emoji: '🚒', label: 'Fire truck', say: 'Fire truck! Wee-oo wee-oo!', caption: 'Fire truck says wee-oo!', clip: 'fire' },
  { key: 'amb', emoji: '🚑', label: 'Ambulance', say: 'Ambulance! Wee-oo wee-oo!', caption: 'Ambulance says wee-oo!', clip: 'amb' },
  { key: 'tractor', emoji: '🚜', label: 'Tractor', say: 'Tractor! Putt putt!', caption: 'Tractor says putt putt!', clip: 'tractor' },
  { key: 'bike', emoji: '🚲', label: 'Bicycle', say: 'Bicycle! Ring ring!', caption: 'Bicycle says ring ring!' },
];

export const FRUITS: readonly TapItem[] = [
  { key: 'apple', emoji: '🍎', label: 'Apple', say: 'Apple! Yum!', caption: 'Apple! Yum!' },
  { key: 'banana', emoji: '🍌', label: 'Banana', say: 'Banana! Yum!', caption: 'Banana! Yum!' },
  { key: 'grapes', emoji: '🍇', label: 'Grapes', say: 'Grapes! Yum!', caption: 'Grapes! Yum!' },
  { key: 'berry', emoji: '🍓', label: 'Strawberry', say: 'Strawberry! Yum!', caption: 'Strawberry! Yum!' },
  { key: 'orange', emoji: '🍊', label: 'Orange', say: 'Orange! Yum!', caption: 'Orange! Yum!' },
  { key: 'melon', emoji: '🍉', label: 'Watermelon', say: 'Watermelon! Yum!', caption: 'Watermelon! Yum!' },
  { key: 'pine', emoji: '🍍', label: 'Pineapple', say: 'Pineapple! Yum!', caption: 'Pineapple! Yum!' },
  { key: 'carrot', emoji: '🥕', label: 'Carrot', say: 'Carrot! Crunch!', caption: 'Carrot! Crunch!' },
  { key: 'broc', emoji: '🥦', label: 'Broccoli', say: 'Broccoli! Yum!', caption: 'Broccoli! Yum!' },
];

export const VEHICLES: readonly TapItem[] = [...BASE_VEHICLES, ...MORE_VEHICLES];

/** Fruits and vegetables together, for "Yummy food". */
export const FOODS: readonly TapItem[] = [...FRUITS, ...MORE_FOODS];

/** A simple day: each step is something a toddler does, with a friendly line to say. */
export const DAY_STEPS: readonly TapItem[] = [
  { key: 'wake', emoji: '🌞', label: 'Wake up', say: 'Good morning! Time to wake up!', caption: 'Good morning!' },
  { key: 'wash', emoji: '🧼', label: 'Wash hands', say: 'Wash your hands with soap!', caption: 'Wash your hands!' },
  { key: 'teeth', emoji: '🪥', label: 'Brush teeth', say: 'Brush, brush, brush your teeth!', caption: 'Brush your teeth!' },
  { key: 'eat', emoji: '🍽', label: 'Eat', say: 'Yummy! Time to eat!', caption: 'Time to eat!' },
  { key: 'bath', emoji: '🛁', label: 'Bath', say: 'Splash splash! Bath time!', caption: 'Bath time!' },
  { key: 'sleep', emoji: '😴', label: 'Sleep', say: 'Shh. Time to sleep. Good night!', caption: 'Good night!' },
];

export interface ColourDef {
  name: string;
  hex: string;
  /** Something that is this colour, to link the word to a real thing. */
  thing: string;
  thingEmoji: string;
}

export const COLOURS: readonly ColourDef[] = [
  { name: 'Red', hex: '#e53935', thing: 'an apple', thingEmoji: '🍎' },
  { name: 'Blue', hex: '#1e88e5', thing: 'a whale', thingEmoji: '🐳' },
  { name: 'Yellow', hex: '#fdd835', thing: 'a banana', thingEmoji: '🍌' },
  { name: 'Green', hex: '#43a047', thing: 'a frog', thingEmoji: '🐸' },
  { name: 'Orange', hex: '#fb8c00', thing: 'an orange', thingEmoji: '🍊' },
  { name: 'Pink', hex: '#ec407a', thing: 'a pig', thingEmoji: '🐷' },
  { name: 'Purple', hex: '#8e24aa', thing: 'grapes', thingEmoji: '🍇' },
  { name: 'Brown', hex: '#6d4c41', thing: 'a bear', thingEmoji: '🐻' },
  { name: 'Grey', hex: '#757575', thing: 'an elephant', thingEmoji: '🐘' },
  { name: 'White', hex: '#eeeeee', thing: 'a cloud', thingEmoji: '☁️' },
];

export interface OppositeSide {
  emoji: string;
  word: string;
  /** How big the picture is drawn, so "small" really looks small. */
  scale: number;
}

export interface OppositePair {
  a: OppositeSide;
  b: OppositeSide;
}

export const OPPOSITES: readonly OppositePair[] = [
  { a: { emoji: '🐘', word: 'Big', scale: 1 }, b: { emoji: '🐭', word: 'Small', scale: 0.45 } },
  { a: { emoji: '⬆', word: 'Up', scale: 1 }, b: { emoji: '⬇', word: 'Down', scale: 1 } },
  { a: { emoji: '🔥', word: 'Hot', scale: 1 }, b: { emoji: '🧊', word: 'Cold', scale: 1 } },
  { a: { emoji: '🌞', word: 'Day', scale: 1 }, b: { emoji: '🌙', word: 'Night', scale: 1 } },
];

export interface BodyPart {
  emoji: string;
  name: string;
}

export const BODY_PARTS: readonly BodyPart[] = [
  { emoji: '👃', name: 'nose' },
  { emoji: '👂', name: 'ear' },
  { emoji: '👀', name: 'eyes' },
  { emoji: '👄', name: 'mouth' },
  { emoji: '👋', name: 'hand' },
  { emoji: '🦶', name: 'foot' },
  { emoji: '👅', name: 'tongue' },
  { emoji: '🦷', name: 'tooth' },
  { emoji: '🦵', name: 'leg' },
  { emoji: '💪', name: 'arm' },
];

/** How many things to find in one go of "Where is my nose?". */
export const BODY_ROUNDS = 6;

/**
 * "Mary had a little lamb", as bars of the xylophone: 0 = C, 1 = D, 2 = E, 3 = G.
 * Only these four are used, so the song needs just four big bars.
 */
export const LAMB_SONG: readonly number[] = [
  2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 3, 3, 2, 1, 0, 1, 2, 2, 2, 2, 1, 1, 2, 1, 0,
];

/** Bar colours for the song, low note to high note. */
export const LAMB_BARS = ['#e53935', '#fb8c00', '#43a047', '#1e88e5'] as const;

/** The most presents in one go of Peekaboo. */
export const PEEKABOO_COUNT = 6;
