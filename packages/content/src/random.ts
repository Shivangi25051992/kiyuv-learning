/** Small random helpers shared by the question generators. */

export const rand = (a: number, b: number): number =>
  Math.floor(Math.random() * (b - a + 1)) + a;

export const pick = <T>(arr: readonly T[]): T => {
  if (arr.length === 0) {
    throw new Error('Cannot pick from an empty array');
  }
  return arr[Math.floor(Math.random() * arr.length)] as T;
};

export const shuffle = <T>(arr: readonly T[]): T[] =>
  arr.slice().sort(() => Math.random() - 0.5);

export const uniqOpts = <T>(correct: T, generator: () => T, n = 3): T[] => {
  const set = new Set<T>([correct]);
  let tries = 0;
  while (set.size < n + 1 && tries < 50) {
    set.add(generator());
    tries++;
  }
  return shuffle([...set]);
};
