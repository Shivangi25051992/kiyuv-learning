import { extractInviteCode, isInviteCodeShape } from '@kiyuv/shared';

const KEY = 'kiyuv_joinCode';

function storage(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

/**
 * A join link looks like `/join#CODE`. The code sits after the `#`, so the
 * browser never sends it to a server. It is kept for this tab only, so it
 * survives signing in, and it is taken out of the address bar.
 */
export function readJoinCode(location: Pick<Location, 'pathname' | 'hash'> = window.location): string | null {
  const store = storage();
  if (location.pathname.replace(/\/$/, '') === '/join') {
    const code = extractInviteCode(location.hash);
    if (isInviteCodeShape(code)) {
      try {
        store?.setItem(KEY, code);
      } catch {
        // storage unavailable: the code only lasts until the page is reloaded
      }
      try {
        window.history.replaceState(null, '', '/');
      } catch {
        // not critical
      }
      return code;
    }
  }
  try {
    const saved = store?.getItem(KEY) ?? null;
    return saved && isInviteCodeShape(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function clearJoinCode(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
