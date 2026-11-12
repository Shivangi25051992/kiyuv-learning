/**
 * "Put it in order" life-science activities. The child taps the steps in the right order.
 * Every step teaches one real fact.
 */
export interface SeqStep {
  key: string;
  /** A picture from the app's picture set. */
  emoji: string;
  name: string;
  fact: string;
}

export const DIGEST_STEPS: readonly SeqStep[] = [
  { key: 'mouth', emoji: '👄', name: 'Mouth', fact: 'Your teeth chew the food and spit (saliva) starts to break it down.' },
  { key: 'pipe', emoji: '⬇', name: 'Food pipe', fact: 'The food pipe squeezes the food down to your stomach.' },
  { key: 'stomach', emoji: '🍲', name: 'Stomach', fact: 'Your stomach mixes the food with juices until it is soft and runny.' },
  { key: 'small', emoji: '🧶', name: 'Small intestine', fact: 'The small intestine takes the goodness from food into your blood.' },
  { key: 'large', emoji: '🚽', name: 'Large intestine', fact: 'The large intestine takes back water. What is left leaves your body.' },
];

export const WATER_STEPS: readonly SeqStep[] = [
  { key: 'evap', emoji: '☀', name: 'Evaporation', fact: 'The Sun warms water in seas and lakes, and it rises into the air as vapour.' },
  { key: 'cond', emoji: '☁', name: 'Condensation', fact: 'High up, the vapour cools and turns into tiny drops that make clouds.' },
  { key: 'precip', emoji: '🌧', name: 'Precipitation', fact: 'When the drops get heavy they fall as rain, hail or snow.' },
  { key: 'collect', emoji: '🌊', name: 'Collection', fact: 'The water runs into rivers, lakes and seas, and the cycle starts again.' },
];

/** A resting heart, and what exercise does to it. Real ranges for children of about 6 to 12. */
export const HEART_REST_BPM = 80;
export const HEART_MAX_BPM = 160;
export const HEART_JUMP_STEP = 10;
export const HEART_GOAL_JUMPS = 10;
/** Resting heart rates of children this age are often between 70 and 100 beats a minute. */
export const HEART_CALM_BPM = 90;
