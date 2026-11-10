import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FAV_COLOR_THEMES,
  IDLE_PICKER_TIMEOUT_MS,
  nextAvailableKidId,
  type KidId,
  type KidOnboardingInput,
  type KidProfile,
} from '@kiyuv/shared';
import {
  signOutParent,
  subscribeAuthState,
  type AuthParentUser,
} from '../lib/firebase/index.js';
import {
  createOrSaveProfile,
  deleteChildProfile,
  detectLegacyLocalProgress,
  flushAllDirtyKidsForUser,
  getActiveKidForDevice,
  loadLocalProfiles,
  purgeLegacyLocalKeys,
  refreshActiveKidFromCloud,
  resetFamilyProgress,
   saveLocalProfiles,
  scheduleKidSync,
  setActiveKidForDevice,
  syncFamilyFromCloud,
  type LegacyImportCandidate,
} from '../lib/sync/index.js';
import { initAudio, isSoundEnabled, sfx, toggleSound } from '../lib/sound.js';
import { LoginScreen } from '../features/auth/LoginScreen.js';
import {
  PinPromptModal,
  hasConfiguredPin,
  isPinFreshForParentAction,
} from '../features/auth/PinModal.js';
import { OnboardingForm } from '../features/onboarding/OnboardingForm.js';
import { ParentAreaModal } from '../features/parent/ParentAreaModal.js';
import { CurriculumView } from '../features/play/CurriculumView.js';
import { TopicRunner } from '../features/play/TopicRunner.js';
import { ProfilePicker } from '../features/profiles/ProfilePicker.js';
import { LeaderboardView } from '../features/progress/LeaderboardView.js';

type ScreenMode = 'picker' | 'onboarding' | 'app';
type AppTab = 'curriculum' | 'games' | 'leader';

export const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthParentUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [activeKidId, setActiveKidId] = useState<KidId | null>(null);
  const [screenMode, setScreenMode] = useState<ScreenMode>('picker');
  const [editingProfile, setEditingProfile] = useState<KidProfile | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('curriculum');
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [legacyCandidates, setLegacyCandidates] = useState<LegacyImportCandidate[]>([]);

  // Parent PIN gate state for sensitive actions (add/edit/delete profile, parent area, reset)
  const [pendingParentAction, setPendingParentAction] = useState<(() => void) | null>(
    null,
  );
  const [showParentArea, setShowParentArea] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());

  const requireRecentParentPin = useCallback(
    (action: () => void) => {
      if (!authUser) return;
      if (isPinFreshForParentAction(authUser.uid)) {
        action();
      } else {
        setPendingParentAction(() => action);
      }
    },
    [authUser],
  );

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsub = subscribeAuthState((u) => {
      setAuthUser(u);
      setAuthReady(true);
      if (!u) {
        setUnlocked(false);
        setProfiles([]);
        setActiveKidId(null);
      }
    });
    return unsub;
  }, []);

  // Load family profiles once parent unlocks the device
  const handleDeviceUnlocked = useCallback(async (user: AuthParentUser) => {
    setAuthUser(user);
    setUnlocked(true);
    const legacy = detectLegacyLocalProgress();
    setLegacyCandidates(legacy);

    const local = loadLocalProfiles(user.uid);
    if (local.length > 0) {
      setProfiles(local);
    }

    const synced = await syncFamilyFromCloud(user.uid);
    setProfiles(synced);

    const rememberedKidId = getActiveKidForDevice(user.uid);
    if (synced.length === 0) {
      // First-time family setup -> go straight to onboarding for the first child
      setEditingProfile(null);
      setScreenMode('onboarding');
    } else if (
      synced.length === 1 &&
      rememberedKidId &&
      synced[0]?.kidId === rememberedKidId
    ) {
      setActiveKidId(rememberedKidId);
      setScreenMode('app');
    } else {
      // Show "Who's learning?" OTT profile picker
      setActiveKidId(rememberedKidId);
      setScreenMode('picker');
    }
  }, []);

  // Flush dirty progress when tab becomes hidden; refresh active child when returning to foreground
  useEffect(() => {
    if (!authUser || !unlocked) return;
    const onVisChange = () => {
      if (document.visibilityState === 'hidden') {
        lastActivityRef.current = Date.now();
        void flushAllDirtyKidsForUser(authUser.uid);
      } else if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= IDLE_PICKER_TIMEOUT_MS) {
          setCurrentTopicId(null);
          setScreenMode('picker');
        } else if (activeKidId) {
          void refreshActiveKidFromCloud(authUser.uid, activeKidId).then((updated) => {
            if (updated) {
              setProfiles(loadLocalProfiles(authUser.uid));
            }
          });
        }
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, [authUser, unlocked, activeKidId]);

  // Return to "Who's learning?" picker after 10 minutes of inactivity (Task 2.6)
  useEffect(() => {
    if (!unlocked || screenMode !== 'app') return;
    const bumpActivity = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener('pointerdown', bumpActivity, { passive: true });
    window.addEventListener('keydown', bumpActivity, { passive: true });
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_PICKER_TIMEOUT_MS) {
        setCurrentTopicId(null);
        setScreenMode('picker');
      }
    }, 30_000);
    return () => {
      window.removeEventListener('pointerdown', bumpActivity);
      window.removeEventListener('keydown', bumpActivity);
      clearInterval(interval);
    };
  }, [unlocked, screenMode]);

  const activeProfile =
    profiles.find((p) => p.kidId === activeKidId) ?? profiles[0] ?? null;

  // Apply active child's favourite colour theme CSS variables
  useEffect(() => {
    const theme = activeProfile
      ? (FAV_COLOR_THEMES[activeProfile.favColor] ?? FAV_COLOR_THEMES.blue)
      : FAV_COLOR_THEMES.blue;
    document.documentElement.style.setProperty('--kid-primary', theme.hex);
    document.documentElement.style.setProperty('--kid-accent', theme.accent);
    document.documentElement.style.setProperty('--kid-bg-light', theme.bgLight);
    document.documentElement.style.setProperty('--kid-border', theme.border);
  }, [activeProfile]);

  const handleSelectProfile = async (profile: KidProfile) => {
    if (!authUser) return;
    initAudio();
    sfx.start();
    setActiveKidForDevice(authUser.uid, profile.kidId);
    setActiveKidId(profile.kidId);
    setCurrentTopicId(null);
    setActiveTab('curriculum');
    setScreenMode('app');

    const refreshed = await refreshActiveKidFromCloud(authUser.uid, profile.kidId);
    if (refreshed) {
      setProfiles(loadLocalProfiles(authUser.uid));
    }
  };

  const handleRequestAddProfile = () => {
    requireRecentParentPin(() => {
      setEditingProfile(null);
      setScreenMode('onboarding');
    });
  };

  const handleRequestEditProfile = (profile: KidProfile) => {
    requireRecentParentPin(() => {
      setEditingProfile(profile);
      setScreenMode('onboarding');
    });
  };

  const handleSaveOnboarding = async (
    input: KidOnboardingInput,
    importedLegacy?: LegacyImportCandidate | null,
  ) => {
    if (!authUser) return;
    const targetKidId =
      editingProfile?.kidId ??
      nextAvailableKidId(profiles.map((p) => p.kidId));
    if (!targetKidId) {
      throw new Error('Maximum of 6 child profiles reached for this family.');
    }

    const saved = await createOrSaveProfile(
      authUser.uid,
      targetKidId,
      input,
      importedLegacy
        ? {
            stars: importedLegacy.stars,
            streak: importedLegacy.streak,
            bestStreak: importedLegacy.bestStreak,
            totalCorrect: importedLegacy.totalCorrect,
            totalWrong: importedLegacy.totalWrong,
            badges: importedLegacy.badges,
            topics: importedLegacy.topics,
          }
        : undefined,
    );

    if (importedLegacy) {
      purgeLegacyLocalKeys(importedLegacy.legacyKey);
      setLegacyCandidates(detectLegacyLocalProgress());
    } else if (legacyCandidates.length === 0) {
      purgeLegacyLocalKeys();
    }

    const updatedList = loadLocalProfiles(authUser.uid);
    setProfiles(updatedList);
    setActiveKidForDevice(authUser.uid, saved.kidId);
    setActiveKidId(saved.kidId);
    setEditingProfile(null);
    setScreenMode('app');
  };

  const handleDeleteProfile = async () => {
    if (!authUser || !editingProfile) return;
    const remaining = await deleteChildProfile(authUser.uid, editingProfile.kidId);
    setProfiles(remaining);
    setEditingProfile(null);
    if (remaining.length === 0) {
      setActiveKidId(null);
      setScreenMode('onboarding');
    } else {
      setActiveKidId(getActiveKidForDevice(authUser.uid));
      setScreenMode('picker');
    }
  };

  const handleUpdateActiveProfileProgress = (
    nextProfile: KidProfile,
    flushImmediately: boolean,
  ) => {
    if (!authUser) return;
    const updatedList = profiles.map((p) =>
      p.kidId === nextProfile.kidId ? nextProfile : p,
    );
    setProfiles(updatedList);
    saveLocalProfiles(authUser.uid, updatedList);
    scheduleKidSync(authUser.uid, nextProfile.kidId, flushImmediately);
  };

  const handleLogout = async () => {
    if (authUser) {
      await flushAllDirtyKidsForUser(authUser.uid);
    }
    await signOutParent();
    setUnlocked(false);
  };

  if (!authReady) {
    return null;
  }

  if (!authUser || !unlocked || !hasConfiguredPin(authUser.uid)) {
    return <LoginScreen user={authUser} onUnlocked={handleDeviceUnlocked} />;
  }

  const activeTheme = activeProfile
    ? (FAV_COLOR_THEMES[activeProfile.favColor] ?? FAV_COLOR_THEMES.blue)
    : FAV_COLOR_THEMES.blue;

  return (
    <div>
      {/* Top Navigation Bar */}
      <header className="nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="title">🧠 Kiyuv Learning</div>
        </div>

        <div className="right">
          {screenMode === 'app' && activeProfile && (
            <button
              type="button"
              className="profile-switch-pill"
              style={{
                borderColor: activeTheme.accent,
                background: activeTheme.bgLight,
                color: activeTheme.hex,
              }}
              onClick={() => {
                setCurrentTopicId(null);
                setScreenMode('picker');
              }}
              title="Switch Learner Profile (No PIN required)"
            >
              <span>{activeProfile.avatar}</span>
              <span>{activeProfile.nickname}</span>
              <span style={{ fontSize: 11, opacity: 0.75 }}>⇄ Switch</span>
            </button>
          )}

          <button
            type="button"
            className="toggle"
            onClick={() =>
              requireRecentParentPin(() => {
                setShowParentArea(true);
              })
            }
            title="Parent Area (PIN required)"
          >
            👨‍👩‍👧‍👦 Parent
          </button>

          <button
            type="button"
            className={`toggle ${soundOn ? '' : 'off'}`}
            onClick={() => setSoundOn(toggleSound())}
          >
            {soundOn ? '🔊 Sound' : '🔇 Muted'}
          </button>

          <button
            type="button"
            className="logout-btn"
            onClick={() => void handleLogout()}
            title="Sign out"
          >
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Screen 1: "Who's learning?" OTT Multi-Profile Picker */}
      {screenMode === 'picker' && (
        <ProfilePicker
          profiles={profiles}
          activeKidId={activeKidId}
          onSelectProfile={(p) => void handleSelectProfile(p)}
          onRequestAddProfile={handleRequestAddProfile}
          onRequestEditProfile={handleRequestEditProfile}
        />
      )}

      {/* Screen 2: Parent-Gated Simple Onboarding / Edit Form */}
      {screenMode === 'onboarding' && (
        <OnboardingForm
          existingProfile={editingProfile}
          isFirstProfile={profiles.length === 0}
          legacyCandidates={legacyCandidates}
          onSave={handleSaveOnboarding}
          onCancel={
            profiles.length > 0
              ? () => {
                  setEditingProfile(null);
                  setScreenMode('picker');
                }
              : undefined
          }
          onDelete={editingProfile ? handleDeleteProfile : undefined}
        />
      )}

      {/* Screen 3: Active Learner App */}
      {screenMode === 'app' && activeProfile && (
        <>
          <div className="hero">
            <h1>
              Hi {activeProfile.nickname}! Let&apos;s Learn 🚀
            </h1>
            <p>
              India CBSE · US Common Core · UK National Curriculum · Australia ACARA ·
              Olympiad Prep
            </p>
          </div>

          {/* Quick Profile Switcher Strip when multiple kids exist */}
          {profiles.length > 1 && !currentTopicId && (
            <div className="who-tabs">
              {profiles.map((p) => {
                const th = FAV_COLOR_THEMES[p.favColor] ?? FAV_COLOR_THEMES.blue;
                const isSelected = p.kidId === activeProfile.kidId;
                return (
                  <button
                    key={p.kidId}
                    type="button"
                    className={`who ${isSelected ? 'active' : ''}`}
                    style={{
                      color: th.hex,
                      borderColor: isSelected ? th.accent : 'transparent',
                      background: isSelected ? th.bgLight : '#fff',
                    }}
                    onClick={() => void handleSelectProfile(p)}
                  >
                    <span>
                      {p.avatar} {p.nickname}
                    </span>
                    <span className="age">
                      Ages {p.ageBand} · ⭐{p.stars}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="tab-switch">
            <button
              type="button"
              className={activeTab === 'curriculum' ? 'active' : ''}
              onClick={() => {
                setCurrentTopicId(null);
                setActiveTab('curriculum');
              }}
            >
              📚 Curriculum Map
            </button>
            <button
              type="button"
              className={activeTab === 'games' ? 'active' : ''}
              onClick={() => {
                setCurrentTopicId(null);
                setActiveTab('games');
              }}
            >
              🎮 Play
            </button>
            <button
              type="button"
              className={activeTab === 'leader' ? 'active' : ''}
              onClick={() => {
                setCurrentTopicId(null);
                setActiveTab('leader');
              }}
            >
              🏆 Leaderboard
            </button>
          </div>

          <main className="container">
            {currentTopicId ? (
              <TopicRunner
                profile={activeProfile}
                topicId={currentTopicId}
                onUpdateProfile={handleUpdateActiveProfileProgress}
                onExitToMap={() => setCurrentTopicId(null)}
              />
            ) : activeTab === 'leader' ? (
              <LeaderboardView
                profiles={profiles}
                onOpenParentReset={() =>
                  requireRecentParentPin(() => {
                    setShowParentArea(true);
                  })
                }
              />
            ) : (
              <CurriculumView
                profile={activeProfile}
                onStartTopic={(tid) => setCurrentTopicId(tid)}
              />
            )}
          </main>
        </>
      )}

      <footer className="footer">
        Kiyuv Learning Academy · Offline-first · Ad-free · No third-party tracking
      </footer>

      {/* Parent 5-Minute PIN Re-Verification Modal */}
      {pendingParentAction && (
        <PinPromptModal
          uid={authUser.uid}
          onVerified={() => {
            const act = pendingParentAction;
            setPendingParentAction(null);
            act();
          }}
          onCancel={() => setPendingParentAction(null)}
        />
      )}

      {/* Parent Area Modal */}
      {showParentArea && (
        <ParentAreaModal
          user={authUser}
          profiles={profiles}
          onAddProfile={() => {
            setShowParentArea(false);
            setEditingProfile(null);
            setScreenMode('onboarding');
          }}
          onEditProfile={(p) => {
            setShowParentArea(false);
            setEditingProfile(p);
            setScreenMode('onboarding');
          }}
          onResetProgress={async (targetKidId) => {
            const updated = await resetFamilyProgress(authUser.uid, targetKidId);
            setProfiles(updated);
          }}
          onClose={() => setShowParentArea(false)}
        />
      )}
    </div>
  );
};
