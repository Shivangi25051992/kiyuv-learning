import { PIN_FRESH_SESSION_MS } from '@kiyuv/shared';

/**
 * Remembers that a parent unlocked this device, so a page refresh does not ask
 * for the PIN again. It is a convenience for the screen only. It holds no PIN and
 * nothing derived from one, and it is not what protects the data (the server and
 * the Firestore rules do that).
 *
 * The device stays unlocked for 12 hours, then the PIN is asked for again.
 */

const KEY_PREFIX = 'kiyuv_unlockedAt:';

function safeStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function markDeviceUnlocked(uid: string, now = Date.now()): void {
  try {
    safeStorage()?.setItem(`${KEY_PREFIX}${uid}`, String(now));
  } catch {
    // Storage can be blocked (private mode). The PIN is then asked for on refresh.
  }
}

export function isDeviceStillUnlocked(uid: string, now = Date.now()): boolean {
  try {
    const raw = safeStorage()?.getItem(`${KEY_PREFIX}${uid}`);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    const age = now - at;
    return age >= 0 && age < PIN_FRESH_SESSION_MS;
  } catch {
    return false;
  }
}

export function clearDeviceUnlock(uid?: string): void {
  try {
    const store = safeStorage();
    if (!store) return;
    if (uid) {
      store.removeItem(`${KEY_PREFIX}${uid}`);
      return;
    }
    for (let i = store.length - 1; i >= 0; i--) {
      const key = store.key(i);
      if (key && key.startsWith(KEY_PREFIX)) store.removeItem(key);
    }
  } catch {
    // nothing to clear
  }
}
