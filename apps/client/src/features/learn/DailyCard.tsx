import React from 'react';
import { PASS_MARK } from '@kiyuv/content';
import { Pic } from '../../ui/Pic.js';
import { IconCheck, IconFlame, IconPlay } from '../../ui/Icons.js';
import { DAILY_BONUS_STARS, type DailyPick } from './dailyChallenge.js';

interface DailyCardProps {
  pick: DailyPick;
  done: boolean;
  now: Date;
  onStart: () => void;
}

/** A new challenge every day. Finishing it with a pass earns bonus stars. */
export const DailyCard: React.FC<DailyCardProps> = ({ pick, done, now, onStart }) => {
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const day = now.toLocaleDateString('en-US', { weekday: 'short' });

  if (done) {
    return (
      <div className="daily-card done" role="status" aria-label="Daily challenge done. Come back tomorrow for a new one.">
        <span className="daily-ic" aria-hidden="true">
          <IconCheck size={30} />
        </span>
        <span className="daily-body">
          <small>Daily challenge · {day}</small>
          <b>Done for today!</b>
          <span>Come back tomorrow for a new one.</span>
        </span>
        <span className="daily-flame" aria-hidden="true">
          <IconFlame size={28} />
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="daily-card"
      data-silent
      onClick={onStart}
      aria-label={`Daily challenge for ${weekday}: ${pick.name}. Get ${PASS_MARK} or more right first time for ${DAILY_BONUS_STARS} bonus stars.`}
    >
      <span className="daily-ic" aria-hidden="true">
        <Pic emoji="🎁" />
      </span>
      <span className="daily-body">
        <small>Daily challenge · {day}</small>
        <b>{pick.name}</b>
        <span>
          {pick.subject} · {PASS_MARK}+ right first time for {DAILY_BONUS_STARS} bonus stars
        </span>
      </span>
      <span className="daily-go" aria-hidden="true">
        <IconPlay size={22} />
      </span>
    </button>
  );
};
