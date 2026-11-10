import { pick } from '@kiyuv/content';

export function confettiBlast(): void {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('celebrate');
  if (!container) return;
  const colors = [
    '#ff6b6b',
    '#ffd166',
    '#3ddc97',
    '#4f8bff',
    '#c084fc',
    '#ff86c8',
    '#ff9f43',
    '#ffd700',
  ] as const;
  for (let i = 0; i < 45; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = pick(colors);
    c.style.animationDelay = `${Math.random() * 0.5}s`;
    c.style.animationDuration = `${1.5 + Math.random()}s`;
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(c);
    setTimeout(() => c.remove(), 2500);
  }
}

export function starBurst(x: number, y: number): void {
  if (typeof document === 'undefined') return;
  const emojis = ['⭐', '✨', '💫', '🌟'] as const;
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('div');
    s.className = 'star-burst';
    s.textContent = pick(emojis);
    const angle = (i / 8) * Math.PI * 2;
    const dist = 70 + Math.random() * 30;
    s.style.left = `${x + Math.cos(angle) * dist}px`;
    s.style.top = `${y + Math.sin(angle) * dist}px`;
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
