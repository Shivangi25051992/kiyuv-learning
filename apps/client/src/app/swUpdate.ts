/**
 * After a new version is published, the app's offline copy used to need a second visit before
 * the new screens appeared. This makes the first visit finish the job: if the new version takes
 * over just after the page opened, the page reloads once to show it.
 *
 * It only ever happens right at the start (a reload later could interrupt a child mid-question),
 * only when an older version was in charge, and only once per visit, so it can never loop.
 */
export const EARLY_MS = 15_000;
const FLAG = 'kiyuv.updated';

interface Options {
  /** The time now, in milliseconds. */
  now?: () => number;
  /** Reloads the page. */
  reload?: () => void;
  /** Remembers, for this visit only, that the page already reloaded. */
  store?: Pick<Storage, 'getItem' | 'setItem'> | null;
}

export function refreshOnEarlyUpdate(container: EventTarget & { controller: unknown }, options: Options = {}): void {
  const now = options.now ?? Date.now;
  const reload = options.reload ?? (() => window.location.reload());
  let store: Options['store'] = options.store;
  if (store === undefined) {
    try {
      store = sessionStorage;
    } catch {
      store = null;
    }
  }
  // Nothing to replace on a first visit: there was no older version in charge.
  if (!container.controller) return;
  const openedAt = now();
  container.addEventListener('controllerchange', () => {
    if (now() - openedAt > EARLY_MS) return;
    try {
      if (store?.getItem(FLAG)) return;
      store?.setItem(FLAG, '1');
    } catch {
      return;
    }
    reload();
  });
}
