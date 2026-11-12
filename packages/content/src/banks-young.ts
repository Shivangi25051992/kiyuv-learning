import type { MultipleChoiceItem } from './banks.js';
import { mc } from './course-types.js';

/**
 * Question banks for ages 6 and 7 (grades 1 and 2). Short sentences, everyday words, and
 * one clear answer each. Written by hand and read through before release.
 */

export const YOUNG_ANIMALS: readonly MultipleChoiceItem[] = [
  mc('Where does a bird live?', 'In a nest', 'In a burrow', 'In a web', 'In a hive'),
  mc('Where does a bee live?', 'In a hive', 'In a nest', 'In a pond', 'In a cave'),
  mc('Where does a fish live?', 'In water', 'In a tree', 'In a nest', 'In sand only'),
  mc('Which animal gives us milk?', 'Cow', 'Lion', 'Frog', 'Snake'),
  mc('Which animal has a long trunk?', 'Elephant', 'Giraffe', 'Zebra', 'Monkey'),
  mc('A baby dog is called a...', 'Puppy', 'Kitten', 'Calf', 'Cub'),
  mc('A baby cat is called a...', 'Kitten', 'Puppy', 'Chick', 'Lamb'),
  mc('A baby cow is called a...', 'Calf', 'Lamb', 'Foal', 'Chick'),
  mc('Which animal can fly?', 'Eagle', 'Cow', 'Dog', 'Fish'),
  mc('Which animal hops and says ribbit?', 'Frog', 'Duck', 'Horse', 'Pig'),
  mc('Which of these animals eats only plants?', 'Rabbit', 'Tiger', 'Lion', 'Crocodile'),
  mc('Which animal has stripes?', 'Zebra', 'Elephant', 'Rabbit', 'Camel'),
  mc('Which animal gives us wool?', 'Sheep', 'Dog', 'Hen', 'Fish'),
  mc('Which animal lays eggs that we eat?', 'Hen', 'Cow', 'Horse', 'Goat'),
  mc('How many legs does a spider have?', '8', '4', '6', '10'),
  mc('How many legs does an insect have?', '6', '4', '8', '2'),
  mc('Which animal sleeps in a den in winter?', 'Bear', 'Parrot', 'Fish', 'Duck'),
  mc('What is a home for a pet dog called?', 'Kennel', 'Nest', 'Hive', 'Web'),
];

export const YOUNG_PLANTS: readonly MultipleChoiceItem[] = [
  mc('What do plants need to grow?', 'Water and sunlight', 'Only toys', 'Only sweets', 'Only noise'),
  mc('Which part of a plant holds it in the soil?', 'Roots', 'Leaves', 'Flowers', 'Fruit'),
  mc('Which part of a plant is usually green and flat?', 'Leaf', 'Root', 'Seed', 'Stem'),
  mc('What does a seed grow into?', 'A new plant', 'A stone', 'A toy', 'A cloud'),
  mc('Which part of a plant carries water up?', 'Stem', 'Petal', 'Seed', 'Fruit'),
  mc('Which is a fruit?', 'Mango', 'Potato', 'Carrot', 'Spinach'),
  mc('Which is a root vegetable?', 'Carrot', 'Apple', 'Banana', 'Orange'),
  mc('What do we call the colourful part of a plant that smells nice?', 'Flower', 'Root', 'Stem', 'Seed'),
  mc('Where do we find seeds inside?', 'Fruits', 'Stones', 'Clouds', 'Sand'),
  mc('Which is the biggest plant?', 'Tree', 'Grass', 'Moss', 'Flower'),
  mc('What do trees give us to breathe?', 'Fresh air', 'Smoke', 'Sand', 'Noise'),
  mc('Which plant gives us rice?', 'Paddy plant', 'Mango tree', 'Rose bush', 'Banana tree'),
  mc('Which fruit grows on a tree?', 'Apple', 'Potato', 'Onion', 'Carrot'),
  mc('What should we do to a plant every day?', 'Give it water', 'Pull its leaves', 'Hide it in a box', 'Nothing at all'),
];

export const YOUNG_RHYMES: readonly MultipleChoiceItem[] = [
  mc('Which word rhymes with "cat"?', 'hat', 'dog', 'cup', 'pen'),
  mc('Which word rhymes with "sun"?', 'fun', 'moon', 'star', 'sky'),
  mc('Which word rhymes with "bee"?', 'tree', 'bird', 'fish', 'cow'),
  mc('Which word rhymes with "pen"?', 'ten', 'pin', 'pan', 'pot'),
  mc('Which word rhymes with "bell"?', 'well', 'ball', 'bill', 'bull'),
  mc('Which word rhymes with "star"?', 'car', 'sun', 'moon', 'tree'),
  mc('Which word rhymes with "light"?', 'night', 'lamp', 'dark', 'sun'),
  mc('Which word rhymes with "cake"?', 'lake', 'cook', 'cup', 'cart'),
  mc('Which word rhymes with "ring"?', 'sing', 'rang', 'rain', 'rug'),
  mc('Which word rhymes with "boat"?', 'coat', 'bat', 'boot', 'bee'),
  mc('Which word rhymes with "mouse"?', 'house', 'mice', 'moose', 'mop'),
  mc('Which word rhymes with "book"?', 'look', 'bike', 'back', 'bag'),
  mc('Which word rhymes with "red"?', 'bed', 'rid', 'rod', 'road'),
  mc('Which word rhymes with "fish"?', 'dish', 'fan', 'fist', 'fin'),
  mc('Which word rhymes with "moon"?', 'spoon', 'mean', 'man', 'mud'),
  mc('Which word rhymes with "rain"?', 'train', 'run', 'ran', 'ring'),
];

export const YOUNG_WORDS: readonly MultipleChoiceItem[] = [
  mc('Which word is a naming word (a noun)?', 'dog', 'run', 'happy', 'quickly'),
  mc('Which word is an action word (a verb)?', 'jump', 'table', 'red', 'tall'),
  mc('Which word is an action word (a verb)?', 'sing', 'book', 'blue', 'small'),
  mc('Which word is a naming word (a noun)?', 'school', 'eat', 'soft', 'sleep'),
  mc('Which word tells us how something looks (an adjective)?', 'big', 'chair', 'walk', 'Ravi'),
  mc('Which word is a person\'s name?', 'Meera', 'jump', 'green', 'apple'),
  mc('Pick the right word: "I have ___ apple."', 'an', 'a', 'two', 'many'),
  mc('Pick the right word: "She has ___ dog."', 'a', 'an', 'two', 'many'),
  mc('Pick the right word: "He has ___ egg."', 'an', 'a', 'two', 'many'),
  mc('Which sentence is correct?', 'The cat sleeps.', 'the cat sleeps', 'The cat sleep.', 'Cat the sleeps.'),
  mc('Which one is more than one (a plural)?', 'cats', 'cat', 'a cat', 'one cat'),
  mc('What is the plural of "book"?', 'books', 'bookes', 'bookies', 'book'),
  mc('What is the plural of "box"?', 'boxes', 'boxs', 'boxies', 'box'),
  mc('What is the plural of "child"?', 'children', 'childs', 'childes', 'childrens'),
  mc('Which sentence ends with the right mark?', 'Where is my bag?', 'Where is my bag.', 'Where is my bag!!', 'Where is my bag,'),
];

export const YOUNG_SHAPES: readonly MultipleChoiceItem[] = [
  mc('How many sides does a triangle have?', '3', '4', '5', '2'),
  mc('How many sides does a square have?', '4', '3', '5', '6'),
  mc('How many corners does a rectangle have?', '4', '3', '2', '6'),
  mc('Which shape has no corners?', 'Circle', 'Square', 'Triangle', 'Rectangle'),
  mc('Which shape has 4 equal sides?', 'Square', 'Triangle', 'Circle', 'Oval'),
  mc('A ball is the shape of a...', 'Sphere', 'Cube', 'Cone', 'Cylinder'),
  mc('A dice is the shape of a...', 'Cube', 'Sphere', 'Cone', 'Circle'),
  mc('An ice cream cone is the shape of a...', 'Cone', 'Cube', 'Sphere', 'Square'),
  mc('A tin can is the shape of a...', 'Cylinder', 'Cone', 'Cube', 'Triangle'),
  mc('How many sides does a pentagon have?', '5', '4', '6', '8'),
  mc('How many sides does a hexagon have?', '6', '5', '8', '4'),
  mc('Which shape is a clock face?', 'Circle', 'Triangle', 'Star', 'Diamond'),
  mc('A door is usually the shape of a...', 'Rectangle', 'Circle', 'Triangle', 'Star'),
  mc('Which has a flat face and rolls?', 'Cylinder', 'Cube', 'Pyramid', 'Box'),
  mc('Two halves of a circle make...', 'A whole circle', 'A square', 'A triangle', 'A star'),
  mc('Which shape has 3 corners?', 'Triangle', 'Square', 'Circle', 'Rectangle'),
];

export const YOUNG_WEATHER: readonly MultipleChoiceItem[] = [
  mc('What do we use when it rains?', 'An umbrella', 'A fan', 'Sunglasses', 'A kite'),
  mc('Which season is the coldest?', 'Winter', 'Summer', 'Spring', 'Monsoon'),
  mc('Which season is usually the hottest?', 'Summer', 'Winter', 'Autumn', 'Spring'),
  mc('What falls from the clouds?', 'Rain', 'Sand', 'Leaves', 'Stones'),
  mc('What do we see in the sky after rain and sun?', 'A rainbow', 'A moon', 'A kite', 'A bridge'),
  mc('How many seasons are there in a year (in many places)?', '4', '2', '3', '7'),
  mc('Which weather do we need a warm jumper for?', 'Cold', 'Hot', 'Sunny', 'Windy only'),
  mc('When is the Sun in the sky?', 'Day', 'Night', 'Only in winter', 'Never'),
  mc('What moves the clouds and a kite?', 'Wind', 'Sand', 'Soil', 'Ice'),
  mc('Snow is made of...', 'Frozen water', 'Sand', 'Cotton', 'Salt'),
  mc('Which one do we wear in the rain?', 'Raincoat', 'Sunhat', 'Swimsuit', 'Scarf only'),
  mc('Which season has falling leaves?', 'Autumn', 'Spring', 'Summer', 'Winter'),
  mc('Which season has many new flowers?', 'Spring', 'Autumn', 'Winter', 'Summer'),
  mc('Thunder is a...', 'Loud sound in the sky', 'Soft song', 'Kind of fruit', 'Kind of cloud'),
];

export const YOUNG_BODY: readonly MultipleChoiceItem[] = [
  mc('Which part do we use to see?', 'Eyes', 'Ears', 'Nose', 'Hands'),
  mc('Which part do we use to hear?', 'Ears', 'Eyes', 'Feet', 'Knees'),
  mc('Which part do we use to smell?', 'Nose', 'Mouth', 'Ears', 'Hands'),
  mc('Which part do we use to taste?', 'Tongue', 'Nose', 'Ears', 'Elbow'),
  mc('Which part do we use to touch?', 'Skin', 'Hair only', 'Nails only', 'Teeth'),
  mc('How many senses do we have?', '5', '3', '7', '10'),
  mc('How many fingers are on two hands?', '10', '8', '12', '5'),
  mc('Which part helps us walk?', 'Legs', 'Ears', 'Eyes', 'Nose'),
  mc('Which part of the body pumps blood?', 'Heart', 'Lungs', 'Brain', 'Tummy'),
  mc('Which part do we think with?', 'Brain', 'Heart', 'Tummy', 'Elbow'),
  mc('Which part do we breathe with?', 'Lungs', 'Knees', 'Hair', 'Nails'),
  mc('What do we use to chew food?', 'Teeth', 'Hair', 'Nails', 'Ears'),
  mc('What bends in the middle of our arm?', 'Elbow', 'Knee', 'Ankle', 'Neck'),
  mc('What bends in the middle of our leg?', 'Knee', 'Elbow', 'Wrist', 'Chin'),
];

export const YOUNG_DAYS: readonly MultipleChoiceItem[] = [
  mc('How many days are in a week?', '7', '5', '6', '10'),
  mc('Which day comes after Monday?', 'Tuesday', 'Sunday', 'Wednesday', 'Friday'),
  mc('Which day comes after Friday?', 'Saturday', 'Thursday', 'Sunday', 'Monday'),
  mc('Which day comes before Wednesday?', 'Tuesday', 'Thursday', 'Monday', 'Friday'),
  mc('Which day comes after Sunday?', 'Monday', 'Saturday', 'Tuesday', 'Friday'),
  mc('Which is the first month of the year?', 'January', 'March', 'December', 'June'),
  mc('Which is the last month of the year?', 'December', 'January', 'November', 'October'),
  mc('How many months are in a year?', '12', '10', '7', '11'),
  mc('Which month comes after March?', 'April', 'February', 'May', 'June'),
  mc('Which month comes before June?', 'May', 'July', 'April', 'August'),
  mc('What do we call the day after today?', 'Tomorrow', 'Yesterday', 'Today', 'Last week'),
  mc('What do we call the day before today?', 'Yesterday', 'Tomorrow', 'Today', 'Next week'),
  mc('How many hours are in one day?', '24', '12', '10', '60'),
  mc('How many minutes are in one hour?', '60', '12', '100', '24'),
  mc('Which comes first in the day?', 'Morning', 'Night', 'Evening', 'Afternoon'),
];

export const YOUNG_INDIA: readonly MultipleChoiceItem[] = [
  mc('What is the name of our country?', 'India', 'Nepal', 'Japan', 'Brazil'),
  mc('What are the colours of the Indian flag?', 'Saffron, white and green', 'Red, blue and yellow', 'Black and white', 'Pink and purple'),
  mc('What is the national bird of India?', 'Peacock', 'Parrot', 'Crow', 'Sparrow'),
  mc('What is the national animal of India?', 'Tiger', 'Cow', 'Elephant', 'Dog'),
  mc('What is the national flower of India?', 'Lotus', 'Rose', 'Sunflower', 'Tulip'),
  mc('What is the national fruit of India?', 'Mango', 'Apple', 'Grapes', 'Banana'),
  mc('On which day do we celebrate Independence Day?', '15 August', '26 January', '2 October', '14 November'),
  mc('On which day do we celebrate Republic Day?', '26 January', '15 August', '25 December', '5 September'),
  mc('Who is called the Father of the Nation?', 'Mahatma Gandhi', 'Nehru', 'Tagore', 'Ashoka'),
  mc('What is the capital of India?', 'New Delhi', 'Mumbai', 'Chennai', 'Kolkata'),
  mc('Which festival is the festival of lights?', 'Diwali', 'Holi', 'Eid', 'Pongal'),
  mc('Which festival is the festival of colours?', 'Holi', 'Diwali', 'Christmas', 'Onam'),
  mc('The wheel in the middle of our flag is called the...', 'Ashoka Chakra', 'Sun wheel', 'Cart wheel', 'Moon wheel'),
  mc('What do we call the song we sing for our country?', 'National anthem', 'Lullaby', 'Birthday song', 'Prayer'),
];

export const YOUNG_HABITS: readonly MultipleChoiceItem[] = [
  mc('When should we wash our hands?', 'Before eating', 'Never', 'Only on Sundays', 'Only at night'),
  mc('How many times a day should we brush our teeth?', 'Two', 'Zero', 'Ten', 'Only on holidays'),
  mc('Which food is good for strong bones?', 'Milk', 'Candy', 'Chips', 'Soda'),
  mc('Which food helps us grow healthy?', 'Fruits and vegetables', 'Only sweets', 'Only chips', 'Only cake'),
  mc('What should we drink to stay healthy?', 'Water', 'Cola', 'Energy drink', 'Syrup only'),
  mc('What should we do before crossing the road?', 'Look both ways', 'Run fast', 'Close our eyes', 'Play'),
  mc('What colour means stop at a traffic light?', 'Red', 'Green', 'Blue', 'Pink'),
  mc('What colour means go at a traffic light?', 'Green', 'Red', 'Yellow', 'Black'),
  mc('Where should we throw rubbish?', 'In the dustbin', 'On the road', 'In a river', 'Under a bed'),
  mc('How much should a child sleep each night?', 'About 9 to 11 hours', '1 hour', '3 hours', 'None'),
  mc('What should we do when we sneeze?', 'Cover our nose and mouth', 'Shout', 'Spit', 'Run'),
  mc('Which keeps us safe in a car?', 'A seat belt', 'A hat', 'A toy', 'A balloon'),
  mc('What do we do when we are sad?', 'Talk to someone we trust', 'Hide forever', 'Hit someone', 'Break a toy'),
  mc('Why do we exercise and play outside?', 'To stay strong and healthy', 'To get tired for no reason', 'To stay dirty', 'To miss lunch'),
];

/** Short words for "fill in the missing letter" in grade 1. */
export const YOUNG_SPELLING: readonly string[] = [
  'CAT', 'DOG', 'SUN', 'HAT', 'BED', 'PEN', 'CUP', 'BUS', 'BAG', 'BOX',
  'FISH', 'MILK', 'BOOK', 'TREE', 'BIRD', 'FROG', 'DUCK', 'CAKE', 'MOON', 'STAR',
  'RAIN', 'SNOW', 'FARM', 'JUMP', 'PLAY', 'READ', 'SING', 'BALL', 'DOLL', 'KITE',
  'HAND', 'FOOT', 'NOSE', 'LEAF', 'ROSE', 'HOME', 'DESK', 'LAMP', 'DRUM', 'SHIP',
  'APPLE', 'WATER', 'HAPPY', 'GREEN', 'HORSE', 'MOUSE', 'TABLE', 'CHAIR', 'SMILE', 'CLOCK',
];

/** Easy opposite pairs for ages 6 and 7. */
export const YOUNG_OPPOSITES: readonly (readonly [string, string])[] = [
  ['Hot', 'Cold'], ['Big', 'Small'], ['Up', 'Down'], ['Day', 'Night'], ['Happy', 'Sad'],
  ['Fast', 'Slow'], ['Tall', 'Short'], ['Open', 'Close'], ['Hard', 'Soft'], ['Wet', 'Dry'],
  ['Old', 'New'], ['Full', 'Empty'], ['In', 'Out'], ['Clean', 'Dirty'],
  ['Long', 'Short'], ['Heavy', 'Light'], ['Boy', 'Girl'], ['Come', 'Go'], ['Stop', 'Go'],
  ['Sit', 'Stand'], ['Laugh', 'Cry'], ['Push', 'Pull'], ['Early', 'Late'], ['Left', 'Right'],
];
