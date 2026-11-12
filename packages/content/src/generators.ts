import {
  EARLY_ALPHABET,
  EARLY_ALPHABET_WORDS,
  EARLY_ANIMALS,
  EARLY_BODY,
  EARLY_COLORS,
  EARLY_FRUITS,
  EARLY_HINDI_LETTERS,
  EARLY_OPPOSITES,
  EARLY_SHAPES,
  type AnimalItem,
  type EmojiNamedItem,
  type MultipleChoiceItem,
  PRIMARY_GK_INDIA,
  PRIMARY_GK_WORLD,
  PRIMARY_GRAMMAR,
  PRIMARY_OLYMPIAD_LOGIC,
  PRIMARY_SCIENCE,
  PRIMARY_SPELLING_BEE,
  PRIMARY_SPELLING_G3,
  PRIMARY_VOCAB_ANTONYMS,
  PRIMARY_VOCAB_SYNONYMS,
} from './banks.js';
import { SENIOR_SPELLING, SENIOR_AFFIXES, SENIOR_COMPUTING, SENIOR_EARTH, SENIOR_GRAMMAR, SENIOR_IDIOMS, SENIOR_LIFE, SENIOR_PHYSICS, SENIOR_WORLD } from './banks-senior.js';
import {
  YOUNG_ANIMALS, YOUNG_BODY, YOUNG_DAYS, YOUNG_HABITS, YOUNG_INDIA, YOUNG_OPPOSITES, YOUNG_PLANTS,
  YOUNG_RHYMES, YOUNG_SHAPES, YOUNG_SPELLING, YOUNG_WEATHER, YOUNG_WORDS,
} from './banks-young.js';
import {
  EARLY_BIRDS_BUGS, EARLY_HOME_ANIMALS, EARLY_MORE_FRUITS, EARLY_SKY, EARLY_VEGETABLES, EARLY_WATER_ANIMALS, EARLY_WILD_ANIMALS,
} from './banks-early.js';
import { CURRICULUM, type MathGeneratorKey } from './curriculum.js';
import { type MoreMathOutput, type SeniorMathKey, type YoungMathKey, defaultChoices, seniorMath, showInt, youngMath } from './math-more.js';
import { pick, rand, shuffle, uniqOpts } from './random.js';
import { COURSE_BANKS } from './courses.js';

export { pick, rand, shuffle, uniqOpts } from './random.js';

export interface MathQuestionOutput {
  q: string;
  a: number | string;
}

export const mathGen: Record<Exclude<MathGeneratorKey, YoungMathKey | SeniorMathKey>, () => MathQuestionOutput> = {
  add_easy: () => {
    const a = rand(1, 20);
    const b = rand(1, 20);
    return { q: `${a} + ${b}`, a: a + b };
  },
  add_med: () => {
    const a = rand(20, 99);
    const b = rand(20, 99);
    return { q: `${a} + ${b}`, a: a + b };
  },
  add_hard: () => {
    const a = rand(100, 999);
    const b = rand(100, 999);
    return { q: `${a} + ${b}`, a: a + b };
  },
  sub_easy: () => {
    const a = rand(5, 20);
    const b = rand(1, a);
    return { q: `${a} − ${b}`, a: a - b };
  },
  sub_med: () => {
    const a = rand(50, 100);
    const b = rand(10, a);
    return { q: `${a} − ${b}`, a: a - b };
  },
  sub_hard: () => {
    const a = rand(500, 1000);
    const b = rand(100, a);
    return { q: `${a} − ${b}`, a: a - b };
  },
  mul_easy: () => {
    const a = rand(1, 10);
    const b = rand(1, 5);
    return { q: `${a} × ${b}`, a: a * b };
  },
  mul_med: () => {
    const a = rand(2, 12);
    const b = rand(2, 12);
    return { q: `${a} × ${b}`, a: a * b };
  },
  mul_hard: () => {
    const a = rand(10, 25);
    const b = rand(5, 15);
    return { q: `${a} × ${b}`, a: a * b };
  },
  div_easy: () => {
    const b = rand(2, 5);
    const q = rand(1, 10);
    return { q: `${b * q} ÷ ${b}`, a: q };
  },
  div_med: () => {
    const b = rand(2, 12);
    const q = rand(2, 12);
    return { q: `${b * q} ÷ ${b}`, a: q };
  },
  div_hard: () => {
    const b = rand(3, 15);
    const q = rand(10, 50);
    return { q: `${b * q} ÷ ${b}`, a: q };
  },
  wp_easy: () => {
    const a = rand(5, 20);
    const b = rand(1, Math.min(15, a));
    return { q: `Sam has ${a} apples and gives ${b} away. How many left?`, a: a - b };
  },
  wp_med: () => {
    const a = rand(5, 12);
    const b = rand(3, 8);
    return { q: `Each box has ${a} pencils. There are ${b} boxes. How many pencils?`, a: a * b };
  },
  wp_hard: () => {
    const total = rand(50, 100);
    const part = rand(10, 40);
    return { q: `A class has ${total} students. ${part} are girls. How many boys?`, a: total - part };
  },
  place: () => {
    const n = rand(100, 9999);
    const str = String(n);
    const digit = pick([...str]);
    const pos = str.indexOf(digit);
    const places = ['thousands', 'hundreds', 'tens', 'ones'] as const;
    const placeName = places[str.length - pos - 1 + (4 - str.length)] ?? 'ones';
    return { q: `In ${n}, what is the place value of digit ${digit}?`, a: placeName };
  },
  time: () => {
    const h = rand(1, 12);
    const m = pick([0, 15, 30, 45] as const);
    const mstr = m === 0 ? "o'clock" : `${m} minutes past`;
    return { q: `What time? ${h} ${mstr}`, a: `${h}:${String(m).padStart(2, '0')}` };
  },
  rounding: () => {
    const n = rand(1, 999);
    return { q: `Round ${n} to nearest 10`, a: Math.round(n / 10) * 10 };
  },
};

export interface QuestionOption {
  label: string;
  value: string;
  colorHex?: string;
  isLargeEmoji?: boolean;
}

export interface GeneratedQuestion {
  topicId: string;
  prompt: string;
  subPrompt?: string;
  highlightText?: string;
  highlightColor?: string;
  visualEmojis?: string[];
  heroEmoji?: string;
  hint?: string;
  options: QuestionOption[];
  correctValue: string;
}

const PICTURE_ONLY = /^(?:\p{Extended_Pictographic}|‍|️)+$/u;

/** True for an answer that is nothing but one or more emoji. */
export const isPictureOnly = (text: string): boolean => PICTURE_ONLY.test(text);

const MORE_MATH = { ...youngMath, ...seniorMath } satisfies Record<string, () => MoreMathOutput>;

export function generateQuestionForTopic(topicId: string): GeneratedQuestion {
  // 1. Counting
  if (topicId === 'k-count5' || topicId === 'k-count10' || topicId === 'k-count20') {
    const max = topicId === 'k-count5' ? 5 : topicId === 'k-count10' ? 10 : 20;
    const n = rand(1, max);
    const emoji = pick(['🍎', '🎈', '⭐', '🐸', '🚗', '🌸', '🦋', '🌙', '🍌', '🧸'] as const);
    const opts = uniqOpts(n, () => rand(1, max));
    return {
      topicId,
      prompt: 'How many?',
      visualEmojis: Array.from({ length: n }, () => emoji),
      options: opts.map((o) => ({ label: String(o), value: String(o) })),
      correctValue: String(n),
    };
  }

  // 2. Number Match & Bigger Number
  if (topicId === 'k-match' || topicId === 'k-biggerN') {
    const a = rand(1, 20);
    let b = rand(1, 20);
    while (b === a) b = rand(1, 20);
    const bigger = a >= b ? a : b;
    const correct = topicId === 'k-biggerN' ? bigger : a;
    return {
      topicId,
      prompt: topicId === 'k-biggerN' ? 'Which is bigger?' : `Tap the number ${a}`,
      options: shuffle([a, b]).map((n) => ({ label: String(n), value: String(n) })),
      correctValue: String(correct),
    };
  }

  // 3. Alphabet
  if (topicId === 'k-letter' || topicId === 'k-starts' || topicId === 'k-upper') {
    const letter = pick(EARLY_ALPHABET);
    const pair = EARLY_ALPHABET_WORDS[letter] ?? ['Apple', '🍎'];
    const [word, emoji] = pair;
    const opts = uniqOpts(letter, () => pick(EARLY_ALPHABET));
    const prompt =
      topicId === 'k-starts'
        ? `Which letter does "${word}" start with?`
        : topicId === 'k-upper'
          ? `Tap the big "${letter}"`
          : `Tap "${letter}"`;
    return {
      topicId,
      prompt,
      heroEmoji: topicId === 'k-starts' ? emoji : undefined,
      options: opts.map((l) => ({ label: l, value: l })),
      correctValue: letter,
    };
  }

  // 4. Colors
  if (topicId === 'k-color8' || topicId === 'k-color10') {
    const pool = topicId === 'k-color8' ? EARLY_COLORS.slice(0, 8) : EARLY_COLORS;
    const target = pick(pool);
    const distractors = shuffle(pool.filter((c) => c.name !== target.name)).slice(0, 3);
    const opts = shuffle([target, ...distractors]);
    return {
      topicId,
      prompt: `Tap ${target.name}! 🎨`,
      highlightText: target.name,
      highlightColor: target.hex,
      options: opts.map((c) => ({ label: c.name, value: c.name, colorHex: c.hex })),
      correctValue: target.name,
    };
  }

  // 5. Shapes
  if (topicId === 'k-shape6' || topicId === 'k-shape8') {
    const pool = topicId === 'k-shape6' ? EARLY_SHAPES.slice(0, 6) : EARLY_SHAPES;
    const target = pick(pool);
    const opts = shuffle([target, ...shuffle(pool.filter((s) => s.name !== target.name)).slice(0, 2)]);
    return {
      topicId,
      prompt: `Tap the ${target.name}!`,
      options: opts.map((s) => ({ label: s.emoji, value: s.name, isLargeEmoji: true })),
      correctValue: target.name,
    };
  }

  // 6. Animals: each topic has its own animals
  const animalPools: Record<string, readonly EmojiNamedItem[]> = {
    'k-animal6': EARLY_HOME_ANIMALS,
    'k-animal-wild': EARLY_WILD_ANIMALS,
    'k-animal-bird': EARLY_BIRDS_BUGS,
    'k-animal-water': EARLY_WATER_ANIMALS,
  };
  const animalPool = animalPools[topicId];
  if (animalPool || topicId === 'k-animal-sound') {
    const pool: readonly EmojiNamedItem[] = animalPool ?? EARLY_ANIMALS;
    const target = pick(pool);
    const opts = shuffle([target, ...shuffle(pool.filter((a) => a.name !== target.name)).slice(0, 2)]);
    const prompt =
      topicId === 'k-animal-sound' ? `Who says "${(target as AnimalItem).sound}"?` : `Tap the ${target.name}!`;
    return {
      topicId,
      prompt,
      options: opts.map((a) => ({ label: a.emoji, value: a.name, isLargeEmoji: true })),
      correctValue: target.name,
    };
  }

  // 7. Fruits, vegetables, and the sky: tap the picture with this name
  const thingPools: Record<string, readonly EmojiNamedItem[]> = {
    'k-fruit': [...EARLY_FRUITS, ...EARLY_MORE_FRUITS],
    'k-veg': EARLY_VEGETABLES,
    'k-sky': EARLY_SKY,
  };
  const thingPool = thingPools[topicId];
  if (thingPool) {
    const target = pick(thingPool);
    const opts = shuffle([target, ...shuffle(thingPool.filter((f) => f.name !== target.name)).slice(0, 2)]);
    return {
      topicId,
      prompt: `Where is the ${target.name}?`,
      options: opts.map((f) => ({ label: f.emoji, value: f.name, isLargeEmoji: true })),
      correctValue: target.name,
    };
  }

  // 8. Body parts
  if (topicId === 'k-body') {
    const target = pick(EARLY_BODY);
    const opts = shuffle([
      target,
      ...shuffle(EARLY_BODY.filter((b) => b.name !== target.name)).slice(0, 2),
    ]);
    return {
      topicId,
      prompt: `Where is the ${target.name}?`,
      options: opts.map((b) => ({ label: b.emoji, value: b.name, isLargeEmoji: true })),
      correctValue: target.name,
    };
  }

  // 9. Opposites
  if (topicId === 'k-opp') {
    const [w1, w2, e1, e2] = pick(EARLY_OPPOSITES);
    const askFirst = Math.random() < 0.5;
    const correctEm = askFirst ? e1 : e2;
    const otherEm = askFirst ? e2 : e1;
    const distractors = shuffle(
      EARLY_ANIMALS.map((a) => a.emoji).filter((e) => e !== correctEm && e !== otherEm),
    ).slice(0, 1);
    const opts = shuffle([correctEm, otherEm, ...distractors]);
    return {
      topicId,
      prompt: `Opposite of ${askFirst ? w2 : w1}? ${askFirst ? e2 : e1}`,
      options: opts.map((e) => ({ label: e, value: e, isLargeEmoji: true })),
      correctValue: correctEm,
    };
  }

  // 10. Hindi letters
  if (topicId === 'k-hindi-vowel' || topicId === 'k-hindi-cons') {
    const pool =
      topicId === 'k-hindi-vowel' ? EARLY_HINDI_LETTERS.slice(0, 4) : EARLY_HINDI_LETTERS.slice(4);
    const target = pick(pool);
    const opts = shuffle([
      target,
      ...shuffle(pool.filter((l) => l.letter !== target.letter)).slice(0, 2),
    ]);
    return {
      topicId,
      prompt: `Tap ${target.sound} (${target.word} ${target.emoji})`,
      options: opts.map((l) => ({ label: l.letter, value: l.letter })),
      correctValue: target.letter,
    };
  }

  // 11. Math generators
  const mathTopic = Object.values(CURRICULUM)
    .flatMap((c) => c.subjects)
    .flatMap((s) => s.topics)
    .find((t) => t.id === topicId);
  if (mathTopic?.gen && mathTopic.gen in MORE_MATH) {
    const g = MORE_MATH[mathTopic.gen as keyof typeof MORE_MATH]();
    const choices = g.opts ?? (typeof g.a === 'number' ? defaultChoices(g.a) : [g.a]);
    return {
      topicId,
      prompt: g.plain ? g.q : `${g.q} = ?`,
      options: shuffle(choices).map((o) => ({ label: typeof o === 'number' ? showInt(o) : o, value: String(o) })),
      correctValue: String(g.a),
    };
  }
  if (mathTopic?.gen) {
    const g = mathGen[mathTopic.gen as keyof typeof mathGen]();
    const correct = g.a;
    let opts: (number | string)[];
    if (typeof correct === 'number') {
      opts = uniqOpts(correct, () => Math.max(0, correct + rand(-5, 5)));
    } else if (mathTopic.gen === 'place') {
      const base = ['ones', 'tens', 'hundreds', 'thousands'];
      opts = shuffle(base);
      if (!opts.includes(correct)) opts[0] = correct;
    } else if (mathTopic.gen === 'time') {
      const parts = String(correct).split(':');
      const h = Number(parts[0] || 12);
      const m = parts[1] || '00';
      const distractors = [
        `${((h + 1) % 12) || 12}:${m}`,
        `${h}:${m === '00' ? '30' : '00'}`,
        `${((h + 2) % 12) || 12}:${m === '15' ? '45' : '15'}`,
      ];
      opts = shuffle([correct, ...distractors]);
    } else {
      opts = [correct];
    }
    return {
      topicId,
      prompt: `${g.q} = ?`,
      options: opts.map((o) => ({ label: String(o), value: String(o) })),
      correctValue: String(correct),
    };
  }

  // 12. Spelling
  const spellingBanks: Record<string, readonly string[]> = {
    'y-spell-g3': PRIMARY_SPELLING_G3,
    'y-spell-bee': PRIMARY_SPELLING_BEE,
    'g-cvc': YOUNG_SPELLING,
    's-spell': SENIOR_SPELLING,
  };
  if (spellingBanks[topicId]) {
    const bank = spellingBanks[topicId]!;
    const word = pick(bank);
    const missingIdx = rand(0, word.length - 1);
    const missingChar = word[missingIdx] ?? 'A';
    const display = word
      .split('')
      .map((c, i) => (i === missingIdx ? '_' : c))
      .join(' ');
    const distractors = shuffle(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter((c) => c !== missingChar),
    ).slice(0, 3);
    const opts = shuffle([missingChar, ...distractors]);
    return {
      topicId,
      subPrompt: 'Fill in the missing letter',
      prompt: display,
      hint: `Full word has ${word.length} letters`,
      options: opts.map((o) => ({ label: o, value: o })),
      correctValue: missingChar,
    };
  }

  // 13. Vocabulary Synonyms & Antonyms
  if (topicId === 'y-syn' || topicId === 'y-ant' || topicId === 'g-opp') {
    const bank = topicId === 'y-syn' ? PRIMARY_VOCAB_SYNONYMS : topicId === 'g-opp' ? YOUNG_OPPOSITES : PRIMARY_VOCAB_ANTONYMS;
    const [p0, p1] = pick(bank);
    const askFirst = Math.random() < 0.5;
    const q = askFirst ? p0 : p1;
    const ans = askFirst ? p1 : p0;
    // Never offer a word twice, or a word that is also a right answer to this question.
    const related = new Set(bank.filter((pair) => pair.includes(q) || pair.includes(ans)).flat());
    const distractors = shuffle([...new Set(bank.flat())].filter((w) => !related.has(w))).slice(0, 3);
    const opts = shuffle([ans, ...distractors]);
    return {
      topicId,
      prompt: `${topicId === 'y-syn' ? 'Another word for' : 'Opposite of'} "${q}"?`,
      options: opts.map((o) => ({ label: o, value: o })),
      correctValue: ans,
    };
  }

  // 14. Multiple-choice banks (Science, GK India, GK World, Grammar, Olympiad Logic)
  const lookup: Record<string, readonly MultipleChoiceItem[]> = {
    'y-science': PRIMARY_SCIENCE,
    'y-gk-india': PRIMARY_GK_INDIA,
    'y-gk-world': PRIMARY_GK_WORLD,
    'y-grammar': PRIMARY_GRAMMAR,
    'y-logic': PRIMARY_OLYMPIAD_LOGIC,
    'g-animals': YOUNG_ANIMALS,
    'g-plants': YOUNG_PLANTS,
    'g-rhyme': YOUNG_RHYMES,
    'g-nouns': YOUNG_WORDS,
    'g-shapes': YOUNG_SHAPES,
    'g-weather': YOUNG_WEATHER,
    'g-body': YOUNG_BODY,
    'g-days': YOUNG_DAYS,
    'g-india': YOUNG_INDIA,
    'g-habits': YOUNG_HABITS,
    's-grammar': SENIOR_GRAMMAR,
    's-idioms': SENIOR_IDIOMS,
    's-affix': SENIOR_AFFIXES,
    's-life': SENIOR_LIFE,
    's-earth': SENIOR_EARTH,
    's-physics': SENIOR_PHYSICS,
    's-computing': SENIOR_COMPUTING,
    's-world': SENIOR_WORLD,
    ...COURSE_BANKS,
  };
  const bank = lookup[topicId];
  if (bank) {
    const item = pick(bank);
    const opts = shuffle(item.opts);
    // Answers made only of pictures are shown as big picture buttons, for children who cannot read yet.
    const pictureAnswers = opts.every(isPictureOnly);
    return {
      topicId,
      prompt: item.q,
      hint: item.hint,
      options: opts.map((o) => ({ label: o, value: o, ...(pictureAnswers ? { isLargeEmoji: true } : {}) })),
      correctValue: item.a,
    };
  }

  throw new Error(`Unknown topicId: ${topicId}`);
}
