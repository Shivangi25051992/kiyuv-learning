/**
 * Kid-friendly sound effects, synthesised with the Web Audio API.
 * No audio files, nothing is downloaded, and nothing leaves the device.
 *
 * Design rules: soft attack, warm tones (sine and triangle), gentle volume
 * through one master compressor, and a wrong answer is a friendly "boop",
 * never a buzzer.
 */

let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
let soundEnabled =
  typeof localStorage !== 'undefined' ? localStorage.getItem('kidsSoundOn') !== '0' : true;

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function initAudio(): void {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        audioCtx = new Ctx();
        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.ratio.value = 4;
        master = audioCtx.createGain();
        master.gain.value = 0.9;
        master.connect(compressor);
        compressor.connect(audioCtx.destination);
      }
    } catch {
      // Audio is optional; ignore browsers that block it.
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {});
  }
}

export function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('kidsSoundOn', soundEnabled ? '1' : '0');
  }
  if (soundEnabled) {
    initAudio();
    sfx.hello();
  } else {
    stopSpeaking();
  }
  return soundEnabled;
}

interface ToneOptions {
  type?: OscillatorType;
  volume?: number;
  delay?: number;
  /** Glide to this frequency over the note, for "bloop" and "whoop" sounds. */
  glideTo?: number;
  /** Add a quiet octave above for a sparkly, bell-like colour. */
  sparkle?: boolean;
}

function tone(freq: number, duration: number, opts: ToneOptions = {}): void {
  if (!soundEnabled || !audioCtx || !master) return;
  const { type = 'sine', volume = 0.22, delay = 0, glideTo, sparkle = false } = opts;
  const startAt = audioCtx.currentTime + delay;
  const stopAt = startAt + duration + 0.05;

  const voices: Array<{ f: number; v: number }> = [{ f: freq, v: volume }];
  if (sparkle) voices.push({ f: freq * 2, v: volume * 0.35 });

  for (const voice of voices) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(voice.f, startAt);
    if (glideTo) {
      osc.frequency.exponentialRampToValueAtTime(
        voice.f * (glideTo / freq),
        startAt + duration,
      );
    }
    // Soft attack and long, natural release so notes never click.
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(voice.v, startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(startAt);
    osc.stop(stopAt);
  }
}

/** A short filtered noise burst, used for whooshes and page swishes. */
function whooshNoise(duration: number, fromHz: number, toHz: number, volume = 0.12): void {
  if (!soundEnabled || !audioCtx || !master) return;
  const length = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  const t0 = audioCtx.currentTime;
  filter.frequency.setValueAtTime(fromHz, t0);
  filter.frequency.exponentialRampToValueAtTime(toHz, t0 + duration);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + duration * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t0);
}

type Note = readonly [freq: number, gap: number, length?: number];

function melody(
  notes: readonly Note[],
  opts: Omit<ToneOptions, 'delay'> = {},
  startDelay = 0,
): void {
  let at = startDelay;
  for (const [f, gap, length] of notes) {
    tone(f, length ?? gap * 2.4, { ...opts, delay: at });
    at += gap;
  }
}

// Notes (Hz) from a happy C major pentatonic scale, so any order sounds nice.
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const G5 = 783.99;
const A5 = 880.0;
const C6 = 1046.5;
const D6 = 1174.66;
const E6 = 1318.51;
const G6 = 1567.98;

export const sfx = {
  /** Every button press: a tiny bubble pop. */
  tap: () => tone(620, 0.09, { glideTo: 920, volume: 0.14 }),
  /** Choosing a profile or a topic: a friendly two-note chime. */
  select: () => {
    tone(G5, 0.18, { volume: 0.18, sparkle: true });
    tone(C6, 0.28, { volume: 0.18, sparkle: true, delay: 0.09 });
  },
  /** Moving between screens. */
  whoosh: () => whooshNoise(0.28, 500, 2200, 0.1),
  /** Right answer: a rising sparkle. */
  correct: () => melody([[C5, 0.07], [E5, 0.07], [G5, 0.07], [C6, 0.2, 0.5]], { type: 'triangle', sparkle: true }),
  /** Third right answer in a row. */
  mega: () =>
    melody([[C5, 0.06], [E5, 0.06], [G5, 0.06], [C6, 0.06], [E6, 0.22, 0.6]], {
      type: 'triangle',
      sparkle: true,
    }),
  /** Five in a row: the happy run. */
  streak: () =>
    melody([[E5, 0.055], [G5, 0.055], [A5, 0.055], [C6, 0.055], [D6, 0.055], [E6, 0.055], [G6, 0.25, 0.7]], {
      type: 'triangle',
      sparkle: true,
    }),
  /** Wrong answer: two soft falling "boops". Gentle, never scary. */
  wrong: () => {
    tone(330, 0.16, { volume: 0.13, glideTo: 290 });
    tone(262, 0.22, { volume: 0.12, glideTo: 230, delay: 0.14 });
  },
  /** A star flies into the counter. */
  star: () => tone(1318, 0.16, { volume: 0.12, sparkle: true, glideTo: 1500 }),
  /** Trophy: a fanfare. */
  trophy: () => {
    melody([[C5, 0.1], [E5, 0.1], [G5, 0.1], [C6, 0.12], [E6, 0.3, 0.9]], { type: 'triangle', sparkle: true });
    tone(C5 / 2, 0.9, { volume: 0.12, delay: 0.1 });
  },
  /** Finishing a round. */
  fanfare: () => {
    melody([[G5, 0.12], [G5, 0.12], [G5, 0.12], [C6, 0.3, 0.7]], { type: 'triangle', sparkle: true });
    melody([[E6, 0.12], [D6, 0.12], [E6, 0.12], [G6, 0.3, 0.9]], { type: 'triangle', sparkle: true }, 0.55);
  },
  /** Starting a round or opening the app. */
  start: () => melody([[G5, 0.09], [C6, 0.18, 0.4]], { sparkle: true }),
  /** Welcome: a little wave of notes. */
  hello: () => melody([[C5, 0.08], [G5, 0.08], [E6, 0.2, 0.5]], { type: 'triangle', sparkle: true }),
};

// ---------------------------------------------------------------------------
// Read-aloud voice (the browser's built-in speech; nothing is sent anywhere)
// ---------------------------------------------------------------------------

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

/** Speaks a short phrase in a slow, friendly voice. Does nothing when sound is off. */
export function speak(text: string): void {
  if (!soundEnabled || !canSpeak() || !text.trim()) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    utter.pitch = 1.25;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  } catch {
    // Speech is optional.
  }
}
