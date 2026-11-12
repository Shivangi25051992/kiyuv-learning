import { afterEach, describe, expect, it, vi } from 'vitest';
import { playClip } from './sound.js';

class FakeAudio {
  static made: FakeAudio[] = [];
  static rejectPlay = false;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  volume = 1;
  paused = false;
  constructor(public src: string) {
    FakeAudio.made.push(this);
  }
  play() {
    return FakeAudio.rejectPlay ? Promise.reject(new Error('blocked')) : Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

const spoken: string[] = [];
class FakeUtterance {
  constructor(public text: string) {}
}
const install = () => {
  FakeAudio.made = [];
  spoken.length = 0;
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: { speak: (u: FakeUtterance) => spoken.push(u.text), cancel: () => {}, getVoices: () => [] },
  });
};
afterEach(() => {
  vi.unstubAllGlobals();
  FakeAudio.rejectPlay = false;
});

describe('playing a real recording', () => {
  it('plays the recording first, then says the name when it ends', () => {
    install();
    playClip('cow', 'Cow!', 'Cow! Moo!');
    expect(FakeAudio.made[0]!.src).toBe('/sounds/cow.mp3');
    expect(spoken).toEqual([]);
    FakeAudio.made[0]!.onended!();
    expect(spoken).toEqual(['Cow!']);
  });

  it('a second tap stops the first recording, so they never pile up', () => {
    install();
    playClip('cow', 'Cow!', 'x');
    playClip('dog', 'Dog!', 'x');
    expect(FakeAudio.made[0]!.paused).toBe(true);
    FakeAudio.made[0]!.onended?.();
    expect(spoken).toEqual([]);
  });

  it('says the words instead when the recording cannot play', async () => {
    install();
    FakeAudio.rejectPlay = true;
    playClip('cow', 'Cow!', 'Cow! Moo!');
    await Promise.resolve();
    await Promise.resolve();
    expect(spoken).toEqual(['Cow! Moo!']);
  });
});
