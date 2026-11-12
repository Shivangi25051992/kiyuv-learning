import type { EmojiNamedItem } from './banks.js';

/**
 * More picture banks for ages 4 and 5. Every item is an emoji with a name, shown as a big
 * picture the child taps. Each topic draws from its own list, so "Wild Animals" only asks
 * about wild animals.
 */

/** Pets and farm animals (topic: Pet and Farm Animals). */
export const EARLY_HOME_ANIMALS: readonly EmojiNamedItem[] = [
  { emoji: '🐶', name: 'Dog' }, { emoji: '🐱', name: 'Cat' }, { emoji: '🐄', name: 'Cow' },
  { emoji: '🐷', name: 'Pig' }, { emoji: '🐑', name: 'Sheep' }, { emoji: '🐔', name: 'Hen' },
  { emoji: '🦆', name: 'Duck' }, { emoji: '🐴', name: 'Horse' }, { emoji: '🐐', name: 'Goat' },
  { emoji: '🐰', name: 'Rabbit' }, { emoji: '🐹', name: 'Hamster' }, { emoji: '🐓', name: 'Rooster' },
];

/** Wild animals (topic: Wild Animals). */
export const EARLY_WILD_ANIMALS: readonly EmojiNamedItem[] = [
  { emoji: '🦁', name: 'Lion' }, { emoji: '🐯', name: 'Tiger' }, { emoji: '🐘', name: 'Elephant' },
  { emoji: '🦒', name: 'Giraffe' }, { emoji: '🦓', name: 'Zebra' }, { emoji: '🐵', name: 'Monkey' },
  { emoji: '🐻', name: 'Bear' }, { emoji: '🐺', name: 'Wolf' }, { emoji: '🦊', name: 'Fox' },
  { emoji: '🐼', name: 'Panda' }, { emoji: '🦘', name: 'Kangaroo' }, { emoji: '🦛', name: 'Hippo' },
];

/** Birds and bugs (topic: Birds and Bugs). */
export const EARLY_BIRDS_BUGS: readonly EmojiNamedItem[] = [
  { emoji: '🦜', name: 'Parrot' }, { emoji: '🦉', name: 'Owl' }, { emoji: '🦅', name: 'Eagle' },
  { emoji: '🦚', name: 'Peacock' }, { emoji: '🐧', name: 'Penguin' }, { emoji: '🦢', name: 'Swan' },
  { emoji: '🐝', name: 'Bee' }, { emoji: '🦋', name: 'Butterfly' }, { emoji: '🐞', name: 'Ladybird' },
  { emoji: '🐜', name: 'Ant' }, { emoji: '🕷', name: 'Spider' }, { emoji: '🐌', name: 'Snail' },
];

/** Animals that live in water (topic: Water Animals). */
export const EARLY_WATER_ANIMALS: readonly EmojiNamedItem[] = [
  { emoji: '🐟', name: 'Fish' }, { emoji: '🐬', name: 'Dolphin' }, { emoji: '🐳', name: 'Whale' },
  { emoji: '🦈', name: 'Shark' }, { emoji: '🐙', name: 'Octopus' }, { emoji: '🦀', name: 'Crab' },
  { emoji: '🐢', name: 'Turtle' }, { emoji: '🐸', name: 'Frog' }, { emoji: '🦭', name: 'Seal' },
  { emoji: '🐡', name: 'Pufferfish' },
];

/** Vegetables (topic: Vegetables). */
export const EARLY_VEGETABLES: readonly EmojiNamedItem[] = [
  { emoji: '🥕', name: 'Carrot' }, { emoji: '🥦', name: 'Broccoli' }, { emoji: '🍅', name: 'Tomato' },
  { emoji: '🥔', name: 'Potato' }, { emoji: '🌽', name: 'Corn' }, { emoji: '🥒', name: 'Cucumber' },
  { emoji: '🍆', name: 'Brinjal' }, { emoji: '🧅', name: 'Onion' },
];

/** The sky and space (topic: Sky and Space). */
export const EARLY_SKY: readonly EmojiNamedItem[] = [
  { emoji: '🌞', name: 'Sun' }, { emoji: '🌙', name: 'Moon' }, { emoji: '⭐', name: 'Star' },
  { emoji: '🌍', name: 'Earth' }, { emoji: '☁️', name: 'Cloud' }, { emoji: '🌈', name: 'Rainbow' },
  { emoji: '🚀', name: 'Rocket' }, { emoji: '🪐', name: 'Planet' }, { emoji: '☄️', name: 'Comet' },
];

/** Fruits that were not in the first list. */
export const EARLY_MORE_FRUITS: readonly EmojiNamedItem[] = [
  { emoji: '🍒', name: 'Cherry' }, { emoji: '🍐', name: 'Pear' }, { emoji: '🥥', name: 'Coconut' },
  { emoji: '🍋', name: 'Lemon' },
];
