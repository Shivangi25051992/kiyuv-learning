import { pick, rand, shuffle } from './random.js';

/**
 * Maths question makers for the grade 1 to 2 path (ages 6 and 7) and the grade 6 to 8 path
 * (ages 11 to 13). Each returns the question, the right answer, and (where the usual
 * "a few off" wrong answers would not teach anything) its own set of answers to choose from.
 */
export interface MoreMathOutput {
  q: string;
  a: number | string;
  /** Every answer to show, the right one included. Used instead of numbers near the answer. */
  opts?: (number | string)[];
  /** The question is a full sentence, so it is shown without "= ?" after it. */
  plain?: boolean;
}

const MINUS = '−';

/** Show a whole number with a proper minus sign. */
export const showInt = (n: number): string => (n < 0 ? `${MINUS}${-n}` : String(n));

/** Whole numbers near the right one, never repeating it or each other. */
function nearby(correct: number, steps: readonly number[], floor?: number): number[] {
  const out = new Set<number>([correct]);
  for (const s of shuffle(steps.flatMap((x) => [x, -x]))) {
    const v = correct + s;
    if (floor !== undefined && v < floor) continue;
    out.add(v);
    if (out.size === 4) break;
  }
  let n = 1;
  while (out.size < 4) {
    const v = correct + n++;
    if (floor === undefined || v >= floor) out.add(v);
  }
  return shuffle([...out]);
}

/** Whole-number answers to choose from when a question gives none of its own. */
export const defaultChoices = (correct: number): number[] => nearby(correct, [1, 2, 3, 5], 0);

/** The right answer plus up to three listed wrong ones, topped up with near misses. */
function choices(correct: number, wrong: readonly number[], floor?: number): number[] {
  const out = [correct];
  const ok = (v: number) => !out.includes(v) && (floor === undefined || v >= floor);
  for (const w of wrong) if (ok(w) && out.length < 4) out.push(w);
  for (const v of nearby(correct, [1, 2, 3, 5, 10], floor)) if (ok(v) && out.length < 4) out.push(v);
  return shuffle(out);
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number): number => (a / gcd(a, b)) * b;

/** A decimal written without trailing zeros: 12.50 becomes "12.5", 12.00 becomes "12". */
function decimal(n: number, scale: 10 | 100): string {
  const text = (n / scale).toFixed(scale === 10 ? 1 : 2);
  return text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;
}

function fraction(n: number, d: number): string {
  const g = gcd(n, d);
  const [rn, rd] = [n / g, d / g];
  return rd === 1 ? String(rn) : `${rn}/${rd}`;
}

/** Wrong fractions that are never equal in value to the right one. */
function fractionOpts(n: number, d: number, extras: readonly (readonly [number, number])[]): string[] {
  const right = fraction(n, d);
  const seen = new Set<string>([right]);
  const out = [right];
  const tryAdd = (x: number, y: number) => {
    if (y <= 0 || x <= 0 || out.length >= 4) return;
    if (x * d === n * y) return;
    const text = `${x}/${y}`;
    if (seen.has(text) || seen.has(fraction(x, y))) return;
    seen.add(text);
    out.push(text);
  };
  extras.forEach(([x, y]) => tryAdd(x, y));
  let step = 1;
  while (out.length < 4 && step < 30) {
    tryAdd(n + step, d);
    tryAdd(n, d + step);
    step++;
  }
  return shuffle(out);
}

/** Two numbers with nothing in common, the second bigger. */
function coprimePair(maxD: number): [number, number] {
  for (;;) {
    const d = rand(3, maxD);
    const n = rand(1, d - 1);
    if (gcd(n, d) === 1) return [n, d];
  }
}

// ------------------------------------------------------------------ ages 6 and 7

export const youngMath = {
  add_10: (): MoreMathOutput => {
    const a = rand(1, 9);
    const b = rand(0, 10 - a);
    return { q: `${a} + ${b}`, a: a + b };
  },
  sub_10: (): MoreMathOutput => {
    const a = rand(2, 10);
    const b = rand(0, a);
    return { q: `${a} ${MINUS} ${b}`, a: a - b };
  },
  add_20: (): MoreMathOutput => {
    const a = rand(6, 14);
    const b = rand(2, 20 - a);
    return { q: `${a} + ${b}`, a: a + b };
  },
  sub_20: (): MoreMathOutput => {
    const a = rand(11, 20);
    const b = rand(2, a - 1);
    return { q: `${a} ${MINUS} ${b}`, a: a - b };
  },
  compare: (): MoreMathOutput => {
    const a = rand(10, 99);
    let b = rand(10, 99);
    while (b === a) b = rand(10, 99);
    const bigger = Math.random() < 0.5;
    return {
      q: `Which number is ${bigger ? 'bigger' : 'smaller'}: ${a} or ${b}?`,
      a: bigger ? Math.max(a, b) : Math.min(a, b),
      opts: [a, b],
      plain: true,
    };
  },
  tens_ones: (): MoreMathOutput => {
    const t = rand(1, 9);
    const o = rand(0, 9);
    const answer = t * 10 + o;
    // Swapped digits and "tens plus ones" are the slips a child really makes.
    return { q: `${t} tens and ${o} ones make...`, a: answer, opts: choices(answer, [o * 10 + t, t + o, answer + 10, answer - 10], 1), plain: true };
  },
  skip: (): MoreMathOutput => {
    const step = pick([2, 5, 10] as const);
    const start = step * rand(0, 4);
    const terms = [0, 1, 2, 3].map((i) => start + i * step);
    const answer = start + 4 * step;
    return {
      q: `Count by ${step}s: ${terms.join(', ')}, ___`,
      a: answer,
      opts: nearby(answer, [step, 1, 2 * step]),
      plain: true,
    };
  },
  even_odd: (): MoreMathOutput => {
    const n = rand(1, 60);
    return { q: `Is ${n} even or odd?`, a: n % 2 === 0 ? 'Even' : 'Odd', opts: ['Even', 'Odd'], plain: true };
  },
  time_easy: (): MoreMathOutput => {
    const h = rand(1, 12);
    const half = Math.random() < 0.5;
    const next = (x: number) => (x % 12) + 1;
    const q = half
      ? `The short hand is between ${h} and ${next(h)}. The long hand points to 6. What time is it?`
      : `The short hand points to ${h}. The long hand points to 12. What time is it?`;
    const right = `${h}:${half ? '30' : '00'}`;
    const wrong = [`${h}:${half ? '00' : '30'}`, `${next(h)}:${half ? '30' : '00'}`, `${((h + 10) % 12) + 1}:${half ? '00' : '30'}`];
    return { q, a: right, opts: shuffle([right, ...wrong]), plain: true };
  },
  add_2d: (): MoreMathOutput => {
    const a1 = rand(0, 9);
    const b1 = rand(0, 9 - a1);
    const a = rand(1, 5) * 10 + a1;
    const b = rand(1, 4) * 10 + b1;
    return { q: `${a} + ${b}`, a: a + b };
  },
  groups: (): MoreMathOutput => {
    const things = ['apples', 'sweets', 'flowers', 'pencils', 'stickers', 'marbles'] as const;
    const holder = pick(['plates', 'boxes', 'bags', 'baskets'] as const);
    const n = rand(2, 5);
    const m = rand(2, 5);
    const t = pick(things);
    return { q: `There are ${n} ${holder}. Each one has ${m} ${t}. How many ${t} in all?`, a: n * m, plain: true };
  },
  mul_2510: (): MoreMathOutput => {
    const t = pick([2, 5, 10] as const);
    const b = rand(1, 10);
    return { q: `${t} × ${b}`, a: t * b };
  },
} satisfies Record<string, () => MoreMathOutput>;

// ---------------------------------------------------------------- ages 11 to 13

const SUPERSCRIPT: Record<number, string> = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' };

export const seniorMath = {
  int: (): MoreMathOutput => {
    const a = rand(-15, 15) || 7;
    const b = rand(-12, 12) || -4;
    const op = pick(['+', MINUS, '×'] as const);
    const right = (n: number) => (n < 0 ? `(${showInt(n)})` : String(n));
    const answer = op === '+' ? a + b : op === MINUS ? a - b : a * b;
    // The usual slips: the wrong sign, or adding when it should take away.
    const slips = op === '+' ? [-answer, a - b, b - a] : op === MINUS ? [-answer, a + b, b - a] : [-answer, a + b, Math.abs(answer)];
    return { q: `${showInt(a)} ${op} ${right(b)}`, a: answer, opts: choices(answer, slips) };
  },
  powers: (): MoreMathOutput => {
    const kind = pick(['sq', 'cube', 'root', 'pow'] as const);
    if (kind === 'sq') {
      const n = rand(3, 15);
      return { q: `${n}${SUPERSCRIPT[2]}`, a: n * n, opts: choices(n * n, [n * 2, n * n + n, (n - 1) * (n - 1)], 1) };
    }
    if (kind === 'cube') {
      const n = rand(2, 6);
      return { q: `${n}${SUPERSCRIPT[3]}`, a: n ** 3, opts: choices(n ** 3, [n * 3, n * n, n ** 3 + n], 1) };
    }
    if (kind === 'root') {
      const n = rand(3, 15);
      return { q: `√${n * n}`, a: n, opts: choices(n, [n * 2, n + 1, n - 1], 1) };
    }
    const k = rand(4, 8);
    return { q: `2${SUPERSCRIPT[k]}`, a: 2 ** k, opts: choices(2 ** k, [2 * k, 2 ** (k - 1), 2 ** (k + 1)], 1) };
  },
  bodmas: (): MoreMathOutput => {
    const kind = rand(1, 4);
    const a = rand(2, 9);
    const b = rand(2, 9);
    const c = rand(2, 9);
    if (kind === 1) return { q: `${a} + ${b} × ${c}`, a: a + b * c, opts: choices(a + b * c, [(a + b) * c, a * b + c, a + b + c], 1) };
    if (kind === 2) return { q: `(${a} + ${b}) × ${c}`, a: (a + b) * c, opts: choices((a + b) * c, [a + b * c, a * c + b, a + b + c], 1) };
    if (kind === 3) {
      const right = a * b - c;
      if (right < 1) return seniorMath.bodmas();
      return { q: `${a} × ${b} ${MINUS} ${c}`, a: right, opts: choices(right, [a * (b - c), a * b + c, right + a], 1) };
    }
    const k = rand(2, 6);
    return { q: `${a} + ${b * k} ÷ ${k}`, a: a + b, opts: choices(a + b, [(a + b * k) / k, a + b * k, b], 1) };
  },
  hcf_lcm: (): MoreMathOutput => {
    const g = rand(2, 9);
    const [x, y] = coprimePair(9);
    const a = g * x;
    const b = g * y;
    const wantHcf = Math.random() < 0.5;
    const answer = wantHcf ? g : lcm(a, b);
    const slips = wantHcf ? [lcm(a, b), a, 1] : [g, a * b, b];
    return { q: `What is the ${wantHcf ? 'HCF' : 'LCM'} of ${a} and ${b}?`, a: answer, opts: choices(answer, slips, 1), plain: true };
  },
  frac_simp: (): MoreMathOutput => {
    const [n0, d0] = coprimePair(9);
    const g = rand(2, 6);
    const n = n0 * g;
    const d = d0 * g;
    return {
      q: `Write ${n}/${d} in its simplest form.`,
      a: `${n0}/${d0}`,
      opts: fractionOpts(n0, d0, [[n, d], [n0, d0 + 1], [n0 + 1, d0]]),
      plain: true,
    };
  },
  frac_add: (): MoreMathOutput => {
    if (Math.random() < 0.5) {
      const d = pick([5, 6, 7, 8, 9, 10, 12] as const);
      const n1 = rand(1, d - 2);
      const n2 = rand(1, d - n1 - 1);
      const s = n1 + n2;
      return { q: `${n1}/${d} + ${n2}/${d}`, a: fraction(s, d), opts: fractionOpts(s, d, [[s, d * 2], [n1 + n2, d + d]]) };
    }
    const [d1, d2] = pick([[2, 4], [2, 3], [3, 6], [4, 8], [2, 6], [3, 4], [5, 10], [2, 5]] as const);
    const n1 = rand(1, d1 - 1);
    const n2 = rand(1, d2 - 1);
    const l = lcm(d1, d2);
    const s = (n1 * l) / d1 + (n2 * l) / d2;
    return { q: `${n1}/${d1} + ${n2}/${d2}`, a: fraction(s, l), opts: fractionOpts(s, l, [[n1 + n2, d1 + d2], [n1 + n2, l]]) };
  },
  frac_mul: (): MoreMathOutput => {
    const [n1, d1] = coprimePair(7);
    const [n2, d2] = coprimePair(7);
    const n = n1 * n2;
    const d = d1 * d2;
    return { q: `${n1}/${d1} × ${n2}/${d2}`, a: fraction(n, d), opts: fractionOpts(n, d, [[n1 + n2, d1 + d2], [n1 * d2, d1 * n2]]) };
  },
  dec: (): MoreMathOutput => {
    const kind = pick(['add', 'sub', 'mul', 'div'] as const);
    const scale = pick([10, 100] as const);
    const spread = scale === 10 ? [1, 10, 2] : [1, 10, 100];
    const fmt = (n: number) => decimal(n, scale);
    const options = (right: number, s: 10 | 100) => nearby(right, spread, 1).map((n) => decimal(n, s));
    if (kind === 'add' || kind === 'sub') {
      const A = rand(110, 990);
      const B = rand(11, A - 10);
      const right = kind === 'add' ? A + B : A - B;
      return { q: `${fmt(A)} ${kind === 'add' ? '+' : MINUS} ${fmt(B)}`, a: decimal(right, scale), opts: options(right, scale) };
    }
    const k = rand(2, 9);
    const A = rand(11, 99);
    if (kind === 'mul') return { q: `${decimal(A, 10)} × ${k}`, a: decimal(A * k, 10), opts: options(A * k, 10) };
    return { q: `${decimal(A * k, 10)} ÷ ${k}`, a: decimal(A, 10), opts: options(A, 10) };
  },
  percent: (): MoreMathOutput => {
    const kind = pick(['of', 'off', 'is'] as const);
    if (kind === 'of') {
      const p = pick([5, 10, 20, 25, 30, 40, 50, 75] as const);
      const base = 20 * rand(1, 20);
      const right = (base * p) / 100;
      return { q: `What is ${p}% of ${base}?`, a: right, opts: nearby(right, [p / 5 || 1, 5, 10, 2], 1), plain: true };
    }
    if (kind === 'off') {
      const p = pick([10, 20, 25, 50] as const);
      const base = 20 * rand(2, 20);
      const right = (base * (100 - p)) / 100;
      return { q: `A bag costs ${base} rupees. It is sold at ${p}% off. What is the new price in rupees?`, a: right, opts: nearby(right, [(base * p) / 100, 5, 10], 1), plain: true };
    }
    const total = pick([20, 25, 40, 50, 80, 200] as const);
    const p = pick([10, 20, 25, 40, 50, 60, 75] as const);
    const part = (total * p) / 100;
    if (!Number.isInteger(part)) return seniorMath.percent();
    const wrong = shuffle([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80].filter((x) => x !== p)).slice(0, 3);
    return { q: `${part} out of ${total} is what percent?`, a: `${p}%`, opts: shuffle([`${p}%`, ...wrong.map((w) => `${w}%`)]), plain: true };
  },
  ratio: (): MoreMathOutput => {
    if (Math.random() < 0.5) {
      const [a, b] = coprimePair(7);
      const k = rand(2, 9);
      return { q: `The ratio of boys to girls is ${a}:${b}. There are ${a * k} boys. How many girls?`, a: b * k, opts: nearby(b * k, [k, 1, 2], 1), plain: true };
    }
    const a = rand(1, 5);
    const b = rand(a + 1, 7);
    const k = rand(2, 8);
    const total = (a + b) * k;
    return { q: `Share ${total} sweets in the ratio ${a}:${b}. How many sweets is the bigger share?`, a: b * k, opts: nearby(b * k, [k, 2, 5], 1), plain: true };
  },
  alg1: (): MoreMathOutput => {
    const x = rand(2, 15);
    const a = rand(2, 12);
    const kind = rand(1, 4);
    const q =
      kind === 1 ? `x + ${a} = ${x + a}. What is x?`
      : kind === 2 ? `x ${MINUS} ${a} = ${x - a}. What is x?`
      : kind === 3 ? `${a}x = ${a * x}. What is x?`
      : `x ÷ ${a} = ${x}. What is x?`;
    const right = kind === 4 ? x * a : x;
    return { q, a: right, opts: nearby(right, [1, 2, a], 0), plain: true };
  },
  alg2: (): MoreMathOutput => {
    const x = rand(2, 12);
    const a = rand(2, 9);
    const b = rand(1, 15);
    const plus = Math.random() < 0.5;
    const total = plus ? a * x + b : a * x - b;
    if (total <= 0) return seniorMath.alg2();
    return { q: `${a}x ${plus ? '+' : MINUS} ${b} = ${total}. What is x?`, a: x, opts: nearby(x, [1, 2, 3], 0), plain: true };
  },
  area: (): MoreMathOutput => {
    const kind = rand(1, 4);
    const l = rand(3, 20);
    const w = rand(2, 15);
    if (kind === 1) return { q: `A rectangle is ${l} cm long and ${w} cm wide. What is its area in square cm?`, a: l * w, opts: nearby(l * w, [l, w, 2 * (l + w)], 1), plain: true };
    if (kind === 2) return { q: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter in cm?`, a: 2 * (l + w), opts: nearby(2 * (l + w), [l + w, 2, 4], 1), plain: true };
    if (kind === 3) return { q: `A square has sides of ${l} cm. What is its area in square cm?`, a: l * l, opts: nearby(l * l, [l, 2 * l, 4 * l], 1), plain: true };
    const base = rand(2, 12) * 2;
    return { q: `A triangle has base ${base} cm and height ${w} cm. What is its area in square cm?`, a: (base * w) / 2, opts: nearby((base * w) / 2, [w, base, 2], 1), plain: true };
  },
  angles: (): MoreMathOutput => {
    const kind = rand(1, 4);
    if (kind === 1) {
      const a = rand(30, 80);
      const b = rand(30, 80);
      return { q: `Two angles of a triangle are ${a}° and ${b}°. What is the third angle in degrees?`, a: 180 - a - b, opts: nearby(180 - a - b, [10, 20, 5], 1), plain: true };
    }
    if (kind === 2) {
      const a = rand(25, 155);
      return { q: `Two angles on a straight line make 180°. One is ${a}°. What is the other in degrees?`, a: 180 - a, opts: nearby(180 - a, [10, 20, 5], 1), plain: true };
    }
    if (kind === 3) {
      const a = rand(15, 75);
      return { q: `Two angles are complementary (they make 90°). One is ${a}°. What is the other in degrees?`, a: 90 - a, opts: nearby(90 - a, [10, 5, 15], 1), plain: true };
    }
    const a = rand(20, 55) * 2;
    return { q: `In a triangle, two angles are equal and the third is ${a}°. What is each equal angle in degrees?`, a: (180 - a) / 2, opts: nearby((180 - a) / 2, [5, 10, 2], 1), plain: true };
  },
  stats: (): MoreMathOutput => {
    const kind = pick(['mean', 'median', 'range'] as const);
    if (kind === 'mean') {
      const n = rand(4, 6);
      const mean = rand(5, 40);
      const nums = Array.from({ length: n - 1 }, () => rand(Math.max(1, mean - 8), mean + 8));
      const last = mean * n - nums.reduce((s, v) => s + v, 0);
      if (last < 1) return seniorMath.stats();
      const all = shuffle([...nums, last]);
      return { q: `What is the mean of ${all.join(', ')}?`, a: mean, opts: nearby(mean, [1, 2, 3], 1), plain: true };
    }
    const count = kind === 'median' ? pick([5, 7] as const) : rand(5, 7);
    const nums = Array.from({ length: count }, () => rand(2, 60));
    const sorted = [...nums].sort((a, b) => a - b);
    const right = kind === 'median' ? sorted[(count - 1) / 2]! : sorted[count - 1]! - sorted[0]!;
    return { q: `What is the ${kind} of ${nums.join(', ')}?`, a: right, opts: nearby(right, [1, 2, 5], 0), plain: true };
  },
  speed: (): MoreMathOutput => {
    const kind = rand(1, 3);
    const s = rand(2, 12) * 5;
    const t = rand(2, 6);
    if (kind === 1) return { q: `A train goes at ${s} km per hour for ${t} hours. How far does it go in km?`, a: s * t, opts: nearby(s * t, [s, t * 5, 10], 1), plain: true };
    if (kind === 2) return { q: `A cyclist rides ${s * t} km at ${s} km per hour. How many hours does it take?`, a: t, opts: nearby(t, [1, 2], 1), plain: true };
    return { q: `A bus travels ${s * t} km in ${t} hours. What is its speed in km per hour?`, a: s, opts: nearby(s, [5, 10, t], 1), plain: true };
  },
  wp_multi: (): MoreMathOutput => {
    const kind = rand(1, 3);
    if (kind === 1) {
      const n = rand(3, 9);
      const p = rand(5, 30);
      const pay = Math.ceil((n * p + 1) / 50) * 50;
      return { q: `Asha buys ${n} notebooks at ${p} rupees each and pays with ${pay} rupees. How much change does she get?`, a: pay - n * p, opts: nearby(pay - n * p, [p, 10, 5], 1), plain: true };
    }
    if (kind === 2) {
      const day = rand(8, 25);
      const days = rand(3, 8);
      const left = rand(10, 60);
      return { q: `A tank has ${day * days + left} litres. ${day} litres are used each day for ${days} days. How many litres are left?`, a: left, opts: nearby(left, [day, 10, 5], 1), plain: true };
    }
    const bro = rand(3, 12);
    return { q: `Mina is 3 times as old as her brother. Together they are ${bro * 4} years old. How old is her brother?`, a: bro, opts: nearby(bro, [bro, 2, 3], 1), plain: true };
  },
  seq: (): MoreMathOutput => {
    const kind = rand(1, 4);
    let terms: number[];
    if (kind === 1) {
      const d = rand(2, 9);
      const a = rand(1, 20);
      terms = Array.from({ length: 5 }, (_, i) => a + i * d);
    } else if (kind === 2) {
      const r = pick([2, 3] as const);
      const a = rand(1, 4);
      terms = Array.from({ length: 5 }, (_, i) => a * r ** i);
    } else if (kind === 3) {
      const a = rand(1, 5);
      terms = Array.from({ length: 5 }, (_, i) => (a + i) ** 2);
    } else {
      const start = rand(1, 4);
      const d0 = rand(1, 3);
      terms = [start];
      for (let i = 0; i < 4; i++) terms.push(terms[i]! + d0 + 2 * i);
    }
    const answer = terms[4]!;
    return { q: `What comes next? ${terms.slice(0, 4).join(', ')}, ___`, a: answer, opts: nearby(answer, [1, 2, 4], 1), plain: true };
  },
} satisfies Record<string, () => MoreMathOutput>;

export type YoungMathKey = keyof typeof youngMath;
export type SeniorMathKey = keyof typeof seniorMath;
