import React, { useEffect, useRef, useState } from 'react';
import { shuffle } from '@kiyuv/content';
import { Pic } from '../../ui/Pic.js';
import { confettiBlast, starBurst } from '../../lib/effects.js';
import { initAudio, playNote, sfx, speak } from '../../lib/sound.js';
import {
  BODY_PARTS,
  BODY_ROUNDS,
  COLOURS,
  DAY_STEPS,
  FRUITS,
  LAMB_BARS,
  LAMB_SONG,
  OPPOSITES,
  PEEKABOO_COUNT,
  VEHICLES,
  type BodyPart,
  type ColourDef,
  type OppositeSide,
  type TapItem,
} from './playData.js';
import { ANIMALS, type Animal } from './playTime.js';
import { useTapPulse } from './useTapPulse.js';

/**
 * More Play time activities for the youngest children (about 2 to 3). Like the first five,
 * nothing here can be answered wrongly in a way that costs anything: every tap gets a happy
 * reaction. Timers are cleared when the child leaves, and fast taps are never lost.
 */

function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);
  return (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
}

function centreOf(el: HTMLElement): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// ---------------------------------------------- Tap and hear (vehicles, fruit, my day)
const TapToHear: React.FC<{ items: readonly TapItem[]; prompt: string; labelled?: boolean }> = ({
  items,
  prompt,
  labelled = false,
}) => {
  const [said, setSaid] = useState<TapItem | null>(null);
  const { pulseClass, trigger } = useTapPulse();

  const tap = (item: TapItem) => {
    initAudio();
    sfx.tap();
    trigger(item.key);
    setSaid(item);
    speak(item.say);
  };

  return (
    <>
      <p className="play-caption" role="status" aria-live="polite">
        {said ? said.caption : prompt}
      </p>
      <ul className="toy-grid">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              className={`toy${labelled ? ' labelled' : ''} ${pulseClass(item.key)}`}
              data-silent
              aria-label={item.label}
              onClick={() => tap(item)}
            >
              <Pic emoji={item.emoji} />
              {labelled && <span className="toy-label">{item.label}</span>}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

export const VehiclesPlay: React.FC = () => <TapToHear items={VEHICLES} prompt="Tap a vehicle!" />;
export const FruitPlay: React.FC = () => <TapToHear items={FRUITS} prompt="Tap a fruit!" />;
export const DayPlay: React.FC = () => <TapToHear items={DAY_STEPS} prompt="Tap to start your day!" labelled />;

// ------------------------------------------------------------ Peekaboo presents
const pickAnimals = (): Animal[] => shuffle([...ANIMALS]).slice(0, PEEKABOO_COUNT);

export const PeekabooPlay: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>(pickAnimals);
  const [opened, setOpened] = useState<ReadonlySet<number>>(new Set());
  const [said, setSaid] = useState<Animal | null>(null);
  // Kept in a ref as well, so two presents opened in the same moment are both counted.
  const openedRef = useRef<Set<number>>(new Set());
  const later = useTimers();

  const open = (i: number, el: HTMLElement) => {
    initAudio();
    const animal = animals[i]!;
    if (openedRef.current.has(i)) {
      speak(`${animal.name}! ${animal.sound}!`);
      return;
    }
    sfx.tap();
    starBurst(centreOf(el).x, centreOf(el).y);
    openedRef.current.add(i);
    setOpened(new Set(openedRef.current));
    setSaid(animal);
    speak(`Peekaboo! ${animal.name}! ${animal.sound}!`);
    if (openedRef.current.size === animals.length) {
      later(() => {
        confettiBlast();
        sfx.fanfare();
        speak('Hooray!');
      }, 1500);
      later(() => {
        openedRef.current = new Set();
        setOpened(new Set());
        setSaid(null);
        setAnimals(pickAnimals());
      }, 4200);
    }
  };

  const allDone = opened.size === animals.length;
  return (
    <>
      <p className="play-caption" role="status" aria-live="polite">
        {allDone ? 'Hooray!' : said ? `Peekaboo! ${said.name} says ${said.sound}!` : 'Open a present!'}
      </p>
      <ul className="toy-grid">
        {animals.map((a, i) => {
          const isOpen = opened.has(i);
          return (
            <li key={`${a.name}-${i}`}>
              <button
                type="button"
                className={`toy gift${isOpen ? ' revealed' : ''}`}
                data-silent
                aria-label={isOpen ? a.name : `Present ${i + 1}`}
                onClick={(e) => open(i, e.currentTarget)}
              >
                <Pic emoji={isOpen ? a.emoji : '🎁'} />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
};

// ------------------------------------------------------------------ Colour splash
export const ColoursPlay: React.FC = () => {
  const [picked, setPicked] = useState<ColourDef | null>(null);
  const { pulseClass, trigger } = useTapPulse();

  const tap = (c: ColourDef) => {
    initAudio();
    sfx.select();
    trigger(c.name);
    setPicked(c);
    speak(`${c.name}! Like ${c.thing}!`);
  };

  return (
    <div className="colour-stage" style={{ ['--tint' as string]: picked ? `${picked.hex}33` : 'transparent' }}>
      <p className="play-caption" role="status" aria-live="polite">
        {picked ? `${picked.name}! Like ${picked.thing}!` : 'Tap a colour!'}
      </p>
      <div className="colour-thing" aria-hidden="true">
        {picked && (
          <span key={picked.name} className="pop-in">
            <Pic emoji={picked.thingEmoji} />
          </span>
        )}
      </div>
      <ul className="paint-grid">
        {COLOURS.map((c) => (
          <li key={c.name}>
            <button
              type="button"
              className={`paint ${pulseClass(c.name)}`}
              data-silent
              style={{ background: c.hex }}
              aria-label={c.name}
              onClick={() => tap(c)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

// ---------------------------------------------------------------- Big and small
export const OppositesPlay: React.FC = () => {
  const [said, setSaid] = useState<string | null>(null);
  const { pulseClass, trigger } = useTapPulse();

  const tap = (side: OppositeSide) => {
    initAudio();
    sfx.select();
    trigger(side.word);
    setSaid(side.word);
    speak(`${side.word}!`);
  };

  return (
    <>
      <p className="play-caption" role="status" aria-live="polite">
        {said ? `${said}!` : 'Tap a picture!'}
      </p>
      <ul className="opp-list">
        {OPPOSITES.map((pair) => (
          <li key={pair.a.word} className="opp-pair">
            {[pair.a, pair.b].map((side) => (
              <button
                key={side.word}
                type="button"
                className={`opp-tile ${pulseClass(side.word)}`}
                data-silent
                aria-label={side.word}
                onClick={() => tap(side)}
              >
                <span className="opp-pic" style={{ ['--k' as string]: side.scale }}>
                  <Pic emoji={side.emoji} />
                </span>
                <span className="opp-word">{side.word}</span>
              </button>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
};

// ------------------------------------------------------------ Where is my nose?
const pickRound = (not?: BodyPart): { target: BodyPart; options: BodyPart[] } => {
  const pool = BODY_PARTS.filter((p) => p !== not);
  const target = pool[Math.floor(Math.random() * pool.length)]!;
  const others = shuffle(BODY_PARTS.filter((p) => p !== target)).slice(0, 2);
  return { target, options: shuffle([target, ...others]) };
};

export const BodyPlay: React.FC = () => {
  const [phase, setPhase] = useState<'start' | 'ask' | 'done'>('start');
  const [round, setRound] = useState(() => pickRound());
  const [found, setFound] = useState(0);
  const [message, setMessage] = useState('Find the parts of your body!');
  const lockedRef = useRef(false);
  const foundRef = useRef(0);
  const { pulseClass, trigger } = useTapPulse();
  const later = useTimers();

  const ask = (target: BodyPart) => speak(`Touch the ${target.name}!`);

  const start = () => {
    initAudio();
    sfx.start();
    foundRef.current = 0;
    lockedRef.current = false;
    const next = pickRound();
    setFound(0);
    setRound(next);
    setPhase('ask');
    setMessage(`Touch the ${next.target.name}!`);
    ask(next.target);
  };

  const pick = (part: BodyPart, el: HTMLElement) => {
    if (lockedRef.current) return;
    initAudio();
    if (part === round.target) {
      lockedRef.current = true;
      starBurst(centreOf(el).x, centreOf(el).y);
      sfx.correct();
      speak(`Yes! ${part.name}!`);
      setMessage(`Yes! ${part.name}!`);
      foundRef.current += 1;
      setFound(foundRef.current);
      later(() => {
        if (foundRef.current >= BODY_ROUNDS) {
          confettiBlast();
          sfx.fanfare();
          speak('Hooray!');
          setMessage('Hooray!');
          setPhase('done');
          return;
        }
        const next = pickRound(round.target);
        setRound(next);
        setMessage(`Touch the ${next.target.name}!`);
        lockedRef.current = false;
        ask(next.target);
      }, 1400);
    } else {
      // Gentle: a wobble, a soft sound and a hint. Nothing is counted against the child.
      trigger(part.name);
      sfx.wrong();
      speak(`That is the ${part.name}. Find the ${round.target.name}!`);
      setMessage(`Find the ${round.target.name}!`);
    }
  };

  if (phase === 'start') {
    return (
      <>
        <p className="play-caption">{message}</p>
        <button type="button" className="primary-btn big again-btn" onClick={start} data-silent>
          Let us play!
        </button>
      </>
    );
  }
  if (phase === 'done') {
    return (
      <>
        <p className="play-caption" role="status" aria-live="polite">
          Hooray!
        </p>
        <button type="button" className="primary-btn big again-btn" onClick={start} data-silent>
          Again!
        </button>
      </>
    );
  }
  return (
    <>
      <p className="play-caption" role="status" aria-live="polite">
        {message}
      </p>
      <button type="button" className="listen-btn again-btn" onClick={() => ask(round.target)} data-silent>
        Say it again
      </button>
      <ul className="toy-grid">
        {round.options.map((part) => (
          <li key={part.name}>
            <button
              type="button"
              className={`toy ${pulseClass(part.name)}`}
              data-silent
              aria-label={part.name}
              onClick={(e) => pick(part, e.currentTarget)}
            >
              <Pic emoji={part.emoji} />
            </button>
          </li>
        ))}
      </ul>
      <div
        className="song-progress"
        role="progressbar"
        aria-label="Things found"
        aria-valuemin={0}
        aria-valuemax={BODY_ROUNDS}
        aria-valuenow={found}
        aria-valuetext={`${found} of ${BODY_ROUNDS} found`}
      >
        <span style={{ width: `${(found / BODY_ROUNDS) * 100}%` }} />
      </div>
    </>
  );
};

// ----------------------------------------------------------------------- Sing along
export const SongPlay: React.FC = () => {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const stepRef = useRef(0);
  const { pulseClass, trigger } = useTapPulse(300);
  const later = useTimers();

  const tap = (i: number) => {
    initAudio();
    playNote(i);
    trigger(String(i));
    if (done || stepRef.current >= LAMB_SONG.length) return;
    // Any bar makes its sound. Only the glowing one moves the song on.
    if (i !== LAMB_SONG[stepRef.current]) return;
    stepRef.current += 1;
    setStep(stepRef.current);
    if (stepRef.current === LAMB_SONG.length) {
      setDone(true);
      later(() => {
        confettiBlast();
        sfx.fanfare();
        speak('Hooray! You played the song!');
      }, 700);
    }
  };

  const again = () => {
    initAudio();
    sfx.start();
    stepRef.current = 0;
    setStep(0);
    setDone(false);
  };

  const target = done ? -1 : LAMB_SONG[step]!;
  return (
    <>
      <p className="play-caption" role="status" aria-live="polite">
        {done ? 'You played the song! Hooray!' : 'Tap the glowing bar!'}
      </p>
      <div className="song-lamb" aria-hidden="true">
        <span className={done ? 'pulse-a' : ''}>
          <Pic emoji="🐑" />
        </span>
      </div>
      <ul className="song-bars">
        {LAMB_BARS.map((colour, i) => (
          <li key={colour}>
            <button
              type="button"
              className={`song-bar ${i === target ? 'glow' : ''} ${pulseClass(String(i))}`}
              data-silent
              style={{ background: colour }}
              aria-label={`Bar ${i + 1}${i === target ? ', glowing' : ''}`}
              onClick={() => tap(i)}
            />
          </li>
        ))}
      </ul>
      <div
        className="song-progress"
        role="progressbar"
        aria-label="Song progress"
        aria-valuemin={0}
        aria-valuemax={LAMB_SONG.length}
        aria-valuenow={step}
        aria-valuetext={`${step} of ${LAMB_SONG.length} notes`}
      >
        <span style={{ width: `${(step / LAMB_SONG.length) * 100}%` }} />
      </div>
      {done && (
        <button type="button" className="primary-btn big again-btn" onClick={again} data-silent>
          Again!
        </button>
      )}
    </>
  );
};
