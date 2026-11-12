/**
 * Good habits and how things grow: short, hands-on activities that teach one real thing each.
 * Nothing here is marked right or wrong in a way that costs anything: a mistake gets a kind
 * hint, and the child just tries again.
 */

/** Screen id for the habits page. Not a topic, never stored as progress. */
export const HABITS_PAGE_ID = 'habits';

export interface HabitActivity {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  /** Suggested ages, for parents. */
  ages: string;
  group: string;
}

export const HABIT_ACTIVITIES: readonly HabitActivity[] = [
  { id: 'habit-wash', name: 'Wash your hands', emoji: '🧼', blurb: 'Five steps to clean hands', ages: 'Ages 3 to 8', group: 'Healthy habits' },
  { id: 'habit-plate', name: 'Healthy plate', emoji: '🥕', blurb: 'Every day foods and treats', ages: 'Ages 4 to 10', group: 'Healthy habits' },
  { id: 'habit-breathe', name: 'Calm breathing', emoji: '😌', blurb: 'Breathe slowly with Kiyu', ages: 'Ages 4 to 13', group: 'Feelings and calm' },
  { id: 'habit-kind', name: 'Be kind', emoji: '🤝', blurb: 'What would a good friend do?', ages: 'Ages 7 to 13', group: 'Kind and respectful' },
  { id: 'habit-road', name: 'Cross safely', emoji: '🚦', blurb: 'Wait, look, then cross', ages: 'Ages 5 to 9', group: 'Staying safe' },
  { id: 'habit-online', name: 'Stay safe online', emoji: '🔒', blurb: 'Passwords, strangers and pop-ups', ages: 'Ages 8 to 13', group: 'Staying safe' },
  { id: 'habit-screen', name: 'Sleep and screens', emoji: '🌙', blurb: 'Rest well and take screen breaks', ages: 'Ages 8 to 13', group: 'Sleep and screens' },
  { id: 'habit-recycle', name: 'Recycle sort', emoji: '📦', blurb: 'Which bin does it go in?', ages: 'Ages 5 to 10', group: 'Our planet' },
  { id: 'habit-grow', name: 'Grow a plant', emoji: '🌱', blurb: 'Water it, give it sun, watch it grow', ages: 'Ages 4 to 9', group: 'How things grow' },
  { id: 'habit-water', name: 'The water cycle', emoji: '🌧', blurb: 'Follow a drop of water round and round', ages: 'Ages 7 to 12', group: 'How things grow' },
  { id: 'habit-digest', name: 'Journey of food', emoji: '🍲', blurb: 'Where does your lunch go?', ages: 'Ages 8 to 13', group: 'How your body works' },
  { id: 'habit-heart', name: 'Your heart', emoji: '🫀', blurb: 'What does exercise do to your heart?', ages: 'Ages 7 to 13', group: 'How your body works' },
];

export const HABIT_GROUPS: readonly string[] = [...new Set(HABIT_ACTIVITIES.map((a) => a.group))];

export const isHabitActivity = (id: string): boolean => HABIT_ACTIVITIES.some((a) => a.id === id);

/** True for the habits page or any activity on it. */
export const isHabitScreen = (id: string | null): boolean => id === HABITS_PAGE_ID || (id !== null && isHabitActivity(id));

// ------------------------------------------------------------------ Wash your hands
export interface WashStep {
  key: string;
  emoji: string;
  label: string;
  say: string;
}

/** The steps of washing hands well. The scrub is the one that takes 20 seconds. */
export const WASH_STEPS: readonly WashStep[] = [
  { key: 'wet', emoji: '💧', label: 'Wet your hands', say: 'Wet your hands with clean water.' },
  { key: 'soap', emoji: '🧼', label: 'Add soap', say: 'Add soap.' },
  { key: 'scrub', emoji: '🖐', label: 'Scrub for 20 seconds', say: 'Scrub your palms, the backs of your hands, between your fingers and your thumbs.' },
  { key: 'rinse', emoji: '🚿', label: 'Rinse off the soap', say: 'Rinse all the soap off.' },
  { key: 'dry', emoji: '🧻', label: 'Dry with a clean towel', say: 'Dry your hands with a clean towel.' },
];

/** Index of the scrub step, and how long it lasts. */
export const SCRUB_STEP = 2;
export const SCRUB_SECONDS = 20;

// ------------------------------------------------------------------- Healthy plate
export interface Food {
  emoji: string;
  name: string;
  kind: 'daily' | 'treat';
  fact: string;
}

export const FOODS: readonly Food[] = [
  { emoji: '🍎', name: 'Apple', kind: 'daily', fact: 'Fruit gives your body vitamins.' },
  { emoji: '🥕', name: 'Carrot', kind: 'daily', fact: 'Vegetables help you grow strong.' },
  { emoji: '🥛', name: 'Milk', kind: 'daily', fact: 'Milk helps build strong bones.' },
  { emoji: '🥚', name: 'Egg', kind: 'daily', fact: 'Eggs have protein to build your body.' },
  { emoji: '🍌', name: 'Banana', kind: 'daily', fact: 'Bananas give you energy to play.' },
  { emoji: '🥦', name: 'Broccoli', kind: 'daily', fact: 'Green vegetables keep you healthy.' },
  { emoji: '🐟', name: 'Fish', kind: 'daily', fact: 'Fish has protein to help you grow.' },
  { emoji: '🍰', name: 'Cake', kind: 'treat', fact: 'Cake is a yummy treat for special days.' },
  { emoji: '🍩', name: 'Doughnut', kind: 'treat', fact: 'A doughnut is a treat, not an every day food.' },
  { emoji: '🍭', name: 'Lollipop', kind: 'treat', fact: 'Sweets are fine sometimes. Brush your teeth after!' },
  { emoji: '🍦', name: 'Ice cream', kind: 'treat', fact: 'Ice cream is a sometimes treat.' },
];

/** How many foods to sort in one go: half every day foods, half treats. */
export const PLATE_ROUNDS = 8;

// ------------------------------------------------------------------- Recycle sort
export type BinKey = 'paper' | 'plastic' | 'glass' | 'metal' | 'food';

export interface Bin {
  key: BinKey;
  name: string;
}

/** Bins are told apart by their names, never only by colour. */
export const BINS: readonly Bin[] = [
  { key: 'paper', name: 'Paper' },
  { key: 'plastic', name: 'Plastic' },
  { key: 'glass', name: 'Glass' },
  { key: 'metal', name: 'Metal' },
  { key: 'food', name: 'Food scraps' },
];

export interface Rubbish {
  emoji: string;
  name: string;
  bin: BinKey;
  fact: string;
}

export const RUBBISH: readonly Rubbish[] = [
  { emoji: '📰', name: 'Newspaper', bin: 'paper', fact: 'Paper can be made into new paper.' },
  { emoji: '📦', name: 'Cardboard box', bin: 'paper', fact: 'Cardboard can be used again to make new boxes.' },
  { emoji: '🥤', name: 'Plastic cup', bin: 'plastic', fact: 'Plastic can be melted and made into new things.' },
  { emoji: '🥃', name: 'Glass jar', bin: 'glass', fact: 'Glass can be melted and made into new jars.' },
  { emoji: '🥫', name: 'Tin can', bin: 'metal', fact: 'Metal cans can be recycled again and again.' },
  { emoji: '🍌', name: 'Banana peel', bin: 'food', fact: 'Food scraps can turn into soil for plants.' },
];

// ------------------------------------------------------------------- Grow a plant
export interface PlantStage {
  emoji: string;
  name: string;
  /** What the child is told when the plant reaches this stage. */
  fact: string;
}

export const PLANT_STAGES: readonly PlantStage[] = [
  { emoji: '🫘', name: 'Seed', fact: 'A seed is asleep. It needs water and sunlight to wake up.' },
  { emoji: '🌱', name: 'Sprout', fact: 'The seed woke up! A tiny sprout pushes out of the soil.' },
  { emoji: '🌿', name: 'Young plant', fact: 'Leaves open up. They use sunlight to make food for the plant.' },
  { emoji: '🌻', name: 'Flower', fact: 'A flower! Later it makes new seeds, and the story starts again.' },
];

// ------------------------------------------------------------------- Cross safely
/** How long each light stays on, in milliseconds. */
export const RED_MS = 3500;
export const GREEN_MS = 4500;
