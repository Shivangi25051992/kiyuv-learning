import React, { useState } from 'react';
import {
  FAV_COLOR_THEMES,
  MAX_KIDS_PER_FAMILY,
  type KidProfile,
} from '@kiyuv/shared';

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
    <div className="picker-screen">
      <div className="picker-container">
        <div className="picker-badge">👨‍👩‍👧‍👦 FAMILY LEARNING PROFILES</div>
        <h1 className="picker-title">
          {manageMode ? 'Manage Learner Profiles' : "Who's learning today?"}
        </h1>
        <p className="picker-subtitle">
          {manageMode
            ? 'Select a profile to edit its details or remove it (requires Parent PIN)'
            : 'Tap your profile to jump into your personal curriculum & colour theme'}
        </p>

        <div className="picker-grid">
          {profiles.map((profile) => {
            const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
            const isCurrentDevice = profile.kidId === activeKidId;
            return (
              <button
                key={profile.kidId}
                type="button"
                className="picker-tile"
                onClick={() =>
                  manageMode ? onRequestEditProfile(profile) : onSelectProfile(profile)
                }
                style={{
                  borderColor: theme.accent,
                  background: manageMode ? '#fff' : theme.bgLight,
                }}
              >
                <div
                  className="picker-avatar-ring"
                  style={{
                    borderColor: theme.accent,
                    boxShadow: `0 6px 20px ${theme.border}`,
                  }}
                >
                  <span>{profile.avatar}</span>
                  {manageMode && (
                    <span className="picker-edit-badge" title="Edit profile">
                      ✏️
                    </span>
                  )}
                </div>
                <div className="picker-nickname" style={{ color: theme.hex }}>
                  {profile.nickname}
                </div>
                <div className="picker-meta">
                  Ages {profile.ageBand} ·{' '}
                  {profile.track === 'early' ? '🌱 Early' : '🚀 Primary'}
                </div>
                <div className="picker-stats">
                  <span>⭐ {profile.stars}</span>
                  <span>🔥 {profile.bestStreak}</span>
                </div>
                {isCurrentDevice && !manageMode && (
                  <div
                    className="picker-device-pill"
                    style={{ background: theme.hex, color: '#fff' }}
                  >
                    Last active on this device
                  </div>
                )}
              </button>
            );
          })}

          {profiles.length < MAX_KIDS_PER_FAMILY && (
            <button
              type="button"
              className="picker-tile add-tile"
              onClick={onRequestAddProfile}
            >
              <div className="picker-avatar-ring add-ring">
                <span>＋</span>
              </div>
              <div className="picker-nickname">Add Profile</div>
              <div className="picker-meta">
                {MAX_KIDS_PER_FAMILY - profiles.length} of {MAX_KIDS_PER_FAMILY} slots free
              </div>
            </button>
          )}
        </div>

        {profiles.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <button
              type="button"
              className="manage-profiles-btn"
              onClick={() => setManageMode((m) => !m)}
            >
              {manageMode ? '✓ Done Managing' : '⚙️ Manage Profiles (Parent PIN)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
