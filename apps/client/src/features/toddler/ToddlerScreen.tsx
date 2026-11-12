import React from 'react';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';
import { Pic } from '../../ui/Pic.js';
import { IconBack } from '../../ui/Icons.js';
import { AnimalsPlay, BalloonsPlay, CountPlay, MusicPlay, ShapesPlay } from './activities.js';
import {
  BodyPlay,
  ColoursPlay,
  DayPlay,
  FruitPlay,
  OppositesPlay,
  PeekabooPlay,
  SongPlay,
  VehiclesPlay,
} from './moreActivities.js';
import { useCompanion } from '../companion/CompanionProvider.js';
import { PLAY_ACTIVITIES, PLAY_GROUPS, PLAY_TIME_ID } from './playTime.js';
import './toddler.css';
import './toddler2.css';

const ACTIVITY_VIEWS: Record<string, React.FC> = {
  'play-animals': AnimalsPlay,
  'play-peekaboo': PeekabooPlay,
  'play-vehicles': VehiclesPlay,
  'play-colours': ColoursPlay,
  'play-shapes': ShapesPlay,
  'play-opposites': OppositesPlay,
  'play-balloons': BalloonsPlay,
  'play-count': CountPlay,
  'play-body': BodyPlay,
  'play-day': DayPlay,
  'play-fruit': FruitPlay,
  'play-music': MusicPlay,
  'play-song': SongPlay,
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

/** Play time: tap-and-see activities for the youngest children, in sections. */
export const ToddlerScreen: React.FC<ToddlerScreenProps> = ({ id, profile, onOpen, onClose }) => {
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
  const isHub = id === PLAY_TIME_ID;
  const activity = PLAY_ACTIVITIES.find((a) => a.id === id);
  const View = ACTIVITY_VIEWS[id];
  const { react: companion } = useCompanion();

  // Kiyu runs over to whatever the child taps, and cheers.
  const runToTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const button = (e.target as HTMLElement).closest('button');
    if (!button) return;
    const r = button.getBoundingClientRect();
    companion('play-tap', { at: { x: r.left + r.width / 2, y: r.top + 10 } });
  };

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
        <>
          <p className="play-intro">Tap, look and listen. There are no wrong answers!</p>
          {PLAY_GROUPS.map((group) => (
            <section key={group} className="play-group" aria-label={group}>
              <h2 className="play-group-title">{group}</h2>
              <ul className="play-hub">
                {PLAY_ACTIVITIES.filter((a) => a.group === group).map((a) => (
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
            </section>
          ))}
        </>
      ) : View ? (
        <div className="play-stage" onClickCapture={runToTap}>
          <View />
        </div>
      ) : null}
    </div>
  );
};
