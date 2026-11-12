import React, { useEffect, useRef, useState } from 'react';
import { shuffle } from '@kiyuv/content';
import { Pic } from '../../ui/Pic.js';
import { IconSpeaker } from '../../ui/Icons.js';
import { confettiBlast, starBurst } from '../../lib/effects.js';
import { canSpeak, initAudio, sfx, speak } from '../../lib/sound.js';
import { useCompanion } from '../companion/CompanionProvider.js';
import {
  BINS,
  FOODS,
  GREEN_MS,
  PLANT_STAGES,
  PLATE_ROUNDS,
  RED_MS,
  RUBBISH,
  SCRUB_SECONDS,
  SCRUB_STEP,
  WASH_STEPS,
  type BinKey,
  type Food,
} from './habits.js';

/** What every habit activity receives: the child's name, for Kiyu's cheer. */
export interface HabitProps {
  name: string;
}

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

/** The line that tells the child what to do, with a button to hear it (the voice only speaks when pressed). */
const Say: React.FC<{ text: string }> = ({ text }) => (
  <div className="habit-say">
    <p role="status" aria-live="polite">
      {text}
    </p>
    {canSpeak() && (
      <button type="button" className="listen-btn" data-silent onClick={() => { initAudio(); speak(text); }} aria-label="Read it out loud">
        <IconSpeaker size={20} /> Listen
      </button>
    )}
  </div>
);

const celebrate = () => {
  confettiBlast();
  sfx.fanfare();
};

// -------------------------------------------------------------- Wash your hands
export const WashPlay: React.FC<HabitProps> = ({ name }) => {
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const stepRef = useRef(0);
  const scrubbing = useRef(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const { react } = useCompanion();

  useEffect(() => () => {
    if (interval.current) clearInterval(interval.current);
  }, []);

  const advance = () => {
    stepRef.current += 1;
    setStep(stepRef.current);
    setHint(null);
    if (stepRef.current === WASH_STEPS.length) {
      celebrate();
      react('habit-done', { ctx: { name } });
    }
  };

  const tap = (i: number, el: HTMLElement) => {
    initAudio();
    if (scrubbing.current || stepRef.current >= WASH_STEPS.length) return;
    if (i !== stepRef.current) {
      sfx.tap();
      setHint(`Next: ${WASH_STEPS[stepRef.current]!.label}!`);
      return;
    }
    const c = centreOf(el);
    starBurst(c.x, c.y);
    if (i === SCRUB_STEP) {
      // The scrub takes a full 20 seconds, counted down out loud on the screen.
      sfx.select();
      scrubbing.current = true;
      let remaining = SCRUB_SECONDS;
      setLeft(remaining);
      interval.current = setInterval(() => {
        remaining -= 1;
        setLeft(remaining);
        if (remaining <= 0) {
          if (interval.current) clearInterval(interval.current);
          scrubbing.current = false;
          setLeft(null);
          advance();
        }
      }, 1000);
      return;
    }
    sfx.correct();
    advance();
  };

  const again = () => {
    initAudio();
    sfx.start();
    stepRef.current = 0;
    scrubbing.current = false;
    setStep(0);
    setLeft(null);
    setHint(null);
  };

  const done = step >= WASH_STEPS.length;
  const text = done
    ? 'Clean hands! Hooray!'
    : left !== null
      ? 'Scrub, scrub, scrub! Count down with me.'
      : (hint ?? WASH_STEPS[step]!.say);

  return (
    <>
      <Say text={text} />
      {left !== null && (
        <div className="scrub-timer" role="timer" aria-label={`${left} ${left === 1 ? 'second' : 'seconds'} left`}>
          <span className="scrub-count">{left}</span>
          <span className="scrub-bubbles" aria-hidden="true">🫧</span>
        </div>
      )}
      <ol className="wash-steps">
        {WASH_STEPS.map((s, i) => {
          const state = i < step ? 'done' : i === step && !done ? 'now' : 'later';
          return (
            <li key={s.key}>
              <button
                type="button"
                className={`wash-step ${state}`}
                data-silent
                aria-label={`Step ${i + 1}: ${s.label}${state === 'done' ? ', done' : ''}`}
                aria-current={state === 'now' ? 'step' : undefined}
                onClick={(e) => tap(i, e.currentTarget)}
              >
                <span className="wash-num" aria-hidden="true">{state === 'done' ? '✓' : i + 1}</span>
                <span className="wash-pic" aria-hidden="true"><Pic emoji={s.emoji} /></span>
                <span className="wash-label">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {done && (
        <button type="button" className="primary-btn big again-btn" onClick={again} data-silent>
          Again!
        </button>
      )}
    </>
  );
};

// ----------------------------------------------------------------- Healthy plate
const pickFoods = (): Food[] => {
  const half = PLATE_ROUNDS / 2;
  const daily = shuffle(FOODS.filter((f) => f.kind === 'daily')).slice(0, half);
  const treats = shuffle(FOODS.filter((f) => f.kind === 'treat')).slice(0, half);
  return shuffle([...daily, ...treats]);
};

export const PlatePlay: React.FC<HabitProps> = ({ name }) => {
  const [foods, setFoods] = useState<Food[]>(pickFoods);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const lockedRef = useRef(false);
  const later = useTimers();
  const { react } = useCompanion();

  const done = index >= foods.length;
  const food = foods[index];

  const choose = (kind: Food['kind'], el: HTMLElement) => {
    if (lockedRef.current || !food) return;
    initAudio();
    if (food.kind !== kind) {
      sfx.wrong();
      setMessage('Hmm, try the other one!');
      return;
    }
    lockedRef.current = true;
    const c = centreOf(el);
    starBurst(c.x, c.y);
    sfx.correct();
    setMessage(food.fact);
    later(() => {
      lockedRef.current = false;
      setMessage(null);
      setIndex((i) => i + 1);
    }, 1900);
  };

  useEffect(() => {
    if (!done) return;
    celebrate();
    react('habit-done', { ctx: { name } });
  }, [done, react, name]);

  const again = () => {
    initAudio();
    sfx.start();
    lockedRef.current = false;
    setFoods(pickFoods());
    setIndex(0);
    setMessage(null);
  };

  if (done) {
    return (
      <>
        <Say text="Well sorted! Healthy foods help you grow, and treats are for sometimes." />
        <button type="button" className="primary-btn big again-btn" onClick={again} data-silent>
          Again!
        </button>
      </>
    );
  }
  return (
    <>
      <Say text={message ?? 'Is it an every day food, or a sometimes treat?'} />
      <div className="plate-food" aria-live="polite">
        <span className="plate-pic"><Pic emoji={food!.emoji} /></span>
        <b>{food!.name}</b>
      </div>
      <div className="plate-choices">
        <button type="button" className="plate-btn daily" data-silent onClick={(e) => choose('daily', e.currentTarget)}>
          <span aria-hidden="true"><Pic emoji="🥗" /></span> Every day food
        </button>
        <button type="button" className="plate-btn treat" data-silent onClick={(e) => choose('treat', e.currentTarget)}>
          <span aria-hidden="true"><Pic emoji="🍬" /></span> Sometimes treat
        </button>
      </div>
      <div className="song-progress" role="progressbar" aria-label="Foods sorted" aria-valuemin={0} aria-valuemax={foods.length} aria-valuenow={index} aria-valuetext={`${index} of ${foods.length} sorted`}>
        <span style={{ width: `${(index / foods.length) * 100}%` }} />
      </div>
    </>
  );
};

// ------------------------------------------------------------------ Recycle sort
export const RecyclePlay: React.FC<HabitProps> = ({ name }) => {
  const [items, setItems] = useState(() => shuffle([...RUBBISH]));
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const lockedRef = useRef(false);
  const later = useTimers();
  const { react } = useCompanion();

  const done = index >= items.length;
  const item = items[index];

  const drop = (bin: BinKey, el: HTMLElement) => {
    if (lockedRef.current || !item) return;
    initAudio();
    if (item.bin !== bin) {
      sfx.wrong();
      setMessage('Not that bin. Try another one!');
      return;
    }
    lockedRef.current = true;
    const c = centreOf(el);
    starBurst(c.x, c.y);
    sfx.correct();
    setMessage(item.fact);
    later(() => {
      lockedRef.current = false;
      setMessage(null);
      setIndex((i) => i + 1);
    }, 2000);
  };

  useEffect(() => {
    if (!done) return;
    celebrate();
    react('habit-done', { ctx: { name } });
  }, [done, react, name]);

  const again = () => {
    initAudio();
    sfx.start();
    lockedRef.current = false;
    setItems(shuffle([...RUBBISH]));
    setIndex(0);
    setMessage(null);
  };

  if (done) {
    return (
      <>
        <Say text="All sorted! Recycling helps keep our planet clean." />
        <button type="button" className="primary-btn big again-btn" onClick={again} data-silent>
          Again!
        </button>
      </>
    );
  }
  return (
    <>
      <Say text={message ?? `Which bin does the ${item!.name.toLowerCase()} go in?`} />
      <div className="plate-food" aria-live="polite">
        <span className="plate-pic"><Pic emoji={item!.emoji} /></span>
        <b>{item!.name}</b>
      </div>
      <ul className="bin-grid">
        {BINS.map((b) => (
          <li key={b.key}>
            <button type="button" className="bin-btn" data-silent onClick={(e) => drop(b.key, e.currentTarget)}>
              <span className="bin-lid" aria-hidden="true"><Pic emoji="♻" /></span>
              <span>{b.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="song-progress" role="progressbar" aria-label="Items sorted" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={index} aria-valuetext={`${index} of ${items.length} sorted`}>
        <span style={{ width: `${(index / items.length) * 100}%` }} />
      </div>
    </>
  );
};

// ------------------------------------------------------------------- Grow a plant
export const GrowPlay: React.FC<HabitProps> = ({ name }) => {
  const [stage, setStage] = useState(0);
  const [needs, setNeeds] = useState({ water: false, sun: false });
  const needsRef = useRef({ water: false, sun: false });
  const stageRef = useRef(0);
  const later = useTimers();
  const { react } = useCompanion();
  const last = PLANT_STAGES.length - 1;

  const give = (what: 'water' | 'sun', el: HTMLElement) => {
    if (stageRef.current >= last) return;
    initAudio();
    const c = centreOf(el);
    starBurst(c.x, c.y);
    sfx.select();
    needsRef.current = { ...needsRef.current, [what]: true };
    setNeeds(needsRef.current);
    if (needsRef.current.water && needsRef.current.sun) {
      later(() => {
        stageRef.current += 1;
        setStage(stageRef.current);
        needsRef.current = { water: false, sun: false };
        setNeeds(needsRef.current);
        sfx.star();
        if (stageRef.current === last) {
          celebrate();
          react('habit-done', { ctx: { name } });
        }
      }, 700);
    }
  };

  const again = () => {
    initAudio();
    sfx.start();
    stageRef.current = 0;
    needsRef.current = { water: false, sun: false };
    setStage(0);
    setNeeds(needsRef.current);
  };

  const s = PLANT_STAGES[stage]!;
  const finished = stage === last;
  return (
    <>
      <Say text={s.fact} />
      <div className="grow-stage" aria-live="polite">
        <span key={stage} className="grow-plant pop-in"><Pic emoji={s.emoji} /></span>
        <b>{s.name}</b>
        <ol className="grow-steps" aria-label="Plant stages">
          {PLANT_STAGES.map((p, i) => (
            <li key={p.name} className={i <= stage ? 'on' : ''}>{p.name}</li>
          ))}
        </ol>
      </div>
      {finished ? (
        <button type="button" className="primary-btn big again-btn" onClick={again} data-silent>
          Plant another seed
        </button>
      ) : (
        <div className="grow-needs">
          <button type="button" className={`need-btn${needs.water ? ' given' : ''}`} data-silent aria-pressed={needs.water} onClick={(e) => give('water', e.currentTarget)}>
            <span aria-hidden="true"><Pic emoji="💧" /></span>
            <b>Give water</b>
            <small>{needs.water ? 'Watered!' : 'Plants need water'}</small>
          </button>
          <button type="button" className={`need-btn${needs.sun ? ' given' : ''}`} data-silent aria-pressed={needs.sun} onClick={(e) => give('sun', e.currentTarget)}>
            <span aria-hidden="true"><Pic emoji="🌞" /></span>
            <b>Give sunlight</b>
            <small>{needs.sun ? 'Sunny!' : 'Plants need sunlight'}</small>
          </button>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ Cross safely
export const RoadPlay: React.FC<HabitProps> = ({ name }) => {
  const [light, setLight] = useState<'red' | 'green'>('red');
  const [looked, setLooked] = useState({ left: false, right: false });
  const [crossed, setCrossed] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const crossedRef = useRef(false);
  const { react } = useCompanion();

  // The light changes on its own: stop for a while, then go for a while, again and again.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const next = (current: 'red' | 'green') => {
      timer = setTimeout(() => {
        const flipped = current === 'red' ? 'green' : 'red';
        setLight(flipped);
        next(flipped);
      }, current === 'red' ? RED_MS : GREEN_MS);
    };
    next('red');
    return () => clearTimeout(timer);
  }, []);

  const look = (side: 'left' | 'right') => {
    initAudio();
    sfx.tap();
    setLooked((l) => ({ ...l, [side]: true }));
    setHint(null);
  };

  const cross = () => {
    if (crossedRef.current) return;
    initAudio();
    if (light !== 'green') {
      sfx.wrong();
      setHint('Wait for the green light. Stop means stop!');
      return;
    }
    if (!looked.left || !looked.right) {
      sfx.wrong();
      setHint('Look left and look right first!');
      return;
    }
    crossedRef.current = true;
    setCrossed(true);
    setHint(null);
    celebrate();
    react('habit-done', { ctx: { name } });
  };

  const again = () => {
    initAudio();
    sfx.start();
    crossedRef.current = false;
    setCrossed(false);
    setLooked({ left: false, right: false });
    setHint(null);
  };

  const text = crossed
    ? 'You crossed safely! You waited, you looked, then you went.'
    : (hint ?? (light === 'green' ? 'Green means go. Look both ways, then cross!' : 'Red means stop. Wait for the green light.'));

  return (
    <>
      <Say text={text} />
      <div className="road-scene">
        <div className="traffic-light" role="img" aria-label={light === 'green' ? 'Green light. Go' : 'Red light. Stop'}>
          <span className={`lamp red${light === 'red' ? ' on' : ''}`} />
          <span className={`lamp green${light === 'green' ? ' on' : ''}`} />
          <b className="light-word">{light === 'green' ? 'GO' : 'STOP'}</b>
        </div>
        <div className="road">
          <span className={`walker${crossed ? ' crossed' : ''}`} aria-hidden="true"><Pic emoji="🚶" /></span>
        </div>
      </div>
      <div className="look-row">
        <button type="button" className={`look-btn${looked.left ? ' done' : ''}`} data-silent aria-pressed={looked.left} onClick={() => look('left')}>
          <span aria-hidden="true"><Pic emoji="👈" /></span> Look left
        </button>
        <button type="button" className={`look-btn${looked.right ? ' done' : ''}`} data-silent aria-pressed={looked.right} onClick={() => look('right')}>
          Look right <span aria-hidden="true"><Pic emoji="👉" /></span>
        </button>
      </div>
      {crossed ? (
        <button type="button" className="primary-btn big again-btn" onClick={again} data-silent>
          Again!
        </button>
      ) : (
        <button type="button" className="primary-btn big again-btn" onClick={cross} data-silent>
          Cross the road
        </button>
      )}
    </>
  );
};
