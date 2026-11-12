import React, { useEffect, useRef, useState } from 'react';
import { Pic } from '../../ui/Pic.js';
import { confettiBlast, starBurst } from '../../lib/effects.js';
import { initAudio, playNote, sfx, speak } from '../../lib/sound.js';
import {
  ANIMALS,
  BALLOON_COLOURS,
  MAX_APPLES,
  SHAPES,
  XYLOPHONE_COLOURS,
  type Animal,
} from './playTime.js';
import { useTapPulse } from './useTapPulse.js';

/**
 * Play time activities for the youngest children (about 2 to 3).
 * Nothing here can be answered wrongly. Every tap gives a happy reaction: a wiggle,
 * a sound, and a voice saying the name. The voice only speaks right after a tap.
 */

const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five'] as const;

/** Where on the screen a tapped button is, for the little burst of stars. */
function centreOf(el: HTMLElement): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// ---------------------------------------------------------------- Say hello
export const AnimalsPlay: React.FC = () => {
  const [said, setSaid] = useState<Animal | null>(null);
  const { pulseClass, trigger } = useTapPulse();

  const tap = (animal: Animal) => {
    initAudio();
    sfx.tap();
    trigger(animal.name);
    setSaid(animal);
    speak(`${animal.name}! ${animal.sound}!`);
  };

  return (
    <>
      <p className="play-caption" role="status" aria-live="polite">
        {said ? `${said.name} says ${said.sound}!` : 'Tap an animal!'}
      </p>
      <ul className="toy-grid">
        {ANIMALS.map((a) => (
          <li key={a.name}>
            <button type="button" className={`toy ${pulseClass(a.name)}`} data-silent aria-label={a.name} onClick={() => tap(a)}>
              <Pic emoji={a.emoji} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

// -------------------------------------------------------- Pop the balloons
export const BalloonsPlay: React.FC = () => {
  const [popped, setPopped] = useState<ReadonlySet<number>>(new Set());
  // Kept in a ref as well, so two taps landing before the next redraw are both counted.
  const poppedRef = useRef<Set<number>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const pop = (i: number, el: HTMLElement) => {
    if (poppedRef.current.has(i)) return;
    initAudio();
    sfx.tap();
    const { x, y } = centreOf(el);
    starBurst(x, y);
    speak(`${BALLOON_COLOURS[i]!.name}!`);
    poppedRef.current.add(i);
    setPopped(new Set(poppedRef.current));
    if (poppedRef.current.size === BALLOON_COLOURS.length) {
      timers.current.push(
        setTimeout(() => {
          confettiBlast();
          sfx.fanfare();
          speak('Hooray!');
        }, 700),
        setTimeout(() => {
          poppedRef.current = new Set();
          setPopped(new Set());
        }, 3200),
      );
    }
  };

  const allDone = popped.size === BALLOON_COLOURS.length;
  return (
    <>
      <p className="play-caption" role="status" aria-live="polite">
        {allDone ? 'Hooray!' : 'Pop the balloons!'}
      </p>
      <ul className="pop-balloon-field">
        {BALLOON_COLOURS.map((b, i) => {
          const gone = popped.has(i);
          return (
            <li key={b.name}>
              <button
                type="button"
                className={`pop-balloon${gone ? ' popped' : ''}`}
                data-silent
                style={{ ['--b' as string]: b.hex, ['--d' as string]: `${i * -0.45}s` }}
                aria-label={`${b.name} balloon`}
                disabled={gone}
                onClick={(e) => pop(i, e.currentTarget)}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
};

// ---------------------------------------------------------- Count with me
const randomCount = (not?: number): number => {
  let n = 1 + Math.floor(Math.random() * MAX_APPLES);
  while (n === not) n = 1 + Math.floor(Math.random() * MAX_APPLES);
  return n;
};

export const CountPlay: React.FC = () => {
  const [total, setTotal] = useState(() => randomCount());
  const [counted, setCounted] = useState<readonly number[]>([]);
  const countedRef = useRef<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const finished = counted.length === total;

  const tap = (i: number, el: HTMLElement) => {
    if (countedRef.current.includes(i)) return;
    initAudio();
    const { x, y } = centreOf(el);
    starBurst(x, y);
    sfx.star();
    countedRef.current = [...countedRef.current, i];
    const next = countedRef.current;
    setCounted(next);
    speak(NUMBER_WORDS[next.length - 1]!);
    if (next.length === total) {
      timers.current.push(
        setTimeout(() => {
          confettiBlast();
          sfx.fanfare();
          speak(`${NUMBER_WORDS[total - 1]} ${total === 1 ? 'apple' : 'apples'}! Hooray!`);
        }, 900),
      );
    }
  };

  const again = () => {
    initAudio();
    sfx.start();
    setTotal(randomCount(total));
    countedRef.current = [];
    setCounted([]);
  };

  return (
    <>
      <p className="play-caption" role="status" aria-live="polite">
        {finished ? `${total} ${total === 1 ? 'apple' : 'apples'}! Hooray!` : 'Tap each apple and count!'}
      </p>
      <ul className="apple-row">
        {Array.from({ length: total }, (_, i) => {
          const number = counted.indexOf(i) + 1;
          return (
            <li key={`${total}-${i}`}>
              <button
                type="button"
                className={`apple${number > 0 ? ' counted' : ''}`}
                data-silent
                aria-label={number > 0 ? `Apple ${number}, counted` : 'Apple'}
                onClick={(e) => tap(i, e.currentTarget)}
              >
                <Pic emoji="🍎" />
                {number > 0 && (
                  <span className="apple-badge" aria-hidden="true">
                    {number}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {finished && (
        <button type="button" className="primary-btn big again-btn" onClick={again} data-silent>
          Again!
        </button>
      )}
    </>
  );
};

// ------------------------------------------------------------ Dance shapes
export const ShapesPlay: React.FC = () => {
  const [said, setSaid] = useState<string | null>(null);
  const { pulseClass, trigger } = useTapPulse(900);

  const tap = (name: string) => {
    initAudio();
    sfx.select();
    trigger(name);
    setSaid(name);
    speak(`${name}!`);
  };

  return (
    <>
      <p className="play-caption" role="status" aria-live="polite">
        {said ? `${said}!` : 'Tap a shape!'}
      </p>
      <ul className="shape-row">
        {SHAPES.map((s) => (
          <li key={s.name}>
            <button type="button" className="shape-btn" data-silent aria-label={s.name} onClick={() => tap(s.name)}>
              <span
                className={`shape ${pulseClass(s.name)}`}
                style={{ background: s.hex, clipPath: s.clip ?? undefined, borderRadius: s.radius }}
              />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

// -------------------------------------------------------- Little xylophone
export const MusicPlay: React.FC = () => {
  const { pulseClass, trigger } = useTapPulse(300);

  const tap = (i: number) => {
    initAudio();
    playNote(i);
    trigger(String(i));
  };

  return (
    <>
      <p className="play-caption">Tap the bars to make music!</p>
      <ul className="xylo">
        {XYLOPHONE_COLOURS.map((colour, i) => (
          <li key={colour} style={{ ['--h' as string]: `${100 - i * 10}%` }}>
            <button
              type="button"
              className={`xylo-bar ${pulseClass(String(i))}`}
              data-silent
              style={{ background: colour }}
              aria-label={`Note ${i + 1}`}
              onClick={() => tap(i)}
            />
          </li>
        ))}
      </ul>
    </>
  );
};
