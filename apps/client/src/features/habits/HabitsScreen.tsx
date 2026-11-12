import React from 'react';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';
import { Pic } from '../../ui/Pic.js';
import { IconBack } from '../../ui/Icons.js';
import { GrowPlay, PlatePlay, RecyclePlay, RoadPlay, WashPlay, type HabitProps } from './activities.js';
import { BreathePlay, DigestPlay, HeartPlay, KindPlay, OnlinePlay, ScreenPlay, WaterPlay } from './activities2.js';
import { HABITS_PAGE_ID, HABIT_ACTIVITIES, HABIT_GROUPS } from './habits.js';
import '../toddler/toddler.css';
import '../toddler/toddler2.css';
import './habits.css';

const VIEWS: Record<string, React.FC<HabitProps>> = {
  'habit-wash': WashPlay,
  'habit-plate': PlatePlay,
  'habit-road': RoadPlay,
  'habit-recycle': RecyclePlay,
  'habit-grow': GrowPlay,
  'habit-breathe': BreathePlay,
  'habit-kind': KindPlay,
  'habit-online': OnlinePlay,
  'habit-screen': ScreenPlay,
  'habit-water': WaterPlay,
  'habit-digest': DigestPlay,
  'habit-heart': HeartPlay,
};

interface HabitsScreenProps {
  /** The habits page (HABITS_PAGE_ID) or one activity. */
  id: string;
  profile: KidProfile;
  onOpen: (id: string) => void;
  onClose: () => void;
}

/** Good habits and how things grow: short, hands-on activities, each teaching one real thing. */
export const HabitsScreen: React.FC<HabitsScreenProps> = ({ id, profile, onOpen, onClose }) => {
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
  const isHub = id === HABITS_PAGE_ID;
  const activity = HABIT_ACTIVITIES.find((a) => a.id === id);
  const View = VIEWS[id];

  return (
    <div className="play-shell habits-shell" style={{ ['--run-color' as string]: theme.hex }}>
      <div className="play-top">
        <button
          type="button"
          className="back-topics"
          onClick={() => (isHub ? onClose() : onOpen(HABITS_PAGE_ID))}
          aria-label={isHub ? 'Back to the learn page' : 'Back to good habits'}
        >
          <IconBack size={22} />
          <span aria-hidden="true">Back</span>
        </button>
      </div>
      <h1 className="play-title">{isHub ? 'Good habits' : (activity?.name ?? 'Good habits')}</h1>

      {isHub ? (
        <>
          <p className="play-intro">Learn healthy habits and how things grow. Tap, try and find out!</p>
          {HABIT_GROUPS.map((group) => (
            <section key={group} className="play-group" aria-label={group}>
              <h2 className="play-group-title">{group}</h2>
              <ul className="play-hub">
                {HABIT_ACTIVITIES.filter((a) => a.group === group).map((a) => (
                  <li key={a.id}>
                    <button type="button" className="play-tile" data-silent onClick={() => onOpen(a.id)}>
                      <span className="play-tile-emoji" aria-hidden="true">
                        <Pic emoji={a.emoji} />
                      </span>
                      <span className="play-tile-name">{a.name}</span>
                      <span className="play-tile-blurb">{a.blurb}</span>
                      <span className="habit-ages">{a.ages}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : View ? (
        <div className="play-stage">
          <View name={profile.nickname} />
        </div>
      ) : null}
    </div>
  );
};
