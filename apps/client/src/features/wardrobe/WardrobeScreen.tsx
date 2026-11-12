import React, { useState } from 'react';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';
import { Mascot } from '../../ui/Mascot.js';
import { IconBack, IconLock } from '../../ui/Icons.js';
import { rankOf } from '../learn/rank.js';
import { setActiveLook } from './lookStore.js';
import {
  LOOKS,
  isUnlocked,
  loadLookChoice,
  rankNameOf,
  resolveLook,
  saveLookChoice,
  starsNeeded,
  type LookChoice,
} from './looks.js';
import './wardrobe.css';

interface WardrobeScreenProps {
  profile: KidProfile;
  /** Where this child's on-device choices are kept. */
  storeKey: string;
  onClose: () => void;
}

/**
 * Kiyu's wardrobe. Every rank the child earns with stars unlocks something new to wear, and
 * Kiyu wears it everywhere in the app. Nothing here costs money or needs anyone's data.
 */
export const WardrobeScreen: React.FC<WardrobeScreenProps> = ({ profile, storeKey, onClose }) => {
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
  const [choice, setChoice] = useState<LookChoice>(() => loadLookChoice(storeKey));
  const rank = rankOf(profile.stars);
  const wearing = resolveLook(storeKey, profile.stars);
  const next = LOOKS.find((l) => !isUnlocked(l, profile.stars));

  const wear = (c: LookChoice) => {
    saveLookChoice(storeKey, c);
    setChoice(c);
    setActiveLook(resolveLook(storeKey, profile.stars));
  };

  return (
    <div className="wardrobe" style={{ ['--run-color' as string]: theme.hex }}>
      <div className="courses-top">
        <button type="button" className="back-topics" onClick={onClose} aria-label="Back to the learn page">
          <IconBack size={22} />
          <span aria-hidden="true">Back</span>
        </button>
      </div>
      <h1 className="courses-title">Kiyu&apos;s wardrobe</h1>
      <p className="courses-sub">
        {next
          ? `Earn stars to unlock more. Next: ${next.name} at ${rankNameOf(next)} (${starsNeeded(next)} stars).`
          : 'You unlocked everything. Kiyu is a Legend!'}
      </p>

      <div className="wardrobe-stage" aria-live="polite">
        <Mascot mood="happy" size={170} accessory={wearing} />
        <p className="wardrobe-wearing">
          {wearing ? `Kiyu is wearing: ${LOOKS.find((l) => l.key === wearing)!.name}` : 'Kiyu is wearing no extras'}
        </p>
        <p className="wardrobe-rank">
          Your rank: <b>{rank.name}</b> · {profile.stars} stars
        </p>
      </div>

      <ul className="look-grid">
        <li>
          <button
            type="button"
            className={`look-card${choice === 'none' ? ' on' : ''}`}
            data-silent
            aria-pressed={choice === 'none'}
            onClick={() => wear('none')}
          >
            <Mascot mood="happy" size={72} accessory={null} />
            <b>No extras</b>
            <small>Just Kiyu</small>
          </button>
        </li>
        {LOOKS.map((look) => {
          const open = isUnlocked(look, profile.stars);
          const on = open && (choice === look.key || (choice === 'auto' && wearing === look.key));
          return (
            <li key={look.key}>
              <button
                type="button"
                className={`look-card${on ? ' on' : ''}${open ? '' : ' locked'}`}
                data-silent
                disabled={!open}
                aria-pressed={open ? on : undefined}
                aria-label={open ? look.name : `${look.name}. Locked. Reach ${rankNameOf(look)} at ${starsNeeded(look)} stars.`}
                onClick={() => wear(look.key)}
              >
                <Mascot mood={open ? 'happy' : 'sleepy'} size={72} accessory={look.key} />
                <b>{look.name}</b>
                <small>
                  {open ? (on ? 'Wearing' : 'Tap to wear') : (
                    <>
                      <IconLock size={13} /> {rankNameOf(look)} · {starsNeeded(look)} stars
                    </>
                  )}
                </small>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
