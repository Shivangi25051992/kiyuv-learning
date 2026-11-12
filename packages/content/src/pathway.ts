/**
 * Which learning path a child is on. It comes from their age alone, so editing the age changes
 * the content straight away, and an older profile with a stale two-way `track` still gets the
 * right path.
 *
 *  tots     ages 2 and 3   Play time only. Nothing to read, nothing to get wrong.
 *  early    ages 4 and 5   Letters, counting to 20, colours, shapes, animals.
 *  young    ages 6 and 7   Grades 1 and 2: add and take away, short words, plants and animals.
 *  primary  ages 8 to 10   Grades 3 to 5. These topic ids are the original ones, so progress is kept.
 *  senior   ages 11 to 13  Grades 6 to 8: fractions, percentages, algebra, grammar, science.
 *
 * The older `early` and `primary` track values are also valid pathways.
 */
export type Pathway = 'tots' | 'early' | 'young' | 'primary' | 'senior';

export const PATHWAYS: readonly Pathway[] = ['tots', 'early', 'young', 'primary', 'senior'];

export interface PathwayInput {
  age: number;
}

/** The learning path for a child. */
export function pathwayOf({ age }: PathwayInput): Pathway {
  if (age <= 3) return 'tots';
  if (age <= 5) return 'early';
  if (age <= 7) return 'young';
  if (age <= 10) return 'primary';
  return 'senior';
}

/** Ages 2 and 3: Play time instead of a quiz path. */
export const isTots = (input: PathwayInput): boolean => pathwayOf(input) === 'tots';

/** Words for the child's stage, shown to parents. */
export const PATHWAY_LABEL: Record<Pathway, string> = {
  tots: 'Play time (ages 2 to 3)',
  early: 'Early years (ages 4 to 5)',
  young: 'Grades 1 to 2 (ages 6 to 7)',
  primary: 'Grades 3 to 5 (ages 8 to 10)',
  senior: 'Grades 6 to 8 (ages 11 to 13)',
};
