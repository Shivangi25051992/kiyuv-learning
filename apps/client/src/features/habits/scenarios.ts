/**
 * "What would you do?" situations for older children (about 7 to 13). Each has one good
 * choice. A less good choice gets a short, kind reason and the child simply tries another.
 */
export interface ScenarioOption {
  text: string;
  good: boolean;
  /** Shown after this choice is tapped. */
  feedback: string;
}

export interface Scenario {
  prompt: string;
  options: readonly [ScenarioOption, ScenarioOption, ScenarioOption];
}

const o = (text: string, good: boolean, feedback: string): ScenarioOption => ({ text, good, feedback });

export const KIND_SCENARIOS: readonly Scenario[] = [
  {
    prompt: 'A new classmate sits alone at lunch. What could you do?',
    options: [
      o('Invite them to sit with you', true, 'Being friendly helps new people feel welcome.'),
      o('Ignore them', false, 'Being left out can make someone feel lonely. Try another choice.'),
      o('Laugh about them with your friends', false, 'That could really hurt their feelings. Try another choice.'),
    ],
  },
  {
    prompt: 'A friend drops all their books in the corridor. What do you do?',
    options: [
      o('Walk past quickly', false, 'A little help makes a big difference. Try another choice.'),
      o('Help them pick the books up', true, 'Helping is a kind way to be a good friend.'),
      o('Take a photo of it', false, 'They might feel embarrassed. Try another choice.'),
    ],
  },
  {
    prompt: 'Someone is telling you a story and you want to talk too. What is kind?',
    options: [
      o('Wait until they finish, then take your turn', true, 'Listening shows you care about what they say.'),
      o('Talk over them', false, 'Talking over someone can make them feel unheard. Try another choice.'),
      o('Walk away while they talk', false, 'That can feel unkind. Try another choice.'),
    ],
  },
  {
    prompt: 'You and a friend disagree about a game. What helps most?',
    options: [
      o('Shout until they give in', false, 'Shouting makes things worse. Try another choice.'),
      o('Never play with them again', false, 'One disagreement does not need to end a friendship. Try another choice.'),
      o('Listen to them, then say how you feel calmly', true, 'Listening and speaking calmly helps friends find a fair answer.'),
    ],
  },
  {
    prompt: 'You said something that hurt a friend. What do you do?',
    options: [
      o('Say sorry and ask how you can make it better', true, 'A real sorry helps to fix hurt feelings.'),
      o('Pretend it did not happen', false, 'They may still feel hurt. Try another choice.'),
      o('Blame them for it', false, 'Blaming makes it worse. Try another choice.'),
    ],
  },
  {
    prompt: 'A teammate misses the goal and looks upset. What do you say?',
    options: [
      o('"That was your fault!"', false, 'Blame hurts and does not help the team. Try another choice.'),
      o('Nothing. Look away.', false, 'A kind word could help them a lot. Try another choice.'),
      o('"Nice try! You will get it next time."', true, 'Kind words help teammates keep trying.'),
    ],
  },
  {
    prompt: 'You see a child being teased. What is a good thing to do?',
    options: [
      o('Join in so you fit in', false, 'Joining in hurts the person being teased. Try another choice.'),
      o('Be kind to them and tell a trusted grown-up', true, 'Being kind and getting a grown-up to help is brave and safe.'),
      o('Pretend you did not see', false, 'The child could still be hurt. Try another choice.'),
    ],
  },
  {
    prompt: 'You borrow a book from a friend. What should you do?',
    options: [
      o('Take care of it and give it back on time', true, 'Looking after borrowed things shows respect.'),
      o('Keep it forever', false, 'It belongs to your friend. Try another choice.'),
      o('Write in it', false, 'That would spoil it for your friend. Try another choice.'),
    ],
  },
];

export const ONLINE_SCENARIOS: readonly Scenario[] = [
  {
    prompt: 'Someone you do not know online asks where you live. What do you do?',
    options: [
      o('Tell them your address', false, 'Never share where you live with someone you do not know. Try another choice.'),
      o('Do not answer, and tell a trusted grown-up', true, 'Keeping your address private keeps you safe.'),
      o('Give them just your street name', false, 'Even a little bit can help someone find you. Try another choice.'),
    ],
  },
  {
    prompt: 'A pop-up says "You won a prize! Type your password to get it." What do you do?',
    options: [
      o('Type your password quickly', false, 'That could let a stranger into your account. Try another choice.'),
      o('Close it and tell a grown-up', true, 'Real prizes never ask for your password.'),
      o('Share it with your friends', false, 'It could be a trick that reaches them too. Try another choice.'),
    ],
  },
  {
    prompt: 'You are making a new password. Which is the strongest?',
    options: [
      o('Your name and birthday', false, 'People can guess these easily. Try another choice.'),
      o('A long mix of words, numbers and symbols that only you know', true, 'Long and mixed passwords are much harder to guess.'),
      o('1234', false, 'This is one of the first things people try. Try another choice.'),
    ],
  },
  {
    prompt: 'A friend asks for your password so they can play on your account. What do you do?',
    options: [
      o('Keep it private. Only a parent should know it.', true, 'Passwords are private, even from friends.'),
      o('Give it to them. They are your friend.', false, 'Friends can share it by accident. Try another choice.'),
      o('Write it on a note and pass it on', false, 'Notes can be seen by anyone. Try another choice.'),
    ],
  },
  {
    prompt: 'Someone sends you a mean message. What is a good thing to do?',
    options: [
      o('Send a meaner message back', false, 'That can make things worse. Try another choice.'),
      o('Do not reply, keep the message, and tell a trusted grown-up', true, 'Not replying and telling a grown-up keeps you safe and helps stop it.'),
      o('Delete it and tell nobody', false, 'A grown-up can only help if they know. Try another choice.'),
    ],
  },
  {
    prompt: 'You are not sure if a website is safe. What do you do?',
    options: [
      o('Ask a grown-up before you use it', true, 'Asking first is the safe thing to do.'),
      o('Click everything to find out', false, 'Clicking around can open unsafe pages. Try another choice.'),
      o('Type your name and photo into it', false, 'Never share your details with a site you are unsure about. Try another choice.'),
    ],
  },
  {
    prompt: 'A game asks for your full name and your photo. What do you do?',
    options: [
      o('Fill it all in right away', false, 'Share as little as you can. Try another choice.'),
      o('Ask a parent first, and share as little as possible', true, 'A parent can help decide what is safe to share.'),
      o('Use a friend\'s name instead', false, 'Pretending to be someone else is not the answer. Try another choice.'),
    ],
  },
  {
    prompt: 'You see something online that makes you feel scared. What do you do?',
    options: [
      o('Keep looking to be brave', false, 'It is okay to look away. Try another choice.'),
      o('Close it and tell a grown-up right away', true, 'Telling a grown-up helps you feel safe again.'),
      o('Send it to your friends', false, 'It could scare them too. Try another choice.'),
    ],
  },
];

export const SCREEN_SCENARIOS: readonly Scenario[] = [
  {
    prompt: 'How much sleep do children aged 6 to 12 need each night?',
    options: [
      o('About 4 hours', false, 'That is much too little. Try another choice.'),
      o('About 9 to 12 hours', true, 'Sleep helps your body grow and your brain learn.'),
      o('About 15 hours', false, 'That is more than children usually need. Try another choice.'),
    ],
  },
  {
    prompt: 'It is nearly bedtime and you want to play a game. What is best?',
    options: [
      o('Stop screens about an hour before bed and read or relax', true, 'Screens close to bedtime can make it harder to fall asleep.'),
      o('Play until you fall asleep', false, 'Bright screens can keep your brain awake. Try another choice.'),
      o('Watch videos under the covers', false, 'That can keep you awake and tired tomorrow. Try another choice.'),
    ],
  },
  {
    prompt: 'You have been on a screen for a long time. What should you do?',
    options: [
      o('Keep going, you are winning', false, 'Your body needs a break. Try another choice.'),
      o('Take a break: stretch, drink water and look far away', true, 'Breaks help your eyes, your body and your mood.'),
      o('Turn the brightness up', false, 'That can make your eyes more tired. Try another choice.'),
    ],
  },
  {
    prompt: 'You have homework and want to play. What is a good plan?',
    options: [
      o('Play first and hope there is time later', false, 'Homework can get rushed or missed. Try another choice.'),
      o('Do your homework first, then play', true, 'Finishing your work first means you can play without worrying.'),
      o('Do both at once', false, 'Doing two things at once makes both harder. Try another choice.'),
    ],
  },
  {
    prompt: 'You are lying in bed and cannot fall asleep. What helps?',
    options: [
      o('Read a quiet book or breathe slowly', true, 'Calm, quiet things help your body get ready for sleep.'),
      o('Play on a phone', false, 'Bright screens make it harder to sleep. Try another choice.'),
      o('Drink a fizzy drink', false, 'Some fizzy drinks have caffeine, which keeps you awake. Try another choice.'),
    ],
  },
  {
    prompt: 'Your eyes feel tired from looking at a screen. What can you try?',
    options: [
      o('Look at something far away for about 20 seconds', true, 'Looking far away gives your eye muscles a rest.'),
      o('Stare at the screen harder', false, 'That tires your eyes even more. Try another choice.'),
      o('Rub them with dirty hands', false, 'That can spread germs. Try another choice.'),
    ],
  },
];
