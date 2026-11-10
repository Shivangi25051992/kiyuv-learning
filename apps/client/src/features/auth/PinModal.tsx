import React, { useState } from 'react';
import { PIN_FRESH_PARENT_MS } from '@kiyuv/shared';

const PIN_HASH_KEY_PREFIX = 'kiyuv_pinHash:';
const PIN_VERIFIED_AT_PREFIX = 'kiyuv_pinAt:';

export async function hashPinLocally(uid: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${uid}:${pin}:kiyuv-v2`);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for test environments without subtle crypto
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
  const digest = await hashPinLocally(uid, pin);
  localStorage.setItem(`${PIN_HASH_KEY_PREFIX}${uid}`, digest);
  recordPinVerifiedNow(uid);
}

export async function checkParentPin(uid: string, pin: string): Promise<boolean> {
  const expected = localStorage.getItem(`${PIN_HASH_KEY_PREFIX}${uid}`);
  if (!expected) return false;
  const actual = await hashPinLocally(uid, pin);
  if (actual === expected) {
    recordPinVerifiedNow(uid);
    return true;
  }
  return false;
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
  subtitle = 'Enter your 4-digit Parent PIN to continue',
  onVerified,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pin.trim();
    if (!/^[0-9]{4}$/.test(trimmed)) {
      setError('Enter a 4-digit PIN');
      return;
    }
    setPin('');
    if (!hasConfiguredPin(uid)) {
      await saveParentPin(uid, trimmed);
      onVerified();
      return;
    }
    const ok = await checkParentPin(uid, trimmed);
    if (!ok) {
      setError('Incorrect PIN. Please try again.');
      return;
    }
    onVerified();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-card">
        <div style={{ fontSize: 44, marginBottom: 8 }}>🔒</div>
        <h3 style={{ margin: '0 0 6px', fontSize: 22 }}>{title}</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 16px' }}>
          {hasConfiguredPin(uid)
            ? subtitle
            : 'Create a 4-digit Parent PIN to protect profile & progress settings'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoFocus
            value={pin}
            onChange={(e) => {
              setError('');
              setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
            }}
            placeholder="• • • •"
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
            <button type="submit" className="login-btn" style={{ flex: 1, marginTop: 0 }}>
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
