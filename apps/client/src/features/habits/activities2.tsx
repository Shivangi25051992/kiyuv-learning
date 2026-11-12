import React, { useEffect, useRef, useState } from 'react';
import { shuffle } from '@kiyuv/content';
import { Pic } from '../../ui/Pic.js';
import { IconSpeaker } from '../../ui/Icons.js';
import { confettiBlast, starBurst } from '../../lib/effects.js';
import { canSpeak, initAudio, sfx, speak } from '../../lib/sound.js';
import { useCompanion } from '../companion/CompanionProvider.js';
import type { HabitProps } from './activities.js';
import { DIGEST_STEPS, HEART_CALM_BPM, HEART_GOAL_JUMPS, HEART_JUMP_STEP, HEART_MAX_BPM, HEART_REST_BPM, WATER_STEPS, type SeqStep } from './sequences.js';
import { KIND_SCENARIOS, ONLINE_SCENARIOS, SCREEN_SCENARIOS, type Scenario } from './scenarios.js';

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

// ------------------------------------------------------------- "What would you do?"
interface ScenarioPlayProps extends HabitProps {
  items: readonly Scenario[];
  /** What Kiyu's page says when all are done. */
  doneLine: string;
}

export const ScenarioPlay: React.FC<ScenarioPlayProps> = ({ name, items, doneLine }) => {
  const [order, setOrder] = useState(() => shuffle([...items]));
  const [index, setIndex] = useState(0);
  const [tried, setTried] = useState<ReadonlySet<number>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [choices, setChoices] = useState(() => shuffle([0, 1, 2]));
  const lockedRef = useRef(false);
  const later = useTimers();
  const { react } = useCompanion();

  const done = index >= order.length;
  const scenario = order[index];

  useEffect(() => {
    if (!done) return;
    celebrate();
    react('habit-done', { ctx: { name } });
  }, [done, react, name]);

  const pick = (optionIndex: number, el: HTMLElement) => {
    if (lockedRef.current || !scenario) return;
    initAudio();
    const option = scenario.options[optionIndex]!;
    setFeedback(option.feedback);
    if (!option.good) {
      sfx.wrong();
      setTried((t) => new Set(t).add(optionIndex));
      return;
    }
    lockedRef.current = true;
    const c = centreOf(el);
    starBurst(c.x, c.y);
    sfx.correct();
    later(() => {
      lockedRef.current = false;
      setFeedback(null);
      setTried(new Set());
      setChoices(shuffle([0, 1, 2]));
      setIndex((i) => i + 1);
    }, 2300);
  };

  const again = () => {
    initAudio();
    sfx.start();
    lockedRef.current = false;
    setOrder(shuffle([...items]));
    setIndex(0);
    setFeedback(null);
    setTried(new Set());
    setChoices(shuffle([0, 1, 2]));
  };

  if (done) {
    return (
      <>
        <Say text={doneLine} />
        <button type="button" className="primary-btn big again-btn" onClick={again} data-silent>
          Again!
        </button>
      </>
    );
  }
  return (
    <>
      <Say text={scenario!.prompt} />
      <ul className="scenario-options">
        {choices.map((i) => {
          const option = scenario!.options[i]!;
          const wasTried = tried.has(i);
          return (
            <li key={`${index}-${i}`}>
              <button
                type="button"
                className={`scenario-btn${wasTried ? ' tried' : ''}`}
                data-silent
                aria-disabled={wasTried || undefined}
                onClick={(e) => pick(i, e.currentTarget)}
              >
                {option.text}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="scenario-feedback" role="status" aria-live="polite">
        {feedback ?? ' '}
      </p>
      <div className="song-progress" role="progressbar" aria-label="Situations done" aria-valuemin={0} aria-valuemax={order.length} aria-valuenow={index} aria-valuetext={`${index} of ${order.length} done`}>
        <span style={{ width: `${(index / order.length) * 100}%` }} />
      </div>
    </>
  );
};

export const KindPlay: React.FC<HabitProps> = (p) => (
  <ScenarioPlay {...p} items={KIND_SCENARIOS} doneLine="You made kind choices every time. Kindness makes everyone feel good!" />
);
export const OnlinePlay: React.FC<HabitProps> = (p) => (
  <ScenarioPlay {...p} items={ONLINE_SCENARIOS} doneLine="You know how to stay safe online. When in doubt, tell a trusted grown-up!" />
);
export const ScreenPlay: React.FC<HabitProps> = (p) => (
  <ScenarioPlay {...p} items={SCREEN_SCENARIOS} doneLine="Good sleep and screen breaks help your body and your brain!" />
);

// ------------------------------------------------------------------ Put it in order
interface SequencePlayProps extends HabitProps {
  steps: readonly SeqStep[];
  intro: string;
  doneLine: string;
}

export const SequencePlay: React.FC<SequencePlayProps> = ({ name, steps, intro, doneLine }) => {
  const [shown, setShown] = useState(() => shuffle([...steps]));
  const [next, setNext] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const nextRef = useRef(0);
  const { react } = useCompanion();

  const done = next >= steps.length;

  const tap = (step: SeqStep, el: HTMLElement) => {
    if (nextRef.current >= steps.length) return;
    initAudio();
    const expected = steps[nextRef.current]!;
    if (step.key !== expected.key) {
      sfx.wrong();
      setMessage('That one comes later. Which comes next?');
      return;
    }
    const c = centreOf(el);
    starBurst(c.x, c.y);
    sfx.correct();
    nextRef.current += 1;
    setNext(nextRef.current);
    setMessage(step.fact);
    if (nextRef.current === steps.length) {
      celebrate();
      react('habit-done', { ctx: { name } });
    }
  };

  const again = () => {
    initAudio();
    sfx.start();
    nextRef.current = 0;
    setNext(0);
    setMessage(null);
    setShown(shuffle([...steps]));
  };

  const doneKeys = new Set(steps.slice(0, next).map((s) => s.key));
  return (
    <>
      <Say text={done ? doneLine : (message ?? intro)} />
      <ol className="seq-list">
        {shown.map((s) => {
          const place = steps.findIndex((x) => x.key === s.key) + 1;
          const isDone = doneKeys.has(s.key);
          return (
            <li key={s.key}>
              <button
                type="button"
                className={`seq-step${isDone ? ' done' : ''}`}
                data-silent
                aria-label={isDone ? `${s.name}, number ${place}` : s.name}
                onClick={(e) => tap(s, e.currentTarget)}
              >
                <span className="seq-num" aria-hidden="true">{isDone ? place : '?'}</span>
                <span className="seq-pic" aria-hidden="true"><Pic emoji={s.emoji} /></span>
                <span className="seq-name">{s.name}</span>
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

export const DigestPlay: React.FC<HabitProps> = (p) => (
  <SequencePlay {...p} steps={DIGEST_STEPS} intro="Where does food go after you eat it? Tap the places in order, starting with the mouth." doneLine="That is the journey of your food, from your mouth all the way through!" />
);
export const WaterPlay: React.FC<HabitProps> = (p) => (
  <SequencePlay {...p} steps={WATER_STEPS} intro="Water travels in a circle. Tap the steps in order, starting with the Sun warming the water." doneLine="That is the water cycle. The same water goes round and round!" />
);

// ------------------------------------------------------------------ Calm breathing
/** One breath in, one breath out. Both last this long. */
export const BREATH_MS = 4000;
export const BREATH_CYCLES = 3;

export const BreathePlay: React.FC<HabitProps> = ({ name }) => {
  const [phase, setPhase] = useState<'ready' | 'in' | 'out' | 'done'>('ready');
  const [cycle, setCycle] = useState(1);
  const later = useTimers();
  const { react } = useCompanion();

  const start = () => {
    initAudio();
    sfx.start();
    setCycle(1);
    setPhase('in');
    for (let c = 0; c < BREATH_CYCLES; c++) {
      later(() => {
        setCycle(c + 1);
        setPhase('in');
      }, c * 2 * BREATH_MS);
      later(() => setPhase('out'), c * 2 * BREATH_MS + BREATH_MS);
    }
    later(() => {
      setPhase('done');
      sfx.fanfare();
      react('habit-done', { ctx: { name } });
    }, BREATH_CYCLES * 2 * BREATH_MS);
  };

  const text =
    phase === 'ready'
      ? 'Let us breathe slowly together. Breathe in through your nose, and out through your mouth.'
      : phase === 'in'
        ? 'Breathe in... slowly...'
        : phase === 'out'
          ? 'Breathe out... slowly...'
          : 'Well done. Notice how calm your body feels.';
  return (
    <>
      <Say text={text} />
      <div className={`breath-wrap phase-${phase}`}>
        <div className="breath-circle" aria-hidden="true">
          <Pic emoji="😌" />
        </div>
      </div>
      {phase === 'in' || phase === 'out' ? (
        <p className="breath-count" aria-live="off">
          Breath {cycle} of {BREATH_CYCLES}
        </p>
      ) : (
        <button type="button" className="primary-btn big again-btn" onClick={start} data-silent>
          {phase === 'done' ? 'Again' : 'Start breathing'}
        </button>
      )}
    </>
  );
};

// ------------------------------------------------------------ Your heart and exercise
export const HeartPlay: React.FC<HabitProps> = ({ name }) => {
  const [bpm, setBpm] = useState(HEART_REST_BPM);
  const [jumps, setJumps] = useState(0);
  const [resting, setResting] = useState(false);
  const [done, setDone] = useState(false);
  const bpmRef = useRef(HEART_REST_BPM);
  const jumpsRef = useRef(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const { react } = useCompanion();

  useEffect(() => () => {
    if (interval.current) clearInterval(interval.current);
  }, []);

  const jump = (el: HTMLElement) => {
    if (done) return;
    initAudio();
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
      setResting(false);
    }
    const c = centreOf(el);
    starBurst(c.x, c.y);
    sfx.tap();
    jumpsRef.current += 1;
    setJumps(jumpsRef.current);
    bpmRef.current = Math.min(HEART_MAX_BPM, bpmRef.current + HEART_JUMP_STEP);
    setBpm(bpmRef.current);
  };

  const rest = () => {
    if (done || interval.current) return;
    initAudio();
    setResting(true);
    interval.current = setInterval(() => {
      bpmRef.current = Math.max(HEART_REST_BPM, bpmRef.current - 5);
      setBpm(bpmRef.current);
      if (bpmRef.current <= HEART_CALM_BPM) {
        if (interval.current) clearInterval(interval.current);
        interval.current = null;
        setResting(false);
        if (jumpsRef.current >= HEART_GOAL_JUMPS) {
          setDone(true);
          celebrate();
          react('habit-done', { ctx: { name } });
        }
      }
    }, 400);
  };

  const again = () => {
    initAudio();
    sfx.start();
    bpmRef.current = HEART_REST_BPM;
    jumpsRef.current = 0;
    setBpm(HEART_REST_BPM);
    setJumps(0);
    setDone(false);
  };

  const text = done
    ? 'Your heart is strong! At rest, a child\'s heart usually beats about 70 to 100 times a minute.'
    : resting
      ? 'Rest... and your heart slows down again.'
      : jumps === 0
        ? 'Your heart is resting. Press Jump to get moving!'
        : jumps < 5
          ? 'Your heart beats faster to bring more oxygen to your muscles.'
          : jumps < HEART_GOAL_JUMPS
            ? 'Exercise makes your heart stronger. Keep jumping!'
            : 'Great! Now press Rest and watch your heart slow down.';

  return (
    <>
      <Say text={text} />
      <div className="heart-box" role="img" aria-label={`Heart beating ${bpm} times a minute`}>
        <span className="heart-pic" style={{ ['--bpm' as string]: bpm }}><Pic emoji="🫀" /></span>
        <b className="heart-bpm">{bpm}</b>
        <small>beats a minute</small>
      </div>
      <div className="song-progress" role="progressbar" aria-label="Jumps" aria-valuemin={0} aria-valuemax={HEART_GOAL_JUMPS} aria-valuenow={Math.min(jumps, HEART_GOAL_JUMPS)} aria-valuetext={`${Math.min(jumps, HEART_GOAL_JUMPS)} of ${HEART_GOAL_JUMPS} jumps`}>
        <span style={{ width: `${(Math.min(jumps, HEART_GOAL_JUMPS) / HEART_GOAL_JUMPS) * 100}%` }} />
      </div>
      {done ? (
        <button type="button" className="primary-btn big again-btn" onClick={again} data-silent>
          Again!
        </button>
      ) : (
        <div className="look-row">
          <button type="button" className="look-btn" data-silent onClick={(e) => jump(e.currentTarget)}>
            <span aria-hidden="true"><Pic emoji="🤸" /></span> Jump
          </button>
          <button type="button" className="look-btn" data-silent onClick={rest} aria-disabled={resting || undefined}>
            <span aria-hidden="true"><Pic emoji="😌" /></span> Rest
          </button>
        </div>
      )}
    </>
  );
};
