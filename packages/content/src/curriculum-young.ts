import type { TrackCurriculum } from './curriculum.js';

/** Ages 6 and 7: grades 1 and 2. Small numbers, short words, and the world close to home. */
export const YOUNG_CURRICULUM: TrackCurriculum = {
  pathway: 'young',
  label: 'Grades 1 to 2 · Ages 6 and 7',
  subtitle: 'Adding and taking away, short words, rhymes, plants, animals, shapes and the world around us',
  subjects: [
    {
      emoji: '➕',
      name: 'Numbers — Add and Take Away',
      grade: 'Grade 1-2',
      systems: ['cbse', 'cc', 'uk', 'au'],
      topics: [
        { id: 'g-add10', name: 'Add within 10', diff: 1, gen: 'add_10' },
        { id: 'g-sub10', name: 'Take away within 10', diff: 1, gen: 'sub_10' },
        { id: 'g-add20', name: 'Add within 20', diff: 2, gen: 'add_20' },
        { id: 'g-sub20', name: 'Take away within 20', diff: 2, gen: 'sub_20' },
        { id: 'g-add2d', name: 'Add tens and ones', diff: 3, gen: 'add_2d' },
      ],
    },
    {
      emoji: '🔢',
      name: 'Numbers — Size and Pattern',
      grade: 'Grade 1-2',
      systems: ['cbse', 'cc', 'uk', 'au'],
      topics: [
        { id: 'g-compare', name: 'Bigger or smaller', diff: 1, gen: 'compare' },
        { id: 'g-tens', name: 'Tens and ones', diff: 2, gen: 'tens_ones' },
        { id: 'g-skip', name: 'Count by 2s, 5s and 10s', diff: 2, gen: 'skip' },
        { id: 'g-evenodd', name: 'Even and odd', diff: 2, gen: 'even_odd' },
        { id: 'g-groups', name: 'Equal groups', diff: 3, gen: 'groups' },
        { id: 'g-times', name: 'Times tables 2, 5 and 10', diff: 3, gen: 'mul_2510' },
      ],
    },
    {
      emoji: '⏰',
      name: 'Time and Calendar',
      grade: 'Grade 1-2',
      systems: ['cbse', 'cc', 'uk', 'au'],
      topics: [
        { id: 'g-time', name: 'Tell the time', diff: 2, gen: 'time_easy' },
        { id: 'g-days', name: 'Days and months', diff: 1 },
      ],
    },
    {
      emoji: '🔷',
      name: 'Shapes',
      grade: 'Grade 1-2',
      systems: ['cbse', 'cc', 'uk', 'au'],
      topics: [{ id: 'g-shapes', name: 'Flat and solid shapes', diff: 2 }],
    },
    {
      emoji: '🔤',
      name: 'English — Words',
      grade: 'Grade 1-2',
      systems: ['cbse', 'cc', 'uk', 'au'],
      topics: [
        { id: 'g-cvc', name: 'Spell short words', diff: 1 },
        { id: 'g-rhyme', name: 'Rhyming words', diff: 1 },
        { id: 'g-nouns', name: 'Naming and action words', diff: 2 },
        { id: 'g-opp', name: 'Opposite words', diff: 1 },
      ],
    },
    {
      emoji: '🌱',
      name: 'Our World',
      grade: 'Grade 1-2',
      systems: ['cbse', 'cc', 'uk', 'au'],
      topics: [
        { id: 'g-animals', name: 'Animals and their homes', diff: 1 },
        { id: 'g-plants', name: 'Plants', diff: 1 },
        { id: 'g-weather', name: 'Weather and seasons', diff: 1 },
        { id: 'g-body', name: 'My body and senses', diff: 1 },
        { id: 'g-habits', name: 'Healthy habits', diff: 1 },
      ],
    },
    {
      emoji: '🇮🇳',
      name: 'My Country India',
      grade: 'Grade 1-2',
      systems: ['cbse'],
      topics: [{ id: 'g-india', name: 'India: flag, festivals, symbols', diff: 2 }],
    },
  ],
};
