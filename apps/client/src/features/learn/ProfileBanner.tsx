import React from 'react';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';
import { LEVEL_COUNT, levelStatus, pathwayOf } from '@kiyuv/content';
import { Pic } from '../../ui/Pic.js';
import { IconFlame, IconTrophy } from '../../ui/Icons.js';
import { themeOfLevel } from './levelThemes.js';
import { rankOf } from './rank.js';

interface ProfileBannerProps {
  profile: KidProfile;
  /** Days in a row the child has learned. */
  days: number;
}

/**
 * Who is learning and how far they have come: name, rank, day streak, topics mastered,
 * and a bar that fills as stars are earned toward the next rank.
 */
export const ProfileBanner: React.FC<ProfileBannerProps> = ({ profile, days }) => {
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
  const rank = rankOf(profile.stars);
  const status = levelStatus(pathwayOf(profile), profile.topics);
  const mastered = Object.values(profile.topics).filter((t) => t.b >= 10 || t.m).length;
  const where =
    pathwayOf(profile) === 'tots'
      ? 'Play time'
      : status.allCleared
        ? `All ${LEVEL_COUNT} levels cleared`
        : `Level ${status.current} of ${LEVEL_COUNT} · ${themeOfLevel(status.current).name}`;
  const barText = rank.maxed
    ? `${profile.stars} stars. You reached the top rank`
    : `${rank.into} of ${rank.need} stars toward ${rank.next}`;

  return (
    <section
      className="pbanner"
      aria-label="Your profile"
      style={{ ['--tone' as string]: theme.hex, ['--tone2' as string]: theme.accent }}
    >
      <div className="pb-top">
        <span className="pb-avatar" aria-hidden="true">
          <Pic emoji={profile.avatar} />
        </span>
        <div className="pb-name">
          <h1>{profile.nickname}</h1>
          <p>
            Age {profile.age} · {where}
          </p>
        </div>
      </div>

      <ul className="pb-chips" aria-label="Your progress">
        <li className="pb-chip">
          <span aria-hidden="true">
            <Pic emoji={rank.emoji} />
          </span>
          <b>{rank.name}</b>
        </li>
        <li className="pb-chip">
          <IconFlame size={18} />
          <b>{days}</b> {days === 1 ? 'day' : 'days'}
        </li>
        <li className="pb-chip">
          <IconTrophy size={18} />
          <b>{mastered}</b> mastered
        </li>
      </ul>

      <div className="pb-xp">
        <div className="pb-xp-label" aria-hidden="true">
          <span>{rank.maxed ? 'Top rank!' : `Next rank: ${rank.next}`}</span>
          <span>{rank.maxed ? `${profile.stars} ⭐` : `${rank.into}/${rank.need} ⭐`}</span>
        </div>
        <div
          className="pb-xp-bar"
          role="progressbar"
          aria-label="Stars toward the next rank"
          aria-valuemin={0}
          aria-valuemax={rank.maxed ? 1 : rank.need}
          aria-valuenow={rank.maxed ? 1 : rank.into}
          aria-valuetext={barText}
        >
          <span style={{ width: `${rank.pct}%` }} />
        </div>
      </div>
    </section>
  );
};
