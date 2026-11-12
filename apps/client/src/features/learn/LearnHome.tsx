import React, { useEffect, useState } from 'react';
import { CHALLENGE_ID, CHALLENGE_WIN, COURSES_PAGE_ID, PASS_MARK, coursesForTrack, freeCourseCount, levelStatus } from '@kiyuv/content';
import type { KidProfile } from '@kiyuv/shared';
import { Pic } from '../../ui/Pic.js';
import { Mascot } from '../../ui/Mascot.js';
import { IconLock, IconPlay } from '../../ui/Icons.js';
import { loadRound } from '../play/roundState.js';
import { PLAY_TIME_ID } from '../toddler/playTime.js';
import { useCompanion } from '../companion/CompanionProvider.js';
import { AdventureMap } from './AdventureMap.js';
import { DailyCard } from './DailyCard.js';
import { ProfileBanner } from './ProfileBanner.js';
import { todaysDaily } from './dailyChallenge.js';
import { dayStreakOf, isDailyDone, loadDaily } from './dailyState.js';
import { HABITS_PAGE_ID } from '../habits/habits.js';
import { SUBJECTS_PAGE_ID } from './pages.js';
import { challengeProgress, recommend, upNext } from './learnPath.js';
import { themeOfLevel } from './levelThemes.js';
import './learn.css';

interface LearnHomeProps {
  profile: KidProfile;
  roundKey?: string;
  /** Opens a topic, a course, or a page (courses, subjects, challenge, play time). */
  onStartTopic: (id: string) => void;
  /** The current time. Only tests set this. */
  now?: Date;
}

/** A card with a picture, a title, a line of plain words and one clear action. */
const ExtraCard: React.FC<{
  emoji: string;
  title: string;
  text: string;
  action: string;
  onClick: () => void;
  tone?: string;
}> = ({ emoji, title, text, action, onClick, tone }) => (
  <li>
    <button type="button" className="extra-card" data-silent onClick={onClick} style={tone ? { ['--tone' as string]: tone } : undefined}>
      <span className="extra-emoji" aria-hidden="true">
        <Pic emoji={emoji} />
      </span>
      <span className="extra-text">
        <b>{title}</b>
        <small>{text}</small>
      </span>
      <span className="extra-go">{action}</span>
    </button>
  </li>
);

/** The Learn page: one clear next step, the adventure path, then challenges and extras. */
export const LearnHome: React.FC<LearnHomeProps> = ({ profile, roundKey, onStartTopic, now: nowProp }) => {
  const [now] = useState(() => nowProp ?? new Date());
  const dayKey = roundKey ?? `kid:${profile.kidId}`;
  const [daily] = useState(() => todaysDaily(dayKey, profile, now));
  const dayState = loadDaily(dayKey);
  const days = dayStreakOf(dayState, now);
  // Kiyu says hello, once each time the app is opened.
  const { react: companion } = useCompanion();
  const nickname = profile.nickname;
  useEffect(() => {
    companion('greet', { once: true, aboveTabbar: true, ctx: { name: nickname, hour: now.getHours(), days } });
  }, [companion, nickname, now, days]);
  const status = levelStatus(profile.track, profile.topics);
  const theme = themeOfLevel(status.current);
  const next = upNext(profile);
  const recs = recommend(profile, daily?.id);
  const challenge = challengeProgress(profile);
  const saved = next && roundKey ? loadRound(roundKey, next.id) : null;
  const courseCount = coursesForTrack(profile.track).length;
  const isToddler = profile.track === 'early' && profile.age <= 3;
  const playTimeCard = (
    <ExtraCard
      emoji="🎈"
      title="Play time"
      text="Tap, pop and play. No questions."
      action="Open"
      tone="#ad1457"
      onClick={() => onStartTopic(PLAY_TIME_ID)}
    />
  );

  return (
    <div className="learn2">
      {isToddler && (
        <button type="button" className="next-btn playtime-btn" data-silent onClick={() => onStartTopic(PLAY_TIME_ID)}>
          <span className="challenge-emoji" aria-hidden="true">
            <Pic emoji="🎈" />
          </span>
          <span>
            <b>Play time</b>
            <small>Tap, pop and play</small>
          </span>
          <IconPlay size={28} />
        </button>
      )}

      <ProfileBanner profile={profile} days={days} />

      {next ? (
        <section className="upnext" aria-labelledby="upnext-title" style={{ ['--lvl' as string]: theme.color }}>
          <div className="upnext-body">
            <p className="eyebrow">Up next</p>
            <h2 id="upnext-title">{next.name}</h2>
            <p className="upnext-why">
              {next.subject}. Score {PASS_MARK} or more out of 10 to clear it and open the next topic.
            </p>
          </div>
          <Mascot mood="cheer" size={88} className="upnext-mascot" />
          <button type="button" className="primary-btn big upnext-btn" data-silent onClick={() => onStartTopic(next.id)}>
            <IconPlay size={24} />{' '}
            {saved ? `Continue · Question ${saved.questionIndex}` : next.best > 0 ? 'Try again' : 'Play'}
          </button>
        </section>
      ) : (
        <section className="upnext all-done" aria-labelledby="upnext-title" style={{ ['--lvl' as string]: theme.color }}>
          <div className="upnext-body">
            <p className="eyebrow">Amazing!</p>
            <h2 id="upnext-title">You cleared all 10 levels!</h2>
            <p className="upnext-why">Keep your skills sharp: try a Mixed Challenge or a bonus course, or replay any topic for a higher score.</p>
          </div>
          <Mascot mood="cheer" size={88} className="upnext-mascot" />
        </section>
      )}

      {daily && (
        <DailyCard pick={daily} done={isDailyDone(dayState, now)} now={now} onStart={() => onStartTopic(daily.id)} />
      )}

      {recs.length > 0 && (
        <section aria-labelledby="rec-title" className="learn-section">
          <h2 id="rec-title" className="learn-h2">
            Recommended for you
          </h2>
          <ul className="rec-list">
            {recs.map((r) => (
              <li key={r.kind + r.id}>
                <button type="button" className="rec-tile" data-silent onClick={() => onStartTopic(r.id)}>
                  <span className="rec-emoji" aria-hidden="true">
                    <Pic emoji={r.emoji} />
                  </span>
                  <span className="rec-text">
                    <b>{r.title}</b>
                    <small>{r.reason}</small>
                  </span>
                  <IconPlay size={22} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="how-details">
        <summary>How does this work?</summary>
        <ol>
          <li>Tap <b>Play</b> on your next topic and answer 10 questions.</li>
          <li>Get {PASS_MARK} or more right to <b>clear</b> it. The next topic opens.</li>
          <li>Clear every topic in a level to finish that place and walk on to the next one.</li>
        </ol>
      </details>

      <section aria-labelledby="path-title" className="learn-section">
        <h2 id="path-title" className="learn-h2">
          Your adventure
        </h2>
        <AdventureMap profile={profile} roundKey={roundKey} onStartTopic={onStartTopic} />
      </section>

      <section aria-labelledby="extras-title" className="learn-section">
        <h2 id="extras-title" className="learn-h2">
          Challenges and extras
        </h2>
        <ul className="extra-list">
          <li>
            {challenge.unlocked ? (
              <button type="button" className="extra-card" data-silent onClick={() => onStartTopic(CHALLENGE_ID)} style={{ ['--tone' as string]: '#b3350a' }}>
                <span className="extra-emoji" aria-hidden="true">
                  <Pic emoji="🏅" />
                </span>
                <span className="extra-text">
                  <b>Mixed Challenge</b>
                  <small>10 mixed questions from topics you cleared. Get {CHALLENGE_WIN} or more to win!</small>
                </span>
                <span className="extra-go">Play</span>
              </button>
            ) : (
              <div className="extra-card locked" style={{ ['--tone' as string]: '#b3350a' }}>
                <span className="extra-emoji" aria-hidden="true">
                  <Pic emoji="🏅" />
                </span>
                <span className="extra-text">
                  <b>
                    <IconLock size={16} /> Mixed Challenge
                  </b>
                  <small>
                    10 mixed questions from topics you cleared. Clear {challenge.need - challenge.have} more{' '}
                    {challenge.need - challenge.have === 1 ? 'topic' : 'topics'} to unlock it.
                  </small>
                  <span
                    className="meter"
                    role="progressbar"
                    aria-label="Topics cleared toward the Mixed Challenge"
                    aria-valuemin={0}
                    aria-valuemax={challenge.need}
                    aria-valuenow={challenge.have}
                    aria-valuetext={`${challenge.have} of ${challenge.need} topics cleared`}
                  >
                    <span style={{ width: `${(challenge.have / challenge.need) * 100}%` }} />
                  </span>
                  <span className="meter-label" aria-hidden="true">
                    {challenge.have} of {challenge.need} cleared
                  </span>
                </span>
              </div>
            )}
          </li>
          {courseCount > 0 && (
            <ExtraCard
              emoji="📚"
              title="Bonus courses"
              text={`${courseCount} extra courses, ${freeCourseCount(profile.track)} free. Space, animals and more.`}
              action="See all"
              tone="#4c1d95"
              onClick={() => onStartTopic(COURSES_PAGE_ID)}
            />
          )}
          {profile.track === 'early' && !isToddler && playTimeCard}
          {!isToddler && (
            <ExtraCard
              emoji="🧼"
              title="Good habits"
              text="Wash hands, eat well, cross safely, recycle and grow a plant."
              action="Try"
              tone="#0f7a4f"
              onClick={() => onStartTopic(HABITS_PAGE_ID)}
            />
          )}
          <ExtraCard
            emoji="🔢"
            title="Browse by subject"
            text="See every topic grouped by subject."
            action="Browse"
            tone="#0277bd"
            onClick={() => onStartTopic(SUBJECTS_PAGE_ID)}
          />
        </ul>
      </section>
    </div>
  );
};
