import type { TrackCurriculum } from './curriculum.js';

/** Ages 11 to 13: grades 6 to 8. Fractions, percentages, algebra, grammar and science. */
export const SENIOR_CURRICULUM: TrackCurriculum = {
  pathway: 'senior',
  label: 'Grades 6 to 8 · Ages 11 to 13',
  subtitle: 'Fractions, decimals, percentages, algebra, geometry, grammar, science and computing',
  subjects: [
    {
      emoji: '🔢',
      name: 'Number Skills',
      grade: 'Grade 6-7',
      systems: ['cbse', 'cc', 'uk', 'au'],
      topics: [
        { id: 's-int', name: 'Negative numbers', diff: 1, gen: 'int' },
        { id: 's-powers', name: 'Squares, cubes and roots', diff: 1, gen: 'powers' },
        { id: 's-bodmas', name: 'Order of operations', diff: 2, gen: 'bodmas' },
        { id: 's-hcf', name: 'HCF and LCM', diff: 2, gen: 'hcf_lcm' },
      ],
    },
    {
      emoji: '🍕',
      name: 'Fractions and Decimals',
      grade: 'Grade 6-7',
      systems: ['cbse', 'cc', 'uk', 'au', 'olym'],
      topics: [
        { id: 's-fsimp', name: 'Simplify fractions', diff: 2, gen: 'frac_simp' },
        { id: 's-dec', name: 'Decimals', diff: 2, gen: 'dec' },
        { id: 's-fadd', name: 'Add fractions', diff: 2, gen: 'frac_add' },
        { id: 's-fmul', name: 'Multiply fractions', diff: 3, gen: 'frac_mul' },
      ],
    },
    {
      emoji: '💯',
      name: 'Percentages and Ratio',
      grade: 'Grade 7',
      systems: ['cbse', 'cc', 'uk', 'au', 'olym'],
      topics: [
        { id: 's-percent', name: 'Percentages', diff: 2, gen: 'percent' },
        { id: 's-ratio', name: 'Ratio and sharing', diff: 3, gen: 'ratio' },
      ],
    },
    {
      emoji: '🧮',
      name: 'Algebra and Problems',
      grade: 'Grade 7-8',
      systems: ['cbse', 'cc', 'uk', 'au', 'olym'],
      topics: [
        { id: 's-alg1', name: 'Find x (one step)', diff: 2, gen: 'alg1' },
        { id: 's-alg2', name: 'Find x (two steps)', diff: 3, gen: 'alg2' },
        { id: 's-speed', name: 'Speed, distance and time', diff: 3, gen: 'speed' },
        { id: 's-wp', name: 'Multi-step word problems', diff: 3, gen: 'wp_multi' },
      ],
    },
    {
      emoji: '📐',
      name: 'Geometry and Data',
      grade: 'Grade 6-8',
      systems: ['cbse', 'cc', 'uk', 'au'],
      topics: [
        { id: 's-area', name: 'Area and perimeter', diff: 2, gen: 'area' },
        { id: 's-angles', name: 'Angles', diff: 3, gen: 'angles' },
        { id: 's-stats', name: 'Mean, median and range', diff: 2, gen: 'stats' },
      ],
    },
    {
      emoji: '✏️',
      name: 'English',
      grade: 'Grade 6-8',
      systems: ['cbse', 'cc', 'uk', 'au', 'olym'],
      topics: [
        { id: 's-grammar', name: 'Grammar: voice, tense, clauses', diff: 3 },
        { id: 's-idioms', name: 'Idioms', diff: 2 },
        { id: 's-affix', name: 'Prefixes, suffixes and roots', diff: 2 },
        { id: 's-spell', name: 'Spelling (trickier words)', diff: 3 },
      ],
    },
    {
      emoji: '🔬',
      name: 'Science',
      grade: 'Grade 6-8',
      systems: ['cbse', 'cc', 'uk', 'au', 'olym'],
      topics: [
        { id: 's-life', name: 'Life science', diff: 2 },
        { id: 's-earth', name: 'Earth and weather', diff: 2 },
        { id: 's-physics', name: 'Forces, energy and light', diff: 3 },
      ],
    },
    {
      emoji: '💻',
      name: 'Computing',
      grade: 'Grade 6-8',
      systems: ['cbse', 'cc', 'uk', 'au', 'olym'],
      topics: [{ id: 's-computing', name: 'Binary, algorithms and safety', diff: 2 }],
    },
    {
      emoji: '🌍',
      name: 'World Knowledge',
      grade: 'Grade 6-8',
      systems: ['cbse', 'cc', 'uk', 'au'],
      topics: [{ id: 's-world', name: 'Countries, rivers and history', diff: 2 }],
    },
    {
      emoji: '🧩',
      name: 'Logic',
      grade: 'Olympiad Prep',
      systems: ['olym'],
      topics: [{ id: 's-logic', name: 'Number patterns', diff: 3, gen: 'seq' }],
    },
  ],
};
