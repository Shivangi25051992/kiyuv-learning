import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from '@kiyuv/shared';
import { PATHWAY_LABEL, pathwayOf } from '@kiyuv/content';
import { getCurrentAuthUser, loadChildNames } from '../../lib/firebase/index.js';
import type { LegacyImportCandidate } from '../../lib/sync/index.js';
import { Mascot, type MascotMood } from '../../ui/Mascot.js';
import { IconBack, IconCheck, IconClose } from '../../ui/Icons.js';

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

const STEP_COUNT = 3;
const AGES = Array.from({ length: 12 }, (_, idx) => idx + 2);

const STEP_TITLES: readonly { title: string; hint: string; mood: MascotMood }[] = [
  { title: "Who's learning?", hint: 'Pick a nickname and a picture.', mood: 'cheer' },
  { title: 'How old are they?', hint: 'We use this to pick the right questions.', mood: 'happy' },
  { title: 'Almost done!', hint: 'Just a few last details.', mood: 'cheer' },
];

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  existingProfile,
  isFirstProfile = false,
  legacyCandidates = [],
  onSave,
  onCancel,
  onDelete,
}) => {
  const [step, setStep] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [nickname, setNickname] = useState(existingProfile?.nickname ?? '');
  const [name, setName] = useState(existingProfile?.name ?? '');

  // The saved name is encrypted in the cloud. Fetch it so the parent can edit it.
  useEffect(() => {
    const uid = getCurrentAuthUser()?.uid;
    if (!existingProfile || !uid) return;
    let cancelled = false;
    loadChildNames(uid, [existingProfile.kidId])
      .then((loaded) => {
        const plain = loaded[existingProfile.kidId];
        if (!cancelled && plain) setName((current) => current || plain);
      })
      .catch(() => {
        // Leave the field empty; saving an empty name keeps the stored one.
      });
    return () => {
      cancelled = true;
    };
  }, [existingProfile]);
  const [age, setAge] = useState<number>(existingProfile?.age ?? 6);
  const [country, setCountry] = useState<string>(
    existingProfile?.country ?? detectDefaultCountry(),
  );
  const [state, setState] = useState<string>(existingProfile?.state ?? '');
  const [favColor, setFavColor] = useState<FavColor>(existingProfile?.favColor ?? 'blue');
  const [avatar, setAvatar] = useState<string>(existingProfile?.avatar ?? '🧒');
  const [selectedLegacyIdx, setSelectedLegacyIdx] = useState<number>(-1);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const countryOption = useMemo(
    () => COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0]!,
    [country],
  );

  const computedBand = computeAgeBand(age);
  // The learning level always follows the age, so changing the age changes the content.
  const track = suggestTrack(age);
  const stageLabel = PATHWAY_LABEL[pathwayOf({ age })];

  // Move the reader to the new step's title when the step changes.
  useEffect(() => {
    if (step > 0) titleRef.current?.focus();
  }, [step]);
  const activeTheme = FAV_COLOR_THEMES[favColor];
  const stepInfo = STEP_TITLES[step] ?? STEP_TITLES[0]!;
  const isLastStep = step === STEP_COUNT - 1;

  const handleAgeChange = (nextAge: number) => setAge(nextAge);

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    setState('');
  };

  const goNext = () => {
    setError('');
    if (step === 0 && nickname.trim().length === 0) {
      setError('Please type a nickname so we know who is learning.');
      return;
    }
    setStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLastStep) {
      goNext();
      return;
    }
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
      const message = parsed.error.issues[0]?.message ?? 'Please check the details';
      setError(message);
      if (parsed.error.issues[0]?.path[0] === 'nickname') setStep(0);
      return;
    }

    setSaving(true);
    try {
      const legacy =
        selectedLegacyIdx >= 0 ? (legacyCandidates[selectedLegacyIdx] ?? null) : null;
      await onSave(parsed.data, legacy);
    } catch (err) {
      setError((err as Error)?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="wizard-wrap screen-enter" id="main">
      <div
        className="wizard-card"
        style={{
          ['--wizard-accent' as string]: activeTheme.accent,
          ['--wizard-color' as string]: activeTheme.hex,
          ['--wizard-bg' as string]: activeTheme.bgLight,
        }}
      >
        {onCancel && (
          <button type="button" className="wizard-close" onClick={onCancel} aria-label="Cancel">
            <IconClose size={22} />
          </button>
        )}

        <div className="wizard-head">
          <div className="wizard-avatar" aria-hidden="true">
            {avatar}
          </div>
          <Mascot mood={stepInfo.mood} size={84} className="wizard-mascot" />
        </div>

        <ol className="wizard-steps" aria-label={`Step ${step + 1} of ${STEP_COUNT}`}>
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <li
              key={i}
              className={`step-dot ${i === step ? 'current' : ''} ${i < step ? 'done' : ''}`}
              aria-current={i === step ? 'step' : undefined}
            >
              {i < step ? (
                <>
                  <IconCheck size={16} />
                  <span className="sr-only">Step {i + 1}, done</span>
                </>
              ) : (
                <>
                  <span className="sr-only">Step </span>
                  {i + 1}
                </>
              )}
            </li>
          ))}
        </ol>

        <h1 className="wizard-title" ref={titleRef} tabIndex={-1}>
          {existingProfile && step === 0 ? `Edit ${existingProfile.nickname}` : stepInfo.title}
        </h1>
        <p className="wizard-hint">
          {isFirstProfile && step === 0 ? 'Let’s set up your first learner. It takes a minute.' : stepInfo.hint}
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="wizard-form" noValidate>
          {/* STEP 1: nickname and picture */}
          {step === 0 && (
            <div className="wizard-panel">
              <div className="field">
                <label htmlFor="ob-nickname">
                  Nickname <span className="req">(needed)</span>
                </label>
                <input
                  id="ob-nickname"
                  type="text"
                  maxLength={20}
                  autoFocus
                  autoComplete="off"
                  placeholder="For example: Ari"
                  value={nickname}
                  onChange={(e) => {
                    setError('');
                    setNickname(e.target.value);
                  }}
                  className="text-input"
                  aria-describedby={error ? 'ob-nickname-hint ob-error' : 'ob-nickname-hint'}
                  aria-invalid={error && nickname.trim().length === 0 ? true : undefined}
                />
                <span id="ob-nickname-hint" className="field-hint">
                  This is the name your child sees on screen.
                </span>
              </div>

              <fieldset className="field">
                <legend>Pick a picture</legend>
                <div className="avatar-grid">
                  {AVATAR_PRESETS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setAvatar(em)}
                      className={`avatar-choice ${avatar === em ? 'selected' : ''}`}
                      aria-label={`Picture ${em}`}
                      aria-pressed={avatar === em}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {/* STEP 2: age and colour */}
          {step === 1 && (
            <div className="wizard-panel">
              <fieldset className="field">
                <legend>Age in years</legend>
                <div className="age-grid">
                  {AGES.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleAgeChange(yr)}
                      className={`age-chip ${age === yr ? 'selected' : ''}`}
                      aria-pressed={age === yr}
                      aria-label={`${yr} years old`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="field">
                <legend>
                  Favourite colour: <b style={{ color: activeTheme.hex }}>{activeTheme.label}</b>
                </legend>
                <div className="color-row">
                  {FAV_COLORS.map((colKey) => {
                    const th = FAV_COLOR_THEMES[colKey];
                    const selected = favColor === colKey;
                    return (
                      <button
                        key={colKey}
                        type="button"
                        onClick={() => setFavColor(colKey)}
                        className={`color-choice ${selected ? 'selected' : ''}`}
                        style={{ background: th.accent }}
                        aria-label={th.label}
                        aria-pressed={selected}
                      >
                        {selected && <IconCheck size={22} />}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <p className="field-hint" id="ob-stage" role="status">
                Learning stage: <b>{stageLabel}</b>. It changes with the age.
              </p>
            </div>
          )}

          {/* STEP 3: location, optional name, import, delete */}
          {step === 2 && (
            <div className="wizard-panel">
              <div className="field">
                <label htmlFor="ob-country">Country</label>
                <select
                  id="ob-country"
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="text-input"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="ob-state">State or region (optional)</label>
                <select
                  id="ob-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="text-input"
                >
                  <option value="">Prefer not to say</option>
                  {countryOption.states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="ob-name">First name (optional)</label>
                <input
                  id="ob-name"
                  type="text"
                  maxLength={30}
                  autoComplete="off"
                  placeholder="First name only"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-input"
                  aria-describedby="ob-name-hint"
                />
                <span id="ob-name-hint" className="field-hint">
                  Only grown-ups see this. We never ask for a birthday, address, email or phone.
                </span>
              </div>

              {!existingProfile && legacyCandidates.length > 0 && (
                <div className="field legacy-import-box">
                  <label htmlFor="ob-legacy">Bring back old progress from this device</label>
                  <select
                    id="ob-legacy"
                    value={selectedLegacyIdx}
                    onChange={(e) => setSelectedLegacyIdx(Number(e.target.value))}
                    className="text-input"
                  >
                    <option value={-1}>Start fresh</option>
                    {legacyCandidates.map((cand, idx) => (
                      <option key={cand.legacyKey} value={idx}>
                        Keep {cand.stars} stars ({Object.keys(cand.topics).length} topics played)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="form-error" role="alert" id="ob-error">
              {error}
            </div>
          )}

          <div className="wizard-actions">
            {step > 0 ? (
              <button type="button" onClick={goBack} className="secondary-btn">
                <IconBack size={18} /> Back
              </button>
            ) : (
              <span />
            )}
            <button type="submit" disabled={saving} className="primary-btn">
              {isLastStep
                ? saving
                  ? 'Saving…'
                  : existingProfile
                    ? 'Save changes'
                    : 'Start learning!'
                : 'Next'}
            </button>
          </div>

          {existingProfile && onDelete && isLastStep && (
            <div className="wizard-danger">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="danger-outline-btn"
                >
                  Delete {existingProfile.nickname}&apos;s profile
                </button>
              ) : (
                <div className="delete-confirm-box" role="alertdialog" aria-label="Confirm delete">
                  <p>
                    This removes {existingProfile.nickname}&apos;s {existingProfile.stars} stars,
                    badges and progress for good.
                  </p>
                  <div className="wizard-actions">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="secondary-btn"
                    >
                      Keep profile
                    </button>
                    <button type="button" onClick={() => void onDelete()} className="danger-btn">
                      Yes, delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </main>
  );
};
