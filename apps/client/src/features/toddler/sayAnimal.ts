import { playClip, speak } from '../../lib/sound.js';
import { animalSpoken, type Animal } from './animals.js';

/**
 * Plays an animal: its real recording and then its name, or, for an animal without a
 * recording, its name and one fact. The voice never reads a sound word out as if it were text.
 */
export function sayAnimal(animal: Animal, before = ''): void {
  if (animal.clip) playClip(animal.clip, `${before}${animal.name}!`, `${before}${animalSpoken(animal)}`);
  else speak(`${before}${animalSpoken(animal)}`);
}
