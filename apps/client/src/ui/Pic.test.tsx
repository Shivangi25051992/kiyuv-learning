import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Pic, PicText } from './Pic.js';

afterEach(cleanup);

describe('pictures instead of plain emoji', () => {
  it('draws a known emoji as a picture and keeps its name for screen readers', () => {
    const { container } = render(<Pic emoji="🐶" />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('src')).toContain('pics/1f436.svg');
    expect(img.getAttribute('alt')).toBe('🐶');
  });

  it('handles emoji with a hidden variation mark', () => {
    const { container } = render(<Pic emoji={'☀️'} />);
    expect(container.querySelector('img')!.getAttribute('src')).toContain('pics/2600.svg');
  });

  it('leaves an emoji with no picture as text', () => {
    const { container } = render(<Pic emoji="🦖" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('🦖');
  });

  it('swaps emojis inside a sentence and keeps the words', () => {
    const { container } = render(<PicText text="Tap Woof (Dog 🐶) now" />);
    expect(container.textContent).toContain('Tap Woof (Dog ');
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });
});
