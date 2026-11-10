import React, { useState } from 'react';
import {
  FAV_COLOR_THEMES,
  MAX_KIDS_PER_FAMILY,
  type KidProfile,
} from '@kiyuv/shared';
import { Mascot } from '../../ui/Mascot.js';
import { IconCheck, IconLock, IconPencil, IconPlus, IconStar, IconFlame } from '../../ui/Icons.js';

interface ProfilePickerProps {
  profiles: readonly KidProfile[];
  activeKidId: string | null;
  onSelectProfile: (profile: KidProfile) => void;
  onRequestAddProfile: () => void;
  onRequestEditProfile: (profile: KidProfile) => void;
}

export const ProfilePicker: React.FC<ProfilePickerProps> = ({
  profiles,
  activeKidId,
  onSelectProfile,
  onRequestAddProfile,
  onRequestEditProfile,
}) => {
  const [manageMode, setManageMode] = useState(false);

  return (
    <div className="picker-screen screen-enter">
      <div className="picker-container">
        <Mascot mood={manageMode ? 'think' : 'cheer'} size={104} className="picker-mascot" />
        <h1 className="picker-title">
          {manageMode ? 'Edit learners' : "Who's learning today?"}
        </h1>
        <p className="picker-subtitle">
          {manageMode
            ? 'Tap a learner to change their details. A grown-up PIN is needed.'
            : 'Tap your picture to start.'}
        </p>

        <ul className="picker-grid" aria-label="Learners">
          {profiles.map((profile, index) => {
            const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
            const isCurrentDevice = profile.kidId === activeKidId;
            return (
              <li key={profile.kidId} style={{ ['--i' as string]: index }} className="stagger-item">
                <button
                  type="button"
                  className="picker-tile"
                  onClick={() =>
                    manageMode ? onRequestEditProfile(profile) : onSelectProfile(profile)
                  }
                  style={{
                    ['--tile-color' as string]: theme.hex,
                    ['--tile-accent' as string]: theme.accent,
                    ['--tile-bg' as string]: theme.bgLight,
                    ['--tile-border' as string]: theme.border,
                  }}
                  aria-label={
                    manageMode ? `Edit ${profile.nickname}` : `Start learning as ${profile.nickname}`
                  }
                >
                  <span className="picker-avatar">
                    <span className="picker-avatar-emoji">{profile.avatar}</span>
                    {manageMode && (
                      <span className="picker-edit-badge" aria-hidden="true">
                        <IconPencil size={16} />
                      </span>
                    )}
                  </span>
                  <span className="picker-nickname">{profile.nickname}</span>
                  <span className="picker-stats">
                    <span className="stat-pill star">
                      <IconStar size={16} /> {profile.stars}
                    </span>
                    <span className="stat-pill fire">
                      <IconFlame size={16} /> {profile.bestStreak}
                    </span>
                  </span>
                  {isCurrentDevice && !manageMode && (
                    <span className="picker-device-pill">Playing here</span>
                  )}
                </button>
              </li>
            );
          })}

          {profiles.length < MAX_KIDS_PER_FAMILY && (
            <li style={{ ['--i' as string]: profiles.length }} className="stagger-item">
              <button
                type="button"
                className="picker-tile add-tile"
                onClick={onRequestAddProfile}
                aria-label="Add a learner (grown-up PIN needed)"
              >
                <span className="picker-avatar add-ring">
                  <IconPlus size={44} />
                </span>
                <span className="picker-nickname">Add a learner</span>
                <span className="picker-meta">
                  <IconLock size={14} /> Grown-ups only
                </span>
              </button>
            </li>
          )}
        </ul>

        {profiles.length > 0 && (
          <button
            type="button"
            className="manage-profiles-btn"
            onClick={() => setManageMode((m) => !m)}
          >
            {manageMode ? (
              <>
                <IconCheck size={18} /> Done
              </>
            ) : (
              <>
                <IconPencil size={18} /> Edit learners
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
