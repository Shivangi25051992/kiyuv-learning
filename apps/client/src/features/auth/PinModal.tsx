import React, { useState } from 'react';
import {
  PIN_FRESH_PARENT_MS,
  PIN_LENGTH,
  validateStrongPin,
} from '@kiyuv/shared';
import {
  callSetParentPinServer,
  callVerifyParentPinServer,
  fetchPinConfigured,
} from '../../lib/firebase/index.js';

const PIN_VERIFIED_AT_PREFIX = 'kiyuv_pinAt:';

// The server is the only place a PIN is stored or checked. Nothing derived from
// the PIN (no hash, no digest) is ever kept on this device.
const pinConfiguredCache = new Map<string, boolean>();

/** Asks the server whether this parent has a PIN, and remembers the answer. */
export async function refreshPinConfigured(uid: string): Promise<boolean> {
  const configured = await fetchPinConfigured(uid);
  pinConfiguredCache.set(uid, configured);
  return configured;
}

/** Last answer from `refreshPinConfigured` (false until it has been called). */
export function hasConfiguredPin(uid: string): boolean {
  return pinConfiguredCache.get(uid) === true;
}

export async function saveParentPin(uid: string, pin: string): Promise<void> {
  const strength = validateStrongPin(pin);
  if (!strength.valid) {
    throw new Error(strength.reason);
  }
  try {
    await callSetParentPinServer(pin);
  } catch (err) {
    throw new Error(friendlyPinServiceError(err));
  }
  pinConfiguredCache.set(uid, true);
  recordPinVerifiedNow(uid);
}

function friendlyPinServiceError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code.includes('unavailable') || code.includes('not-found') || code.includes('internal')) {
    return 'Cannot reach the PIN service right now. Check your connection and try again.';
  }
  if (code.includes('unauthenticated')) {
    return 'Please sign in again.';
  }
  if (code.includes('failed-precondition') || code.includes('permission-denied')) {
    return (err as Error).message || 'Please sign in again with your provider, then retry.';
  }
  return 'Something went wrong. Please try again.';
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
    return {
      ok: false,
      message: serverRes.message || 'Incorrect PIN. Please try again.',
    };
  } catch (err) {
    // Fail closed: when the server cannot be reached the device stays locked.
    return { ok: false, message: friendlyPinServiceError(err) };
  }
}

export function clearParentPin(uid: string): void {
  sessionStorage.removeItem(`${PIN_VERIFIED_AT_PREFIX}${uid}`);
  // Remove any PIN hash left behind by older builds of the app.
  try {
    localStorage.removeItem(`kiyuv_pinHash:${uid}`);
  } catch {
    // storage unavailable
  }
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
      <div className="modal-card">
        <div style={{ fontSize: 44, marginBottom: 8 }}>🔒</div>
        <h3 style={{ margin: '0 0 6px', fontSize: 22 }}>{title}</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 16px' }}>
          {hasConfiguredPin(uid)
            ? subtitle
            : 'Create a 6-digit Parent PIN (avoid sequences or repeated digits)'}
        </p>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={PIN_LENGTH}
            autoFocus
            value={pin}
            onChange={(e) => {
              setError('');
              setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
            }}
            placeholder="• • • • • •"
            className="login-input pin"
          />
          {error && <div className="login-err">{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={onCancel}
              className="secondary-btn"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="login-btn"
              style={{ flex: 1, marginTop: 0 }}
            >
              {busy ? 'Checking...' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
