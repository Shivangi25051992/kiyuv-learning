import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BADGES,
  CHALLENGE_ID,
  CHALLENGE_WIN,
  challengePool,
  CURRICULUM,
  evaluateEarnedBadgeIds,
  generateQuestionForTopic,
  levelOf,
  levelStatus,
  PASS_MARK,
  pathwayOf,
  pick,
  upNextTopics,
  type GeneratedQuestion,
} from '@kiyuv/content';
import {
  FAV_COLOR_THEMES,
  starsPerCorrectForTrack,
  type KidProfile,
} from '@kiyuv/shared';
import { Pic, PicText } from '../../ui/Pic.js';
import { CountUp } from '../../ui/CountUp.js';
import { balloonRise, confettiBlast, floatEmoji, showTrophy, starBurst } from '../../lib/effects.js';
import { canSpeak, initAudio, setMusicScene, sfx, speak, stopSpeaking } from '../../lib/sound.js';
import { Mascot, type MascotMood } from '../../ui/Mascot.js';
import { useCompanion } from '../companion/CompanionProvider.js';
import { questionKey } from './questionKey.js';
import { clearRound, loadRound, saveRound } from './roundState.js';
import { IconBack, IconCheck, IconFlame, IconPlay, IconRefresh, IconSpeaker, IconStar, IconBook } from '../../ui/Icons.js';

interface TopicRunnerProps {
  profile: KidProfile;
  topicId: string;
  onUpdateProfile: (next: KidProfile, flushImmediately: boolean) => void;
  onExitToMap: () => void;
  /** Starts another topic straight from the finish screen ("Next up" tiles). */
  onPlayTopic?: (topicId: string) => void;
  /** Set when this topic is today's daily challenge and it is not done yet. */
  daily?: { bonus: number; onComplete: () => void };
  /** Runs the action once the parent's PIN is fresh (asks for it if not). */
  requireParentPin?: (action: () => void) => void;
  /**
   * Where to keep the round in progress, so a page refresh returns to the same question.
   * Leave out to keep nothing.
   */
  storageKey?: string;
}

const QUESTIONS_PER_SESSION = 10;
/** How many times a repeat is redrawn before giving up (small topics may run out of new questions). */
const MAX_REDRAWS = 40;

const PRIMARY_PRAISES = [
  'Awesome!',
  'Correct!',
  'Great!',
  'Bravo!',
  'Brilliant!',
  'Nice!',
  'Wow!',
] as const;

const EARLY_PRAISES = ['Yay!', 'Clever!', 'Woohoo!', 'Amazing!', 'Super!', 'Hooray!'] as const;

/**
 * How big an answer's text may be, by its length, so long words and phrases always fit
 * inside the button instead of spilling out of it.
 */
export function answerSize(label: string): string {
  const n = label.length;
  if (n > 24) return 'op-xl';
  if (n > 14) return 'op-long';
  if (n > 8) return 'op-md';
  return '';
}

/** The sentence read out loud for a question (kept short for little listeners). */
function speechFor(q: GeneratedQuestion): string {
  if (q.highlightText && q.highlightColor) return `Tap ${q.highlightText}!`;
  return [q.subPrompt, q.prompt].filter(Boolean).join('. ');
}

export const TopicRunner: React.FC<TopicRunnerProps> = ({
  profile,
  topicId,
  onUpdateProfile,
  onExitToMap,
  onPlayTopic,
  daily,
  requireParentPin,
  storageKey,
}) => {
  // Set once the daily challenge has been passed in this round, so the end screen can say so.
  const [dailyBonus, setDailyBonus] = useState(0);
  // Kiyu, the companion, cheers on streaks and at the end of a round.
  const { react: companion } = useCompanion();
  const profileRef = useRef(profile);
  profileRef.current = profile;
  // A round saved before a page refresh. The parent step is asked again, not skipped.
  const [restored] = useState(() => (storageKey ? loadRound(storageKey, topicId) : null));
  const [questionIndex, setQuestionIndex] = useState(restored?.questionIndex ?? 1);
  const [sessionCorrect, setSessionCorrect] = useState(restored?.sessionCorrect ?? 0);
  const [finished, setFinished] = useState(false);
  // Questions already asked in this round, so the same one never comes twice.
  const askedRef = useRef<string[]>(restored?.asked ?? []);
  // Where the child stood when this round began, so the end screen can say "Level cleared!"
  const levelAtStart = useRef(levelStatus(pathwayOf(profile), profile.topics));
  const isChallenge = topicId === CHALLENGE_ID;
  // A challenge mixes questions from every topic the child has cleared.
  const poolRef = useRef(isChallenge ? challengePool(pathwayOf(profile), profile.topics) : []);
  const draw = useCallback(
    () => generateQuestionForTopic(isChallenge ? pick(poolRef.current) : topicId),
    [isChallenge, topicId],
  );
  const freshQuestion = useCallback((): GeneratedQuestion => {
    let q = draw();
    for (let i = 0; i < MAX_REDRAWS && askedRef.current.includes(questionKey(q)); i++) {
      q = draw();
    }
    askedRef.current = [...askedRef.current, questionKey(q)];
    return q;
  }, [draw]);
  const [question, setQuestion] = useState<GeneratedQuestion>(() => restored?.question ?? freshQuestion());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [optionState, setOptionState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const wasBlocked = restored !== null && restored.helpStage !== 'none';
  const [feedbackMsg, setFeedbackMsg] = useState<string>(
    wasBlocked ? 'You used all your tries. Please ask a parent to help!' : '',
  );
  const [locked, setLocked] = useState(wasBlocked);
  // Wrong answers given to the current question. When a parent has set a limit and the
  // tries run out, the question is blocked until a parent helps (stage 'blocked', then 'parent').
  const [wrongTries, setWrongTries] = useState(restored?.wrongTries ?? 0);
  // True once this question has had a wrong answer. Only questions answered right on the
  // first try score, so a score of 7 means 7 questions known, not 7 questions reached.
  const [missed, setMissed] = useState(restored?.missed ?? false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [helpStage, setHelpStage] = useState<'none' | 'blocked' | 'parent'>(
    wasBlocked ? 'blocked' : 'none',
  );

  // Keep the round up to date, so a refresh returns to the same question. Once a question
  // has been answered right, the saved round moves on to the next one (never the same
  // question again), and a finished round is forgotten.
  useEffect(() => {
    if (!storageKey) return;
    if (finished || (optionState === 'correct' && questionIndex >= QUESTIONS_PER_SESSION)) {
      clearRound(storageKey, topicId);
      return;
    }
    if (optionState === 'correct') {
      saveRound(storageKey, {
        topicId,
        questionIndex: questionIndex + 1,
        sessionCorrect,
        question: null,
        wrongTries: 0,
        helpStage: 'none',
        missed: false,
        asked: askedRef.current,
      });
      return;
    }
    saveRound(storageKey, {
      topicId,
      questionIndex,
      sessionCorrect,
      question,
      wrongTries,
      helpStage,
      missed,
      asked: askedRef.current,
    });
  }, [storageKey, topicId, finished, optionState, questionIndex, sessionCorrect, question, wrongTries, helpStage, missed]);

  const questionRef = useRef<HTMLDivElement>(null);
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
  const isEarly = pathwayOf(profile) === 'early';

  const startRound = useCallback(() => {
    initAudio();
    sfx.start();
    setQuestionIndex(1);
    setSessionCorrect(0);
    setFinished(false);
    setSelectedOption(null);
    setOptionState('idle');
    setFeedbackMsg('');
    setLocked(false);
    setWrongTries(0);
    setMissed(false);
    setRevealed(null);
    setHelpStage('none');
    askedRef.current = [];
    setQuestion(freshQuestion());
  }, [freshQuestion]);

  // Finishing a round always gets a fanfare; a near-perfect round also gets the trophy.
  useEffect(() => {
    if (!finished) return;
    if (sessionCorrect >= 9) {
      showTrophy();
      sfx.trophy();
      confettiBlast();
      confettiBlast();
      balloonRise(14);
    } else {
      sfx.fanfare();
      if (sessionCorrect >= 6) confettiBlast();
      balloonRise(sessionCorrect >= 6 ? 8 : 4);
    }
    // Kiyu celebrates too: the biggest thing that happened gets the words.
    const p = profileRef.current;
    const before = levelAtStart.current;
    const now = levelStatus(pathwayOf(p), p.topics);
    const levelUp = now.allCleared ? !before.allCleared : now.current > before.current;
    const ctx = { name: p.nickname };
    if (dailyBonus > 0) companion('daily-done', { ctx });
    else if (levelUp && !isChallenge) companion('level-up', { ctx });
    else companion(sessionCorrect >= 9 ? 'finish-great' : 'finish-ok', { ctx });
  }, [finished, sessionCorrect, dailyBonus, isChallenge, companion]);

  // The background music gets quieter during a round, so it never competes with thinking.
  useEffect(() => {
    setMusicScene('play');
    return () => setMusicScene('home');
  }, []);

  // The voice speaks only when the child presses "Listen". A new question, or leaving
  // the round, stops whatever is being read.
  useEffect(() => {
    return () => stopSpeaking();
  }, [question, finished]);

  // Keyboard and screen-reader users land on each new question.
  useEffect(() => {
    if (questionIndex > 1 && !finished) questionRef.current?.focus();
  }, [questionIndex, finished]);

  const advanceOrFinish = (latestProfile: KidProfile, nextSessionCorrect: number) => {
    if (questionIndex >= QUESTIONS_PER_SESSION) {
      let finalProfile = latestProfile;
      // Passing today's daily challenge earns bonus stars, once a day.
      if (daily && nextSessionCorrect >= PASS_MARK) {
        finalProfile = { ...latestProfile, stars: latestProfile.stars + daily.bonus };
        setDailyBonus(daily.bonus);
        daily.onComplete();
      }
      setFinished(true);
      onUpdateProfile(finalProfile, true); // Immediate cloud sync when a round finishes
      return;
    }
    setQuestionIndex((q) => q + 1);
    setSelectedOption(null);
    setOptionState('idle');
    setFeedbackMsg('');
    setLocked(false);
    setWrongTries(0);
    setMissed(false);
    setRevealed(null);
    setHelpStage('none');
    setQuestion(freshQuestion());
    void nextSessionCorrect;
  };

  const handleOptionClick = (
    evt: React.MouseEvent<HTMLButtonElement>,
    optionValue: string,
  ) => {
    if (locked) return;
    initAudio();
    const isCorrect = optionValue === question.correctValue;
    setSelectedOption(optionValue);

    const rect = evt.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const existingTopic = profile.topics[topicId] ?? { p: 0, c: 0, b: 0, m: false };

    if (isCorrect) {
      setLocked(true);
      setOptionState('correct');
      const earnedStars = starsPerCorrectForTrack(profile.track);
      const nextStars = profile.stars + earnedStars;
      const nextStreak = profile.streak + 1;
      const nextBestStreak = Math.max(profile.bestStreak, nextStreak);
      const nextTotalCorrect = profile.totalCorrect + 1;
      // Right on the first try scores a point. Right after a mistake still moves on, and still
      // earns stars, but does not count toward clearing the topic.
      const firstTry = !missed;
      const nextSessionCorrect = sessionCorrect + (firstTry ? 1 : 0);
      setSessionCorrect(nextSessionCorrect);

      // A challenge earns stars and streaks but never changes a topic's best score.
      const nextTopicBest = Math.max(existingTopic.b, nextSessionCorrect);
      const nextTopics = isChallenge
        ? profile.topics
        : {
            ...profile.topics,
            [topicId]: {
              p: existingTopic.p + 1,
              c: existingTopic.c + 1,
              b: nextTopicBest,
              m: nextTopicBest >= 10 || existingTopic.m,
            },
          };

      const oldEarnedIds = new Set(
        evaluateEarnedBadgeIds({
          stars: profile.stars,
          bestStreak: profile.bestStreak,
          topics: profile.topics,
        }),
      );
      const allEarnedIds = evaluateEarnedBadgeIds({
        stars: nextStars,
        bestStreak: nextBestStreak,
        topics: nextTopics,
      });
      const newlyUnlockedBadge = BADGES.find(
        (b) => allEarnedIds.includes(b.id) && !oldEarnedIds.has(b.id),
      );

      const badgeUnion = [...new Set([...profile.badges, ...allEarnedIds])];
      const updatedProfile: KidProfile = {
        ...profile,
        stars: nextStars,
        streak: nextStreak,
        bestStreak: nextBestStreak,
        totalCorrect: nextTotalCorrect,
        topics: nextTopics,
        badges: badgeUnion,
      };

      onUpdateProfile(updatedProfile, false);
      starBurst(cx, cy);
      floatEmoji(cx, cy, `+${earnedStars}⭐`);

      if (nextStreak >= 5) sfx.streak();
      else if (nextStreak >= 3) sfx.mega();
      else sfx.correct();
      // A long run of right answers gets Kiyu running across the screen.
      if (nextStreak === 3) companion('streak3', { ctx: { name: profile.nickname } });
      else if (nextStreak === 5) companion('streak5', { ctx: { name: profile.nickname } });
      else if (nextStreak === 10) companion('streak10', { ctx: { name: profile.nickname } });
      setTimeout(() => sfx.star(), 320);

      if (nextStars % 25 === 0) {
        confettiBlast();
        confettiBlast();
      } else if (nextStreak >= 3 && nextStreak % 3 === 0) {
        confettiBlast();
      }

      // A correct answer after a mistake still gets kind words, but not the cheer for first time.
      const praise = firstTry ? pick(isEarly ? EARLY_PRAISES : PRIMARY_PRAISES) : 'You got it!';
      if (newlyUnlockedBadge) {
        setTimeout(() => {
          showTrophy();
          sfx.trophy();
          confettiBlast();
          setFeedbackMsg(`New badge: ${newlyUnlockedBadge.emoji} ${newlyUnlockedBadge.name}!`);
        }, 250);
      } else {
        setFeedbackMsg(
          `${praise}${nextStreak >= 3 ? ` ${nextStreak} in a row!` : ''} You earned ${earnedStars} ${
            earnedStars === 1 ? 'star' : 'stars'
          }.`,
        );
      }

      setTimeout(() => {
        advanceOrFinish(updatedProfile, nextSessionCorrect);
      }, 1250);
    } else {
      setOptionState('wrong');
      const updatedProfile: KidProfile = {
        ...profile,
        streak: 0,
        totalWrong: profile.totalWrong + 1,
        topics: isChallenge
          ? profile.topics
          : {
              ...profile.topics,
              [topicId]: {
                ...existingTopic,
                p: existingTopic.p + 1,
              },
            },
      };
      onUpdateProfile(updatedProfile, false);
      sfx.wrong();

      // A parent can limit the tries per question. When they run out, the question is
      // blocked and the child is sent to a parent, who sees the answer and helps.
      const maxTries = profile.maxTries ?? 0;
      const triesUsed = wrongTries + 1;
      setWrongTries(triesUsed);
      setMissed(true);
      if (maxTries > 0 && triesUsed >= maxTries) {
        setLocked(true);
        setHelpStage('blocked');
        setFeedbackMsg('You used all your tries. Please ask a parent to help!');
        return;
      }
      const left = maxTries > 0 ? maxTries - triesUsed : 0;
      const leftText = left > 0 ? ` ${left} ${left === 1 ? 'try' : 'tries'} left.` : '';
      const chosen = question.options.find((o) => o.value === optionValue)?.label;
      setFeedbackMsg(
        (chosen && chosen.length <= 20
          ? `${chosen} is not right. Try again!`
          : isEarly
            ? 'Oopsie! Try again!'
            : 'Not quite. Try again!') + leftText,
      );
      // The message stays until the next answer, so it can be read at any pace.
      setTimeout(() => {
        setSelectedOption(null);
        setOptionState('idle');
      }, 900);
    }
  };

  const answerLabel =
    question.options.find((o) => o.value === question.correctValue)?.label ?? question.correctValue;
  // Words and phrases need wider buttons than numbers, so they get fewer, wider columns.
  // Every answer in a set uses the same text size, so a short one never looks shouting-large
  // beside a long one.
  const setSize = answerSize(
    question.options.reduce((longest, o) => (o.label.length > longest.length ? o.label : longest), ''),
  );
  const wideAnswers = question.options.some(
    (o) => !o.colorHex && !o.isLargeEmoji && o.label.length > 8,
  );

  const showParentHelp = () => {
    setHelpStage('parent');
    setRevealed(question.correctValue);
  };

  const retryWithHelp = () => {
    setHelpStage('none');
    setRevealed(null);
    setWrongTries(0);
    setLocked(false);
    setSelectedOption(null);
    setOptionState('idle');
    setFeedbackMsg('Try again. You can do it!');
  };

  // ------------------------------------------------------------ Finish screen
  if (finished) {
    const medal =
      sessionCorrect >= 9 ? '🏆' : sessionCorrect >= 7 ? '🥇' : sessionCorrect >= 5 ? '🥈' : '🥉';
    const message = isChallenge
      ? sessionCorrect >= CHALLENGE_WIN
        ? 'Challenge won! You are a champion.'
        : `Good try! Get ${CHALLENGE_WIN} or more right first time to win the challenge.`
      : sessionCorrect >= 9
        ? 'Mastered! Brilliant work.'
        : sessionCorrect >= PASS_MARK
          ? 'Topic cleared! Play again to score even higher.'
          : `Good try! Get ${PASS_MARK} or more right first time to clear this topic.`;
    const mood: MascotMood = sessionCorrect >= PASS_MARK ? 'cheer' : 'happy';
    const upNext = upNextTopics(pathwayOf(profile), profile.topics, topicId, 2).flatMap((id) => {
      for (const subject of CURRICULUM[pathwayOf(profile)].subjects) {
        const found = subject.topics.find((x) => x.id === id);
        if (found) return [{ id, name: found.name, emoji: subject.emoji, level: levelOf(pathwayOf(profile), id) }];
      }
      return [];
    });
    const before = levelAtStart.current;
    const now = levelStatus(pathwayOf(profile), profile.topics);
    const levelUp = now.allCleared
      ? !before.allCleared
        ? 'You cleared all 10 levels!'
        : null
      : now.current > before.current
        ? `Level ${before.current} cleared! Level ${now.current} is open.`
        : null;

    return (
      <div className="finish pop-in" style={{ ['--run-color' as string]: theme.hex }}>
        <Mascot mood={mood} size={140} className="finish-mascot" />
        <div className="finish-medal" aria-hidden="true">
          {medal}
        </div>
        <h1 className="finish-title">Great practice, {profile.nickname}!</h1>
        <div className="finish-score" aria-label={`${sessionCorrect} out of ${QUESTIONS_PER_SESSION} right first time`}>
          <span className="finish-num">{sessionCorrect}</span>
          <span className="finish-of">/ {QUESTIONS_PER_SESSION}</span>
        </div>
        <p className="finish-msg">{message}</p>
        {levelUp && (
          <p className="finish-level pop-in" role="status">
            <span aria-hidden="true">🎉</span> {levelUp}
          </p>
        )}
        {dailyBonus > 0 && (
          <p className="finish-daily pop-in" role="status">
            <span aria-hidden="true">🎁</span> Daily challenge done! +{dailyBonus} bonus stars
          </p>
        )}
        {onPlayTopic && upNext.length > 0 && (
          <section className="finish-next" aria-label="Next up">
            <h2>Next up</h2>
            <ul>
              {upNext.map((t) => (
                <li key={t.id}>
                  <button type="button" className="next-tile" data-silent onClick={() => onPlayTopic(t.id)}>
                    <span className="next-tile-emoji" aria-hidden="true">
                      <Pic emoji={t.emoji} />
                    </span>
                    <span className="next-tile-text">
                      <b>{t.name}</b>
                      <small>Level {t.level}</small>
                    </span>
                    <IconPlay size={24} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="finish-actions">
          <button type="button" className="primary-btn big" onClick={startRound} data-silent>
            <IconRefresh size={22} /> Play again
          </button>
          <button type="button" className="secondary-btn big" onClick={onExitToMap}>
            <IconBook size={22} /> Back to topics
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------- Game screen
  const mascotMood: MascotMood =
    optionState === 'correct' ? (profile.streak >= 3 ? 'excited' : 'cheer') : optionState === 'wrong' ? 'oops' : 'think';

  return (
    <div
      className={`game ${isEarly ? 'early-track' : ''}`}
      style={{
        ['--run-color' as string]: theme.hex,
        ['--run-accent' as string]: theme.accent,
        ['--run-bg' as string]: theme.bgLight,
      }}
    >
      <h1 className="sr-only">Practice round, question {questionIndex} of {QUESTIONS_PER_SESSION}</h1>
      <div className="game-top">
        <button
          type="button"
          className="back-topics"
          onClick={onExitToMap}
          aria-label="Back to topics"
        >
          <IconBack size={22} />
          <span aria-hidden="true">Topics</span>
        </button>
        <div className="game-pills">
          <div className="pill score-pill" role="img" aria-label={`${profile.stars} stars`}>
            <IconStar size={18} />
            <span key={profile.stars} className="bump">
              <CountUp value={profile.stars} />
            </span>
          </div>
          <div className="pill first-pill" role="img" aria-label={`${sessionCorrect} right first time so far`}>
            <IconCheck size={18} />
            <span key={sessionCorrect} className="bump">
              {sessionCorrect}
            </span>
          </div>
          <div
            className={`pill streak-pill${profile.streak >= 5 ? ' streak-5' : profile.streak >= 3 ? ' streak-3' : ''}`}
            role="img"
            aria-label={`${profile.streak} in a row`}
          >
            <IconFlame size={18} />
            <span key={profile.streak} className="bump">
              {profile.streak}
            </span>
          </div>
        </div>
      </div>

      <div
        className="progress-dots"
        role="progressbar"
        aria-label="Questions"
        aria-valuemin={1}
        aria-valuemax={QUESTIONS_PER_SESSION}
        aria-valuenow={questionIndex}
        aria-valuetext={`Question ${questionIndex} of ${QUESTIONS_PER_SESSION}`}
      >
        {Array.from({ length: QUESTIONS_PER_SESSION }, (_, i) => {
          const n = i + 1;
          const state = n < questionIndex ? 'done' : n === questionIndex ? 'current' : '';
          return <span key={n} className={`pdot ${state}`} />;
        })}
      </div>

      <div className="question-card" key={`${questionIndex}-${question.prompt}`}>
        <Mascot mood={mascotMood} size={isEarly ? 96 : 76} className="game-mascot" />

        {question.subPrompt && (
          <div className="q-sub">
            <PicText text={question.subPrompt} />
          </div>
        )}

        <div
          className="q"
          ref={questionRef}
          tabIndex={-1}
          style={question.topicId.startsWith('y-spell') ? { letterSpacing: 6 } : undefined}
        >
          {question.highlightText && question.highlightColor ? (
            <>
              Tap <span style={{ color: question.highlightColor }}>{question.highlightText}</span>!
            </>
          ) : (
            <PicText text={question.prompt} />
          )}
        </div>

        {canSpeak() && (
          <button
            type="button"
            className="listen-btn"
            onClick={() => speak(speechFor(question))}
            aria-label="Read the question out loud"
            data-silent
          >
            <IconSpeaker size={22} /> Listen
          </button>
        )}

        {question.heroEmoji && (
          <div className="hero-emoji" role="img" aria-label={question.heroEmoji}>
            <Pic emoji={question.heroEmoji} />
          </div>
        )}

        {question.visualEmojis && (
          <div className="count-row" role="group" aria-label="Things to count">
            {question.visualEmojis.map((em, idx) => (
              <span key={idx} className="count-item" style={{ ['--i' as string]: idx }}>
                <Pic emoji={em} />
              </span>
            ))}
          </div>
        )}

        {question.hint && <div className="hint">Hint: {question.hint}</div>}
      </div>

      <div className={`ops${wideAnswers ? ' ops-wide' : question.options.length === 3 ? ' ops-three' : ''}`}>
        {question.options.map((opt, optIndex) => {
          const isSelected = selectedOption === opt.value;
          const stateCls =
            revealed === opt.value
              ? 'correct'
              : isSelected && optionState === 'correct'
                ? 'correct'
                : isSelected && optionState === 'wrong'
                  ? 'wrong'
                  : '';

          if (opt.colorHex) {
            return (
              <button
                key={opt.value}
                type="button"
                data-silent
                className={`color-btn ${stateCls}`}
                style={{ background: opt.colorHex, ['--i' as string]: optIndex }}
                onClick={(e) => handleOptionClick(e, opt.value)}
                aria-label={opt.label}
              />
            );
          }

          if (opt.isLargeEmoji) {
            return (
              <button
                key={opt.value}
                type="button"
                data-silent
                className={`kiki-obj-btn ${stateCls}`}
                style={{ ['--i' as string]: optIndex }}
                onClick={(e) => handleOptionClick(e, opt.value)}
              >
                <Pic emoji={opt.label} />
              </button>
            );
          }

          return (
            <button
              key={opt.value}
              type="button"
              data-silent
              className={`op ${setSize} ${stateCls}`}
              style={{ ['--i' as string]: optIndex }}
              onClick={(e) => handleOptionClick(e, opt.value)}
            >
              <PicText text={opt.label} />
            </button>
          );
        })}
      </div>

      {helpStage !== 'none' && (
        <div className="ask-parent" role="region" aria-label="Ask a parent">
          {helpStage === 'blocked' ? (
            <>
              <p>You used all your tries. Please ask a parent to help you.</p>
              <button
                type="button"
                className="primary-btn big"
                autoFocus
                onClick={() => (requireParentPin ? requireParentPin(showParentHelp) : showParentHelp())}
              >
                Parent help
              </button>
            </>
          ) : (
            <>
              <p>
                Parent: the answer is <strong>{answerLabel}</strong>. Please help {profile.nickname}{' '}
                understand it, then let them try again.
              </p>
              <button type="button" className="primary-btn big" autoFocus onClick={retryWithHelp}>
                Let {profile.nickname} try again
              </button>
            </>
          )}
        </div>
      )}

      <div
        className={`msg ${optionState === 'wrong' ? 'wrong-msg' : ''} ${optionState === 'correct' ? 'right-msg' : ''}`}
        role="status"
        aria-live="polite"
      >
        {feedbackMsg}
      </div>
    </div>
  );
};
