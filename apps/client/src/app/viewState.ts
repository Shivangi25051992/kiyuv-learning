import { KID_IDS, type KidId } from '@kiyuv/shared';

export type AppTab = 'curriculum' | 'games' | 'leader' | 'groups';
const TABS: readonly AppTab[] = ['curriculum', 'games', 'leader', 'groups'];

/** Where the parent was in the app, so a page refresh puts them back there. */
export type SavedView =
  | { mode: 'picker' }
  | { mode: 'app'; kidId: KidId; tab: AppTab };

const KEY_PREFIX = 'kiyuv_view:';

function storage(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

/**
 * Kept in session storage, so it lives as long as this browser tab. Closing the tab
 * (or signing in fresh) starts again at "Who's learning?". It holds no personal data,
 * only a profile slot (k1 to k6) and a tab name.
 */
export function saveView(uid: string, view: SavedView): void {
  try {
    storage()?.setItem(`${KEY_PREFIX}${uid}`, JSON.stringify(view));
  } catch {
    // storage unavailable: a refresh then lands on the picker, as before
  }
}

export function loadView(uid: string): SavedView | null {
  try {
    const raw = storage()?.getItem(`${KEY_PREFIX}${uid}`);
    if (!raw) return null;
    const v = JSON.parse(raw) as { mode?: unknown; kidId?: unknown; tab?: unknown };
    if (v.mode === 'picker') return { mode: 'picker' };
    if (
      v.mode === 'app' &&
      typeof v.kidId === 'string' &&
      (KID_IDS as readonly string[]).includes(v.kidId) &&
      typeof v.tab === 'string' &&
      (TABS as readonly string[]).includes(v.tab)
    ) {
      return { mode: 'app', kidId: v.kidId as KidId, tab: v.tab as AppTab };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearView(uid?: string): void {
  try {
    const store = storage();
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
