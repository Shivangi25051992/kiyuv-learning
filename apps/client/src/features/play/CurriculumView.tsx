import React from 'react';
import {
  CHALLENGE_ID,
  CHALLENGE_MIN_TOPICS,
  CHALLENGE_WIN,
  CURRICULUM,
  challengePool,
  isChallengeUnlocked,
  isTopicUnlocked,
  levelOf,
} from '@kiyuv/content';
import type { KidProfile } from '@kiyuv/shared';
import { Pic } from '../../ui/Pic.js';
import { SUBJECT_COLORS } from './subjectColors.js';
import { PLAY_TIME_ID } from '../toddler/playTime.js';
import { LearnHome } from '../learn/LearnHome.js';
import { IconLock, IconPlay } from '../../ui/Icons.js';

interface CurriculumViewProps {
  profile: KidProfile;
  mode?: 'learn' | 'play';
  /** Where this child's rounds in progress are saved (so topics can say "Continue"). */
  roundKey?: string;
  onStartTopic: (topicId: string) => void;
}

type SubjectList = (typeof CURRICULUM)[keyof typeof CURRICULUM]['subjects'];

const openTopics = (profile: KidProfile, subjects: SubjectList) =>
  subjects.flatMap((s) => s.topics).filter((t) => isTopicUnlocked(profile.track, profile.topics, t.id));

function pickRandomTopicId(profile: KidProfile, subjects: SubjectList): string | null {
  const all = openTopics(profile, subjects);
  if (all.length === 0) return null;
  const notMastered = all.filter((t) => (profile.topics[t.id]?.b ?? 0) < 10);
  const pool = notMastered.length > 0 ? notMastered : all;
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? null;
}

/** A harder replay: 10 mixed questions from topics already cleared. Opens after a few clears. */
const ChallengeButton: React.FC<{ profile: KidProfile; onStart: () => void }> = ({ profile, onStart }) => {
  const have = challengePool(profile.track, profile.topics).length;
  if (!isChallengeUnlocked(profile.track, profile.topics)) {
    return (
      <p className="challenge-hint">
        <IconLock size={18} /> Clear {CHALLENGE_MIN_TOPICS} topics to unlock the Mixed Challenge ({have}/{CHALLENGE_MIN_TOPICS}).
      </p>
    );
  }
  return (
    <button type="button" className="next-btn challenge-btn" data-silent onClick={onStart}>
      <span className="challenge-emoji" aria-hidden="true">
        <Pic emoji="🏅" />
      </span>
      <span>
        <b>Mixed Challenge</b>
        <small>Win with {CHALLENGE_WIN} or more out of 10</small>
      </span>
      <IconPlay size={28} />
    </button>
  );
};

/** Play time for the youngest children: tap-and-see activities with no questions. */
const PlayTimeButton: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <button type="button" className="next-btn playtime-btn" data-silent onClick={onOpen}>
    <span className="challenge-emoji" aria-hidden="true">
      <Pic emoji="🎈" />
    </span>
    <span>
      <b>Play time</b>
      <small>Tap, pop and play</small>
    </span>
    <IconPlay size={28} />
  </button>
);

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  profile,
  mode = 'learn',
  roundKey,
  onStartTopic,
}) => {
  const cur = CURRICULUM[profile.track];

  // ---------------------------------------------------------------- Play mode
  if (mode === 'play') {
    return (
      <div className="play-home">
        {profile.track === 'early' && <PlayTimeButton onOpen={() => onStartTopic(PLAY_TIME_ID)} />}
        <button
          type="button"
          className="surprise-btn"
          data-silent
          onClick={() => {
            const id = pickRandomTopicId(profile, cur.subjects);
            if (id) onStartTopic(id);
          }}
        >
          <span className="surprise-emoji" aria-hidden="true">
            🎲
          </span>
          <span className="surprise-text">
            <b>Surprise me!</b>
            <small>A random game, just for you</small>
          </span>
          <IconPlay size={30} />
        </button>

        <ChallengeButton profile={profile} onStart={() => onStartTopic(CHALLENGE_ID)} />

        <h2 className="section-title">Pick a game</h2>
        <ul className="game-grid">
          {cur.subjects.map((subject, i) => {
            const colors = SUBJECT_COLORS[i % SUBJECT_COLORS.length]!;
            const open = subject.topics.filter((t) => isTopicUnlocked(profile.track, profile.topics, t.id));
            const topic = open.find((t) => (profile.topics[t.id]?.b ?? 0) < 10) ?? open[0];
            const firstLevel = Math.min(...subject.topics.map((t) => levelOf(profile.track, t.id)));
            if (!topic) {
              return (
                <li key={subject.name} className="stagger-item" style={{ ['--i' as string]: i }}>
                  <button
                    type="button"
                    className="game-card locked"
                    disabled
                    aria-label={`${subject.name}. Locked. Clear the topics before it to play.`}
                  >
                    <span className="game-emoji" aria-hidden="true">
                      {subject.emoji}
                    </span>
                    <span className="game-name">{subject.name}</span>
                    <span className="game-go">
                      <IconLock size={16} /> Level {firstLevel}
                    </span>
                  </button>
                </li>
              );
            }
            return (
              <li key={subject.name} className="stagger-item" style={{ ['--i' as string]: i }}>
                <button
                  type="button"
                  className="game-card"
                  data-silent
                  style={{
                    ['--card-main' as string]: colors.main,
                    ['--card-text' as string]: colors.text,
                    ['--card-soft' as string]: colors.soft,
                  }}
                  onClick={() => onStartTopic(topic.id)}
                  aria-label={`Play ${subject.name}`}
                >
                  <span className="game-emoji" aria-hidden="true">
                    {subject.emoji}
                  </span>
                  <span className="game-name">{subject.name}</span>
                  <span className="game-go">
                    <IconPlay size={18} /> Play
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // --------------------------------------------------------------- Learn mode
  return <LearnHome profile={profile} roundKey={roundKey} onStartTopic={onStartTopic} />;
};
