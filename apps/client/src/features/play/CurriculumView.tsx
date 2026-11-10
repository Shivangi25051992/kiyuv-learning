import React from 'react';
import {
  ALIGNMENT_LABELS,
  CURRICULUM,
  EXAM_PREP_BY_TRACK,
  type CurriculumSystem,
} from '@kiyuv/content';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';
import { IconCheck, IconFlame, IconPlay, IconStar, IconTrophy } from '../../ui/Icons.js';

interface CurriculumViewProps {
  profile: KidProfile;
  mode?: 'learn' | 'play';
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
  { main: '#ef5350', soft: '#ffeceb' },
  { main: '#fb8c00', soft: '#fff1dd' },
  { main: '#e0a800', soft: '#fff8d6' },
  { main: '#1faa72', soft: '#e3f9ee' },
  { main: '#3b7bff', soft: '#e8f0ff' },
  { main: '#8e5cf0', soft: '#f1eaff' },
  { main: '#e0479b', soft: '#ffe8f4' },
] as const;

type SubjectList = (typeof CURRICULUM)[keyof typeof CURRICULUM]['subjects'];

/** The next topic a child should try: never played first, then the lowest best score. */
function pickNextTopicId(profile: KidProfile, subjects: SubjectList): string | null {
  const all = subjects.flatMap((s) => s.topics);
  if (all.length === 0) return null;
  const unplayed = all.find((t) => (profile.topics[t.id]?.b ?? 0) === 0);
  if (unplayed) return unplayed.id;
  const sorted = [...all].sort(
    (a, b) => (profile.topics[a.id]?.b ?? 0) - (profile.topics[b.id]?.b ?? 0),
  );
  return sorted[0]?.id ?? null;
}

function pickRandomTopicId(profile: KidProfile, subjects: SubjectList): string | null {
  const all = subjects.flatMap((s) => s.topics);
  if (all.length === 0) return null;
  const notMastered = all.filter((t) => (profile.topics[t.id]?.b ?? 0) < 10);
  const pool = notMastered.length > 0 ? notMastered : all;
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? null;
}

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
  onStartTopic,
}) => {
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

        <h2 className="section-title">Pick a game</h2>
        <ul className="game-grid">
          {cur.subjects.map((subject, i) => {
            const colors = SUBJECT_COLORS[i % SUBJECT_COLORS.length]!;
            const topic =
              subject.topics.find((t) => (profile.topics[t.id]?.b ?? 0) < 10) ?? subject.topics[0];
            if (!topic) return null;
            return (
              <li key={subject.name} className="stagger-item" style={{ ['--i' as string]: i }}>
                <button
                  type="button"
                  className="game-card"
                  data-silent
                  style={{
                    ['--card-main' as string]: colors.main,
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
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      data-silent
                      className={`topic-chip ${mastered ? 'mastered' : ''}`}
                      onClick={() => onStartTopic(topic.id)}
                      aria-label={`${topic.name}. ${
                        mastered ? 'Mastered.' : best > 0 ? `Best score ${best} of 10.` : 'New.'
                      }`}
                    >
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
        Tap a topic to play 10 questions. More stars <b>★</b> means harder. A topic turns{' '}
        <span className="gold-pill">gold</span> when you get 10 out of 10.
      </p>
    </div>
  );
};
