import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getSavedVoiceName,
  isMusicEnabled,
  listEnglishVoices,
  recommendedVoice,
  setVoiceName,
  speak,
  startMusic,
  stopMusic,
  toggleMusic,
} from './sound.js';

const voice = (name: string, lang: string, localService = true) =>
  ({ name, lang, localService, default: false, voiceURI: name }) as SpeechSynthesisVoice;

const VOICES = [
  voice('Microsoft David - English (United States)', 'en-US'),
  voice('Microsoft Zira - English (United States)', 'en-US'),
  voice('Microsoft Aria Online (Natural) - English (United States)', 'en-US', false),
  voice('Google UK English Male', 'en-GB', false),
  voice('Amelie', 'fr-FR'),
];

describe('reading voice', () => {
  const spoken: Array<{ voice?: SpeechSynthesisVoice; rate: number }> = [];

  beforeEach(() => {
    spoken.length = 0;
    localStorage.clear();
    class FakeUtterance {
      voice?: SpeechSynthesisVoice;
      lang = '';
      rate = 1;
      pitch = 1;
      volume = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => VOICES,
        cancel: () => {},
        speak: (u: FakeUtterance) => spoken.push({ voice: u.voice, rate: u.rate }),
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefers a natural female voice and ignores non-English voices', () => {
    expect(recommendedVoice()?.name).toContain('Aria');
    expect(listEnglishVoices().some((v) => v.lang.startsWith('fr'))).toBe(false);
    const names = listEnglishVoices().map((v) => v.name);
    expect(names.indexOf('Microsoft Zira - English (United States)')).toBeLessThan(
      names.indexOf('Microsoft David - English (United States)'),
    );
  });

  it('speaks slowly with the chosen voice, and a parent can override it', () => {
    speak('Hello');
    expect(spoken[0]?.voice?.name).toContain('Aria');
    expect(spoken[0]?.rate).toBeLessThan(1);

    setVoiceName('Microsoft Zira - English (United States)');
    expect(getSavedVoiceName()).toBe('Microsoft Zira - English (United States)');
    speak('Hello again');
    expect(spoken[1]?.voice?.name).toContain('Zira');

    setVoiceName(null);
    expect(getSavedVoiceName()).toBeNull();
  });

  it('falls back to the automatic voice when the saved one is gone', () => {
    setVoiceName('Voice That Was Uninstalled');
    speak('Hello');
    expect(spoken[0]?.voice?.name).toContain('Aria');
  });
});

describe('background music', () => {
  it('remembers on and off, and never throws when audio is unavailable', () => {
    localStorage.clear();
    const before = isMusicEnabled();
    expect(toggleMusic()).toBe(!before);
    expect(localStorage.getItem('kidsMusicOn')).toBe(!before ? '1' : '0');
    expect(toggleMusic()).toBe(before);
    expect(() => {
      startMusic();
      stopMusic();
    }).not.toThrow();
  });
});

describe('music volume', () => {
  it('is saved, limited to 0 to 100 percent, and starts at 50 percent', async () => {
    const mod = await import('./sound.js');
    expect(mod.getMusicVolume()).toBeGreaterThanOrEqual(0);
    mod.setMusicVolume(0.8);
    expect(mod.getMusicVolume()).toBe(0.8);
    expect(localStorage.getItem('kidsMusicVolume')).toBe('0.8');
    mod.setMusicVolume(5);
    expect(mod.getMusicVolume()).toBe(1);
    mod.setMusicVolume(-2);
    expect(mod.getMusicVolume()).toBe(0);
    mod.setMusicVolume(Number.NaN);
    expect(mod.getMusicVolume()).toBe(0.5);
  });
});
