import type { TapItem } from './playData.js';

/**
 * More things to tap in Play time. Each line is short, kind and true. Every emoji here has a
 * drawing in the app's picture set (a test checks).
 */

export const MORE_VEHICLES: readonly TapItem[] = [
  { key: 'plane', emoji: '✈️', label: 'Aeroplane', say: 'Aeroplane! It flies high in the sky!', caption: 'An aeroplane flies high in the sky!' },
  { key: 'moto', emoji: '🏍️', label: 'Motorbike', say: 'Motorbike! Vroom vroom!', caption: 'A motorbike goes vroom!' },
  { key: 'taxi', emoji: '🚕', label: 'Taxi', say: 'Taxi! It takes us where we want to go!', caption: 'A taxi takes us places!' },
  { key: 'truck', emoji: '🚚', label: 'Truck', say: 'Truck! It carries big things!', caption: 'A truck carries big things!' },
  { key: 'police', emoji: '🚓', label: 'Police car', say: 'Police car! It helps keep us safe!', caption: 'A police car helps keep us safe!' },
  { key: 'rocket', emoji: '🚀', label: 'Rocket', say: 'Rocket! Three, two, one, blast off!', caption: '3, 2, 1, blast off!' },
  { key: 'scooter', emoji: '🛵', label: 'Scooter', say: 'Scooter! Zoom!', caption: 'A scooter goes zoom!' },
  { key: 'sailboat', emoji: '⛵', label: 'Sailboat', say: 'Sailboat! The wind pushes it along!', caption: 'The wind pushes a sailboat!' },
];

export const MORE_FOODS: readonly TapItem[] = [
  { key: 'cherry', emoji: '🍒', label: 'Cherries', say: 'Cherries! Yum!', caption: 'Cherries! Yum!' },
  { key: 'lemon', emoji: '🍋', label: 'Lemon', say: 'Lemon! Sour!', caption: 'Lemon! Sour!' },
  { key: 'pear', emoji: '🍐', label: 'Pear', say: 'Pear! Yum!', caption: 'Pear! Yum!' },
  { key: 'mango', emoji: '🥭', label: 'Mango', say: 'Mango! Yum!', caption: 'Mango! Yum!' },
  { key: 'coconut', emoji: '🥥', label: 'Coconut', say: 'Coconut! Yum!', caption: 'Coconut! Yum!' },
  { key: 'tomato', emoji: '🍅', label: 'Tomato', say: 'Tomato! Yum!', caption: 'Tomato! Yum!' },
  { key: 'potato', emoji: '🥔', label: 'Potato', say: 'Potato! Yum!', caption: 'Potato! Yum!' },
  { key: 'corn', emoji: '🌽', label: 'Corn', say: 'Corn! Yum!', caption: 'Corn! Yum!' },
  { key: 'cucumber', emoji: '🥒', label: 'Cucumber', say: 'Cucumber! Crunch!', caption: 'Cucumber! Crunch!' },
  { key: 'brinjal', emoji: '🍆', label: 'Brinjal', say: 'Brinjal! Yum!', caption: 'Brinjal! Yum!' },
  { key: 'onion', emoji: '🧅', label: 'Onion', say: 'Onion!', caption: 'Onion!' },
  { key: 'bread', emoji: '🍞', label: 'Bread', say: 'Bread! Yum!', caption: 'Bread! Yum!' },
  { key: 'egg', emoji: '🥚', label: 'Egg', say: 'Egg! Yum!', caption: 'Egg! Yum!' },
  { key: 'milk', emoji: '🥛', label: 'Milk', say: 'Milk! Good for strong bones!', caption: 'Milk is good for strong bones!' },
];

/** Things in the sky. */
export const SKY_THINGS: readonly TapItem[] = [
  { key: 'sun', emoji: '🌞', label: 'Sun', say: 'Sun! It gives us light and keeps us warm!', caption: 'The Sun gives us light!' },
  { key: 'moon', emoji: '🌙', label: 'Moon', say: 'Moon! We see it at night!', caption: 'We see the Moon at night!' },
  { key: 'star', emoji: '🌟', label: 'Star', say: 'Star! Twinkle twinkle!', caption: 'Twinkle twinkle little star!' },
  { key: 'earth', emoji: '🌍', label: 'Earth', say: 'Earth! This is where we live!', caption: 'Earth is where we live!' },
  { key: 'saturn', emoji: '🪐', label: 'Planet with rings', say: 'Saturn! A planet with big rings!', caption: 'Saturn has big rings!' },
  { key: 'rocket', emoji: '🚀', label: 'Rocket', say: 'Rocket! Three, two, one, blast off!', caption: '3, 2, 1, blast off!' },
  { key: 'astronaut', emoji: '🧑‍🚀', label: 'Astronaut', say: 'Astronaut! They travel to space!', caption: 'An astronaut travels to space!' },
  { key: 'comet', emoji: '☄️', label: 'Comet', say: 'Comet! It zooms across the sky!', caption: 'A comet zooms across the sky!' },
  { key: 'cloud', emoji: '☁️', label: 'Cloud', say: 'Cloud! Soft and fluffy!', caption: 'Clouds are soft and fluffy!' },
  { key: 'telescope', emoji: '🔭', label: 'Telescope', say: 'Telescope! It helps us see far away!', caption: 'A telescope helps us see far!' },
];

export const WEATHER: readonly TapItem[] = [
  { key: 'sunny', emoji: '🌞', label: 'Sunny', say: 'Sunny! It is warm and bright!', caption: 'Sunny! Warm and bright!' },
  { key: 'cloudy', emoji: '☁️', label: 'Cloudy', say: 'Cloudy! The sky is full of clouds!', caption: 'Cloudy! Lots of clouds!' },
  { key: 'rainy', emoji: '🌧️', label: 'Rainy', say: 'Rainy! Splash, splash, splash!', caption: 'Rainy! Splash splash!' },
  { key: 'snowy', emoji: '❄️', label: 'Snowy', say: 'Snowy! It is cold and white!', caption: 'Snowy! Cold and white!' },
  { key: 'windy', emoji: '💨', label: 'Windy', say: 'Windy! Whoosh!', caption: 'Windy! Whoosh!' },
  { key: 'rainbow', emoji: '🌈', label: 'Rainbow', say: 'Rainbow! So many colours!', caption: 'A rainbow has so many colours!' },
  { key: 'umbrella', emoji: '☂️', label: 'Umbrella', say: 'Umbrella! It keeps us dry in the rain!', caption: 'An umbrella keeps us dry!' },
  { key: 'thunder', emoji: '⚡', label: 'Lightning', say: 'Lightning! Flash!', caption: 'Lightning! Flash!' },
];

/** Everyday things at home. */
export const HOME_THINGS: readonly TapItem[] = [
  { key: 'bed', emoji: '🛏️', label: 'Bed', say: 'Bed! We sleep in a bed!', caption: 'We sleep in a bed!' },
  { key: 'chair', emoji: '🪑', label: 'Chair', say: 'Chair! We sit on a chair!', caption: 'We sit on a chair!' },
  { key: 'glass', emoji: '🥛', label: 'Glass', say: 'Glass! We drink from a glass!', caption: 'We drink from a glass!' },
  { key: 'spoon', emoji: '🥄', label: 'Spoon', say: 'Spoon! We eat with a spoon!', caption: 'We eat with a spoon!' },
  { key: 'door', emoji: '🚪', label: 'Door', say: 'Door! Knock knock!', caption: 'Knock knock!' },
  { key: 'clock', emoji: '⏰', label: 'Clock', say: 'Clock! Tick tock!', caption: 'Tick tock!' },
  { key: 'book', emoji: '📖', label: 'Book', say: 'Book! We read a book!', caption: 'We read a book!' },
  { key: 'ball', emoji: '⚽', label: 'Ball', say: 'Ball! We kick the ball!', caption: 'We kick the ball!' },
  { key: 'teddy', emoji: '🧸', label: 'Teddy bear', say: 'Teddy bear! A cuddly friend!', caption: 'A cuddly teddy bear!' },
  { key: 'shoes', emoji: '👟', label: 'Shoes', say: 'Shoes! We wear shoes on our feet!', caption: 'We wear shoes on our feet!' },
  { key: 'cap', emoji: '🧢', label: 'Cap', say: 'Cap! We wear a cap on our head!', caption: 'We wear a cap on our head!' },
  { key: 'light', emoji: '💡', label: 'Light', say: 'Light! It makes the room bright!', caption: 'A light makes the room bright!' },
  { key: 'soap', emoji: '🧼', label: 'Soap', say: 'Soap! Wash, wash, wash!', caption: 'Wash, wash, wash!' },
  { key: 'brush', emoji: '🪥', label: 'Toothbrush', say: 'Toothbrush! Brush, brush, brush!', caption: 'Brush, brush, brush!' },
];
