import type { Track } from '@kiyuv/shared';
import type { MultipleChoiceItem } from './banks.js';

/**
 * Bonus courses sit outside the 10 levels and never gate one. Each one is a bank of
 * multiple-choice questions, written by hand and read through before release.
 */
export interface Course {
  id: string;
  name: string;
  /** One emoji, shown as the course picture. */
  emoji: string;
  blurb: string;
  /** Which children see it: the little ones (about 2 to 5) or primary (about 6 to 13). */
  track: Track;
  /** Heading it is listed under on the course page. */
  group: string;
  /** Suggested ages, for parents, like "Ages 6 to 9". */
  ages: string;
  /** Free courses are open to everyone. The rest show a "ask a parent" notice for now. */
  free: boolean;
  items: readonly MultipleChoiceItem[];
}

/**
 * A question with the right answer first and three wrong ones. The order on screen is
 * shuffled every time, so listing the answer first here is only for the writer.
 */
export const mc = (
  question: string,
  answer: string,
  wrong1: string,
  wrong2: string,
  wrong3: string,
): MultipleChoiceItem => ({ q: question, a: answer, opts: [answer, wrong1, wrong2, wrong3] });
