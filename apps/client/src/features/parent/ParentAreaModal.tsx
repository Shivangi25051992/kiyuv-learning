import React, { useEffect, useState } from 'react';
import {
  FAV_COLOR_THEMES,
  MAX_KIDS_PER_FAMILY,
  TRIES_CHOICES,
  triesLabel,
  type KidId,
  type KidProfile,
} from '@kiyuv/shared';
import { loadChildNames, type AuthParentUser } from '../../lib/firebase/index.js';
import { VoiceSettings } from './VoiceSettings.js';
import { CompanionSettings } from '../companion/CompanionSettings.js';
import { useModalFocus } from '../../ui/useModalFocus.js';
import { AccountDataSection } from './AccountDataSection.js';
import { AboutLink } from '../about/AboutModal.js';

interface ParentAreaModalProps {
  user: AuthParentUser;
  profiles: readonly KidProfile[];
  onAddProfile: () => void;
  onEditProfile: (profile: KidProfile) => void;
  onResetProgress: (targetKidId?: KidId) => Promise<void>;
  /** Saves how many tries a child gets per question (0 = unlimited). */
  onChangeTries: (kidId: KidId, maxTries: number) => Promise<void>;
  /** Returns the family's data as text for a file. */
  onExportData: () => Promise<string>;
  onDeleteAccount: () => Promise<void>;
  onClose: () => void;
}

export const ParentAreaModal: React.FC<ParentAreaModalProps> = ({
  user,
  profiles,
  onAddProfile,
  onEditProfile,
  onResetProgress,
  onChangeTries,
  onExportData,
  onDeleteAccount,
  onClose,
}) => {
  const [confirmResetTarget, setConfirmResetTarget] = useState<'all' | KidId | null>(null);
  const [busy, setBusy] = useState(false);
  const [triesError, setTriesError] = useState('');
  // Names are stored encrypted. They are decrypted here, in memory only, because
  // this screen is only reachable with a freshly verified PIN.
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    loadChildNames(
      user.uid,
      profiles.map((p) => p.kidId),
    )
      .then((loaded) => {
        if (!cancelled) setNames(loaded);
      })
      .catch(() => {
        // Names stay hidden if the PIN is no longer fresh or the service is offline.
      });
    return () => {
      cancelled = true;
    };
  }, [user.uid, profiles]);

  const dialogRef = useModalFocus<HTMLDivElement>(onClose);

  const handleTriesChange = async (kidId: KidId, value: number) => {
    setTriesError('');
    try {
      await onChangeTries(kidId, value);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      setTriesError(
        code.includes('permission-denied')
          ? 'Could not save. Close this window, enter your PIN again and retry.'
          : 'Could not save. Check your connection and try again.',
      );
    }
  };

  const handleConfirmReset = async () => {
    if (!confirmResetTarget) return;
    setBusy(true);
    try {
      await onResetProgress(confirmResetTarget === 'all' ? undefined : confirmResetTarget);
      setConfirmResetTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-card wide-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Parent area"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 24 }}>
            <span aria-hidden="true">👨‍👩‍👧‍👦 </span>Parent area
          </h2>
          <button type="button" onClick={onClose} className="close-icon-btn" aria-label="Close">
            ×
          </button>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 18px' }}>
          Signed in as <b>{user.email ?? user.displayName ?? 'Parent'}</b> · PIN verified
        </p>

        <div className="parent-section">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <h4 style={{ margin: 0 }}>
              Child Profiles ({profiles.length}/{MAX_KIDS_PER_FAMILY})
            </h4>
            {profiles.length < MAX_KIDS_PER_FAMILY && (
              <button type="button" className="small-primary-btn" onClick={onAddProfile}>
                ＋ Add Profile
              </button>
            )}
          </div>

          <div className="parent-profile-list">
            {profiles.map((p) => {
              const theme = FAV_COLOR_THEMES[p.favColor] ?? FAV_COLOR_THEMES.blue;
              return (
                <div key={p.kidId} className="parent-profile-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{p.avatar}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: theme.hex }}>
                        {p.nickname}{' '}
                        {(names[p.kidId] ?? p.name) && (
                          <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 12 }}>
                            ({names[p.kidId] ?? p.name})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Age {p.age} (Band {p.ageBand}) · {p.country}
                        {p.state ? `, ${p.state}` : ''} · ⭐ {p.stars}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="secondary-btn small"
                      onClick={() => onEditProfile(p)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="danger-outline-btn small"
                      onClick={() => setConfirmResetTarget(p.kidId)}
                    >
                      Reset Stars
                    </button>
                  </div>
                  <div className="tries-setting">
                    <label htmlFor={`tries-${p.kidId}`}>Tries per question</label>
                    <select
                      id={`tries-${p.kidId}`}
                      className="text-input"
                      value={p.maxTries ?? 0}
                      onChange={(e) => void handleTriesChange(p.kidId, Number(e.target.value))}
                    >
                      {TRIES_CHOICES.map((n) => (
                        <option key={n} value={n}>
                          {triesLabel(n)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {triesError && (
          <p className="field-error" role="alert">
            {triesError}
          </p>
        )}

        {confirmResetTarget && (
          <div className="delete-confirm-box" style={{ marginTop: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#b91c1c', fontWeight: 700 }}>
              {confirmResetTarget === 'all'
                ? "⚠️ Reset ALL children's stars, streaks, badges, and topic progress across all devices?"
                : `⚠️ Reset ${profiles.find((p) => p.kidId === confirmResetTarget)?.nickname ?? 'this child'}'s progress across all devices?`}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ flex: 1 }}
                onClick={() => setConfirmResetTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                style={{ flex: 1 }}
                disabled={busy}
                onClick={() => void handleConfirmReset()}
              >
                {busy ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        )}

        <VoiceSettings />
        <CompanionSettings />

        <AccountDataSection
          childCount={profiles.length}
          onExport={onExportData}
          onDelete={onDeleteAccount}
        />
        <p style={{ margin: '14px 0 0' }}>
          <AboutLink />
        </p>

        <div
          style={{
            marginTop: 20,
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            className="danger-outline-btn"
            onClick={() => setConfirmResetTarget('all')}
          >
            🗑️ Reset All Profiles Progress
          </button>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
