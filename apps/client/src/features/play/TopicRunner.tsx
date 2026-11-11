import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BADGES,
  evaluateEarnedBadgeIds,
  generateQuestionForTopic,
  pick,
  type GeneratedQuestion,
} from '@kiyuv/content';
import {
  FAV_COLOR_THEMES,
  starsPerCorrectForTrack,
  type KidProfile,
} from '@kiyuv/shared';
import { confettiBlast, floatEmoji, showTrophy, starBurst } from '../../lib/effects.js';
import { canSpeak, initAudio, setMusicScene, sfx, speak, stopSpeaking } from '../../lib/sound.js';
import { Mascot, type MascotMood } from '../../ui/Mascot.js';
import { IconBack, IconFlame, IconRefresh, IconSpeaker, IconStar, IconBook } from '../../ui/Icons.js';

interface TopicRunnerProps {
  profile: KidProfile;
  topicId: string;
  onUpdateProfile: (next: KidProfile, flushImmediately: boolean) => void;
  onExitToMap: () => void;
}

const QUESTIONS_PER_SESSION = 10;

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
}) => {
  const [questionIndex, setQuestionIndex] = useState(1);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [question, setQuestion] = useState<GeneratedQuestion>(() =>
    generateQuestionForTopic(topicId),
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [optionState, setOptionState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [locked, setLocked] = useState(false);
  // Wrong answers given to the current question, and the answer shown when tries run out.
  const [wrongTries, setWrongTries] = useState(0);
  const [revealed, setRevealed] = useState<string | null>(null);

  const questionRef = useRef<HTMLDivElement>(null);
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
  const isEarly = profile.track === 'early';

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
    setRevealed(null);
    setQuestion(generateQuestionForTopic(topicId));
  }, [topicId]);

  // Finishing a round always gets a fanfare; a near-perfect round also gets the trophy.
  useEffect(() => {
    if (!finished) return;
    if (sessionCorrect >= 9) {
      showTrophy();
      sfx.trophy();
      confettiBlast();
      confettiBlast();
    } else {
      sfx.fanfare();
      if (sessionCorrect >= 6) confettiBlast();
    }
  }, [finished, sessionCorrect]);

  // The background music gets quieter during a round, so it never competes with thinking.
  useEffect(() => {
    setMusicScene('play');
    return () => setMusicScene('home');
  }, []);

  // The youngest learners cannot read yet, so their questions are read aloud.
  useEffect(() => {
    if (finished || !isEarly) return;
    speak(speechFor(question));
    return () => stopSpeaking();
  }, [question, finished, isEarly]);

  // Keyboard and screen-reader users land on each new question.
  useEffect(() => {
    if (questionIndex > 1 && !finished) questionRef.current?.focus();
  }, [questionIndex, finished]);

  const advanceOrFinish = (latestProfile: KidProfile, nextSessionCorrect: number) => {
    if (questionIndex >= QUESTIONS_PER_SESSION) {
      setFinished(true);
      onUpdateProfile(latestProfile, true); // Immediate cloud sync when a round finishes
      return;
    }
    setQuestionIndex((q) => q + 1);
    setSelectedOption(null);
    setOptionState('idle');
    setFeedbackMsg('');
    setLocked(false);
    setWrongTries(0);
    setRevealed(null);
    setQuestion(generateQuestionForTopic(topicId));
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
      const nextSessionCorrect = sessionCorrect + 1;
      setSessionCorrect(nextSessionCorrect);

      const nextTopicBest = Math.max(existingTopic.b, nextSessionCorrect);
      const nextTopics = {
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
      setTimeout(() => sfx.star(), 320);

      if (nextStars % 25 === 0) {
        confettiBlast();
        confettiBlast();
      } else if (nextStreak >= 3 && nextStreak % 3 === 0) {
        confettiBlast();
      }

      const praise = pick(isEarly ? EARLY_PRAISES : PRIMARY_PRAISES);
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
        if (isEarly) speak(praise);
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
        topics: {
          ...profile.topics,
          [topicId]: {
            ...existingTopic,
            p: existingTopic.p + 1,
          },
        },
      };
      onUpdateProfile(updatedProfile, false);
      sfx.wrong();

      // A parent can limit the tries per question. When they run out, the answer is
      // shown (no stars) and the round moves on.
      const maxTries = profile.maxTries ?? 0;
      const triesUsed = wrongTries + 1;
      setWrongTries(triesUsed);
      if (maxTries > 0 && triesUsed >= maxTries) {
        const answer =
          question.options.find((o) => o.value === question.correctValue)?.label ?? question.correctValue;
        setLocked(true);
        setRevealed(question.correctValue);
        setFeedbackMsg(`The answer was ${answer}. On to the next one!`);
        if (isEarly) speak('Let us try the next one!');
        setTimeout(() => advanceOrFinish(updatedProfile, sessionCorrect), 2200);
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
      if (isEarly) speak('Try again!');
      // The message stays until the next answer, so it can be read at any pace.
      setTimeout(() => {
        setSelectedOption(null);
        setOptionState('idle');
      }, 900);
    }
  };

  // ------------------------------------------------------------ Finish screen
  if (finished) {
    const medal =
      sessionCorrect >= 9 ? '🏆' : sessionCorrect >= 7 ? '🥇' : sessionCorrect >= 5 ? '🥈' : '🥉';
    const message =
      sessionCorrect >= 9
        ? 'Mastered! You are ready for the next level.'
        : sessionCorrect >= 7
          ? 'Great work! One more round to master it.'
          : 'Good try! Practice makes perfect.';
    const mood: MascotMood = sessionCorrect >= 7 ? 'cheer' : 'happy';

    return (
      <div className="finish pop-in" style={{ ['--run-color' as string]: theme.hex }}>
        <Mascot mood={mood} size={140} className="finish-mascot" />
        <div className="finish-medal" aria-hidden="true">
          {medal}
        </div>
        <h1 className="finish-title">Great practice, {profile.nickname}!</h1>
        <div className="finish-score" aria-label={`${sessionCorrect} out of ${QUESTIONS_PER_SESSION}`}>
          <span className="finish-num">{sessionCorrect}</span>
          <span className="finish-of">/ {QUESTIONS_PER_SESSION}</span>
        </div>
        <p className="finish-msg">{message}</p>
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
    optionState === 'correct' ? 'cheer' : optionState === 'wrong' ? 'oops' : 'think';

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
          className="icon-btn"
          onClick={onExitToMap}
          aria-label="Back to topics"
        >
          <IconBack />
        </button>
        <div className="game-pills">
          <div className="pill score-pill" role="img" aria-label={`${profile.stars} stars`}>
            <IconStar size={18} />
            <span key={profile.stars} className="bump">
              {profile.stars}
            </span>
          </div>
          <div className="pill streak-pill" role="img" aria-label={`${profile.streak} in a row`}>
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

        {question.subPrompt && <div className="q-sub">{question.subPrompt}</div>}

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
            question.prompt
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
            {question.heroEmoji}
          </div>
        )}

        {question.visualEmojis && (
          <div className="count-row" role="group" aria-label="Things to count">
            {question.visualEmojis.map((em, idx) => (
              <span key={idx} className="count-item" style={{ ['--i' as string]: idx }}>
                {em}
              </span>
            ))}
          </div>
        )}

        {question.hint && <div className="hint">Hint: {question.hint}</div>}
      </div>

      <div className="ops">
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
                {opt.label}
              </button>
            );
          }

          return (
            <button
              key={opt.value}
              type="button"
              data-silent
              className={`op ${stateCls}`}
              style={{ ['--i' as string]: optIndex }}
              onClick={(e) => handleOptionClick(e, opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

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
