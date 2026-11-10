import React, { useCallback, useEffect, useState } from 'react';
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
import { initAudio, sfx } from '../../lib/sound.js';

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

  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;

  const startRound = useCallback(() => {
    initAudio();
    setQuestionIndex(1);
    setSessionCorrect(0);
    setFinished(false);
    setSelectedOption(null);
    setOptionState('idle');
    setFeedbackMsg('');
    setLocked(false);
    setQuestion(generateQuestionForTopic(topicId));
  }, [topicId]);

  useEffect(() => {
    if (finished && sessionCorrect >= 9) {
      showTrophy();
      sfx.trophy();
      confettiBlast();
      confettiBlast();
    }
  }, [finished, sessionCorrect]);

  const advanceOrFinish = (latestProfile: KidProfile, nextSessionCorrect: number) => {
    if (questionIndex >= QUESTIONS_PER_SESSION) {
      setFinished(true);
      onUpdateProfile(latestProfile, true); // Immediate cloud sync on finishTopic()
      return;
    }
    setQuestionIndex((q) => q + 1);
    setSelectedOption(null);
    setOptionState('idle');
    setFeedbackMsg('');
    setLocked(false);
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

      if (nextStars % 25 === 0) {
        confettiBlast();
        confettiBlast();
      } else if (nextStreak >= 3 && nextStreak % 3 === 0) {
        confettiBlast();
      }

      if (newlyUnlockedBadge) {
        setTimeout(() => {
          showTrophy();
          sfx.trophy();
          confettiBlast();
          setFeedbackMsg(`🏅 New Badge: ${newlyUnlockedBadge.emoji} ${newlyUnlockedBadge.name}!`);
        }, 250);
      } else {
        const praisePool = profile.track === 'early' ? EARLY_PRAISES : PRIMARY_PRAISES;
        setFeedbackMsg(
          `🎉 ${pick(praisePool)}${nextStreak >= 3 ? ` (${nextStreak}🔥)` : ''}`,
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
      setFeedbackMsg(profile.track === 'early' ? '💫 Oopsie!' : '🤔 Try again!');
      setTimeout(() => {
        setSelectedOption(null);
        setOptionState('idle');
        setFeedbackMsg('');
      }, 900);
    }
  };

  if (finished) {
    const medal =
      sessionCorrect >= 9 ? '🏆' : sessionCorrect >= 7 ? '🥇' : sessionCorrect >= 5 ? '🥈' : '🥉';
    const message =
      sessionCorrect >= 9
        ? "Mastered! You're ready for the next level 🚀"
        : sessionCorrect >= 7
          ? 'Excellent work — one more round for mastery!'
          : 'Try again — practice makes perfect!';

    return (
      <div className="game">
        <button
          type="button"
          className="back-btn"
          onClick={onExitToMap}
          aria-label="Back to Curriculum"
        >
          ←
        </button>
        <div style={{ fontSize: 64 }}>{medal}</div>
        <div className="q">Great practice, {profile.nickname}!</div>
        <div style={{ fontSize: 48, color: 'var(--gold)', fontWeight: 700 }}>
          {sessionCorrect} / {QUESTIONS_PER_SESSION}
        </div>
        <div className="hint" style={{ marginTop: 16 }}>
          {message}
        </div>
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            className="op"
            style={{ minWidth: 140, borderColor: theme.accent, color: theme.hex }}
            onClick={startRound}
          >
            🔄 Play Again
          </button>
          <button
            type="button"
            className="op"
            style={{
              minWidth: 140,
              background: '#f0f0f0',
              borderColor: '#ccc',
              color: '#555',
            }}
            onClick={onExitToMap}
          >
            📚 Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`game ${profile.track === 'early' ? 'early-track' : ''}`}>
      <div className="bar">
        <button
          type="button"
          className="back-btn"
          style={{ position: 'static' }}
          onClick={onExitToMap}
          aria-label="Back to Curriculum"
        >
          ←
        </button>
        <div className="level-pill" style={{ color: theme.hex }}>
          Q {questionIndex}/{QUESTIONS_PER_SESSION}
        </div>
        <div className="score-pill">⭐ {profile.stars}</div>
        <div className="streak-pill">🔥 {profile.streak}</div>
      </div>

      <div className="progress-bar">
        <div
          style={{
            width: `${((questionIndex - 1) / QUESTIONS_PER_SESSION) * 100}%`,
            background: `linear-gradient(90deg, var(--green), ${theme.accent})`,
          }}
        />
      </div>

      {question.subPrompt && (
        <div className="q small" style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 4 }}>
          {question.subPrompt}
        </div>
      )}

      <div
        className="q"
        style={
          question.topicId.startsWith('y-spell') ? { letterSpacing: 6 } : undefined
        }
      >
        {question.highlightText && question.highlightColor ? (
          <>
            Tap <span style={{ color: question.highlightColor }}>{question.highlightText}</span>! 🎨
          </>
        ) : (
          question.prompt
        )}
      </div>

      {question.heroEmoji && <div style={{ fontSize: 80, marginBottom: 12 }}>{question.heroEmoji}</div>}

      {question.visualEmojis && (
        <div style={{ margin: '10px 0 18px' }}>
          {question.visualEmojis.map((em, idx) => (
            <span key={idx} className="count-item">
              {em}
            </span>
          ))}
        </div>
      )}

      {question.hint && <div className="hint">💡 {question.hint}</div>}

      <div className="ops">
        {question.options.map((opt) => {
          const isSelected = selectedOption === opt.value;
          const stateCls =
            isSelected && optionState === 'correct'
              ? 'correct'
              : isSelected && optionState === 'wrong'
                ? 'wrong'
                : '';

          if (opt.colorHex) {
            return (
              <button
                key={opt.value}
                type="button"
                className={`color-btn ${stateCls}`}
                style={{ background: opt.colorHex }}
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
                className={`kiki-obj-btn ${stateCls}`}
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
              className={`op ${stateCls}`}
              style={{
                borderColor: theme.accent,
                color: theme.hex,
                background: theme.bgLight,
              }}
              onClick={(e) => handleOptionClick(e, opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className={`msg ${optionState === 'wrong' ? 'wrong-msg' : ''}`}>
        {feedbackMsg}
      </div>
    </div>
  );
};
