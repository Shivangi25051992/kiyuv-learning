import { pick } from '@kiyuv/content';

/** True when the device asks for less motion. Effects then become much smaller. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const CONFETTI_COLORS = [
  '#ff6b6b',
  '#ffd166',
  '#3ddc97',
  '#4f8bff',
  '#c084fc',
  '#ff86c8',
  '#ff9f43',
  '#38bdf8',
] as const;

const CONFETTI_SHAPES = ['dot', 'square', 'strip', 'star'] as const;

export function confettiBlast(): void {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('celebrate');
  if (!container) return;
  const count = prefersReducedMotion() ? 8 : 60;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = `confetti confetti-${pick(CONFETTI_SHAPES)}`;
    c.style.left = `${Math.random() * 100}%`;
    c.style.setProperty('--confetti-color', pick(CONFETTI_COLORS));
    c.style.setProperty('--confetti-drift', `${(Math.random() - 0.5) * 160}px`);
    c.style.setProperty('--confetti-spin', `${360 + Math.random() * 720}deg`);
    c.style.animationDelay = `${Math.random() * 0.45}s`;
    c.style.animationDuration = `${1.6 + Math.random() * 1.1}s`;
    container.appendChild(c);
    setTimeout(() => c.remove(), 3200);
  }
}

export function starBurst(x: number, y: number): void {
  if (typeof document === 'undefined') return;
  const emojis = ['⭐', '✨', '💫', '🌟'] as const;
  const count = prefersReducedMotion() ? 3 : 10;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'star-burst';
    s.textContent = pick(emojis);
    const angle = (i / count) * Math.PI * 2;
    const dist = 70 + Math.random() * 40;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty('--burst-x', `${Math.cos(angle) * dist}px`);
    s.style.setProperty('--burst-y', `${Math.sin(angle) * dist}px`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}

export function floatEmoji(x: number, y: number, text: string): void {
  if (typeof document === 'undefined') return;
  const f = document.createElement('div');
  f.className = 'float-emoji';
  f.textContent = text;
  f.style.left = `${x}px`;
  f.style.top = `${y}px`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1500);
}

export function showTrophy(): void {
  if (typeof document === 'undefined') return;
  const t = document.createElement('div');
  t.className = 'trophy-pop';
  t.textContent = '🏆';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}
