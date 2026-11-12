import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTopicBackButton } from './useTopicBackButton.js';
import {
  FAV_COLOR_THEMES,
  IDLE_PICKER_TIMEOUT_MS,
  nextAvailableKidId,
  type KidId,
  type KidOnboardingInput,
  type KidProfile,
} from '@kiyuv/shared';
import {
  migrateLegacyNames,
  signOutParent,
  subscribeAuthState,
  type AuthParentUser,
} from '../lib/firebase/index.js';
import {
  createOrSaveProfile,
  deleteChildProfile,
  setProfileMaxTries,
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
import { initAudio, isSoundEnabled, sfx, startMusic, stopMusic, toggleSound } from '../lib/sound.js';
import { LoginScreen } from '../features/auth/LoginScreen.js';
import {
  clearDeviceUnlock,
  isDeviceStillUnlocked,
  markDeviceUnlocked,
} from '../features/auth/deviceUnlock.js';
import { clearView, loadView, saveView, type AppTab } from './viewState.js';
import { CountUp } from '../ui/CountUp.js';
import { loadRound } from '../features/play/roundState.js';
import { Mascot } from '../ui/Mascot.js';
import { MusicControl } from '../ui/MusicControl.js';
import {
  IconBook,
  IconGame,
  IconGroup,
  IconLogout,
  IconParent,
  IconSoundOff,
  IconSoundOn,
  IconStar,
  IconSwitch,
  IconTrophy,
} from '../ui/Icons.js';
import {
  PinPromptModal,
  hasConfiguredPin,
  isPinFreshForParentAction,
  refreshPinConfigured,
} from '../features/auth/PinModal.js';
import { OnboardingForm } from '../features/onboarding/OnboardingForm.js';
import { ParentAreaModal } from '../features/parent/ParentAreaModal.js';
import { CurriculumView } from '../features/play/CurriculumView.js';
import { TopicRunner } from '../features/play/TopicRunner.js';
import { ProfilePicker } from '../features/profiles/ProfilePicker.js';
import { TrophiesView } from '../features/progress/TrophiesView.js';
import { GroupsView } from '../features/groups/GroupsView.js';
import { clearJoinCode, readJoinCode } from '../features/groups/joinLink.js';

type ScreenMode = 'picker' | 'onboarding' | 'app';

export const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthParentUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  // True while a refreshed page is restoring the parent's unlocked session.
  const [resuming, setResuming] = useState(false);
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [activeKidId, setActiveKidId] = useState<KidId | null>(null);
  const [screenMode, setScreenMode] = useState<ScreenMode>('picker');
  const [editingProfile, setEditingProfile] = useState<KidProfile | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('curriculum');
  // A code from a join link (/join#CODE), kept until the parent has used it.
  const [joinCode, setJoinCode] = useState<string | null>(() => readJoinCode());
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

  // Load family profiles once parent unlocks the device
  const handleDeviceUnlocked = useCallback(async (user: AuthParentUser, fromLogin = true) => {
    // After a page refresh, remember where the parent was. A fresh sign-in starts over.
    const savedView = fromLogin ? null : loadView(user.uid);
    if (fromLogin) {
      clearView(user.uid);
    }
    setAuthUser(user);
    setUnlocked(true);
    // Remember this unlock for 12 hours, so a page refresh does not ask for the PIN again.
    if (fromLogin) markDeviceUnlocked(user.uid);
    const legacy = detectLegacyLocalProgress();
    setLegacyCandidates(legacy);

    const local = loadLocalProfiles(user.uid);
    if (local.length > 0) {
      setProfiles(local);
    }

    const synced = await syncFamilyFromCloud(user.uid);
    setProfiles(synced);
    // The PIN was just entered, so this is the moment to convert any profile saved before
    // names were encrypted. It is quiet, and tried again at the next sign-in if it fails.
    if (fromLogin) {
      void migrateLegacyNames(
        user.uid,
        synced.map((p) => p.kidId),
      ).catch(() => undefined);
    }

    const rememberedKidId = getActiveKidForDevice(user.uid);
    const savedKid =
      savedView?.mode === 'app' ? synced.find((p) => p.kidId === savedView.kidId) : undefined;
    if (synced.length === 0) {
      // First-time family setup -> go straight to onboarding for the first child
      setEditingProfile(null);
      setScreenMode('onboarding');
    } else if (savedView?.mode === 'app' && savedKid) {
      // Refreshed in the middle of using the app: back to the same child and tab.
      setActiveKidId(savedKid.kidId);
      setActiveTab(savedView.tab);
      // ...and to the same question, if a round was in progress.
      const roundKey = `${user.uid}:${savedKid.kidId}`;
      setCurrentTopicId(
        savedView.topicId && loadRound(roundKey, savedView.topicId) ? savedView.topicId : null,
      );
      setScreenMode('app');
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

  // Remember the profile and tab in use, so a refresh does not send the parent back to the
  // profile picker. Not while a refresh is still being restored.
  useEffect(() => {
    if (!authUser || !unlocked || resuming) return;
    if (screenMode === 'app' && activeKidId) {
      saveView(authUser.uid, {
        mode: 'app',
        kidId: activeKidId,
        tab: activeTab,
        ...(currentTopicId ? { topicId: currentTopicId } : {}),
      });
    } else if (screenMode === 'picker') {
      saveView(authUser.uid, { mode: 'picker' });
    }
  }, [authUser, unlocked, resuming, screenMode, activeKidId, activeTab, currentTopicId]);

  useTopicBackButton(currentTopicId, () => setCurrentTopicId(null));

  // Subscribe to Firebase Auth state. After a refresh, a parent who unlocked within
  // the last 12 hours goes straight back in instead of seeing the PIN screen.
  useEffect(() => {
    const unsub = subscribeAuthState((u) => {
      setAuthUser(u);
      setAuthReady(true);
      if (!u) {
        setUnlocked(false);
        setResuming(false);
        setProfiles([]);
        setActiveKidId(null);
        return;
      }
      if (isDeviceStillUnlocked(u.uid)) {
        setResuming(true);
        // Whether a PIN exists is only known to the server, so ask it before
        // going straight back in.
        void refreshPinConfigured(u.uid)
          .then((configured) => {
            if (!configured) throw new Error('no PIN set');
            return handleDeviceUnlocked(u, false);
          })
          .catch(() => {
            // If restoring fails, fall back to the normal unlock screen.
            clearDeviceUnlock(u.uid);
            setUnlocked(false);
          })
          .finally(() => setResuming(false));
      }
    });
    return unsub;
  }, [handleDeviceUnlocked]);

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

  // Music belongs to the signed-in app. It never plays on the sign-in or PIN screens,
  // and it stops again when the parent signs out or the app locks.
  const unlockedRef = useRef(false);
  useEffect(() => {
    unlockedRef.current = unlocked;
    if (unlocked) {
      initAudio();
      startMusic();
    } else {
      stopMusic();
    }
  }, [unlocked]);

  // A soft "pop" on every button press, except buttons that make their own sound.
  useEffect(() => {
    const onPress = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button || button.disabled) return;
      // Browsers only allow sound after a tap, so the music starts on the first one.
      initAudio();
      if (unlockedRef.current) startMusic();
      if (button.hasAttribute('data-silent')) return;
      sfx.tap();
    };
    document.addEventListener('pointerdown', onPress, { passive: true });
    return () => document.removeEventListener('pointerdown', onPress);
  }, []);

  const activeProfile =
    profiles.find((p) => p.kidId === activeKidId) ?? profiles[0] ?? null;

  // Someone opened a join link: once they are in the app, take them to Groups.
  useEffect(() => {
    if (joinCode && unlocked && screenMode === 'app') {
      setCurrentTopicId(null);
      setActiveTab('groups');
    }
  }, [joinCode, unlocked, screenMode]);

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
    clearDeviceUnlock(authUser?.uid);
    clearView(authUser?.uid);
    await signOutParent();
    setUnlocked(false);
  };

  if (!authReady || resuming) {
    return (
      <div className="splash" role="status" aria-live="polite">
        <Mascot mood="happy" size={132} />
        <div className="splash-title">Kiyuv Learning</div>
        <div className="splash-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (!authUser || !unlocked || !hasConfiguredPin(authUser.uid)) {
    return (
      <LoginScreen
        user={authUser}
        onUnlocked={(u) => void handleDeviceUnlocked(u, true)}
      />
    );
  }

  const activeTheme = activeProfile
    ? (FAV_COLOR_THEMES[activeProfile.favColor] ?? FAV_COLOR_THEMES.blue)
    : FAV_COLOR_THEMES.blue;

  return (
    <div className="app-shell">
      <div className="bg-floaties" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <Mascot size={38} className="brand-mascot" />
          <span className="brand-name">Kiyuv</span>
        </div>

        {screenMode === 'app' && activeProfile && (
          <div className="star-counter" role="img" aria-label={`${activeProfile.stars} stars`}>
            <IconStar size={20} />
            <span key={activeProfile.stars} className="star-count bump">
              <CountUp value={activeProfile.stars} />
            </span>
          </div>
        )}

        <div className="topbar-actions">
          {screenMode === 'app' && activeProfile && (
            <button
              type="button"
              className="chip-btn who-chip"
              style={{
                borderColor: activeTheme.accent,
                background: activeTheme.bgLight,
                color: activeTheme.hex,
              }}
              onClick={() => {
                setCurrentTopicId(null);
                setScreenMode('picker');
              }}
              aria-label={`Switch learner, now ${activeProfile.nickname}`}
              title="Switch learner (no PIN needed)"
            >
              <span className="who-avatar">{activeProfile.avatar}</span>
              <span className="who-name">{activeProfile.nickname}</span>
              <IconSwitch size={18} />
            </button>
          )}

          <button
            type="button"
            className="icon-btn"
            onClick={() => requireRecentParentPin(() => setShowParentArea(true))}
            aria-label="Parent area (PIN needed)"
            title="Parent area (PIN needed)"
          >
            <IconParent />
          </button>

          <MusicControl />

          <button
            type="button"
            className={`icon-btn ${soundOn ? '' : 'is-off'}`}
            onClick={() => setSoundOn(toggleSound())}
            aria-pressed={soundOn}
            aria-label="Sound effects"
            title={soundOn ? 'Sound on' : 'Sound off'}
            data-silent
          >
            {soundOn ? <IconSoundOn /> : <IconSoundOff />}
          </button>

          <button
            type="button"
            className="icon-btn subtle"
            onClick={() => void handleLogout()}
            aria-label="Sign out"
            title="Sign out"
          >
            <IconLogout />
          </button>
        </div>
      </header>

      {/* Screen 1: "Who's learning?" profile picker */}
      {screenMode === 'picker' && (
        <ProfilePicker
          profiles={profiles}
          activeKidId={activeKidId}
          onSelectProfile={(p) => void handleSelectProfile(p)}
          onRequestAddProfile={handleRequestAddProfile}
          onRequestEditProfile={handleRequestEditProfile}
        />
      )}

      {/* Screen 2: simple parent onboarding / edit */}
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

      {/* Screen 3: the learner's home */}
      {screenMode === 'app' && activeProfile && (
        <>
          {!currentTopicId && (
            <section className="hello">
              <Mascot mood="happy" size={92} className="hello-mascot" />
              <div className="hello-text">
                <h1>Hi {activeProfile.nickname}!</h1>
                <p>
                  {activeProfile.streak >= 3
                    ? `${activeProfile.streak} in a row. You're on fire!`
                    : 'Ready to learn something fun today?'}
                </p>
              </div>
            </section>
          )}

          <main
            className="container screen-enter"
            key={`${activeTab}-${currentTopicId ?? 'map'}`}
            id="main"
          >
            {currentTopicId ? (
              <TopicRunner
                profile={activeProfile}
                topicId={currentTopicId}
                onUpdateProfile={handleUpdateActiveProfileProgress}
                onExitToMap={() => setCurrentTopicId(null)}
                onPlayTopic={(tid) => {
                  sfx.select();
                  setCurrentTopicId(tid);
                }}
                requireParentPin={requireRecentParentPin}
                storageKey={`${authUser.uid}:${activeProfile.kidId}`}
              />
            ) : activeTab === 'groups' ? (
              <GroupsView
                uid={authUser.uid}
                profiles={profiles}
                requirePin={requireRecentParentPin}
                initialCode={joinCode}
                onCodeHandled={() => {
                  clearJoinCode();
                  setJoinCode(null);
                }}
              />
            ) : activeTab === 'leader' ? (
              <TrophiesView
                uid={authUser.uid}
                profiles={profiles}
                requirePin={requireRecentParentPin}
                onOpenParentReset={() => requireRecentParentPin(() => setShowParentArea(true))}
                onOpenGroups={() => setActiveTab('groups')}
              />
            ) : (
              <CurriculumView
                profile={activeProfile}
                roundKey={`${authUser.uid}:${activeProfile.kidId}`}
                mode={activeTab === 'games' ? 'play' : 'learn'}
                onStartTopic={(tid) => {
                  sfx.select();
                  setCurrentTopicId(tid);
                }}
              />
            )}
          </main>

          {/* Bottom tab bar on phones, top pills on larger screens */}
          {!currentTopicId && (
            <nav className="tabbar" aria-label="Main">
              <button
                type="button"
                className={activeTab === 'curriculum' ? 'active' : ''}
                aria-current={activeTab === 'curriculum' ? 'page' : undefined}
                onClick={() => {
                  setCurrentTopicId(null);
                  setActiveTab('curriculum');
                }}
              >
                <IconBook size={26} />
                <span>Learn</span>
              </button>
              <button
                type="button"
                className={activeTab === 'games' ? 'active' : ''}
                aria-current={activeTab === 'games' ? 'page' : undefined}
                onClick={() => {
                  setCurrentTopicId(null);
                  setActiveTab('games');
                }}
              >
                <IconGame size={26} />
                <span>Play</span>
              </button>
              <button
                type="button"
                className={activeTab === 'groups' ? 'active' : ''}
                aria-current={activeTab === 'groups' ? 'page' : undefined}
                onClick={() => {
                  setCurrentTopicId(null);
                  setActiveTab('groups');
                }}
              >
                <IconGroup size={26} />
                <span>Groups</span>
              </button>
              <button
                type="button"
                className={activeTab === 'leader' ? 'active' : ''}
                aria-current={activeTab === 'leader' ? 'page' : undefined}
                onClick={() => {
                  setCurrentTopicId(null);
                  setActiveTab('leader');
                }}
              >
                <IconTrophy size={26} />
                <span>Trophies</span>
              </button>
            </nav>
          )}
        </>
      )}

      <footer className="footer">Kiyuv Learning Academy · Ad-free · No tracking</footer>

      {/* Parent PIN re-check (5 minutes) */}
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

      {/* Parent area */}
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
          onChangeTries={async (kidId, maxTries) => {
            setProfiles(await setProfileMaxTries(authUser.uid, kidId, maxTries));
          }}
          onClose={() => setShowParentArea(false)}
        />
      )}
    </div>
  );
};
