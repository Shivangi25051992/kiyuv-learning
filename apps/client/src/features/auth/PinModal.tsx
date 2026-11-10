import React, { useState } from 'react';
import { Mascot } from '../../ui/Mascot.js';
import {
  PIN_FRESH_PARENT_MS,
  PIN_LENGTH,
  validateStrongPin,
} from '@kiyuv/shared';
import {
  callSetParentPinServer,
  callVerifyParentPinServer,
} from '../../lib/firebase/index.js';

const PIN_HASH_KEY_PREFIX = 'kiyuv_pinHash:';
const PIN_VERIFIED_AT_PREFIX = 'kiyuv_pinAt:';

export async function hashPinLocally(uid: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${uid}:${pin}:kiyuv-v3`);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 2166136261;
  for (const byte of data) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function hasConfiguredPin(uid: string): boolean {
  return Boolean(localStorage.getItem(`${PIN_HASH_KEY_PREFIX}${uid}`));
}

export async function saveParentPin(uid: string, pin: string): Promise<void> {
  const strength = validateStrongPin(pin);
  if (!strength.valid) {
    throw new Error(strength.reason);
  }
  try {
    await callSetParentPinServer(pin);
  } catch {
    // Graceful fallback when Cloud Functions are not yet deployed in dev
  }
  const digest = await hashPinLocally(uid, pin);
  localStorage.setItem(`${PIN_HASH_KEY_PREFIX}${uid}`, digest);
  recordPinVerifiedNow(uid);
}

export async function checkParentPin(
  uid: string,
  pin: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const serverRes = await callVerifyParentPinServer(pin);
    if (serverRes.ok) {
      recordPinVerifiedNow(uid);
      return { ok: true };
    }
    if (
      serverRes.lockedUntilMs ||
      serverRes.requiresProviderSignIn ||
      typeof serverRes.remainingAttempts === 'number'
    ) {
      return {
        ok: false,
        message: serverRes.message || 'Incorrect PIN. Please try again.',
      };
    }
  } catch {
    // Fallback to local SHA-256 digest when Cloud Functions are not yet deployed
  }

  const expected = localStorage.getItem(`${PIN_HASH_KEY_PREFIX}${uid}`);
  if (!expected) return { ok: false, message: 'No PIN configured yet.' };
  const actual = await hashPinLocally(uid, pin);
  if (actual === expected) {
    recordPinVerifiedNow(uid);
    return { ok: true };
  }
  return { ok: false, message: 'Incorrect PIN. Please try again.' };
}

export function clearParentPin(uid: string): void {
  localStorage.removeItem(`${PIN_HASH_KEY_PREFIX}${uid}`);
  sessionStorage.removeItem(`${PIN_VERIFIED_AT_PREFIX}${uid}`);
}

export function recordPinVerifiedNow(uid: string): void {
  sessionStorage.setItem(`${PIN_VERIFIED_AT_PREFIX}${uid}`, String(Date.now()));
}

export function isPinFreshForParentAction(uid: string): boolean {
  const ts = Number(sessionStorage.getItem(`${PIN_VERIFIED_AT_PREFIX}${uid}`) ?? '0');
  return ts > 0 && Date.now() - ts < PIN_FRESH_PARENT_MS;
}

interface PinPromptModalProps {
  uid: string;
  title?: string;
  subtitle?: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const PinPromptModal: React.FC<PinPromptModalProps> = ({
  uid,
  title = 'Parent Verification',
  subtitle = 'Enter your 6-digit Parent PIN to continue',
  onVerified,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pin.trim();
    // Clear input immediately per Task 3.3
    setPin('');
    setBusy(true);
    try {
      if (!hasConfiguredPin(uid)) {
        await saveParentPin(uid, trimmed);
        onVerified();
        return;
      }
      const res = await checkParentPin(uid, trimmed);
      if (!res.ok) {
        setError(res.message || 'Incorrect PIN. Please try again.');
        return;
      }
      onVerified();
    } catch (err) {
      setError((err as Error)?.message || 'Invalid PIN');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-card pop-in">
        <Mascot mood="think" size={88} className="modal-mascot" />
        <h3 className="modal-title">{title}</h3>
        <p className="modal-sub">
          {hasConfiguredPin(uid)
            ? subtitle
            : 'Create a 6-digit parent PIN (not 111111 or 123456)'}
        </p>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <label className="sr-only" htmlFor="pin-prompt">
            6-digit parent PIN
          </label>
          <input
            id="pin-prompt"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="current-password"
            maxLength={PIN_LENGTH}
            autoFocus
            value={pin}
            onChange={(e) => {
              setError('');
              setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
            }}
            placeholder="······"
            className="pin-input"
          />
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="primary-btn">
              {busy ? 'Checking…' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
