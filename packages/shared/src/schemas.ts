import { z } from 'zod';
import {
  AGE_BANDS,
  type AgeBand,
  COUNTRIES,
  COUNTRY_CODES,
  FAV_COLORS,
  KID_IDS,
  type KidId,
  MAX_BADGES,
  MAX_COUNT_VALUE,
  MAX_TOPICS,
  TRACKS,
  type Track,
} from './constants.js';

export function computeAgeBand(age: number): AgeBand {
  if (age <= 4) return '2-4';
  if (age <= 7) return '5-7';
  if (age <= 10) return '8-10';
  return '11-13';
}

export function ageBandOk(age: number, band: AgeBand): boolean {
  return (
    (age <= 4 && band === '2-4') ||
    (age >= 5 && age <= 7 && band === '5-7') ||
    (age >= 8 && age <= 10 && band === '8-10') ||
    (age >= 11 && band === '11-13')
  );
}

export function suggestTrack(age: number): Track {
  return age <= 4 ? 'early' : 'primary';
}

export function starsPerCorrectForTrack(track: Track): number {
  return track === 'early' ? 3 : 2;
}

export function nextAvailableKidId(existingIds: readonly string[]): KidId | null {
  const taken = new Set(existingIds);
  for (const id of KID_IDS) {
    if (!taken.has(id)) return id;
  }
  return null;
}

const CountSchema = z.number().int().min(0).max(MAX_COUNT_VALUE);

export const TopicProgressSchema = z.object({
  p: CountSchema,
  c: CountSchema,
  b: CountSchema,
  m: z.boolean(),
});
export type TopicProgress = z.infer<typeof TopicProgressSchema>;

export const KidOnboardingInputSchema = z
  .object({
    name: z.string().trim().max(30, 'Name must be 30 characters or fewer').default(''),
    nickname: z
      .string()
      .trim()
      .min(1, 'Nickname is required')
      .max(20, 'Nickname must be 20 characters or fewer'),
    age: z
      .number({ invalid_type_error: 'Select an age between 2 and 13' })
      .int('Age must be a whole number')
      .min(2, 'Minimum age is 2')
      .max(13, 'Maximum age is 13'),
    country: z
      .string()
      .regex(/^[A-Z]{2}$/, 'Select a valid country')
      .refine((c) => COUNTRY_CODES.has(c), 'Select a supported country from the list'),
    state: z.string().trim().max(40, 'State must be 40 characters or fewer').default(''),
    favColor: z.enum(FAV_COLORS, {
      errorMap: () => ({ message: 'Choose one of the 8 favourite colours' }),
    }),
    avatar: z.string().min(1, 'Choose an avatar').max(16, 'Invalid avatar'),
    ageBand: z.enum(AGE_BANDS),
    track: z.enum(TRACKS),
  })
  .superRefine((val, ctx) => {
    if (!ageBandOk(val.age, val.ageBand)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ageBand'],
        message: `Age ${val.age} must use age band ${computeAgeBand(val.age)}`,
      });
    }
    if (val.state) {
      const countryObj = COUNTRIES.find((c) => c.code === val.country);
      if (countryObj && !countryObj.states.includes(val.state)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['state'],
          message: 'Select a state from the chosen country list',
        });
      }
    }
  });

export type KidOnboardingInput = z.infer<typeof KidOnboardingInputSchema>;

export const KidProfileSchema = z
  .object({
    name: z.string().max(30),
    nickname: z.string().min(1).max(20),
    age: z.number().int().min(2).max(13),
    country: z.string().regex(/^[A-Z]{2}$/),
    state: z.string().max(40),
    favColor: z.enum(FAV_COLORS),
    avatar: z.string().min(1).max(16),
    ageBand: z.enum(AGE_BANDS),
    track: z.enum(TRACKS),
    stars: CountSchema,
    streak: CountSchema,
    bestStreak: CountSchema,
    totalCorrect: CountSchema,
    totalWrong: CountSchema,
    badges: z.array(z.string().min(1).max(32)).max(MAX_BADGES),
    topics: z
      .record(z.string().min(1).max(40), TopicProgressSchema)
      .refine((m) => Object.keys(m).length <= MAX_TOPICS, 'Too many topics'),
    resetEpoch: CountSchema,
    /** Tries per question: 0 or missing means unlimited. Set by a parent, never during onboarding. */
    maxTries: z.number().int().min(0).max(4).optional(),
  })
  .superRefine((val, ctx) => {
    if (!ageBandOk(val.age, val.ageBand)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ageBand'],
        message: `Age ${val.age} does not match ageBand ${val.ageBand}`,
      });
    }
  });

export type KidProfileData = z.infer<typeof KidProfileSchema>;

export interface KidProfile extends KidProfileData {
  kidId: KidId;
  updatedAtMs?: number;
}

export const UserDocumentSchema = z.object({
  lastActiveDate: z.string().min(1).max(16),
  locale: z.string().min(2).max(16),
  resetEpoch: CountSchema,
  schemaVersion: z.number().int().min(1).max(100),
});

export type UserDocumentData = z.infer<typeof UserDocumentSchema>;
