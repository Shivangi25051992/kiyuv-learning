import type { MultipleChoiceItem } from './banks.js';
import type { Course } from './course-types.js';
import { EARLY_COURSES } from './courses-early.js';
import { SCIENCE_COURSES } from './courses-science.js';
import { SKILLS_COURSES } from './courses-skills.js';
import { WORLD_COURSES } from './courses-world.js';

export type { Course } from './course-types.js';

const q = (question: string, a: string, opts: [string, string, string, string]): MultipleChoiceItem => ({
  q: question,
  a,
  opts,
});

const SPACE: readonly MultipleChoiceItem[] = [
  q('Which planet is known as the Red Planet?', 'Mars', ['Venus', 'Mars', 'Jupiter', 'Saturn']),
  q('Which is the biggest planet in our solar system?', 'Jupiter', ['Earth', 'Saturn', 'Jupiter', 'Neptune']),
  q('Which planet is famous for its bright rings?', 'Saturn', ['Mars', 'Saturn', 'Mercury', 'Venus']),
  q('What is the Moon?', 'A natural satellite of Earth', ['A star', 'A planet', 'A natural satellite of Earth', 'A comet']),
  q('What do we call a person who travels into space?', 'Astronaut', ['Pilot', 'Astronaut', 'Sailor', 'Doctor']),
  q('Who was the first person to walk on the Moon?', 'Neil Armstrong', ['Yuri Gagarin', 'Neil Armstrong', 'Rakesh Sharma', 'Kalpana Chawla']),
  q('The Sun is a...', 'Star', ['Planet', 'Star', 'Moon', 'Comet']),
  q('How long does Earth take to go once around the Sun?', '1 year', ['1 day', '1 month', '1 year', '10 years']),
  q('About how long does Earth take to spin around once?', '24 hours', ['1 hour', '12 hours', '24 hours', '7 days']),
  q('Which is the hottest planet?', 'Venus', ['Mercury', 'Venus', 'Mars', 'Jupiter']),
  q('What is the name of our galaxy?', 'Milky Way', ['Andromeda', 'Milky Way', 'Whirlpool', 'Sombrero']),
  q("Which Indian mission landed near the Moon's south pole in 2023?", 'Chandrayaan-3', ['Mangalyaan', 'Chandrayaan-3', 'Aditya-L1', 'Gaganyaan']),
  q('Which planet is the farthest from the Sun?', 'Neptune', ['Uranus', 'Neptune', 'Saturn', 'Mars']),
  q('What causes day and night on Earth?', 'Earth spinning', ['The Moon moving', 'Earth spinning', 'Clouds', 'The Sun switching off']),
  q('A shooting star is really a...', 'Meteor', ['Star', 'Meteor', 'Planet', 'Satellite']),
  q('Which star is closest to Earth?', 'The Sun', ['Sirius', 'Polaris', 'The Sun', 'Vega']),
  q('Why does the Moon shine?', 'It reflects sunlight', ['It makes its own light', 'It reflects sunlight', 'It has lamps', 'It burns gas']),
  q('Who was the first Indian to travel to space?', 'Rakesh Sharma', ['Kalpana Chawla', 'Rakesh Sharma', 'Sunita Williams', 'APJ Abdul Kalam']),
];

const BODY: readonly MultipleChoiceItem[] = [
  q('Which part of the body helps us think?', 'Brain', ['Heart', 'Brain', 'Stomach', 'Lungs']),
  q('How many main senses do we have?', '5', ['3', '4', '5', '8']),
  q('Which part of the eye lets light in?', 'Pupil', ['Pupil', 'Eyelid', 'Eyebrow', 'Eyelash']),
  q('Which part do we use to hear?', 'Ears', ['Eyes', 'Nose', 'Ears', 'Hands']),
  q('Which organs clean the blood and make urine?', 'Kidneys', ['Kidneys', 'Stomach', 'Heart', 'Skull']),
  q('Where does digestion of food begin?', 'Mouth', ['Mouth', 'Knee', 'Ear', 'Lungs']),
  q('Which bone protects the brain?', 'Skull', ['Skull', 'Rib', 'Spine', 'Thigh bone']),
  q('Which vitamin do we get from sunlight?', 'Vitamin D', ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin K']),
  q('What do our lungs help us do?', 'Breathe', ['Breathe', 'Hear', 'Taste', 'Digest food']),
  q('What is the biggest organ of the body?', 'Skin', ['Heart', 'Skin', 'Brain', 'Eye']),
  q('What should we always do before eating?', 'Wash our hands', ['Wash our hands', 'Run around', 'Sleep', 'Shout']),
  q('About how much sleep do children aged 6 to 12 need each night?', '9 to 12 hours', ['2 to 3 hours', '4 to 5 hours', '9 to 12 hours', '15 to 16 hours']),
  q('What carries blood around the body?', 'Blood vessels', ['Bones', 'Blood vessels', 'Hair', 'Nails']),
  q('Which drink helps build strong bones?', 'Milk', ['Cola', 'Milk', 'Soda', 'Energy drink']),
  q('Which muscle works day and night without ever stopping?', 'Heart', ['Heart', 'Arm', 'Leg', 'Tongue']),
  q('What helps protect our teeth from decay?', 'Brushing twice a day', ['Eating more sweets', 'Brushing twice a day', 'Never brushing', 'Chewing pencils']),
  q('Which part helps us smell?', 'Nose', ['Nose', 'Ear', 'Knee', 'Elbow']),
  q('What do white blood cells do?', 'Fight germs', ['Fight germs', 'Make bones', 'Help us see', 'Make hair grow']),
];

const EARTH: readonly MultipleChoiceItem[] = [
  q('Which is the largest ocean?', 'Pacific Ocean', ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean']),
  q('Which is the largest continent?', 'Asia', ['Africa', 'Asia', 'Europe', 'Australia']),
  q('Which is the smallest continent?', 'Australia', ['Europe', 'Australia', 'Africa', 'South America']),
  q('How many continents are there?', '7', ['5', '6', '7', '9']),
  q('What do we call the layer of gases around the Earth?', 'Atmosphere', ['Atmosphere', 'Ocean', 'Crust', 'Cloud']),
  q('Which gas do plants take in from the air?', 'Carbon dioxide', ['Oxygen', 'Carbon dioxide', 'Helium', 'Smoke']),
  q('What do we call water falling from clouds, like rain or snow?', 'Precipitation', ['Evaporation', 'Precipitation', 'Pollution', 'Erosion']),
  q('In which direction does the Sun rise?', 'East', ['North', 'South', 'East', 'West']),
  q('Which is the tallest mountain above sea level?', 'Mount Everest', ['K2', 'Kangchenjunga', 'Mount Everest', 'Mont Blanc']),
  q('Which kind of energy comes from the Sun?', 'Solar energy', ['Wind energy', 'Solar energy', 'Coal energy', 'Sound energy']),
  q('What is a volcano?', 'A mountain that can erupt hot lava', ['A deep lake', 'A mountain that can erupt hot lava', 'A type of cloud', 'A river']),
  q('Which is the largest hot desert in the world?', 'Sahara', ['Thar', 'Sahara', 'Gobi', 'Kalahari']),
  q('Which of these is a renewable source of energy?', 'Wind', ['Coal', 'Petrol', 'Wind', 'Diesel']),
  q('What do reduce, reuse and recycle help to protect?', 'The environment', ['The environment', 'Only money', 'Only toys', 'Nothing']),
  q('What is the imaginary line that divides Earth into north and south halves?', 'Equator', ['Equator', 'Border', 'Coast', 'Road']),
  q('What is a lake?', 'Water surrounded by land', ['Land surrounded by water', 'Water surrounded by land', 'A flowing sea', 'A kind of forest']),
  q('Which season is usually the hottest?', 'Summer', ['Winter', 'Summer', 'Autumn', 'Spring']),
  q('What do we call frozen water?', 'Ice', ['Steam', 'Ice', 'Fog', 'Dew']),
];

/** The first three primary courses, free for everyone. */
const FREE_PRIMARY: readonly Course[] = [
  { id: 'c-space', name: 'Space Explorers', emoji: '🚀', blurb: 'Planets, stars and astronauts', track: 'primary', group: 'Science', ages: 'Ages 7 to 12', free: true, items: SPACE },
  { id: 'c-body', name: 'Amazing Body', emoji: '🧠', blurb: 'How your body works', track: 'primary', group: 'Science', ages: 'Ages 6 to 10', free: true, items: BODY },
  { id: 'c-earth', name: 'Planet Earth', emoji: '🌍', blurb: 'Oceans, mountains and weather', track: 'primary', group: 'Science', ages: 'Ages 7 to 12', free: true, items: EARTH },
];

/** Every bonus course, little ones first. */
export const COURSES: readonly Course[] = [
  ...EARLY_COURSES,
  ...FREE_PRIMARY,
  ...SCIENCE_COURSES,
  ...WORLD_COURSES,
  ...SKILLS_COURSES,
];

export const COURSE_BANKS: Record<string, readonly MultipleChoiceItem[]> = Object.fromEntries(
  COURSES.map((c) => [c.id, c.items]),
);

/** Special screen id for the bonus courses page. Not a course, never stored as progress. */
export const COURSES_PAGE_ID = 'courses';

export const isCourseId = (id: string): boolean => id in COURSE_BANKS;

/** The courses a child on this track can see. */
export const coursesForTrack = (track: Course['track']): Course[] => COURSES.filter((c) => c.track === track);

/** How many courses are free on a track. The rest are premium. */
export const freeCourseCount = (track: Course['track']): number =>
  coursesForTrack(track).filter((c) => c.free).length;
