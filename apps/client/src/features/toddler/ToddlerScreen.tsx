import React from 'react';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';
import { Pic } from '../../ui/Pic.js';
import { IconBack } from '../../ui/Icons.js';
import { AnimalsPlay, BalloonsPlay, CountPlay, MusicPlay, ShapesPlay } from './activities.js';
import { PLAY_ACTIVITIES, PLAY_TIME_ID } from './playTime.js';
import './toddler.css';

const ACTIVITY_VIEWS: Record<string, React.FC> = {
  'play-animals': AnimalsPlay,
  'play-balloons': BalloonsPlay,
  'play-count': CountPlay,
  'play-shapes': ShapesPlay,
  'play-music': MusicPlay,
};

interface ToddlerScreenProps {
  /** The hub (PLAY_TIME_ID) or one activity. */
  id: string;
  profile: KidProfile;
  /** Opens the hub or an activity. */
  onOpen: (id: string) => void;
  /** Leaves Play time altogether. */
  onClose: () => void;
}

/** Play time: a hub of five tap-and-see activities for the youngest children. */
export const ToddlerScreen: React.FC<ToddlerScreenProps> = ({ id, profile, onOpen, onClose }) => {
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
  const isHub = id === PLAY_TIME_ID;
  const activity = PLAY_ACTIVITIES.find((a) => a.id === id);
  const View = ACTIVITY_VIEWS[id];

  return (
    <div className="play-shell" style={{ ['--run-color' as string]: theme.hex }}>
      <div className="play-top">
        <button
          type="button"
          className="back-topics"
          onClick={() => (isHub ? onClose() : onOpen(PLAY_TIME_ID))}
          aria-label={isHub ? 'Leave play time' : 'Back to play time'}
        >
          <IconBack size={22} />
          <span aria-hidden="true">Back</span>
        </button>
      </div>
      <h1 className="play-title">{isHub ? 'Play time' : (activity?.name ?? 'Play time')}</h1>

      {isHub ? (
        <ul className="play-hub">
          {PLAY_ACTIVITIES.map((a) => (
            <li key={a.id}>
              <button type="button" className="play-tile" data-silent onClick={() => onOpen(a.id)}>
                <span className="play-tile-emoji" aria-hidden="true">
                  <Pic emoji={a.emoji} />
                </span>
                <span className="play-tile-name">{a.name}</span>
                <span className="play-tile-blurb">{a.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : View ? (
        <div className="play-stage">
          <View />
        </div>
      ) : null}
    </div>
  );
};
