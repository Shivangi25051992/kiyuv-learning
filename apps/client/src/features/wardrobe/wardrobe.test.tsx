import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KidProfile } from '@kiyuv/shared';
import { Mascot } from '../../ui/Mascot.js';
import { LearnHome } from '../learn/LearnHome.js';
import { RANKS } from '../learn/rank.js';
import { getActiveLook, setActiveLook } from './lookStore.js';
import { LOOKS, WARDROBE_PAGE_ID, isUnlocked, loadLookChoice, resolveLook, saveLookChoice, starsNeeded, unlockedLooks } from './looks.js';
import { WardrobeScreen } from './WardrobeScreen.js';

beforeEach(() => {
  localStorage.clear();
  setActiveLook(null);
});
afterEach(() => {
  cleanup();
  setActiveLook(null);
});

const kid = (stars: number): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track: 'primary', stars, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0,
});

describe('what unlocks when', () => {
  it('has one look for every rank after the first, in order, each 50 stars further on', () => {
    expect(LOOKS).toHaveLength(RANKS.length - 1);
    LOOKS.forEach((l, i) => {
      expect(l.rankIndex).toBe(i + 1);
      expect(starsNeeded(l)).toBe((i + 1) * 50);
    });
    expect(new Set(LOOKS.map((l) => l.key)).size).toBe(LOOKS.length);
  });

  it('unlocks at exactly the star counts, not before', () => {
    expect(unlockedLooks(0)).toHaveLength(0);
    expect(unlockedLooks(49)).toHaveLength(0);
    expect(unlockedLooks(50).map((l) => l.key)).toEqual(['butterfly']);
    expect(unlockedLooks(149).map((l) => l.key)).toEqual(['butterfly', 'star']);
    expect(unlockedLooks(300)).toHaveLength(6);
    expect(isUnlocked(LOOKS[5]!, 299)).toBe(false);
    expect(isUnlocked(LOOKS[5]!, 300)).toBe(true);
  });
});

describe('what Kiyu wears', () => {
  it('is the newest unlocked look unless the child chose something else', () => {
    expect(resolveLook('a', 10)).toBeNull();
    expect(resolveLook('a', 120)).toBe('star');
    saveLookChoice('a', 'butterfly');
    expect(resolveLook('a', 120)).toBe('butterfly');
    saveLookChoice('a', 'none');
    expect(resolveLook('a', 120)).toBeNull();
    saveLookChoice('a', 'auto');
    expect(resolveLook('a', 120)).toBe('star');
  });

  it('never wears something still locked, for example after the stars were reset', () => {
    saveLookChoice('a', 'crown');
    expect(resolveLook('a', 120)).toBe('star');
    expect(resolveLook('a', 5)).toBeNull();
    expect(resolveLook('a', 300)).toBe('crown');
  });

  it('is kept separately for each child, and bad saved data is ignored', () => {
    saveLookChoice('a', 'none');
    expect(loadLookChoice('b')).toBe('auto');
    localStorage.setItem('kiyuv.look.c', 'wizard-hat');
    expect(loadLookChoice('c')).toBe('auto');
  });
});

describe('Kiyu wearing it', () => {
  const svgFor = (accessory: Parameters<typeof Mascot>[0]['accessory']) => {
    const { container, unmount } = render(<Mascot accessory={accessory} />);
    const html = container.querySelector('svg')!.innerHTML;
    const attr = container.querySelector('.mascot-bob')!.getAttribute('data-accessory');
    unmount();
    return { html, attr };
  };

  it('draws each accessory differently, and nothing for none', () => {
    const plain = svgFor(null);
    expect(plain.attr).toBeNull();
    const seen = new Set<string>([plain.html]);
    for (const l of LOOKS) {
      const { html, attr } = svgFor(l.key);
      expect(attr).toBe(l.key);
      expect(html.length, l.key).toBeGreaterThan(plain.html.length);
      seen.add(html);
    }
    expect(seen.size).toBe(LOOKS.length + 1);
    expect(svgFor('cape').html).toContain('mascot-cape');
    expect(svgFor('jetpack').html).toContain('mascot-jetpack');
    expect(svgFor('butterfly').html).toContain('mascot-butterfly');
  });

  it('every Kiyu on screen follows what is set, and an explicit choice wins', () => {
    render(<Mascot />);
    expect(document.querySelector('.mascot-bob')!.getAttribute('data-accessory')).toBeNull();
    act(() => setActiveLook('crown'));
    expect(document.querySelector('.mascot-bob')!.getAttribute('data-accessory')).toBe('crown');
    cleanup();
    act(() => setActiveLook('crown'));
    render(<Mascot accessory={null} />);
    expect(document.querySelector('.mascot-bob')!.getAttribute('data-accessory')).toBeNull();
    cleanup();
    render(<Mascot accessory="star" />);
    expect(document.querySelector('.mascot-bob')!.getAttribute('data-accessory')).toBe('star');
  });

  it('is still decoration only, hidden from screen readers', () => {
    render(<Mascot accessory="crown" />);
    expect(document.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('the wardrobe page', () => {
  const open = (stars: number) => {
    const onClose = vi.fn();
    render(<WardrobeScreen profile={kid(stars)} storeKey="u1:k1" onClose={onClose} />);
    return { onClose };
  };

  it('says what is next, and shows locked looks as locked, with how to earn them', () => {
    open(60);
    expect(screen.getByText(/Next: Gold star at Shining Star \(100 stars\)/)).toBeTruthy();
    const locked = screen.getByRole('button', { name: /Gold star\. Locked\. Reach Shining Star at 100 stars\./ }) as HTMLButtonElement;
    expect(locked.disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Butterfly friend' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('a child can choose what Kiyu wears, and it shows everywhere at once and is remembered', () => {
    open(170);
    expect(screen.getByText('Kiyu is wearing: Hero medal')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Butterfly friend' }));
    expect(screen.getByText('Kiyu is wearing: Butterfly friend')).toBeTruthy();
    expect(getActiveLook()).toBe('butterfly');
    expect(loadLookChoice('u1:k1')).toBe('butterfly');
    expect(screen.getByRole('button', { name: 'Butterfly friend' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /No extras/ }));
    expect(screen.getByText('Kiyu is wearing no extras')).toBeTruthy();
    expect(getActiveLook()).toBeNull();
  });

  it('a locked look cannot be worn', () => {
    open(10);
    expect(screen.getByText(/Next: Butterfly friend at Butterfly \(50 stars\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Royal crown\. Locked/ }));
    expect(getActiveLook()).toBeNull();
    expect(loadLookChoice('u1:k1')).toBe('auto');
  });

  it('celebrates when everything is unlocked, and goes back', () => {
    const { onClose } = open(400);
    expect(screen.getByText(/You unlocked everything/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back to the learn page' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('on the Learn page', () => {
  it('has a card that opens the wardrobe', () => {
    const onStart = vi.fn();
    render(<LearnHome profile={kid(10)} now={new Date(2026, 10, 12, 10)} onStartTopic={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /Kiyu's wardrobe/ }));
    expect(onStart).toHaveBeenCalledWith(WARDROBE_PAGE_ID);
  });
});
