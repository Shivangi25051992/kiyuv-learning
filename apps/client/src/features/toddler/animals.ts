/**
 * The animals a young child can tap in Play time, in groups. Every picture is in the app's
 * picture set. Only animals with a real recording (in /sounds) have a `clip`; the rest say
 * their name and one short fact, so the voice never reads a sound word out as if it were text.
 */

export const ANIMAL_GROUPS = ['Farm', 'Pets', 'Wild', 'Birds', 'Bugs', 'Water'] as const;
export type AnimalGroup = (typeof ANIMAL_GROUPS)[number];

export interface Animal {
  emoji: string;
  name: string;
  group: AnimalGroup;
  /** One short, true line, said and shown when the animal has no recording. */
  fact: string;
  /** The animal's sound as a word, shown in the caption ("Cow says Moo!"). */
  sound?: string;
  /** A real recording in /sounds, without the .mp3. */
  clip?: string;
}

export const ANIMALS: readonly Animal[] = [
  // Farm
  { emoji: '🐄', name: 'Cow', group: 'Farm', sound: 'Moo', clip: 'cow', fact: 'Cows give us milk.' },
  { emoji: '🐃', name: 'Buffalo', group: 'Farm', fact: 'Buffaloes love to splash in water.' },
  { emoji: '🐷', name: 'Pig', group: 'Farm', sound: 'Oink', clip: 'pig', fact: 'Pigs love to roll in mud.' },
  { emoji: '🐑', name: 'Sheep', group: 'Farm', sound: 'Baa', clip: 'sheep', fact: 'Sheep give us wool.' },
  { emoji: '🐐', name: 'Goat', group: 'Farm', sound: 'Meh', clip: 'goat', fact: 'Goats love to climb.' },
  { emoji: '🫏', name: 'Donkey', group: 'Farm', sound: 'Hee-haw', clip: 'donkey', fact: 'Donkeys carry heavy loads.' },
  { emoji: '🐴', name: 'Horse', group: 'Farm', sound: 'Neigh', clip: 'horse', fact: 'Horses can run very fast.' },
  { emoji: '🐔', name: 'Hen', group: 'Farm', sound: 'Cluck', clip: 'hen', fact: 'Hens lay eggs.' },
  { emoji: '🐓', name: 'Rooster', group: 'Farm', sound: 'Cock-a-doodle-doo', clip: 'rooster', fact: 'The rooster wakes us up in the morning.' },
  { emoji: '🦆', name: 'Duck', group: 'Farm', sound: 'Quack', clip: 'duck', fact: 'Ducks love to swim.' },
  { emoji: '🦃', name: 'Turkey', group: 'Farm', fact: 'Turkeys have a big fan of feathers.' },
  // Pets
  { emoji: '🐶', name: 'Dog', group: 'Pets', sound: 'Woof', clip: 'dog', fact: 'Dogs are our friends.' },
  { emoji: '🐱', name: 'Cat', group: 'Pets', sound: 'Meow', clip: 'cat', fact: 'Cats love to nap.' },
  { emoji: '🐰', name: 'Rabbit', group: 'Pets', fact: 'Rabbits hop and love carrots.' },
  { emoji: '🐹', name: 'Hamster', group: 'Pets', fact: 'Hamsters keep food in their cheeks.' },
  { emoji: '🐭', name: 'Mouse', group: 'Pets', sound: 'Squeak', clip: 'mouse', fact: 'Mice are tiny.' },
  { emoji: '🐩', name: 'Poodle', group: 'Pets', fact: 'Poodles have curly fur.' },
  // Wild
  { emoji: '🦁', name: 'Lion', group: 'Wild', sound: 'Roar', clip: 'lion', fact: 'The lion is a big cat.' },
  { emoji: '🐯', name: 'Tiger', group: 'Wild', fact: 'Tigers have stripes.' },
  { emoji: '🐻', name: 'Bear', group: 'Wild', sound: 'Growl', clip: 'bear', fact: 'Bears love honey.' },
  { emoji: '🐘', name: 'Elephant', group: 'Wild', sound: 'Toot', clip: 'elephant', fact: 'Elephants have long trunks.' },
  { emoji: '🦒', name: 'Giraffe', group: 'Wild', fact: 'Giraffes have very long necks.' },
  { emoji: '🦓', name: 'Zebra', group: 'Wild', fact: 'Zebras have black and white stripes.' },
  { emoji: '🐵', name: 'Monkey', group: 'Wild', sound: 'Ooh ooh', clip: 'monkey', fact: 'Monkeys love to climb and eat bananas.' },
  { emoji: '🦍', name: 'Gorilla', group: 'Wild', fact: 'Gorillas are big and strong.' },
  { emoji: '🐺', name: 'Wolf', group: 'Wild', sound: 'Awoo', clip: 'wolf', fact: 'Wolves howl at the moon.' },
  { emoji: '🦊', name: 'Fox', group: 'Wild', fact: 'Foxes have bushy tails.' },
  { emoji: '🦌', name: 'Deer', group: 'Wild', fact: 'Some deer have big antlers.' },
  { emoji: '🐪', name: 'Camel', group: 'Wild', fact: 'Camels live in the desert.' },
  { emoji: '🦘', name: 'Kangaroo', group: 'Wild', fact: 'Kangaroos hop.' },
  { emoji: '🐼', name: 'Panda', group: 'Wild', fact: 'Pandas eat bamboo.' },
  { emoji: '🦏', name: 'Rhino', group: 'Wild', fact: 'A rhino has a horn on its nose.' },
  { emoji: '🦛', name: 'Hippo', group: 'Wild', fact: 'Hippos love the water.' },
  { emoji: '🐆', name: 'Leopard', group: 'Wild', fact: 'Leopards have spots.' },
  { emoji: '🐨', name: 'Koala', group: 'Wild', fact: 'Koalas sleep a lot.' },
  { emoji: '🐊', name: 'Crocodile', group: 'Wild', fact: 'Crocodiles have big teeth.' },
  { emoji: '🐍', name: 'Snake', group: 'Wild', fact: 'Snakes slither on the ground.' },
  { emoji: '🐿', name: 'Squirrel', group: 'Wild', fact: 'Squirrels collect nuts.' },
  { emoji: '🦇', name: 'Bat', group: 'Wild', fact: 'Bats fly at night.' },
  // Birds
  { emoji: '🦜', name: 'Parrot', group: 'Birds', fact: 'Parrots can copy words.' },
  { emoji: '🦉', name: 'Owl', group: 'Birds', sound: 'Hoot', clip: 'owl', fact: 'Owls are awake at night.' },
  { emoji: '🦅', name: 'Eagle', group: 'Birds', fact: 'Eagles fly very high.' },
  { emoji: '🕊', name: 'Dove', group: 'Birds', fact: 'Doves are gentle birds.' },
  { emoji: '🦚', name: 'Peacock', group: 'Birds', fact: 'Peacocks have beautiful tail feathers.' },
  { emoji: '🐧', name: 'Penguin', group: 'Birds', fact: 'Penguins swim but cannot fly.' },
  { emoji: '🦢', name: 'Swan', group: 'Birds', fact: 'Swans glide on the water.' },
  { emoji: '🦩', name: 'Flamingo', group: 'Birds', fact: 'Flamingos are pink.' },
  { emoji: '🐤', name: 'Chick', group: 'Birds', fact: 'A chick hatches from an egg.' },
  { emoji: '🐦', name: 'Bird', group: 'Birds', sound: 'Tweet', clip: 'bird', fact: 'Birds have feathers and wings.' },
  // Bugs
  { emoji: '🐝', name: 'Bee', group: 'Bugs', sound: 'Buzz', clip: 'bee', fact: 'Bees make honey.' },
  { emoji: '🦋', name: 'Butterfly', group: 'Bugs', fact: 'Butterflies have colourful wings.' },
  { emoji: '🐞', name: 'Ladybird', group: 'Bugs', fact: 'Ladybirds are red with black spots.' },
  { emoji: '🐜', name: 'Ant', group: 'Bugs', fact: 'Ants are tiny and work together.' },
  { emoji: '🐛', name: 'Caterpillar', group: 'Bugs', fact: 'A caterpillar turns into a butterfly.' },
  { emoji: '🕷', name: 'Spider', group: 'Bugs', fact: 'Spiders spin webs.' },
  { emoji: '🦗', name: 'Cricket', group: 'Bugs', sound: 'Chirp', clip: 'cricket', fact: 'Crickets chirp at night.' },
  { emoji: '🐌', name: 'Snail', group: 'Bugs', fact: 'Snails are slow and carry their house.' },
  // Water
  { emoji: '🐟', name: 'Fish', group: 'Water', fact: 'Fish swim with their fins.' },
  { emoji: '🐠', name: 'Colourful fish', group: 'Water', fact: 'Some fish are very colourful.' },
  { emoji: '🐡', name: 'Pufferfish', group: 'Water', fact: 'A pufferfish puffs up like a ball.' },
  { emoji: '🐬', name: 'Dolphin', group: 'Water', fact: 'Dolphins are clever and playful.' },
  { emoji: '🐳', name: 'Whale', group: 'Water', fact: 'Whales are very, very big.' },
  { emoji: '🦈', name: 'Shark', group: 'Water', fact: 'Sharks have lots of teeth.' },
  { emoji: '🐙', name: 'Octopus', group: 'Water', fact: 'An octopus has eight arms.' },
  { emoji: '🦀', name: 'Crab', group: 'Water', fact: 'Crabs walk sideways.' },
  { emoji: '🐢', name: 'Turtle', group: 'Water', fact: 'A turtle carries its shell house.' },
  { emoji: '🦭', name: 'Seal', group: 'Water', fact: 'Seals swim and play.' },
  { emoji: '🐸', name: 'Frog', group: 'Water', sound: 'Ribbit', clip: 'frog', fact: 'Frogs hop and swim.' },
  { emoji: '🦐', name: 'Shrimp', group: 'Water', fact: 'Shrimp are small sea animals.' },
];

export const animalsInGroup = (group: AnimalGroup): Animal[] => ANIMALS.filter((a) => a.group === group);

/** The animal's recording, if it has one. */
export const animalClip = (animal: Animal): string | undefined => animal.clip;

/** What is shown under the animals after a tap. */
export const animalCaption = (a: Animal): string => (a.sound ? `${a.name} says ${a.sound}!` : `${a.name}! ${a.fact}`);

/** What the voice says if there is no recording (or it cannot play): the name and one fact. */
export const animalSpoken = (a: Animal): string => `${a.name}! ${a.fact}`;
