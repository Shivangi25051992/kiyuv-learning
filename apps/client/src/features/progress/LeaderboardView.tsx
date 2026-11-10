import React from 'react';
import { BADGES, evaluateEarnedBadgeIds } from '@kiyuv/content';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';

interface LeaderboardViewProps {
  profiles: readonly KidProfile[];
  onOpenParentReset: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  profiles,
  onOpenParentReset,
}) => {
  const ranked = [...profiles].sort((a, b) => b.stars - a.stars);
  const topStars = ranked[0]?.stars ?? 0;

  return (
    <div className="leader">
      <h2>🏆 Family Leaderboard</h2>

      {ranked.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>
          No learner profiles created yet.
        </p>
      ) : (
        <div className="leaderboard-cards">
          {ranked.map((profile, idx) => {
            const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
            const totalQ = profile.totalCorrect + profile.totalWrong;
            const accuracy = totalQ > 0 ? Math.round((profile.totalCorrect / totalQ) * 100) : 0;
            const mastered = Object.values(profile.topics).filter(
              (t) => t.b >= 10 || t.m,
            ).length;
            const isLeader = topStars > 0 && profile.stars === topStars;

            return (
              <div
                key={profile.kidId}
                className="leader-profile-card"
                style={{
                  borderColor: theme.accent,
                  background: theme.bgLight,
                }}
              >
                <div className="leader-rank">
                  {isLeader ? '👑' : `#${idx + 1}`}
                </div>
                <div className="leader-avatar">{profile.avatar}</div>
                <div className="leader-name" style={{ color: theme.hex }}>
                  {profile.nickname}
                </div>
                <div className="leader-band">
                  Ages {profile.ageBand} ·{' '}
                  {profile.track === 'early' ? 'Early Years' : 'Primary'}
                </div>

                <div className="leader-metrics">
                  <div>
                    <div className="lm-val" style={{ color: theme.hex }}>
                      ⭐ {profile.stars}
                    </div>
                    <div className="lm-lab">Stars</div>
                  </div>
                  <div>
                    <div className="lm-val">🏅 {profile.bestStreak}</div>
                    <div className="lm-lab">Best Streak</div>
                  </div>
                  <div>
                    <div className="lm-val">✅ {profile.totalCorrect}</div>
                    <div className="lm-lab">Correct</div>
                  </div>
                  <div>
                    <div className="lm-val">🎯 {accuracy}%</div>
                    <div className="lm-lab">Accuracy</div>
                  </div>
                  <div>
                    <div className="lm-val">🏆 {mastered}</div>
                    <div className="lm-lab">Mastered</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {profiles.map((profile) => {
        const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
        const earnedSet = new Set(
          evaluateEarnedBadgeIds({
            stars: profile.stars,
            bestStreak: profile.bestStreak,
            topics: profile.topics,
          }),
        );
        return (
          <div key={profile.kidId} style={{ marginTop: 26 }}>
            <h3 style={{ margin: '0 0 10px', color: theme.hex, textAlign: 'center' }}>
              {profile.avatar} {profile.nickname}&apos;s Badges ({earnedSet.size}/{BADGES.length})
            </h3>
            <div className="badges">
              {BADGES.map((b) => {
                const unlocked = earnedSet.has(b.id) || profile.badges.includes(b.id);
                return (
                  <div key={b.id} className={`badge ${unlocked ? '' : 'locked'}`}>
                    {b.emoji} {b.name}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <button
          type="button"
          className="danger-outline-btn"
          onClick={onOpenParentReset}
        >
          🔒 Parent Area & Progress Reset
        </button>
      </div>
    </div>
  );
};
