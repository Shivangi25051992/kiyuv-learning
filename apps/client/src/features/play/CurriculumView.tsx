import React from 'react';
import {
  ALIGNMENT_LABELS,
  BADGES,
  CURRICULUM,
  EXAM_PREP_BY_TRACK,
  evaluateEarnedBadgeIds,
  type CurriculumSystem,
} from '@kiyuv/content';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';

interface CurriculumViewProps {
  profile: KidProfile;
  onStartTopic: (topicId: string) => void;
}

const SYSTEM_CLASS_MAP: Record<CurriculumSystem, string> = {
  cbse: 'b-cbse',
  cc: 'b-cc',
  uk: 'b-uk',
  au: 'b-au',
  olym: 'b-olym',
};

export const StatsBar: React.FC<{ profile: KidProfile }> = ({ profile }) => {
  const totalQ = profile.totalCorrect + profile.totalWrong;
  const accuracy = totalQ > 0 ? Math.round((profile.totalCorrect / totalQ) * 100) : 0;
  const earnedCount = evaluateEarnedBadgeIds({
    stars: profile.stars,
    bestStreak: profile.bestStreak,
    topics: profile.topics,
  }).length;
  const masteredCount = Object.values(profile.topics).filter(
    (t) => t.b >= 10 || t.m,
  ).length;

  return (
    <div className="stats-bar">
      <div className="stat stars">
        <div className="v">⭐{profile.stars}</div>
        <div className="l">Stars</div>
      </div>
      <div className="stat streak">
        <div className="v">🔥{profile.streak}</div>
        <div className="l">Streak</div>
      </div>
      <div className="stat streak">
        <div className="v">🏅{profile.bestStreak}</div>
        <div className="l">Best</div>
      </div>
      <div className="stat correct">
        <div className="v">{accuracy}%</div>
        <div className="l">Accuracy</div>
      </div>
      <div className="stat badges">
        <div className="v">
          {earnedCount}/{BADGES.length}
        </div>
        <div className="l">Badges</div>
      </div>
      <div className="stat correct">
        <div className="v">🏆{masteredCount}</div>
        <div className="l">Mastered</div>
      </div>
    </div>
  );
};

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  profile,
  onStartTopic,
}) => {
  const cur = CURRICULUM[profile.track];
  const examTracks = EXAM_PREP_BY_TRACK[profile.track];
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;

  return (
    <div>
      <StatsBar profile={profile} />

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: theme.hex }}>
          {profile.avatar} {profile.nickname} · {cur.label}
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>{cur.subtitle}</p>
      </div>

      <h3 style={{ fontSize: 16, color: 'var(--text)', margin: '20px 0 10px' }}>
        📚 Subjects ({cur.subjects.length})
      </h3>

      <div className="cmap">
        {cur.subjects.map((subject) => (
          <div
            key={subject.name}
            className="subject-card"
            style={{ borderLeftColor: theme.accent }}
          >
            <h3>
              {subject.emoji} {subject.name}
            </h3>
            <div className="meta">
              {subject.systems.map((sy) => (
                <span
                  key={sy}
                  className={`alignment-badge ${SYSTEM_CLASS_MAP[sy]}`}
                >
                  {ALIGNMENT_LABELS[sy]}
                </span>
              ))}
              <br />
              <span
                style={{
                  color: 'var(--muted)',
                  fontSize: 11,
                  marginTop: 4,
                  display: 'inline-block',
                }}
              >
                {subject.grade}
              </span>
            </div>
            <div className="topics">
              {subject.topics.map((topic) => {
                const stat = profile.topics[topic.id];
                const best = stat?.b ?? 0;
                const mastered = best >= 10 || Boolean(stat?.m);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    className={`topic-chip ${mastered ? 'mastered' : ''}`}
                    onClick={() => onStartTopic(topic.id)}
                  >
                    <span>{topic.name}</span>
                    <span className="diff">{'★'.repeat(topic.diff)}</span>
                    {best > 0 && <span> · 🏅{best}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 16, color: 'var(--text)', margin: '24px 0 10px' }}>
        🎯 Exam Preparation Tracks
      </h3>
      {examTracks.map((exam) => (
        <div key={exam.name} className="exam-track">
          <div>
            <div className="et-left">{exam.name}</div>
            <div className="et-meta">
              {exam.org} · {exam.target}
            </div>
          </div>
          <div className="et-right">→</div>
        </div>
      ))}

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginTop: 20,
          color: 'var(--muted)',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <b style={{ color: 'var(--text)' }}>📈 How this works:</b> Tap any topic chip to play a
        10-question round. ★ = difficulty. 🏅 = your best score in that topic. Topics turn{' '}
        <span
          style={{
            background: 'linear-gradient(135deg,#ffd166,#ff9f43)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          gold
        </span>{' '}
        when mastered (10/10).
      </div>
    </div>
  );
};
