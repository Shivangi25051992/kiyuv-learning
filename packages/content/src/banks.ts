import { z } from 'zod';

export const MultipleChoiceItemSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
  opts: z.array(z.string().min(1)).min(2),
  hint: z.string().optional(),
});
export type MultipleChoiceItem = z.infer<typeof MultipleChoiceItemSchema>;

export const EARLY_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;

export const EARLY_ALPHABET_WORDS: Record<string, readonly [string, string]> = {
  A: ['Apple', '🍎'],
  B: ['Ball', '⚽'],
  C: ['Cat', '🐱'],
  D: ['Dog', '🐶'],
  E: ['Egg', '🥚'],
  F: ['Fish', '🐟'],
  G: ['Goat', '🐐'],
  H: ['Hat', '👒'],
  I: ['Ice', '🧊'],
  J: ['Jam', '🍓'],
  K: ['Kite', '🪁'],
  L: ['Lion', '🦁'],
  M: ['Moon', '🌙'],
  N: ['Nest', '🪺'],
  O: ['Owl', '🦉'],
  P: ['Pig', '🐷'],
  Q: ['Queen', '👸'],
  R: ['Rose', '🌹'],
  S: ['Sun', '☀️'],
  T: ['Tree', '🌳'],
  U: ['Umbrella', '☂️'],
  V: ['Van', '🚐'],
  W: ['Water', '💧'],
  X: ['Xylophone', '🎹'],
  Y: ['Yarn', '🧶'],
  Z: ['Zebra', '🦓'],
};

export interface ColorItem {
  name: string;
  hex: string;
}

export const EARLY_COLORS: readonly ColorItem[] = [
  { name: 'Red', hex: '#ff6b6b' },
  { name: 'Blue', hex: '#4f8bff' },
  { name: 'Yellow', hex: '#ffd166' },
  { name: 'Green', hex: '#3ddc97' },
  { name: 'Pink', hex: '#ff86c8' },
  { name: 'Purple', hex: '#c084fc' },
  { name: 'Orange', hex: '#ff9f43' },
  { name: 'Brown', hex: '#a0522d' },
  { name: 'Black', hex: '#2a2a2a' },
  { name: 'White', hex: '#f5f5f5' },
];

export interface EmojiNamedItem {
  emoji: string;
  name: string;
}

export const EARLY_SHAPES: readonly EmojiNamedItem[] = [
  { emoji: '🔴', name: 'Circle' },
  { emoji: '🟦', name: 'Square' },
  { emoji: '🔺', name: 'Triangle' },
  { emoji: '⭐', name: 'Star' },
  { emoji: '💛', name: 'Heart' },
  { emoji: '🔶', name: 'Diamond' },
  { emoji: '🟪', name: 'Rectangle' },
  { emoji: '🥚', name: 'Oval' },
];

export interface AnimalItem extends EmojiNamedItem {
  sound: string;
}

export const EARLY_ANIMALS: readonly AnimalItem[] = [
  { emoji: '🐶', name: 'Dog', sound: 'Woof Woof!' },
  { emoji: '🐱', name: 'Cat', sound: 'Meow Meow!' },
  { emoji: '🐮', name: 'Cow', sound: 'Moo Moo!' },
  { emoji: '🐷', name: 'Pig', sound: 'Oink Oink!' },
  { emoji: '🐸', name: 'Frog', sound: 'Ribbit!' },
  { emoji: '🐑', name: 'Sheep', sound: 'Baa Baa!' },
  { emoji: '🐔', name: 'Hen', sound: 'Cluck Cluck!' },
  { emoji: '🦁', name: 'Lion', sound: 'Roar!' },
  { emoji: '🦆', name: 'Duck', sound: 'Quack Quack!' },
  { emoji: '🐴', name: 'Horse', sound: 'Neigh!' },
  { emoji: '🦉', name: 'Owl', sound: 'Hoot Hoot!' },
  { emoji: '🐘', name: 'Elephant', sound: 'Trumpet!' },
  { emoji: '🐭', name: 'Mouse', sound: 'Squeak!' },
  { emoji: '🐝', name: 'Bee', sound: 'Buzz!' },
];

export const EARLY_FRUITS: readonly EmojiNamedItem[] = [
  { emoji: '🍎', name: 'Apple' },
  { emoji: '🍌', name: 'Banana' },
  { emoji: '🍇', name: 'Grapes' },
  { emoji: '🍊', name: 'Orange' },
  { emoji: '🍓', name: 'Strawberry' },
  { emoji: '🍉', name: 'Watermelon' },
  { emoji: '🥭', name: 'Mango' },
  { emoji: '🍑', name: 'Peach' },
  { emoji: '🍍', name: 'Pineapple' },
  { emoji: '🥝', name: 'Kiwi' },
];

export const EARLY_OPPOSITES: readonly (readonly [string, string, string, string])[] = [
  ['Big', 'Small', '🐘', '🐭'],
  ['Hot', 'Cold', '🔥', '❄️'],
  ['Happy', 'Sad', '😀', '😢'],
  ['Up', 'Down', '⬆️', '⬇️'],
  ['Day', 'Night', '☀️', '🌙'],
  ['Fast', 'Slow', '🏎️', '🐢'],
  ['Open', 'Closed', '📖', '📕'],
  ['Full', 'Empty', '🥛', '🥃'],
  ['Clean', 'Dirty', '✨', '🧦'],
];

export const EARLY_BODY: readonly EmojiNamedItem[] = [
  { emoji: '👁️', name: 'Eye' },
  { emoji: '👂', name: 'Ear' },
  { emoji: '👃', name: 'Nose' },
  { emoji: '👄', name: 'Mouth' },
  { emoji: '🖐️', name: 'Hand' },
  { emoji: '🦶', name: 'Foot' },
  { emoji: '💪', name: 'Arm' },
  { emoji: '🧠', name: 'Brain' },
  { emoji: '🦷', name: 'Tooth' },
];

export interface HindiLetterItem {
  letter: string;
  word: string;
  emoji: string;
  sound: string;
}

export const EARLY_HINDI_LETTERS: readonly HindiLetterItem[] = [
  { letter: 'अ', word: 'अनार', emoji: '🍎', sound: 'A' },
  { letter: 'आ', word: 'आम', emoji: '🥭', sound: 'Aa' },
  { letter: 'इ', word: 'इमली', emoji: '🫘', sound: 'I' },
  { letter: 'उ', word: 'उल्लू', emoji: '🦉', sound: 'U' },
  { letter: 'क', word: 'कमल', emoji: '🪷', sound: 'Ka' },
  { letter: 'ख', word: 'खरगोश', emoji: '🐰', sound: 'Kha' },
  { letter: 'ग', word: 'गाय', emoji: '🐄', sound: 'Ga' },
  { letter: 'च', word: 'चाँद', emoji: '🌙', sound: 'Cha' },
];

export const PRIMARY_SPELLING_G3: readonly string[] = [
  'ADDRESS', 'ANIMAL', 'BEAUTIFUL', 'BECAUSE', 'BEFORE', 'BELIEVE', 'BEHIND', 'BRIGHT', 'CARRY', 'CENTRE',
  'CIRCLE', 'COMPLETE', 'COULD', 'DIFFERENT', 'DURING', 'EARLY', 'EARTH', 'ENOUGH', 'EXCITING', 'FAMOUS',
  'FEBRUARY', 'FOREST', 'FRIEND', 'GARDEN', 'GROUP', 'HEALTH', 'HEART', 'HISTORY', 'HUNGRY', 'IMPORTANT',
  'ISLAND', 'JOURNEY', 'KITCHEN', 'KNOWLEDGE', 'LANGUAGE', 'LAUGH', 'LEARN', 'LIBRARY', 'MACHINE', 'MEASURE',
  'MIGHT', 'MINUTE', 'MOUNTAIN', 'MUSEUM', 'NATURAL', 'NUMBER', 'OCEAN', 'OFTEN', 'OPPOSITE', 'OXYGEN',
  'PEOPLE', 'PICTURE', 'PLANET', 'POSSIBLE', 'QUESTION', 'QUICKLY', 'RHYTHM', 'SCHOOL', 'SCIENCE', 'SEARCH',
  'SEASON', 'SPECIAL', 'SQUIRREL', 'STRAIGHT', 'STRANGE', 'STRENGTH', 'SUDDEN', 'SURPRISE', 'TOGETHER', 'THOUGHT',
  'THROUGH', 'THURSDAY', 'TOMORROW', 'UNIVERSE', 'UNUSUAL', 'VEGETABLE', 'WEATHER', 'WEDNESDAY', 'YESTERDAY', 'ZEBRA',
];

export const PRIMARY_SPELLING_BEE: readonly string[] = [
  'AMPHIBIAN', 'APPLAUSE', 'APPEARANCE', 'ARCHITECT', 'AUDIENCE', 'AUXILIARY', 'BALLERINA', 'BOUQUET', 'BRIGADE', 'CALENDAR',
  'CALLIGRAPHY', 'CATASTROPHE', 'CEMETERY', 'CHAUFFEUR', 'COLOSSAL', 'CONSCIOUS', 'COURAGEOUS', 'DICTIONARY', 'DILIGENT', 'ECCENTRIC',
  'ENVELOPE', 'ENTHUSIASM', 'EXHILARATION', 'FEBRUARY', 'FOREIGN', 'GENUINE', 'GORGEOUS', 'GRATITUDE', 'GUARANTEE', 'HARMONIOUS',
  'HOROSCOPE', 'HYPOTHESIS', 'ILLUMINATION', 'IMAGINATION', 'INDEPENDENCE', 'INTELLIGENT', 'JEOPARDY', 'KNOWLEDGE', 'LABORATORY', 'LIEUTENANT',
  'LIQUOR', 'MAGNIFICENT', 'MINIATURE', 'MISCHIEVOUS', 'MOSQUITO', 'NAUSEOUS', 'NECESSARY', 'NOTICEABLE', 'OBEDIENT', 'OCCASION',
];

export const PRIMARY_VOCAB_SYNONYMS: readonly (readonly [string, string])[] = [
  ['Happy', 'Joyful'], ['Sad', 'Unhappy'], ['Big', 'Large'], ['Small', 'Tiny'], ['Fast', 'Quick'],
  ['Begin', 'Start'], ['End', 'Finish'], ['Afraid', 'Scared'], ['Smart', 'Clever'], ['Brave', 'Fearless'],
  ['Cold', 'Chilly'], ['Hot', 'Warm'], ['Angry', 'Mad'], ['Beautiful', 'Pretty'], ['Famous', 'Well-known'],
  ['Hard', 'Difficult'], ['Easy', 'Simple'], ['Rich', 'Wealthy'], ['Poor', 'Needy'], ['Ancient', 'Old'],
  ['Modern', 'New'], ['Fix', 'Repair'], ['Hide', 'Conceal'], ['Shout', 'Yell'], ['Whisper', 'Murmur'],
  ['Bright', 'Shiny'], ['Dark', 'Dim'], ['Enormous', 'Huge'], ['Little', 'Tiny'], ['Wise', 'Clever'],
];

export const PRIMARY_VOCAB_ANTONYMS: readonly (readonly [string, string])[] = [
  ['Happy', 'Sad'], ['Big', 'Small'], ['Fast', 'Slow'], ['Hot', 'Cold'], ['Up', 'Down'],
  ['Good', 'Bad'], ['Rich', 'Poor'], ['Strong', 'Weak'], ['Full', 'Empty'], ['Light', 'Dark'],
  ['Day', 'Night'], ['Young', 'Old'], ['Hard', 'Soft'], ['Tall', 'Short'], ['Thick', 'Thin'],
  ['Open', 'Close'], ['Wet', 'Dry'], ['Clean', 'Dirty'], ['Easy', 'Difficult'], ['Early', 'Late'],
  ['Begin', 'End'], ['Love', 'Hate'], ['Push', 'Pull'], ['Give', 'Take'], ['Buy', 'Sell'],
  ['Ancient', 'Modern'], ['Brave', 'Cowardly'], ['Expand', 'Shrink'], ['Enter', 'Exit'], ['Accept', 'Reject'],
];

export const PRIMARY_GK_INDIA: readonly MultipleChoiceItem[] = [
  { q: 'What is the capital of India?', a: 'New Delhi', opts: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'] },
  { q: 'How many states does India have?', a: '28', opts: ['25', '28', '29', '30'] },
  { q: 'What is the national animal of India?', a: 'Tiger', opts: ['Lion', 'Tiger', 'Elephant', 'Peacock'] },
  { q: 'What is the national bird of India?', a: 'Peacock', opts: ['Eagle', 'Parrot', 'Peacock', 'Sparrow'] },
  { q: 'Which river is known as the "Ganga of the South"?', a: 'Godavari', opts: ['Krishna', 'Godavari', 'Kaveri', 'Tungabhadra'] },
  { q: 'Who was the first Prime Minister of India?', a: 'Jawaharlal Nehru', opts: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Sardar Patel', 'Subhash Chandra Bose'] },
  { q: 'What is the national flower of India?', a: 'Lotus', opts: ['Rose', 'Lotus', 'Marigold', 'Sunflower'] },
  { q: 'Which is the highest mountain peak in India?', a: 'Kangchenjunga', opts: ['Everest', 'K2', 'Kangchenjunga', 'Nanda Devi'] },
  { q: 'What is the currency of India?', a: 'Rupee', opts: ['Dollar', 'Rupee', 'Euro', 'Yen'] },
  { q: 'On which day is Independence Day celebrated?', a: '15 August', opts: ['26 January', '15 August', '2 October', '14 November'] },
  { q: 'Which is the longest river in India?', a: 'Ganga', opts: ['Yamuna', 'Ganga', 'Brahmaputra', 'Godavari'] },
  { q: 'Who wrote the Indian national anthem?', a: 'Rabindranath Tagore', opts: ['Bankim Chandra', 'Rabindranath Tagore', 'Sarojini Naidu', 'Subramania Bharati'] },
  { q: 'What is the largest state of India by area?', a: 'Rajasthan', opts: ['Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Uttar Pradesh'] },
  { q: 'Which city is called the "City of Lakes"?', a: 'Udaipur', opts: ['Jaipur', 'Udaipur', 'Srinagar', 'Nainital'] },
  { q: "What is India's national fruit?", a: 'Mango', opts: ['Banana', 'Mango', 'Apple', 'Pineapple'] },
];

export const PRIMARY_GK_WORLD: readonly MultipleChoiceItem[] = [
  { q: 'What is the largest planet in our solar system?', a: 'Jupiter', opts: ['Earth', 'Jupiter', 'Saturn', 'Mars'] },
  { q: 'Which planet is known as the Red Planet?', a: 'Mars', opts: ['Venus', 'Mars', 'Mercury', 'Jupiter'] },
  { q: 'How many continents are there?', a: '7', opts: ['5', '6', '7', '8'] },
  { q: 'What is the largest ocean?', a: 'Pacific', opts: ['Atlantic', 'Indian', 'Pacific', 'Arctic'] },
  { q: 'What is the capital of France?', a: 'Paris', opts: ['London', 'Paris', 'Berlin', 'Rome'] },
  { q: 'What is the capital of Australia?', a: 'Canberra', opts: ['Sydney', 'Melbourne', 'Canberra', 'Perth'] },
  { q: 'What is the capital of USA?', a: 'Washington D.C.', opts: ['New York', 'Washington D.C.', 'Los Angeles', 'Chicago'] },
  { q: 'Which is the smallest continent?', a: 'Australia', opts: ['Europe', 'Australia', 'Antarctica', 'South America'] },
  { q: 'Which is the largest desert in the world?', a: 'Sahara', opts: ['Gobi', 'Sahara', 'Kalahari', 'Thar'] },
  { q: 'What is the tallest mountain in the world?', a: 'Mt. Everest', opts: ['K2', 'Mt. Everest', 'Kangchenjunga', 'Lhotse'] },
  { q: 'Who painted the Mona Lisa?', a: 'Leonardo da Vinci', opts: ['Michelangelo', 'Leonardo da Vinci', 'Van Gogh', 'Picasso'] },
  { q: 'How many colors are in a rainbow?', a: '7', opts: ['5', '6', '7', '8'] },
  { q: 'Which animal is the fastest on land?', a: 'Cheetah', opts: ['Lion', 'Cheetah', 'Horse', 'Leopard'] },
  { q: 'What gas do plants breathe in?', a: 'Carbon dioxide', opts: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'] },
  { q: 'Which is the largest country by area?', a: 'Russia', opts: ['China', 'USA', 'Russia', 'Canada'] },
];

export const PRIMARY_SCIENCE: readonly MultipleChoiceItem[] = [
  { q: 'How many planets are in our solar system?', a: '8', opts: ['7', '8', '9', '10'] },
  { q: 'What is the center of our solar system?', a: 'Sun', opts: ['Earth', 'Moon', 'Sun', 'Jupiter'] },
  { q: 'What do plants need to make food?', a: 'Sunlight', opts: ['Sunlight', 'Darkness', 'Sand', 'Oil'] },
  { q: 'How many bones are in an adult human body?', a: '206', opts: ['150', '206', '250', '300'] },
  { q: 'What is the hardest natural substance?', a: 'Diamond', opts: ['Iron', 'Gold', 'Diamond', 'Rock'] },
  { q: 'How many teeth does an adult have?', a: '32', opts: ['28', '30', '32', '34'] },
  { q: 'What organ pumps blood in our body?', a: 'Heart', opts: ['Lungs', 'Heart', 'Liver', 'Kidney'] },
  { q: 'Which animal lays eggs but is not a bird?', a: 'Snake', opts: ['Cow', 'Dog', 'Snake', 'Cat'] },
  { q: 'What force pulls things towards Earth?', a: 'Gravity', opts: ['Magnetism', 'Gravity', 'Friction', 'Push'] },
  { q: 'What is the gas we breathe in to stay alive?', a: 'Oxygen', opts: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Hydrogen'] },
  { q: 'What are baby frogs called?', a: 'Tadpoles', opts: ['Puppies', 'Tadpoles', 'Cubs', 'Kittens'] },
  { q: 'How many states of matter are there?', a: '3', opts: ['2', '3', '4', '5'] },
  { q: 'What is the process of water changing to vapor?', a: 'Evaporation', opts: ['Freezing', 'Melting', 'Evaporation', 'Condensation'] },
  { q: 'Which planet is closest to the Sun?', a: 'Mercury', opts: ['Venus', 'Mercury', 'Earth', 'Mars'] },
  { q: 'What gives plants their green color?', a: 'Chlorophyll', opts: ['Sunlight', 'Water', 'Chlorophyll', 'Soil'] },
];

export const PRIMARY_GRAMMAR: readonly MultipleChoiceItem[] = [
  { q: 'Which is a NOUN? (Naming word)', a: 'Cat', opts: ['Run', 'Cat', 'Big', 'Slowly'] },
  { q: 'Which is a VERB? (Action word)', a: 'Jump', opts: ['Blue', 'Table', 'Jump', 'Sweet'] },
  { q: 'Which is an ADJECTIVE? (Describes)', a: 'Happy', opts: ['Happy', 'Run', 'Book', 'Quickly'] },
  { q: 'Choose the correct: "She ___ to school every day."', a: 'goes', opts: ['go', 'going', 'goes', 'gone'] },
  { q: 'Past tense of "run":', a: 'ran', opts: ['runned', 'ran', 'running', 'runs'] },
  { q: 'Past tense of "eat":', a: 'ate', opts: ['eated', 'ate', 'eaten', 'eating'] },
  { q: 'Plural of "child":', a: 'children', opts: ['childs', 'children', 'childrens', 'childes'] },
  { q: 'Plural of "mouse":', a: 'mice', opts: ['mouses', 'mice', 'mices', 'mouse'] },
  { q: 'Pick the correct article: "___ apple is red."', a: 'An', opts: ['A', 'An', 'The', 'No article'] },
  { q: 'Pick the correct article: "I have ___ book."', a: 'a', opts: ['a', 'an', 'the', 'no'] },
  { q: 'Which word is a PRONOUN?', a: 'They', opts: ['Table', 'They', 'Walk', 'Red'] },
  { q: '"Quickly" is a/an:', a: 'Adverb', opts: ['Noun', 'Verb', 'Adjective', 'Adverb'] },
  { q: 'Opposite of "day" is:', a: 'night', opts: ['sun', 'night', 'sky', 'morning'] },
  { q: 'Which word rhymes with "cat"?', a: 'bat', opts: ['dog', 'bat', 'sun', 'pen'] },
  { q: 'Which letter is a vowel?', a: 'A', opts: ['B', 'C', 'A', 'D'] },
];

export const PRIMARY_OLYMPIAD_LOGIC: readonly MultipleChoiceItem[] = [
  { q: 'Which number comes next? 2, 4, 6, 8, ?', a: '10', opts: ['9', '10', '11', '12'] },
  { q: 'Which number comes next? 1, 3, 6, 10, 15, ?', a: '21', opts: ['18', '20', '21', '22'], hint: 'Triangle numbers' },
  { q: 'What comes next? A, C, E, G, ?', a: 'I', opts: ['H', 'I', 'J', 'K'], hint: 'Skip 1 letter each time' },
  { q: 'If 2+3=10, 3+4=21, 4+5=36, then 5+6=?', a: '55', opts: ['49', '55', '56', '61'], hint: 'Multiply the first number by the sum' },
  { q: 'What is the next shape? 🔵🔴🔵🔴🔵?', a: '🔴', opts: ['🔵', '🔴', '🟡', '🟢'] },
  { q: 'Count the triangles: 🔺🔺🔺🔺', a: '4', opts: ['3', '4', '5', '6'] },
  { q: 'If today is Monday, what day was yesterday?', a: 'Sunday', opts: ['Saturday', 'Sunday', 'Tuesday', 'Friday'] },
  { q: 'How many sides does a hexagon have?', a: '6', opts: ['4', '5', '6', '8'] },
  { q: 'How many corners does a square have?', a: '4', opts: ['3', '4', '5', '6'] },
  { q: 'If 3 cats eat 3 fish in 3 minutes, how many cats eat 9 fish in 9 minutes?', a: '3', opts: ['3', '6', '9', '27'], hint: 'Same rate!' },
  { q: 'What is half of 100?', a: '50', opts: ['25', '50', '75', '100'] },
  { q: 'What is a quarter of 100?', a: '25', opts: ['10', '20', '25', '50'] },
  { q: 'Which fraction is bigger? 1/2 or 1/4?', a: '1/2', opts: ['1/2', '1/4', 'Same', "Can't tell"] },
  { q: 'How many minutes in 1 hour?', a: '60', opts: ['50', '60', '100', '120'] },
  { q: 'How many hours in a day?', a: '24', opts: ['12', '18', '24', '30'] },
  { q: 'How many months in a year?', a: '12', opts: ['10', '11', '12', '14'] },
  { q: 'How many days in a week?', a: '7', opts: ['5', '6', '7', '8'] },
  { q: 'What comes after Wednesday?', a: 'Thursday', opts: ['Tuesday', 'Thursday', 'Friday', 'Saturday'] },
];
