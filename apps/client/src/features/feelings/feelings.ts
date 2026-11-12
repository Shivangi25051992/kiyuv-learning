import type { MascotMood } from '../../ui/Mascot.js';

/**
 * A short daily check-in: "How are you feeling today?" The answer stays on this device,
 * is used only to choose Kiyu's kind words, and is never sent anywhere or shown to anyone.
 * Kiyu does not judge, diagnose or advise on feelings. It listens, says thank you, offers
 * to breathe together when a feeling is big, and reminds the child that a trusted grown-up
 * can always help.
 */
export type FeelingKey = 'happy' | 'okay' | 'tired' | 'worried' | 'sad' | 'angry';

export interface Feeling {
  key: FeelingKey;
  label: string;
  /** A face from the app's picture set. */
  emoji: string;
  /** How Kiyu looks when it answers. */
  kiyu: MascotMood;
  /** What Kiyu says back. {name} is the child's nickname. */
  reply: string;
  /** For big feelings: calm breathing is offered, and a grown-up is mentioned. */
  big: boolean;
}

export const FEELINGS: readonly Feeling[] = [
  { key: 'happy', label: 'Happy', emoji: '😊', kiyu: 'excited', reply: 'I am so glad, {name}! Let us have a great day!', big: false },
  { key: 'okay', label: 'Okay', emoji: '🙂', kiyu: 'happy', reply: 'Thank you for telling me, {name}! Let us have a nice, easy day.', big: false },
  { key: 'tired', label: 'Tired', emoji: '😴', kiyu: 'sleepy', reply: 'Thank you for telling me, {name}. We can go gently today. Sleep is a superpower!', big: false },
  { key: 'worried', label: 'Worried', emoji: '😟', kiyu: 'love', reply: 'It is okay to feel worried, {name}. You are not alone. I am here with you.', big: true },
  { key: 'sad', label: 'Sad', emoji: '😢', kiyu: 'love', reply: 'I am sorry you feel sad, {name}. Thank you for telling me. I am here with you.', big: true },
  { key: 'angry', label: 'Angry', emoji: '😠', kiyu: 'think', reply: 'It is okay to feel angry, {name}. Let us take some slow breaths together.', big: true },
];

export const feelingOf = (key: string | null | undefined): Feeling | null => FEELINGS.find((f) => f.key === key) ?? null;

/** Said under a big feeling: a trusted grown-up can always help. */
export const GROWN_UP_LINE = 'If a feeling stays big, tell a grown-up you trust. They want to help.';

export const replyFor = (feeling: Feeling, name: string): string =>
  feeling.reply.split('{name}').join(name.trim() || 'friend');
