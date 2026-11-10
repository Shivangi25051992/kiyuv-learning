let audioCtx: AudioContext | null = null;
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
      }
    } catch {
      // Ignore AudioContext restriction
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
    sfx.start();
  }
  return soundEnabled;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.25,
  delay = 0,
): void {
  if (!soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const startAt = audioCtx.currentTime + delay;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

function song(notes: readonly (readonly [number, number, number?])[]): void {
  if (!soundEnabled || !audioCtx) return;
  let offset = 0;
  for (const [f, d, v] of notes) {
    tone(f, d, 'sine', v ?? 0.22, offset);
    offset += d * 0.8;
  }
}

export const sfx = {
  correct: () =>
    song([
      [523, 0.1],
      [659, 0.1],
      [784, 0.2],
    ]),
  mega: () =>
    song([
      [523, 0.1],
      [659, 0.1],
      [784, 0.1],
      [1047, 0.3],
    ]),
  streak: () =>
    song([
      [659, 0.08],
      [784, 0.08],
      [988, 0.08],
      [1319, 0.2],
    ]),
  wrong: () => tone(220, 0.15, 'sine', 0.12),
  trophy: () =>
    song([
      [523, 0.12],
      [659, 0.12],
      [784, 0.12],
      [1047, 0.12],
      [1319, 0.35],
    ]),
  start: () =>
    song([
      [784, 0.08],
      [988, 0.15],
    ]),
};
