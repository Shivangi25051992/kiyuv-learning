import React from 'react';
import {
  ALIGNMENT_LABELS,
  CHALLENGE_ID,
  CHALLENGE_MIN_TOPICS,
  CHALLENGE_WIN,
  challengePool,
  COURSES,
  CURRICULUM,
  isChallengeUnlocked,
  EXAM_PREP_BY_TRACK,
  isTopicUnlocked,
  LEVEL_COUNT,
  levelOf,
  levelStatus,
  PASS_MARK,
  type CurriculumSystem,
} from '@kiyuv/content';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';
import { Pic } from '../../ui/Pic.js';
import { loadRound } from './roundState.js';
import { IconCheck, IconFlame, IconLock, IconPlay, IconStar, IconTrophy } from '../../ui/Icons.js';

interface CurriculumViewProps {
  profile: KidProfile;
  mode?: 'learn' | 'play';
  /** Where this child's rounds in progress are saved (so topics can say "Continue"). */
  roundKey?: string;
  onStartTopic: (topicId: string) => void;
}

const SYSTEM_CLASS_MAP: Record<CurriculumSystem, string> = {
  cbse: 'b-cbse',
  cc: 'b-cc',
  uk: 'b-uk',
  au: 'b-au',
  olym: 'b-olym',
};

/** A friendly rainbow, so every subject has its own colour. */
const SUBJECT_COLORS = [
  { main: '#ef5350', text: '#c62828', soft: '#ffeceb' },
  { main: '#fb8c00', text: '#b45309', soft: '#fff1dd' },
  { main: '#e0a800', text: '#8a6100', soft: '#fff8d6' },
  { main: '#1faa72', text: '#047857', soft: '#e3f9ee' },
  { main: '#3b7bff', text: '#1d4ed8', soft: '#e8f0ff' },
  { main: '#8e5cf0', text: '#6d28d9', soft: '#f1eaff' },
  { main: '#e0479b', text: '#be185d', soft: '#ffe8f4' },
] as const;

type SubjectList = (typeof CURRICULUM)[keyof typeof CURRICULUM]['subjects'];

const openTopics = (profile: KidProfile, subjects: SubjectList) =>
  subjects.flatMap((s) => s.topics).filter((t) => isTopicUnlocked(profile.track, profile.topics, t.id));

/** The next topic a child should try: never played first, then the lowest best score. */
function pickNextTopicId(profile: KidProfile, subjects: SubjectList): string | null {
  const all = openTopics(profile, subjects);
  if (all.length === 0) return null;
  const unplayed = all.find((t) => (profile.topics[t.id]?.b ?? 0) === 0);
  if (unplayed) return unplayed.id;
  const sorted = [...all].sort(
    (a, b) => (profile.topics[a.id]?.b ?? 0) - (profile.topics[b.id]?.b ?? 0),
  );
  return sorted[0]?.id ?? null;
}

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

/** Extra courses outside the levels. Always open; they never gate a level. */
const BonusCourses: React.FC<{ profile: KidProfile; onStart: (id: string) => void }> = ({ profile, onStart }) => {
  if (profile.track !== 'primary') return null;
  return (
    <section className="bonus-courses" aria-label="Bonus courses">
      <h2 className="section-title">Bonus courses</h2>
      <ul className="game-grid">
        {COURSES.map((c, i) => {
          const colors = SUBJECT_COLORS[(i + 3) % SUBJECT_COLORS.length]!;
          const best = profile.topics[c.id]?.b ?? 0;
          return (
            <li key={c.id} className="stagger-item" style={{ ['--i' as string]: i }}>
              <button
                type="button"
                className="game-card"
                data-silent
                style={{
                  ['--card-main' as string]: colors.main,
                  ['--card-text' as string]: colors.text,
                  ['--card-soft' as string]: colors.soft,
                }}
                onClick={() => onStart(c.id)}
                aria-label={`${c.name}. ${c.blurb}. ${best > 0 ? `Best score ${best} out of 10` : 'Not played yet'}`}
              >
                <span className="game-emoji" aria-hidden="true">
                  <Pic emoji={c.emoji} />
                </span>
                <span className="game-name">{c.name}</span>
                <span className="bonus-blurb">{c.blurb}</span>
                <span className="game-go">{best > 0 ? `Best ${best}/10` : 'New'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/** Level 1 to 10: where the child is, and what opens the next level. */
export const LevelBanner: React.FC<{ profile: KidProfile }> = ({ profile }) => {
  const status = levelStatus(profile.track, profile.topics);
  const left = status.totalInCurrent - status.clearedInCurrent;
  return (
    <section className="level-banner" aria-label="Your level">
      <div className="level-head">
        <span className="level-badge" aria-hidden="true">
          {status.allCleared ? '★' : status.current}
        </span>
        <div>
          <h2>{status.allCleared ? 'All levels cleared!' : `Level ${status.current}`}</h2>
          <p>
            {status.allCleared
              ? 'Amazing! Play any topic again to beat your best score.'
              : `Score ${PASS_MARK} or more out of 10 in ${left} more ${left === 1 ? 'topic' : 'topics'} to open Level ${status.current + 1}.`}
          </p>
        </div>
      </div>
      <ol className="level-path" aria-label={`Level ${status.current} of ${LEVEL_COUNT}`}>
        {Array.from({ length: LEVEL_COUNT }, (_, i) => {
          const n = i + 1;
          const state = status.allCleared || n < status.current ? 'done' : n === status.current ? 'now' : 'ahead';
          const word = state === 'done' ? 'cleared' : state === 'now' ? 'now' : 'locked';
          return (
            <li key={n} className={`level-step ${state}`}>
              <span className="sr-only">{`Level ${n} ${word}`}</span>
              <span aria-hidden="true">{state === 'ahead' ? <IconLock size={15} /> : n}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export const StatsBar: React.FC<{ profile: KidProfile }> = ({ profile }) => {
  const totalQ = profile.totalCorrect + profile.totalWrong;
  const accuracy = totalQ > 0 ? Math.round((profile.totalCorrect / totalQ) * 100) : 0;
  const masteredCount = Object.values(profile.topics).filter((t) => t.b >= 10 || t.m).length;

  return (
    <ul className="stats-bar" aria-label="Your progress">
      <li className="stat stars">
        <IconStar size={26} />
        <span className="v">{profile.stars}</span>
        <span className="l">Stars</span>
      </li>
      <li className="stat streak">
        <IconFlame size={26} />
        <span className="v">{profile.bestStreak}</span>
        <span className="l">Best streak</span>
      </li>
      <li className="stat correct">
        <IconCheck size={26} />
        <span className="v">{accuracy}%</span>
        <span className="l">Right answers</span>
      </li>
      <li className="stat badges">
        <IconTrophy size={26} />
        <span className="v">{masteredCount}</span>
        <span className="l">Mastered</span>
      </li>
    </ul>
  );
};

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  profile,
  mode = 'learn',
  roundKey,
  onStartTopic,
}) => {
  let topicIndex = 0; // gives each topic card its own little delay in the float animation
  const cur = CURRICULUM[profile.track];
  const examTracks = EXAM_PREP_BY_TRACK[profile.track];
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;

  const nextId = pickNextTopicId(profile, cur.subjects);

  // ---------------------------------------------------------------- Play mode
  if (mode === 'play') {
    return (
      <div className="play-home">
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
                    aria-label={`${subject.name}. Locked. Reach Level ${firstLevel} to play.`}
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
  return (
    <div className="learn-home">
      <StatsBar profile={profile} />
      <LevelBanner profile={profile} />

      {nextId && (
        <button
          type="button"
          className="next-btn"
          data-silent
          onClick={() => onStartTopic(nextId)}
          style={{ ['--next-color' as string]: theme.hex, ['--next-accent' as string]: theme.accent }}
        >
          <IconPlay size={28} />
          <span>
            <b>Play next challenge</b>
            <small>We picked one for you</small>
          </span>
        </button>
      )}

      <ChallengeButton profile={profile} onStart={() => onStartTopic(CHALLENGE_ID)} />
      <BonusCourses profile={profile} onStart={onStartTopic} />

      <h2 className="section-title">
        {cur.label}
        <small>{cur.subtitle}</small>
      </h2>

      <div className="cmap">
        {cur.subjects.map((subject, i) => {
          const colors = SUBJECT_COLORS[i % SUBJECT_COLORS.length]!;
          return (
            <section
              key={subject.name}
              className="subject-card stagger-item"
              style={{
                ['--card-main' as string]: colors.main,
                ['--card-text' as string]: colors.text,
                ['--card-soft' as string]: colors.soft,
                ['--i' as string]: i,
              }}
            >
              <header className="subject-head">
                <span className="subject-emoji" aria-hidden="true">
                  {subject.emoji}
                </span>
                <div>
                  <h3>{subject.name}</h3>
                  <div className="meta">
                    {subject.systems.map((sy) => (
                      <span key={sy} className={`alignment-badge ${SYSTEM_CLASS_MAP[sy]}`}>
                        {ALIGNMENT_LABELS[sy]}
                      </span>
                    ))}
                    <span className="grade">{subject.grade}</span>
                  </div>
                </div>
              </header>
              <div className="topics">
                {subject.topics.map((topic) => {
                  const stat = profile.topics[topic.id];
                  const best = stat?.b ?? 0;
                  const mastered = best >= 10 || Boolean(stat?.m);
                  const saved = roundKey ? loadRound(roundKey, topic.id) : null;
                  const unlocked = isTopicUnlocked(profile.track, profile.topics, topic.id);
                  const level = levelOf(profile.track, topic.id);
                  if (!unlocked) {
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        className="topic-chip locked"
                        disabled
                        style={{ ['--i' as string]: topicIndex++ }}
                        aria-label={`${topic.name}. Locked. Clear Level ${level - 1} to open it.`}
                      >
                        <span className="topic-name">{topic.name}</span>
                        <span className="topic-meta">
                          <span className="topic-lock">
                            <IconLock size={14} /> Level {level}
                          </span>
                        </span>
                        <span className="topic-bar" aria-hidden="true">
                          <span style={{ width: '0%' }} />
                        </span>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      data-silent
                      className={`topic-chip ${mastered ? 'mastered' : ''}${saved ? ' in-progress' : ''}`}
                      style={{ ['--i' as string]: topicIndex++ }}
                      onClick={() => onStartTopic(topic.id)}
                      aria-label={`${topic.name}. Difficulty ${topic.diff} of 3. ${
                        mastered ? 'Mastered.' : best > 0 ? `Best score ${best} of 10.` : 'New.'
                      }${saved ? ` Round in progress, question ${saved.questionIndex} of 10.` : ''}`}
                    >
                      {saved && (
                        <span className="topic-resume" aria-hidden="true">
                          Continue · Q{saved.questionIndex}
                        </span>
                      )}
                      <span className="topic-name">{topic.name}</span>
                      <span className="topic-meta">
                        <span className="diff" aria-hidden="true">
                          {'★'.repeat(topic.diff)}
                        </span>
                        {mastered ? (
                          <span className="topic-done">
                            <IconCheck size={14} /> Mastered
                          </span>
                        ) : best > 0 ? (
                          <span className="topic-best">{best}/10</span>
                        ) : null}
                      </span>
                      <span className="topic-bar" aria-hidden="true">
                        <span style={{ width: `${Math.min(100, best * 10)}%` }} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {examTracks.length > 0 && (
        <>
          <h2 className="section-title">Exam practice</h2>
          <ul className="exam-list">
            {examTracks.map((exam) => (
              <li key={exam.name} className="exam-track">
                <div>
                  <div className="et-left">{exam.name}</div>
                  <div className="et-meta">
                    {exam.org} · {exam.target}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="how-it-works">
        Tap a topic to play 10 questions. Get {PASS_MARK} or more right to clear it, and clear every topic
        in a level to open the next level. More stars <b>★</b> means harder. A topic turns{' '}
        <span className="gold-pill">gold</span> when you get 10 out of 10.
      </p>
    </div>
  );
};
