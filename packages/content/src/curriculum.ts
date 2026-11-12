import type { TopicProgress } from '@kiyuv/shared';
import { SENIOR_CURRICULUM } from './curriculum-senior.js';
import { YOUNG_CURRICULUM } from './curriculum-young.js';
import type { SeniorMathKey, YoungMathKey } from './math-more.js';
import type { Pathway } from './pathway.js';

export type CurriculumSystem = 'cbse' | 'cc' | 'uk' | 'au' | 'olym';

export type MathGeneratorKey =
  | 'add_easy'
  | 'add_med'
  | 'add_hard'
  | 'sub_easy'
  | 'sub_med'
  | 'sub_hard'
  | 'mul_easy'
  | 'mul_med'
  | 'mul_hard'
  | 'div_easy'
  | 'div_med'
  | 'div_hard'
  | 'wp_easy'
  | 'wp_med'
  | 'wp_hard'
  | 'place'
  | 'time'
  | 'rounding'
  | YoungMathKey
  | SeniorMathKey;

export interface CurriculumTopic {
  id: string;
  name: string;
  diff: 1 | 2 | 3;
  gen?: MathGeneratorKey;
}

export interface CurriculumSubject {
  emoji: string;
  name: string;
  grade: string;
  systems: readonly CurriculumSystem[];
  topics: readonly CurriculumTopic[];
}

export interface TrackCurriculum {
  pathway: Pathway;
  label: string;
  subtitle: string;
  subjects: readonly CurriculumSubject[];
}

export const ALIGNMENT_LABELS: Record<CurriculumSystem, string> = {
  cbse: '🇮🇳 CBSE',
  cc: '🇺🇸 Common Core',
  uk: '🇬🇧 UK National',
  au: '🇦🇺 ACARA',
  olym: '🏅 Olympiad',
};

export interface ExamPrepTrack {
  name: string;
  org: string;
  target: string;
}

export const EXAM_PREP_BY_TRACK: Record<Pathway, readonly ExamPrepTrack[]> = {
  tots: [],
  young: [
    { name: '🏅 IMO — International Math Olympiad (Class 1-2)', org: 'SOF (India)', target: 'Counting, add and take away, shapes' },
    { name: '📖 IEO — International English Olympiad (Class 1-2)', org: 'SOF (India)', target: 'Words, rhymes, simple sentences' },
  ],
  senior: [
    { name: '🏅 IMO — International Math Olympiad (Class 6-8)', org: 'SOF (India)', target: 'Fractions, ratio, algebra, geometry' },
    { name: '🔬 NSO — National Science Olympiad (Class 6-8)', org: 'SOF (India)', target: 'Life science, physics, earth science' },
    { name: '📖 IEO — International English Olympiad (Class 6-8)', org: 'SOF (India)', target: 'Grammar, vocabulary, comprehension' },
    { name: '💻 NCO — National Cyber Olympiad (Class 6-8)', org: 'SOF (India)', target: 'Logic, computing, digital safety' },
    { name: '🇦🇺 NAPLAN (Australia, Year 7)', org: 'ACARA', target: 'Numeracy + Literacy' },
  ],
  primary: [
    { name: '🏅 IMO — International Math Olympiad', org: 'SOF (India)', target: 'Math + Logical Reasoning' },
    { name: '🔬 NSO — National Science Olympiad', org: 'SOF (India)', target: 'Science + Achievers Section' },
    { name: '📖 IEO — International English Olympiad', org: 'SOF (India)', target: 'Word & Structure, Reading' },
    { name: '💻 NCO — National Cyber Olympiad', org: 'SOF (India)', target: 'Logic + Computers' },
    { name: '🐝 Scripps / MaRRS Spelling Bee', org: 'US / India', target: 'Grade 3–5 Word Lists' },
    { name: '🇦🇺 NAPLAN (Australia)', org: 'ACARA', target: 'Numeracy + Literacy (Yr 3-5)' },
  ],
  early: [
    { name: '🌱 Early Years Foundation', org: 'UK EYFS / India Pre-primary', target: 'Letters, numbers, colors, shapes' },
    { name: '📚 Kindergarten Readiness', org: 'US Common Core K', target: 'Count to 20, letter recognition' },
  ],
};

export const CURRICULUM: Record<Pathway, TrackCurriculum> = {
  tots: {
    pathway: 'tots',
    label: 'Play time · Ages 2 and 3',
    subtitle: 'Tap, look and listen. Animals, colours, shapes, music and more',
    subjects: [],
  },
  young: YOUNG_CURRICULUM,
  senior: SENIOR_CURRICULUM,
  early: {
    pathway: 'early',
    label: 'Early Years · Ages 4 and 5',
    subtitle: 'Foundational numbers, phonics, colors, shapes, animals & Hindi letters',
    subjects: [
      {
        emoji: '🔢',
        name: 'Numbers & Counting',
        grade: 'Pre-K / Reception / Foundation',
        systems: ['cbse', 'cc', 'uk', 'au'],
        topics: [
          { id: 'k-count5', name: 'Count to 5', diff: 1 },
          { id: 'k-count10', name: 'Count to 10', diff: 2 },
          { id: 'k-count20', name: 'Count to 20', diff: 3 },
          { id: 'k-match', name: 'Number Match', diff: 2 },
          { id: 'k-biggerN', name: 'Bigger Number', diff: 3 },
        ],
      },
      {
        emoji: '🔤',
        name: 'Alphabet (English)',
        grade: 'Pre-K / Reception',
        systems: ['cbse', 'cc', 'uk', 'au'],
        topics: [
          { id: 'k-letter', name: 'Letter Recognition', diff: 1 },
          { id: 'k-starts', name: 'Starts with...', diff: 2 },
          { id: 'k-upper', name: 'Uppercase Match', diff: 2 },
        ],
      },
      {
        emoji: '🎨',
        name: 'Colors',
        grade: 'Pre-K / Reception',
        systems: ['cbse', 'cc', 'uk', 'au'],
        topics: [
          { id: 'k-color8', name: '8 Basic Colors', diff: 1 },
          { id: 'k-color10', name: '10 Colors', diff: 2 },
        ],
      },
      {
        emoji: '🔷',
        name: 'Shapes',
        grade: 'Pre-K / K',
        systems: ['cbse', 'cc', 'uk', 'au'],
        topics: [
          { id: 'k-shape6', name: '6 Shapes', diff: 1 },
          { id: 'k-shape8', name: '8 Shapes (incl. Rectangle, Oval)', diff: 2 },
        ],
      },
      {
        emoji: '🐾',
        name: 'Animals',
        grade: 'Pre-K',
        systems: ['cbse', 'cc'],
        topics: [
          { id: 'k-animal6', name: 'Pet & Farm Animals', diff: 1 },
          { id: 'k-animal-sound', name: 'Animal Sounds', diff: 2 },
          { id: 'k-animal-wild', name: 'Wild Animals', diff: 3 },
          { id: 'k-animal-bird', name: 'Birds and Bugs', diff: 2 },
          { id: 'k-animal-water', name: 'Water Animals', diff: 2 },
        ],
      },
      {
        emoji: '🍎',
        name: 'Food & Fruits',
        grade: 'Pre-K',
        systems: ['cbse', 'cc'],
        topics: [
          { id: 'k-fruit', name: 'Fruits', diff: 1 },
          { id: 'k-veg', name: 'Vegetables', diff: 2 },
        ],
      },
      {
        emoji: '🌙',
        name: 'Sky and Space',
        grade: 'Pre-K',
        systems: ['cbse', 'cc'],
        topics: [{ id: 'k-sky', name: 'Sun, Moon, Stars and Planets', diff: 2 }],
      },
      {
        emoji: '🫁',
        name: 'Body Parts',
        grade: 'Pre-K',
        systems: ['cbse', 'cc', 'uk'],
        topics: [{ id: 'k-body', name: 'Face & Body', diff: 1 }],
      },
      {
        emoji: '🔄',
        name: 'Opposites',
        grade: 'K',
        systems: ['cbse', 'cc', 'uk', 'au'],
        topics: [{ id: 'k-opp', name: 'Opposite Pairs', diff: 2 }],
      },
      {
        emoji: '🇮🇳',
        name: 'Hindi Varnamala',
        grade: 'Pre-K India',
        systems: ['cbse'],
        topics: [
          { id: 'k-hindi-vowel', name: 'स्वर (Vowels)', diff: 1 },
          { id: 'k-hindi-cons', name: 'व्यंजन (Consonants)', diff: 2 },
        ],
      },
    ],
  },
  primary: {
    pathway: 'primary',
    label: 'Grades 3 to 5 · Ages 8 to 10 & Olympiad Prep',
    subtitle: 'Core & advanced math, spelling bee, vocabulary, grammar, science, GK & logic',
    subjects: [
      {
        emoji: '🔢',
        name: 'Math — Core',
        grade: 'Grade 3-4',
        systems: ['cbse', 'cc', 'uk', 'au'],
        topics: [
          { id: 'y-add-e', name: 'Addition (1-40)', diff: 1, gen: 'add_easy' },
          { id: 'y-add-m', name: 'Addition (2-digit)', diff: 2, gen: 'add_med' },
          { id: 'y-add-h', name: 'Addition (3-digit)', diff: 3, gen: 'add_hard' },
          { id: 'y-sub-e', name: 'Subtraction (Easy)', diff: 1, gen: 'sub_easy' },
          { id: 'y-sub-m', name: 'Subtraction (2-digit)', diff: 2, gen: 'sub_med' },
          { id: 'y-sub-h', name: 'Subtraction (3-digit)', diff: 3, gen: 'sub_hard' },
          { id: 'y-mul-e', name: 'Multiplication (Tables 1-5)', diff: 1, gen: 'mul_easy' },
          { id: 'y-mul-m', name: 'Multiplication (2x2 digit)', diff: 2, gen: 'mul_med' },
          { id: 'y-mul-h', name: 'Multiplication (Harder)', diff: 3, gen: 'mul_hard' },
          { id: 'y-div-e', name: 'Division (Easy)', diff: 1, gen: 'div_easy' },
          { id: 'y-div-m', name: 'Division (Medium)', diff: 2, gen: 'div_med' },
          { id: 'y-div-h', name: 'Division (Hard)', diff: 3, gen: 'div_hard' },
        ],
      },
      {
        emoji: '🧮',
        name: 'Math — Advanced',
        grade: 'Grade 4-5',
        systems: ['cbse', 'cc', 'uk', 'au', 'olym'],
        topics: [
          { id: 'y-wp-e', name: 'Word Problems (Easy)', diff: 1, gen: 'wp_easy' },
          { id: 'y-wp-m', name: 'Word Problems (Medium)', diff: 2, gen: 'wp_med' },
          { id: 'y-wp-h', name: 'Word Problems (Hard)', diff: 3, gen: 'wp_hard' },
          { id: 'y-time', name: 'Telling Time', diff: 2, gen: 'time' },
          { id: 'y-round', name: 'Rounding Numbers', diff: 2, gen: 'rounding' },
        ],
      },
      {
        emoji: '🔤',
        name: 'English — Spelling',
        grade: 'Grade 3-5',
        systems: ['cbse', 'cc', 'uk', 'au', 'olym'],
        topics: [
          { id: 'y-spell-g3', name: 'Grade 3-4 Words (80 words)', diff: 2 },
          { id: 'y-spell-bee', name: 'Spelling Bee Words (50 harder)', diff: 3 },
        ],
      },
      {
        emoji: '📖',
        name: 'English — Vocabulary',
        grade: 'Grade 3-5',
        systems: ['cbse', 'cc', 'uk', 'au', 'olym'],
        topics: [
          { id: 'y-syn', name: 'Synonyms (30 pairs)', diff: 2 },
          { id: 'y-ant', name: 'Antonyms (30 pairs)', diff: 2 },
        ],
      },
      {
        emoji: '✏️',
        name: 'English — Grammar',
        grade: 'Grade 3-4',
        systems: ['cbse', 'cc', 'uk', 'au'],
        topics: [{ id: 'y-grammar', name: 'Nouns, Verbs, Tense, Articles', diff: 2 }],
      },
      {
        emoji: '🔬',
        name: 'Science (NSO Prep)',
        grade: 'Grade 3-5',
        systems: ['cbse', 'cc', 'uk', 'au', 'olym'],
        topics: [{ id: 'y-science', name: 'Living World, Space, Matter, Body', diff: 2 }],
      },
      {
        emoji: '🇮🇳',
        name: 'GK — India',
        grade: 'Grade 3-5',
        systems: ['cbse'],
        topics: [{ id: 'y-gk-india', name: 'India Facts (15 Q)', diff: 2 }],
      },
      {
        emoji: '🌍',
        name: 'GK — World',
        grade: 'Grade 3-5',
        systems: ['cbse', 'cc', 'uk', 'au'],
        topics: [{ id: 'y-gk-world', name: 'World Facts (15 Q)', diff: 2 }],
      },
      {
        emoji: '🧩',
        name: 'Olympiad Logic',
        grade: 'IMO / NCO Prep',
        systems: ['olym'],
        topics: [{ id: 'y-logic', name: 'Patterns, Puzzles, Logic (18 Q)', diff: 3 }],
      },
    ],
  },
};

export interface BadgeProgressSnapshot {
  stars: number;
  bestStreak: number;
  topics: Record<string, TopicProgress>;
}

export interface BadgeDefinition {
  id: string;
  emoji: string;
  name: string;
  check: (p: BadgeProgressSnapshot) => boolean;
}

export const BADGES: readonly BadgeDefinition[] = [
  { id: 'first', emoji: '🌱', name: 'First Star', check: (p) => p.stars >= 1 },
  { id: 'ten', emoji: '⭐', name: '10 Stars', check: (p) => p.stars >= 10 },
  { id: 'fifty', emoji: '🌟', name: '50 Stars', check: (p) => p.stars >= 50 },
  { id: 'hundred', emoji: '💫', name: '100 Stars', check: (p) => p.stars >= 100 },
  { id: 'megafan', emoji: '🏆', name: '250 Stars', check: (p) => p.stars >= 250 },
  { id: 'super', emoji: '👑', name: '500 Stars', check: (p) => p.stars >= 500 },
  { id: 'streak3', emoji: '🔥', name: '3-in-a-row', check: (p) => p.bestStreak >= 3 },
  { id: 'streak5', emoji: '⚡', name: '5-in-a-row', check: (p) => p.bestStreak >= 5 },
  { id: 'streak10', emoji: '🚀', name: '10-in-a-row', check: (p) => p.bestStreak >= 10 },
  { id: 'streak20', emoji: '🌈', name: '20-in-a-row', check: (p) => p.bestStreak >= 20 },
  { id: 'tried5', emoji: '🎮', name: 'Tried 5 Topics', check: (p) => Object.keys(p.topics).length >= 5 },
  { id: 'tried10', emoji: '🎯', name: 'Tried 10 Topics', check: (p) => Object.keys(p.topics).length >= 10 },
  {
    id: 'master1',
    emoji: '🏅',
    name: 'Mastered 1 Topic',
    check: (p) => Object.values(p.topics).filter((t) => t.b >= 10 || t.m).length >= 1,
  },
  {
    id: 'master3',
    emoji: '🥇',
    name: 'Mastered 3 Topics',
    check: (p) => Object.values(p.topics).filter((t) => t.b >= 10 || t.m).length >= 3,
  },
];

export function evaluateEarnedBadgeIds(p: BadgeProgressSnapshot): string[] {
  return BADGES.filter((b) => b.check(p)).map((b) => b.id);
}
