import type { GeneratedQuestion } from '@kiyuv/content';

/** What makes two questions "the same" to a child: the words, the answer and the picture shown. */
export function questionKey(q: GeneratedQuestion): string {
  const pictures = q.visualEmojis ? `${q.visualEmojis.length}x${q.visualEmojis[0] ?? ''}` : (q.heroEmoji ?? '');
  return [q.topicId, q.subPrompt ?? '', q.prompt, q.correctValue, pictures].join('|').slice(0, 200);
}
