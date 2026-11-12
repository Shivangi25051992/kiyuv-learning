import React, { useState } from 'react';
import type { KidProfile } from '@kiyuv/shared';
import { PASS_MARK } from '@kiyuv/content';
import { Pic } from '../../ui/Pic.js';
import { IconCheck, IconLock, IconPlay } from '../../ui/Icons.js';
import { loadRound } from '../play/roundState.js';
import { buildPath, type LevelStop, type TopicRowData } from './learnPath.js';
import { themeOfLevel } from './levelThemes.js';

interface AdventureMapProps {
  profile: KidProfile;
  roundKey?: string;
  onStartTopic: (topicId: string) => void;
}

/** A few words that say where the child stands in a level. */
function levelStatusText(stop: LevelStop): string {
  const total = stop.topics.length;
  switch (stop.state) {
    case 'done':
      return 'All done';
    case 'now':
      return `${stop.cleared} of ${total} cleared`;
    case 'open': {
      const open = stop.topics.filter((t) => t.state !== 'locked').length;
      return `${open} open`;
    }
    default:
      return 'Locked';
  }
}

/** The one sentence shown inside a level that is not open yet, and only there. */
function levelNote(stop: LevelStop): string | null {
  if (stop.state === 'locked') {
    return stop.level === 1 ? null : `Finish Level ${stop.level - 1} to unlock this place.`;
  }
  if (stop.state === 'open') {
    return 'Clear the topic before it to open the next one.';
  }
  return null;
}

const TopicRow: React.FC<{ topic: TopicRowData; savedQuestion: number | null; onStart: () => void }> = ({
  topic,
  savedQuestion,
  onStart,
}) => {
  const locked = topic.state === 'locked';
  const status = locked
    ? 'Locked. Clear the topic before it first'
    : topic.state === 'cleared'
      ? `Cleared. Best ${topic.best} out of 10`
      : topic.best > 0
        ? `Best ${topic.best} out of 10. Score ${PASS_MARK} to clear it`
        : 'New';
  const action = savedQuestion
    ? `Continue · Q${savedQuestion}`
    : topic.state === 'cleared'
      ? 'Replay'
      : topic.best > 0
        ? 'Try again'
        : 'Play';
  const meta = locked ? topic.subject : `${topic.subject} · ${topic.best > 0 ? `Best ${topic.best}/10` : 'New'}`;

  return (
    <li>
      <button
        type="button"
        className={`adv-topic ${topic.state}`}
        disabled={locked}
        data-silent
        onClick={onStart}
        aria-label={`${topic.name}. ${topic.subject}. ${status}.${locked ? '' : ` ${action}.`}`}
      >
        <span className="adv-topic-icon" aria-hidden="true">
          {topic.state === 'cleared' ? <IconCheck size={20} /> : locked ? <IconLock size={18} /> : <IconPlay size={18} />}
        </span>
        <span className="adv-topic-text">
          <b>{topic.name}</b>
          <small>{meta}</small>
        </span>
        {!locked && <span className="adv-topic-go">{action}</span>}
      </button>
    </li>
  );
};

/**
 * The adventure path: ten places, one per level. The level being worked on is open by
 * default and tagged "You are here". Tap any level to peek inside it.
 */
export const AdventureMap: React.FC<AdventureMapProps> = ({ profile, roundKey, onStartTopic }) => {
  const path = buildPath(profile);
  const initial = path.find((s) => s.state === 'now')?.level ?? null;
  const [openLevel, setOpenLevel] = useState<number | null>(initial);

  return (
    <ol className="adv" aria-label="Adventure path, levels 1 to 10">
      {path.map((stop) => {
        const theme = themeOfLevel(stop.level);
        const expanded = openLevel === stop.level;
        const panelId = `adv-level-${stop.level}`;
        const status = levelStatusText(stop);
        const note = levelNote(stop);
        return (
          <li
            key={stop.level}
            className={`adv-stop ${stop.state}${expanded ? ' expanded' : ''}`}
            style={{ ['--lvl' as string]: theme.color }}
          >
            <div className="adv-card">
              <button
                type="button"
                className="adv-head"
                aria-expanded={expanded}
                aria-controls={panelId}
                aria-label={`Level ${stop.level}, ${theme.name}. ${status}.${stop.state === 'now' ? ' You are here.' : ''}`}
                onClick={() => setOpenLevel(expanded ? null : stop.level)}
              >
                <span className="adv-node" aria-hidden="true">
                  {stop.state === 'done' ? <IconCheck size={22} /> : stop.state === 'locked' ? <IconLock size={20} /> : stop.level}
                </span>
                <span className="adv-title" aria-hidden="true">
                  <b>
                    Level {stop.level}
                    {stop.state === 'now' && <span className="adv-tag">You are here</span>}
                  </b>
                  <small>
                    <span className="adv-theme-emoji">
                      <Pic emoji={theme.emoji} />
                    </span>
                    {theme.name} · {status}
                  </small>
                </span>
                <span className="adv-chev" aria-hidden="true" />
              </button>
              <div className="adv-panel" id={panelId} hidden={!expanded}>
                {note && <p className="adv-note">{note}</p>}
                <ul className="adv-topics">
                  {stop.topics.map((t) => {
                    const saved = roundKey && t.state !== 'locked' ? loadRound(roundKey, t.id) : null;
                    return (
                      <TopicRow
                        key={t.id}
                        topic={t}
                        savedQuestion={saved?.questionIndex ?? null}
                        onStart={() => onStartTopic(t.id)}
                      />
                    );
                  })}
                </ul>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
