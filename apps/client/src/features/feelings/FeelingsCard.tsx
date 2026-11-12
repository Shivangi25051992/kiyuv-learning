import React, { useState } from 'react';
import { Mascot } from '../../ui/Mascot.js';
import { Pic } from '../../ui/Pic.js';
import { IconPlay } from '../../ui/Icons.js';
import { FEELINGS, GROWN_UP_LINE, replyFor, type Feeling } from './feelings.js';
import { answeredToday, feelingsEnabled, saveFeeling } from './feelingsState.js';
import './feelings.css';

interface FeelingsCardProps {
  /** The child's nickname. */
  name: string;
  /** Where today's answer is kept (the same key as the child's other on-device data). */
  storeKey: string;
  now?: Date;
  /** Opens the calm breathing activity. */
  onBreathe: () => void;
}

/**
 * "How are you feeling today?" once a day. Private to this device. Kiyu answers kindly, and
 * for a big feeling offers to breathe together and reminds the child about a trusted grown-up.
 */
export const FeelingsCard: React.FC<FeelingsCardProps> = ({ name, storeKey, now: nowProp, onBreathe }) => {
  const [now] = useState(() => nowProp ?? new Date());
  const [chosen, setChosen] = useState<Feeling | null>(null);
  const [hidden, setHidden] = useState(() => !feelingsEnabled() || answeredToday(storeKey, now));

  if (hidden && !chosen) return null;

  if (chosen) {
    return (
      <section className="feelings-card answered" aria-labelledby="feelings-reply">
        <Mascot mood={chosen.kiyu} size={72} className="feelings-mascot" />
        <div className="feelings-body">
          <p id="feelings-reply" role="status" className="feelings-reply">
            {replyFor(chosen, name)}
          </p>
          {chosen.big && <p className="feelings-note">{GROWN_UP_LINE}</p>}
          <div className="feelings-actions">
            {chosen.big && (
              <button type="button" className="feelings-breathe" data-silent onClick={onBreathe}>
                <IconPlay size={18} /> Breathe with Kiyu
              </button>
            )}
            <button type="button" className="feelings-done" data-silent onClick={() => setChosen(null)}>
              Thanks, Kiyu
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="feelings-card" aria-labelledby="feelings-title">
      <h2 id="feelings-title" className="feelings-title">
        How are you feeling today?
      </h2>
      <ul className="feelings-faces">
        {FEELINGS.map((f) => (
          <li key={f.key}>
            <button
              type="button"
              className="feelings-face"
              data-silent
              aria-label={f.label}
              onClick={() => {
                saveFeeling(storeKey, f.key, now);
                setChosen(f);
                setHidden(true);
              }}
            >
              <span aria-hidden="true">
                <Pic emoji={f.emoji} />
              </span>
              <small>{f.label}</small>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="feelings-skip"
        data-silent
        onClick={() => {
          saveFeeling(storeKey, 'skip', now);
          setHidden(true);
        }}
      >
        Not now
      </button>
    </section>
  );
};
