import type { MultipleChoiceItem } from './banks.js';
import { mc } from './course-types.js';

/**
 * Question banks for ages 11 to 13 (grades 6 to 8). Written by hand and read through before
 * release. Each question has one clearly correct answer.
 */

export const SENIOR_GRAMMAR: readonly MultipleChoiceItem[] = [
  mc('Which sentence is in the passive voice?', 'The window was broken by the ball.', 'The ball broke the window.', 'The boy kicked the ball.', 'She is singing.'),
  mc('Which sentence is in the active voice?', 'The chef cooked the meal.', 'The meal was cooked by the chef.', 'The meal is being cooked.', 'The meal had been cooked.'),
  mc('Choose the correct form: "If I ___ you, I would apologise."', 'were', 'am', 'was being', 'be'),
  mc('Which word is a conjunction?', 'although', 'quickly', 'beautiful', 'under'),
  mc('Which word is a preposition? "The cat hid under the bed."', 'under', 'cat', 'hid', 'the'),
  mc('Which sentence uses the past perfect tense?', 'She had finished before he arrived.', 'She finishes before he arrives.', 'She is finishing now.', 'She will finish soon.'),
  mc('Which sentence uses the present continuous tense?', 'They are playing football.', 'They play football.', 'They played football.', 'They have played football.'),
  mc('Choose the correct word: "Neither of the boys ___ ready."', 'is', 'are', 'were', 'have been'),
  mc('Choose the correct word: "She is taller ___ her sister."', 'than', 'then', 'that', 'as than'),
  mc('Which is a complex sentence?', 'I stayed home because it was raining.', 'I stayed home.', 'It was raining and I stayed home.', 'Stay home!'),
  mc('In "The boy who won the race smiled", what is "who won the race"?', 'A relative clause', 'A noun', 'A verb', 'An adverb'),
  mc('Which punctuation mark shows that something belongs to someone?', 'Apostrophe', 'Comma', 'Colon', 'Hyphen'),
  mc('Which sentence is punctuated correctly?', 'It\'s a lovely day, isn\'t it?', 'Its a lovely day isnt it.', 'It\'s a lovely day isn\'t it', 'Its a lovely day, isn\'t it'),
  mc('What is the plural of "criterion"?', 'criteria', 'criterions', 'criterias', 'criterion'),
  mc('Which word is an adverb? "He ran quickly."', 'quickly', 'ran', 'He', 'quick'),
  mc('Which of these is a proper noun?', 'Mumbai', 'city', 'river', 'mountain'),
  mc('Change to reported speech: She said, "I am tired."', 'She said that she was tired.', 'She said that I am tired.', 'She said that she is tired yesterday.', 'She said I was tired today.'),
];

export const SENIOR_IDIOMS: readonly MultipleChoiceItem[] = [
  mc('What does "a piece of cake" mean?', 'Very easy', 'Very sweet', 'Very small', 'Very costly'),
  mc('What does "break the ice" mean?', 'Start a friendly conversation', 'Smash something', 'Feel cold', 'Make an ice sculpture'),
  mc('What does "once in a blue moon" mean?', 'Very rarely', 'Every night', 'Every month', 'Very often'),
  mc('What does "under the weather" mean?', 'Feeling unwell', 'Standing in the rain', 'Very happy', 'Very busy'),
  mc('What does "hit the books" mean?', 'Study hard', 'Throw books', 'Buy books', 'Tidy a shelf'),
  mc('What does "spill the beans" mean?', 'Reveal a secret', 'Cook dinner', 'Drop food', 'Tell a joke'),
  mc('What does "cost an arm and a leg" mean?', 'Be very expensive', 'Cause an injury', 'Be free', 'Be cheap'),
  mc('What does "let the cat out of the bag" mean?', 'Reveal a secret by accident', 'Free a pet', 'Go shopping', 'Tell a lie on purpose'),
  mc('What does "the ball is in your court" mean?', 'It is your turn to decide', 'You are playing tennis', 'You must leave', 'You have won'),
  mc('What does "burn the midnight oil" mean?', 'Work late into the night', 'Light a lamp', 'Waste fuel', 'Wake up early'),
  mc('What does "a blessing in disguise" mean?', 'Something good that seemed bad at first', 'A secret gift', 'A prayer', 'A costume'),
  mc('What does "bite the bullet" mean?', 'Face something difficult bravely', 'Eat quickly', 'Be angry', 'Run away'),
  mc('What does "pull someone\'s leg" mean?', 'Tease or joke with them', 'Help them walk', 'Hurt them', 'Ask for money'),
  mc('What does "on cloud nine" mean?', 'Extremely happy', 'Very sleepy', 'Lost', 'Very tall'),
  mc('What does "kill two birds with one stone" mean?', 'Solve two problems with one action', 'Hurt animals', 'Throw stones', 'Make a mistake'),
  mc('What does "the early bird catches the worm" teach?', 'Starting early brings success', 'Birds like worms', 'Never be late for lunch', 'Wake up at night'),
];

export const SENIOR_AFFIXES: readonly MultipleChoiceItem[] = [
  mc('What does the prefix "un-" mean in "unhappy"?', 'Not', 'Again', 'Before', 'Very'),
  mc('What does the prefix "re-" mean in "rewrite"?', 'Again', 'Not', 'Under', 'After'),
  mc('What does the prefix "pre-" mean in "preview"?', 'Before', 'After', 'Against', 'Again'),
  mc('What does the prefix "mis-" mean in "misunderstand"?', 'Wrongly', 'Again', 'Before', 'Over'),
  mc('What does the prefix "sub-" mean in "submarine"?', 'Under', 'Over', 'Across', 'Before'),
  mc('What does the prefix "tele-" mean in "telescope"?', 'Far', 'Near', 'Small', 'Many'),
  mc('What does the suffix "-less" mean in "careless"?', 'Without', 'Full of', 'Again', 'More'),
  mc('What does the suffix "-ful" mean in "helpful"?', 'Full of', 'Without', 'Not', 'Before'),
  mc('Which word means "not possible"?', 'impossible', 'repossible', 'prepossible', 'misspossible'),
  mc('What does "bio" mean in "biology"?', 'Life', 'Earth', 'Star', 'Water'),
  mc('What does "geo" mean in "geography"?', 'Earth', 'Life', 'Sky', 'Number'),
  mc('What does "aqua" mean in "aquarium"?', 'Water', 'Fire', 'Air', 'Earth'),
  mc('What does "port" mean in "transport"?', 'Carry', 'Write', 'See', 'Hear'),
  mc('What does "scrib" or "script" mean in "manuscript"?', 'Write', 'Read', 'Speak', 'Draw'),
  mc('What does the prefix "anti-" mean in "antibiotic"?', 'Against', 'With', 'Before', 'Many'),
  mc('What does "bi-" mean in "bicycle"?', 'Two', 'One', 'Three', 'Half'),
  mc('What does "tri-" mean in "triangle"?', 'Three', 'Two', 'Four', 'Many'),
  mc('Which suffix makes a noun from "happy"?', '-ness', '-ly', '-ing', '-ed'),
];

export const SENIOR_LIFE: readonly MultipleChoiceItem[] = [
  mc('What is the basic unit of life?', 'Cell', 'Atom', 'Organ', 'Tissue'),
  mc('Which part of a plant cell makes food using sunlight?', 'Chloroplast', 'Nucleus', 'Cell wall', 'Vacuole'),
  mc('Which part of a cell controls its activities?', 'Nucleus', 'Cell membrane', 'Cytoplasm', 'Ribosome'),
  mc('What is the process by which plants make food?', 'Photosynthesis', 'Respiration', 'Digestion', 'Evaporation'),
  mc('Which gas do plants take in for photosynthesis?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'),
  mc('Which blood cells carry oxygen?', 'Red blood cells', 'White blood cells', 'Platelets', 'Plasma'),
  mc('Which organ pumps blood around the body?', 'Heart', 'Liver', 'Kidney', 'Stomach'),
  mc('Where does most digestion and absorption of food happen?', 'Small intestine', 'Stomach only', 'Mouth', 'Lungs'),
  mc('What do we call animals that eat only plants?', 'Herbivores', 'Carnivores', 'Omnivores', 'Decomposers'),
  mc('What do we call animals that eat both plants and animals?', 'Omnivores', 'Herbivores', 'Carnivores', 'Producers'),
  mc('In a food chain, plants are called...', 'Producers', 'Consumers', 'Decomposers', 'Predators'),
  mc('Which living things break down dead plants and animals?', 'Decomposers', 'Producers', 'Predators', 'Herbivores'),
  mc('Which vitamin helps stop scurvy?', 'Vitamin C', 'Vitamin A', 'Vitamin D', 'Vitamin K'),
  mc('Which part of the body is protected by the ribs?', 'Heart and lungs', 'Brain', 'Legs', 'Eyes'),
  mc('What is DNA mostly responsible for?', 'Carrying genetic information', 'Digesting food', 'Making bones hard', 'Moving blood'),
  mc('Which group of animals has a backbone?', 'Vertebrates', 'Insects', 'Worms', 'Jellyfish'),
  mc('Which kingdom do mushrooms belong to?', 'Fungi', 'Plants', 'Animals', 'Bacteria'),
  mc('What is the main job of the roots of a plant?', 'Absorb water and minerals', 'Make seeds', 'Attract insects', 'Make food'),
];

export const SENIOR_EARTH: readonly MultipleChoiceItem[] = [
  mc('What is the outermost layer of the Earth called?', 'Crust', 'Mantle', 'Core', 'Atmosphere'),
  mc('Which layer of the Earth is made mostly of molten rock?', 'Mantle', 'Crust', 'Atmosphere', 'Ocean'),
  mc('Which gas makes up most of the air we breathe?', 'Nitrogen', 'Oxygen', 'Carbon dioxide', 'Hydrogen'),
  mc('Which is the process of water turning into vapour?', 'Evaporation', 'Condensation', 'Freezing', 'Melting'),
  mc('Which is the process of vapour turning into water drops?', 'Condensation', 'Evaporation', 'Melting', 'Erosion'),
  mc('What causes the seasons on Earth?', 'The tilt of the Earth as it orbits the Sun', 'The Earth moving closer to the Moon', 'Clouds', 'The Sun changing size'),
  mc('What causes ocean tides?', 'The Moon\'s gravity', 'Wind only', 'Fish moving', 'Earthquakes'),
  mc('Rocks formed from cooled lava are called...', 'Igneous rocks', 'Sedimentary rocks', 'Metamorphic rocks', 'Fossil rocks'),
  mc('Which type of rock often contains fossils?', 'Sedimentary rock', 'Igneous rock', 'Metamorphic rock', 'Volcanic glass'),
  mc('Which is a greenhouse gas?', 'Carbon dioxide', 'Helium', 'Argon', 'Neon'),
  mc('Which of these is a non-renewable energy source?', 'Coal', 'Wind', 'Solar', 'Tidal'),
  mc('What is the name for the study of weather?', 'Meteorology', 'Geology', 'Astronomy', 'Zoology'),
  mc('What instrument measures air pressure?', 'Barometer', 'Thermometer', 'Anemometer', 'Rain gauge'),
  mc('What is the Earth\'s natural satellite?', 'The Moon', 'Mars', 'The Sun', 'Venus'),
  mc('What is the layer of gases around the Earth called?', 'Atmosphere', 'Hydrosphere', 'Lithosphere', 'Biosphere'),
  mc('What is an earthquake caused by?', 'Movement of the Earth\'s plates', 'Heavy rain', 'Strong wind', 'The Moon\'s light'),
];

export const SENIOR_PHYSICS: readonly MultipleChoiceItem[] = [
  mc('What is the unit of force?', 'Newton', 'Joule', 'Watt', 'Pascal'),
  mc('What is the unit of energy?', 'Joule', 'Newton', 'Volt', 'Metre'),
  mc('What force pulls objects towards the Earth?', 'Gravity', 'Friction', 'Magnetism', 'Tension'),
  mc('Which force slows down a sliding box?', 'Friction', 'Gravity', 'Magnetism', 'Light'),
  mc('Which of these is a good conductor of electricity?', 'Copper', 'Rubber', 'Wood', 'Plastic'),
  mc('Which of these is an insulator?', 'Rubber', 'Iron', 'Copper', 'Silver'),
  mc('Sound cannot travel through...', 'A vacuum', 'Air', 'Water', 'Steel'),
  mc('Which travels faster?', 'Light', 'Sound', 'A car', 'A bicycle'),
  mc('What do we call energy stored in a stretched spring?', 'Potential energy', 'Kinetic energy', 'Heat energy', 'Light energy'),
  mc('What do we call the energy of a moving object?', 'Kinetic energy', 'Potential energy', 'Chemical energy', 'Nuclear energy'),
  mc('Which colours make up white light?', 'All the colours of the rainbow', 'Only red', 'Only blue', 'Only black'),
  mc('A magnet attracts which of these?', 'Iron', 'Plastic', 'Wood', 'Glass'),
  mc('What is the speed of an object measured in?', 'Metres per second', 'Kilograms', 'Litres', 'Degrees'),
  mc('What happens to most things when they are heated?', 'They expand', 'They shrink', 'They vanish', 'They become lighter in weight'),
  mc('Which instrument measures temperature?', 'Thermometer', 'Barometer', 'Ammeter', 'Odometer'),
  mc('What is the unit of electric current?', 'Ampere', 'Volt', 'Ohm', 'Watt'),
  mc('What does a lens that bulges outward (convex) do to light?', 'Brings the rays together', 'Spreads them apart', 'Stops them completely', 'Makes them invisible'),
  mc('Which is a simple machine?', 'Lever', 'Television', 'Calculator', 'Radio'),
];

export const SENIOR_COMPUTING: readonly MultipleChoiceItem[] = [
  mc('What number system do computers use inside?', 'Binary', 'Decimal only', 'Roman', 'Fractions'),
  mc('Which two digits does binary use?', '0 and 1', '1 and 2', '0 and 9', '1 and 10'),
  mc('What is the binary number 101 in our usual numbers?', '5', '3', '6', '10'),
  mc('What is the binary number 11 in our usual numbers?', '3', '2', '4', '11'),
  mc('What is a step-by-step set of instructions to solve a problem called?', 'An algorithm', 'A browser', 'A cable', 'A pixel'),
  mc('What does CPU stand for?', 'Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Power Unit'),
  mc('Which part of a computer is its "brain"?', 'CPU', 'Monitor', 'Keyboard', 'Speaker'),
  mc('Which is an input device?', 'Keyboard', 'Printer', 'Monitor', 'Speaker'),
  mc('Which is an output device?', 'Printer', 'Mouse', 'Keyboard', 'Scanner'),
  mc('What does a bug mean in a computer program?', 'A mistake in the code', 'A real insect', 'A new feature', 'A virus-free file'),
  mc('What is a strong password made of?', 'Letters, numbers and symbols', 'Your name only', '1234', 'Your birthday only'),
  mc('Who should you tell if someone online makes you feel unsafe?', 'A trusted adult', 'Nobody', 'A stranger', 'The person who upset you'),
  mc('What is the "if ... then ..." idea in coding called?', 'A condition', 'A loop', 'A pixel', 'A cable'),
  mc('What is repeating a set of steps in code called?', 'A loop', 'A bug', 'A byte', 'A file'),
  mc('How many bits are in a byte?', '8', '2', '4', '16'),
  mc('What does the "www" in a web address stand for?', 'World Wide Web', 'Web Wide World', 'Wide World Window', 'Web Window Wide'),
  mc('What is a pixel?', 'A tiny dot on a screen', 'A computer virus', 'A kind of cable', 'A website'),
  mc('Which of these is a programming language?', 'Python', 'Photoshop', 'Windows', 'Chrome'),
];

export const SENIOR_WORLD: readonly MultipleChoiceItem[] = [
  mc('Which river flows through Egypt?', 'The Nile', 'The Amazon', 'The Ganga', 'The Thames'),
  mc('Which is the largest country in the world by area?', 'Russia', 'Canada', 'China', 'India'),
  mc('Which is the most populated country in the world today?', 'India', 'USA', 'Indonesia', 'Brazil'),
  mc('What is the capital of Japan?', 'Tokyo', 'Kyoto', 'Osaka', 'Seoul'),
  mc('What is the capital of Australia?', 'Canberra', 'Sydney', 'Melbourne', 'Perth'),
  mc('What is the capital of Canada?', 'Ottawa', 'Toronto', 'Vancouver', 'Montreal'),
  mc('Which continent is Egypt in?', 'Africa', 'Asia', 'Europe', 'South America'),
  mc('Which is the smallest country in the world?', 'Vatican City', 'Monaco', 'Malta', 'Nepal'),
  mc('Which ocean lies between Africa and Australia, south of India?', 'Indian Ocean', 'Atlantic Ocean', 'Arctic Ocean', 'Pacific Ocean'),
  mc('Which mountain range separates India from Tibet?', 'The Himalayas', 'The Andes', 'The Alps', 'The Rockies'),
  mc('Which organisation works for peace between countries?', 'The United Nations', 'FIFA', 'NASA', 'The Olympics'),
  mc('Which country gifted the Statue of Liberty to the USA?', 'France', 'England', 'Spain', 'Italy'),
  mc('In which year did India become independent?', '1947', '1950', '1942', '1857'),
  mc('Who was the first Prime Minister of India?', 'Jawaharlal Nehru', 'Mahatma Gandhi', 'Sardar Patel', 'Rajendra Prasad'),
  mc('Who wrote the Indian national anthem?', 'Rabindranath Tagore', 'Bankim Chandra Chatterjee', 'Sarojini Naidu', 'Premchand'),
  mc('Which is the largest desert in the world, counting cold ones?', 'Antarctica', 'Sahara', 'Gobi', 'Thar'),
  mc('Which currency does Japan use?', 'Yen', 'Won', 'Dollar', 'Euro'),
  mc('Which planet is known for its Great Red Spot?', 'Jupiter', 'Mars', 'Saturn', 'Neptune'),
];

/** Trickier words for "fill in the missing letter" at ages 11 to 13. */
export const SENIOR_SPELLING: readonly string[] = [
  'ACCOMMODATE', 'ACHIEVEMENT', 'ACQUAINTANCE', 'ADVERTISEMENT', 'AGGRESSIVE', 'AMBITIOUS', 'APOLOGISE', 'ARGUMENT', 'ATMOSPHERE', 'BEGINNING',
  'BUSINESS', 'CEILING', 'COMMITTEE', 'COMPETITION', 'CONVENIENT', 'CRITICISM', 'DEFINITELY', 'DESPERATE', 'DETERMINE', 'DISAPPEAR',
  'DISCIPLINE', 'EMBARRASS', 'ENVIRONMENT', 'EQUIPMENT', 'EXAGGERATE', 'EXPERIENCE', 'FASCINATING', 'GOVERNMENT', 'GUARDIAN', 'IMMEDIATELY',
  'INDEPENDENT', 'INTERRUPT', 'JEWELLERY', 'JUDGEMENT', 'MAINTENANCE', 'MANAGEMENT', 'OPPORTUNITY', 'PARLIAMENT', 'PERSEVERANCE', 'PRONUNCIATION',
  'RECOMMEND', 'RESTAURANT', 'SACRIFICE', 'SEPARATE', 'SINCERELY', 'SUCCESSFUL', 'TEMPERATURE', 'TWELFTH', 'UNFORTUNATELY', 'VOLUNTEER',
];
