import React from 'react';
import {
  ALIGNMENT_LABELS,
  CURRICULUM,
  EXAM_PREP_BY_TRACK,
  PASS_MARK,
  isTopicUnlocked,
  levelOf,
  type CurriculumSystem,
} from '@kiyuv/content';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';
import { IconBack, IconCheck, IconLock } from '../../ui/Icons.js';
import { SUBJECT_COLORS } from '../play/subjectColors.js';
import { loadRound } from '../play/roundState.js';

const SYSTEM_CLASS_MAP: Record<CurriculumSystem, string> = {
  cbse: 'b-cbse',
  cc: 'b-cc',
  uk: 'b-uk',
  au: 'b-au',
  olym: 'b-olym',
};

interface SubjectsViewProps {
  profile: KidProfile;
  roundKey?: string;
  onBack: () => void;
  onStartTopic: (topicId: string) => void;
}

/**
 * Every topic, grouped by subject. This is for exploring and for parents; the main Learn
 * page is the guided path. The same rules apply: a topic opens when the one before it is cleared.
 */
export const SubjectsView: React.FC<SubjectsViewProps> = ({ profile, roundKey, onBack, onStartTopic }) => {
  const cur = CURRICULUM[profile.track];
  const examTracks = EXAM_PREP_BY_TRACK[profile.track];
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
  let topicIndex = 0;

  return (
    <div className="subjects-page" style={{ ['--run-color' as string]: theme.hex }}>
      <div className="courses-top">
        <button type="button" className="back-topics" onClick={onBack} aria-label="Back to the learn page">
          <IconBack size={22} />
          <span aria-hidden="true">Back</span>
        </button>
      </div>
      <h1 className="courses-title">Browse by subject</h1>
      <p className="courses-sub">
        {cur.label}. {cur.subtitle}
      </p>
      <p className="subjects-help">
        Pick any open topic. Get {PASS_MARK} or more right first time to clear it and open the next one. A topic turns{' '}
        <span className="gold-pill">gold</span> at 10 out of 10.
      </p>

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
                  <h2>{subject.name}</h2>
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
                        aria-label={`${topic.name}. Locked. Clear the topic before it to open this one.`}
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
    </div>
  );
};
