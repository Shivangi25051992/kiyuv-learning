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
    startMusic();
  } else {
    stopSpeaking();
    stopMusic();
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
//
// Which voices exist depends on the device. We pick the most natural-sounding
// English voice, preferring a soft female one, and the parent can choose another
// in the Parent Area.
// ---------------------------------------------------------------------------

const VOICE_KEY = 'kidsVoiceName';

const FEMALE_RE =
  /\b(aria|jenny|ava|emma|sonia|libby|samantha|karen|tessa|moira|serena|susan|zira|hazel|fiona|victoria|allison|nicky|kathy|joanna|salli|kimberly|amy|nova|female|woman|girl)\b/;
const MALE_RE =
  /\b(david|mark|james|george|daniel|alex|fred|ryan|guy|thomas|rishi|bruce|ralph|junior|male|man)\b/;

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
  duckMusic(false);
}

function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase().replace('_', '-');
  if (!lang.startsWith('en')) return -1000;
  let score = 0;
  if (/natural|neural|online|premium|enhanced/.test(name)) score += 40;
  if (FEMALE_RE.test(name)) score += 30;
  if (MALE_RE.test(name)) score -= 60;
  if (/google/.test(name)) score += 8;
  if (['en-us', 'en-gb', 'en-in', 'en-au'].includes(lang)) score += 5;
  if (v.localService) score += 2;
  return score;
}

/** English voices on this device, best first. */
export function listEnglishVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => scoreVoice(v) > -1000)
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

/** The voice we would choose on our own. */
export function recommendedVoice(): SpeechSynthesisVoice | null {
  return listEnglishVoices()[0] ?? null;
}

export function getSavedVoiceName(): string | null {
  try {
    return localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}

/** Saves the parent's choice. Pass null to go back to the automatic choice. */
export function setVoiceName(name: string | null): void {
  try {
    if (name) localStorage.setItem(VOICE_KEY, name);
    else localStorage.removeItem(VOICE_KEY);
  } catch {
    // storage unavailable
  }
}

function chosenVoice(): SpeechSynthesisVoice | null {
  const voices = listEnglishVoices();
  const saved = getSavedVoiceName();
  return (saved ? voices.find((v) => v.name === saved) : undefined) ?? voices[0] ?? null;
}

/** Speaks a short phrase slowly and softly. Does nothing when sound is off. */
export function speak(text: string): void {
  if (!soundEnabled || !canSpeak() || !text.trim()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = chosenVoice();
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }
    utter.rate = 0.88;
    utter.pitch = 1.12;
    utter.volume = 0.95;
    utter.onstart = () => duckMusic(true);
    utter.onend = () => duckMusic(false);
    utter.onerror = () => duckMusic(false);
    synth.speak(utter);
  } catch {
    // Speech is optional.
  }
}

// ---------------------------------------------------------------------------
// Background music: a soft music-box lullaby, made up live so there are no
// audio files and no licences. A slow four-chord loop with a gentle pad, a
// quiet bass note and a wandering bell melody on a happy five-note scale.
// ---------------------------------------------------------------------------

type MusicScene = 'home' | 'play';

const MUSIC_KEY = 'kidsMusicOn';
const MUSIC_VOLUME_KEY = 'kidsMusicVolume';
const DEFAULT_MUSIC_VOLUME = 0.5;
const BPM = 72;
const BEAT = 60 / BPM;

let musicEnabled =
  typeof localStorage !== 'undefined' ? localStorage.getItem(MUSIC_KEY) !== '0' : true;

function loadMusicVolume(): number {
  try {
    const raw = localStorage.getItem(MUSIC_VOLUME_KEY);
    if (raw === null) return DEFAULT_MUSIC_VOLUME;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : DEFAULT_MUSIC_VOLUME;
  } catch {
    return DEFAULT_MUSIC_VOLUME;
  }
}
let musicVolume = loadMusicVolume();
let musicBus: GainNode | null = null;
let musicTimer: number | null = null;
let nextBeatTime = 0;
let beatCount = 0;
let melodyIdx = 3;
let musicScene: MusicScene = 'home';
let musicDucked = false;
let musicLifecycleBound = false;

// Chords as [bass, three upper notes] in Hz: C, Am, F, G (always sounds friendly).
const CHORDS: ReadonlyArray<readonly [number, number, number, number]> = [
  [130.81, 261.63, 329.63, 392.0],
  [110.0, 261.63, 329.63, 440.0],
  [87.31, 261.63, 349.23, 440.0],
  [98.0, 246.94, 293.66, 392.0],
];
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66] as const;

export function isMusicEnabled(): boolean {
  return musicEnabled;
}

/** 0 to 1. The music's own volume, separate from sound effects and voice. */
export function getMusicVolume(): number {
  return musicVolume;
}

export function setMusicVolume(value: number): void {
  musicVolume = Math.min(1, Math.max(0, Number.isFinite(value) ? value : DEFAULT_MUSIC_VOLUME));
  try {
    localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
  } catch {
    // storage unavailable
  }
  applyMusicLevel();
}

function musicLevel(): number {
  // At the default volume (50%) this matches the earlier levels; 100% is twice as loud.
  const base = (musicScene === 'play' ? 0.32 : 0.6) * musicVolume;
  const level = musicDucked ? base * 0.35 : base;
  return Math.max(0.0001, level);
}

function applyMusicLevel(): void {
  if (!audioCtx || !musicBus) return;
  musicBus.gain.setTargetAtTime(musicLevel(), audioCtx.currentTime, 0.25);
}

/** Lower the music while the voice is speaking, so words stay clear. */
export function duckMusic(on: boolean): void {
  musicDucked = on;
  applyMusicLevel();
}

/** Quieter music during a game round, so it never competes with thinking. */
export function setMusicScene(scene: MusicScene): void {
  musicScene = scene;
  applyMusicLevel();
}

function ensureMusicBus(): GainNode | null {
  if (!audioCtx || !master) return null;
  if (musicBus) return musicBus;
  const bus = audioCtx.createGain();
  bus.gain.value = 0.0001;

  // A soft echo gives the bells a roomy, dreamy tail.
  const delay = audioCtx.createDelay(1);
  delay.delayTime.value = BEAT * 0.75;
  const feedback = audioCtx.createGain();
  feedback.gain.value = 0.32;
  const tone = audioCtx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2200;
  bus.connect(master);
  bus.connect(delay);
  delay.connect(tone);
  tone.connect(feedback);
  feedback.connect(delay);
  tone.connect(master);

  musicBus = bus;
  return bus;
}

function musicNote(
  freq: number,
  when: number,
  length: number,
  volume: number,
  type: OscillatorType,
  attack: number,
): void {
  if (!audioCtx || !musicBus) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
  osc.connect(gain);
  gain.connect(musicBus);
  osc.start(when);
  osc.stop(when + length + 0.05);
}

function scheduleBeat(when: number, beat: number): void {
  const inBar = beat % 4;
  const chord = CHORDS[Math.floor(beat / 4) % CHORDS.length]!;

  if (inBar === 0) {
    // Soft pad across the whole bar, and one low bass note.
    const barLength = BEAT * 4;
    musicNote(chord[0], when, barLength * 0.95, 0.2, 'sine', 0.05);
    for (const f of [chord[1], chord[2], chord[3]]) {
      musicNote(f, when, barLength * 1.05, 0.085, 'sine', 0.9);
    }
  }

  // Bell melody: a wandering walk on the scale, with rests so it can breathe.
  for (const half of [0, 0.5]) {
    if (Math.random() < 0.38) continue;
    melodyIdx = Math.max(0, Math.min(SCALE.length - 1, melodyIdx + Math.floor(Math.random() * 5) - 2));
    const freq = SCALE[melodyIdx]!;
    const at = when + half * BEAT;
    musicNote(freq, at, 1.4, 0.2, 'triangle', 0.01);
    musicNote(freq * 2, at, 0.5, 0.04, 'sine', 0.01);
  }
}

function musicTick(): void {
  if (!audioCtx) return;
  while (nextBeatTime < audioCtx.currentTime + 0.7) {
    scheduleBeat(nextBeatTime, beatCount);
    nextBeatTime += BEAT;
    beatCount += 1;
  }
}

function bindMusicLifecycle(): void {
  if (musicLifecycleBound || typeof document === 'undefined') return;
  musicLifecycleBound = true;
  // Music pauses when the app is not on screen and returns when it is.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stopMusic();
    else startMusic();
  });
}

/** Starts the music (does nothing if it is off, muted, or already playing). */
export function startMusic(): void {
  if (!musicEnabled || !soundEnabled || !audioCtx || musicTimer !== null) return;
  if (!ensureMusicBus()) return;
  bindMusicLifecycle();
  nextBeatTime = audioCtx.currentTime + 0.15;
  beatCount = 0;
  applyMusicLevel();
  musicTimer = window.setInterval(musicTick, 200);
  musicTick();
}

export function stopMusic(): void {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  if (audioCtx && musicBus) {
    musicBus.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.2);
  }
}

export function toggleMusic(): boolean {
  musicEnabled = !musicEnabled;
  try {
    localStorage.setItem(MUSIC_KEY, musicEnabled ? '1' : '0');
  } catch {
    // storage unavailable
  }
  if (musicEnabled) {
    initAudio();
    startMusic();
  } else {
    stopMusic();
  }
  return musicEnabled;
}
