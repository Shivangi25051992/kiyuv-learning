import { pick } from '@kiyuv/content';
import { picSrc } from '../ui/Pic.js';

/** Puts an emoji into an element as a drawn picture when there is one, as text otherwise. */
function fillWithPic(el: HTMLElement, emoji: string): void {
  const src = picSrc(emoji);
  if (!src) {
    el.textContent = emoji;
    return;
  }
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.draggable = false;
  img.className = 'pic';
  el.appendChild(img);
}

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
    fillWithPic(s, pick(emojis));
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
  fillWithPic(f, text);
  f.style.left = `${x}px`;
  f.style.top = `${y}px`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1500);
}

export function showTrophy(): void {
  if (typeof document === 'undefined') return;
  const t = document.createElement('div');
  t.className = 'trophy-pop';
  fillWithPic(t, '🏆');
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

/** Balloons float up the screen. A better round sends more of them. */
export function balloonRise(count: number): void {
  if (typeof document === 'undefined') return;
  const total = prefersReducedMotion() ? Math.min(count, 3) : count;
  for (let i = 0; i < total; i++) {
    const b = document.createElement('div');
    b.className = 'balloon';
    fillWithPic(b, '🎈');
    b.style.left = `${5 + Math.random() * 90}%`;
    b.style.setProperty('--balloon-sway', `${(Math.random() - 0.5) * 80}px`);
    b.style.setProperty('--balloon-hue', `${Math.floor(Math.random() * 360)}deg`);
    b.style.animationDelay = `${Math.random() * 0.9}s`;
    b.style.animationDuration = `${3.2 + Math.random() * 1.6}s`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 6000);
  }
}
