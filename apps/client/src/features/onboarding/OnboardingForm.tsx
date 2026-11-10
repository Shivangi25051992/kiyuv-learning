import React, { useMemo, useState } from 'react';
import {
  AVATAR_PRESETS,
  COUNTRIES,
  FAV_COLORS,
  FAV_COLOR_THEMES,
  KidOnboardingInputSchema,
  computeAgeBand,
  suggestTrack,
  type FavColor,
  type KidOnboardingInput,
  type KidProfile,
  type Track,
} from '@kiyuv/shared';
import type { LegacyImportCandidate } from '../../lib/sync/index.js';

interface OnboardingFormProps {
  existingProfile?: KidProfile | null;
  isFirstProfile?: boolean;
  legacyCandidates?: readonly LegacyImportCandidate[];
  onSave: (
    data: KidOnboardingInput,
    importedLegacy?: LegacyImportCandidate | null,
  ) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => Promise<void>;
}

function detectDefaultCountry(): string {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const parts = navigator.language.split('-');
    const region = parts[1]?.toUpperCase();
    if (region && COUNTRIES.some((c) => c.code === region)) {
      return region;
    }
  }
  return 'IN';
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  existingProfile,
  isFirstProfile = false,
  legacyCandidates = [],
  onSave,
  onCancel,
  onDelete,
}) => {
  const [nickname, setNickname] = useState(existingProfile?.nickname ?? '');
  const [name, setName] = useState(existingProfile?.name ?? '');
  const [age, setAge] = useState<number>(existingProfile?.age ?? 6);
  const [country, setCountry] = useState<string>(
    existingProfile?.country ?? detectDefaultCountry(),
  );
  const [state, setState] = useState<string>(existingProfile?.state ?? '');
  const [favColor, setFavColor] = useState<FavColor>(existingProfile?.favColor ?? 'blue');
  const [avatar, setAvatar] = useState<string>(existingProfile?.avatar ?? '🧒');
  const [track, setTrack] = useState<Track>(
    existingProfile?.track ?? suggestTrack(existingProfile?.age ?? 6),
  );
  const [selectedLegacyIdx, setSelectedLegacyIdx] = useState<number>(-1);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const countryOption = useMemo(
    () => COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0]!,
    [country],
  );

  const computedBand = computeAgeBand(age);

  const handleAgeChange = (nextAge: number) => {
    setAge(nextAge);
    if (!existingProfile) {
      setTrack(suggestTrack(nextAge));
    }
  };

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    setState('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = KidOnboardingInputSchema.safeParse({
      name,
      nickname,
      age,
      country,
      state,
      favColor,
      avatar,
      ageBand: computedBand,
      track,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form fields');
      return;
    }

    setSaving(true);
    try {
      const legacy =
        selectedLegacyIdx >= 0 ? (legacyCandidates[selectedLegacyIdx] ?? null) : null;
      await onSave(parsed.data, legacy);
    } catch (err) {
      setError((err as Error)?.message || 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const activeTheme = FAV_COLOR_THEMES[favColor];

  return (
    <div className="onboarding-wrap">
      <div
        className="onboarding-card"
        style={{ borderTop: `6px solid ${activeTheme.accent}` }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            className="profile-avatar-preview"
            style={{
              borderColor: activeTheme.accent,
              background: activeTheme.bgLight,
            }}
          >
            {avatar}
          </div>
          <h2 style={{ margin: '10px 0 4px', fontSize: 26 }}>
            {existingProfile
              ? `Edit ${existingProfile.nickname}'s Profile`
              : isFirstProfile
                ? 'Create First Learner Profile'
                : 'Add Learner Profile'}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            Simple setup · No birthdate, email, phone or address collected
          </p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form" noValidate>
          <div className="form-row two-col">
            <div className="form-field">
              <label htmlFor="ob-nickname">
                Nickname <span className="req">*</span>
              </label>
              <input
                id="ob-nickname"
                type="text"
                maxLength={20}
                required
                placeholder="e.g. Ari, Kiki, Leo"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="login-input"
              />
              <span className="field-hint">Shown on the profile tile & leaderboard</span>
            </div>

            <div className="form-field">
              <label htmlFor="ob-name">First Name (optional)</label>
              <input
                id="ob-name"
                type="text"
                maxLength={30}
                placeholder="First name only"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="login-input"
              />
              <span className="field-hint">Shown only in the Parent Area</span>
            </div>
          </div>

          <div className="form-row two-col">
            <div className="form-field">
              <label htmlFor="ob-age">
                Age (Years) <span className="req">*</span>
              </label>
              <select
                id="ob-age"
                value={age}
                onChange={(e) => handleAgeChange(Number(e.target.value))}
                className="login-input"
              >
                {Array.from({ length: 12 }, (_, idx) => idx + 2).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} years old (Band {computeAgeBand(yr)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="ob-track">Curriculum Track</label>
              <select
                id="ob-track"
                value={track}
                onChange={(e) => setTrack(e.target.value as Track)}
                className="login-input"
              >
                <option value="early">🌱 Early Years (Pre-K / Kindergarten)</option>
                <option value="primary">🚀 Primary & Olympiad (Grades 1–5)</option>
              </select>
            </div>
          </div>

          <div className="form-row two-col">
            <div className="form-field">
              <label htmlFor="ob-country">
                Country <span className="req">*</span>
              </label>
              <select
                id="ob-country"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="login-input"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="ob-state">State / Region (optional)</label>
              <select
                id="ob-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="login-input"
              >
                <option value="">— Prefer not to say —</option>
                {countryOption.states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Choose Avatar</label>
            <div className="swatch-grid">
              {AVATAR_PRESETS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setAvatar(em)}
                  className={`avatar-swatch ${avatar === em ? 'selected' : ''}`}
                  style={
                    avatar === em
                      ? { borderColor: activeTheme.accent, background: activeTheme.bgLight }
                      : undefined
                  }
                  aria-label={`Avatar ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>
              Favourite Colour <span className="req">*</span> ({activeTheme.label})
            </label>
            <div className="color-swatch-row">
              {FAV_COLORS.map((colKey) => {
                const th = FAV_COLOR_THEMES[colKey];
                const selected = favColor === colKey;
                return (
                  <button
                    key={colKey}
                    type="button"
                    onClick={() => setFavColor(colKey)}
                    className={`fav-color-swatch ${selected ? 'selected' : ''}`}
                    style={{
                      background: th.accent,
                      outline: selected ? `3px solid ${th.hex}` : 'none',
                    }}
                    title={th.label}
                    aria-label={th.label}
                  />
                );
              })}
            </div>
          </div>

          {!existingProfile && legacyCandidates.length > 0 && (
            <div className="legacy-import-box">
              <label htmlFor="ob-legacy">
                📦 Import Previous Progress Found on This Device (Optional)
              </label>
              <select
                id="ob-legacy"
                value={selectedLegacyIdx}
                onChange={(e) => setSelectedLegacyIdx(Number(e.target.value))}
                className="login-input"
              >
                <option value={-1}>Start fresh (0 stars)</option>
                {legacyCandidates.map((cand, idx) => (
                  <option key={cand.legacyKey} value={idx}>
                    Import {cand.stars} ⭐ ({Object.keys(cand.topics).length} topics played ·{' '}
                    {cand.suggestedTrack === 'early' ? 'Early Years' : 'Primary'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="login-err">{error}</div>}

          <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="secondary-btn"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="login-btn"
              style={{
                flex: 2,
                marginTop: 0,
                background: activeTheme.hex,
              }}
            >
              {saving
                ? 'Saving...'
                : existingProfile
                  ? 'Save Changes'
                  : 'Create Profile & Start Learning →'}
            </button>
          </div>

          {existingProfile && onDelete && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="danger-outline-btn"
                >
                  🗑️ Delete {existingProfile.nickname}&apos;s Profile
                </button>
              ) : (
                <div className="delete-confirm-box">
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: '#b91c1c', fontWeight: 700 }}>
                    ⚠️ Deleting this profile permanently removes {existingProfile.nickname}&apos;s{' '}
                    {existingProfile.stars} stars, badges, and topic progress.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="secondary-btn"
                      style={{ flex: 1 }}
                    >
                      Keep Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete()}
                      className="danger-btn"
                      style={{ flex: 1 }}
                    >
                      Yes, Delete Permanently
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
