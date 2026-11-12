# Age stages

What a child sees depends on their **age alone**. `pathwayOf({ age })` in `packages/content/src/pathway.ts` is the one place that decides it, so editing a child's age changes the content straight away. The stored `track` field (`early` or `primary`, checked by the Firestore rules) is only kept for compatibility and is never used to pick content.

| Ages | Stage | What they get |
|---|---|---|
| 2 to 3 | `tots` | Play time only: no levels, scores or questions. Age 3 also gets the picture courses ("Look and pick") and three more activities. |
| 4 to 5 | `early` | 10 levels of letters, counting to 20, colours, shapes, animals (own lists for pets and farm, wild, birds and bugs, water), fruit, vegetables, sky, Hindi letters. Play time stays as an extra. |
| 6 to 7 | `young` | Grades 1 and 2. Topic ids start with `g-`. |
| 8 to 10 | `primary` | Grades 3 to 5. The original `y-` topic ids, so existing progress is kept. |
| 11 to 13 | `senior` | Grades 6 to 8. Topic ids start with `s-`. |

## Where things live

- Level maps: `TOPIC_LEVEL` in `levels.ts`. Every stage except `tots` has 10 levels.
- Topic lists: `CURRICULUM` in `curriculum.ts` (`curriculum-young.ts`, `curriculum-senior.ts`).
- Maths question makers: `math-more.ts` (grades 1 to 2 and 6 to 8). They return their own wrong answers where "a few off" would teach nothing.
- Question banks: `banks-young.ts`, `banks-senior.ts`, `banks-early.ts`.
- Courses are filtered by age with `coursesForChild`. A course's range is read from its "Ages 6 to 10" label, a year either side.
- Play time (ages 2 and up): `apps/client/src/features/toddler/`. Animals are in `animals.ts` in six groups; other lists are in `playData.ts` and `playMore.ts`. An activity can set `minAge`.

## Adding content

1. Add the topic to the stage's curriculum file and its level in `TOPIC_LEVEL`.
2. Add a generator key in `math-more.ts`, or a bank and a line in the `lookup` in `generators.ts`.
3. `pathways.test.ts` then checks the topic: every level has topics, and 250 generated questions each offer the right answer once and no repeats.
4. New emoji need a drawing in `apps/client/public/pics` (from `googlefonts/noto-emoji`, `2D/svg`, Apache 2.0) and a line in `picCodes.ts`. A test fails until they have one.
5. New real sounds go in `apps/client/public/sounds`, with the source and licence in `CREDITS.txt`.
