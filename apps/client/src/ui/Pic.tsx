import React from 'react';
import { PIC_CODES } from './picCodes.js';

const EMOJI = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}️?)*/gu;

/** "🐶" becomes "1f436", the name of its picture file. */
function codeOf(emoji: string): string {
  return Array.from(emoji)
    .filter((c) => c !== '️')
    .map((c) => c.codePointAt(0)!.toString(16))
    .join('-');
}

const base = (): string => (import.meta.env?.BASE_URL ?? '/');

/** Where the picture for an emoji lives, or null when there is none. */
export function picSrc(emoji: string): string | null {
  const code = codeOf(emoji);
  return PIC_CODES.has(code) ? `${base()}pics/${code}.svg` : null;
}

/**
 * One drawn picture in place of a plain emoji, so it looks the same on every phone.
 * It sizes itself to the surrounding text (1em). An emoji with no picture stays text.
 */
export const Pic: React.FC<{ emoji: string; className?: string }> = ({ emoji, className }) => {
  const code = codeOf(emoji);
  if (!PIC_CODES.has(code)) return <>{emoji}</>;
  return (
    <img
      className={`pic${className ? ` ${className}` : ''}`}
      src={`${base()}pics/${code}.svg`}
      alt={emoji}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
};

/** Text with its emojis shown as pictures. */
export const PicText: React.FC<{ text: string }> = ({ text }) => {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(EMOJI)) {
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(<Pic key={at} emoji={m[0]} />);
    last = at + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
};
