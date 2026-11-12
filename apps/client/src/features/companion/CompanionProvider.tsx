import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/effects.js';
import { Companion, type CompanionShown } from './Companion.js';
import { reactionFor, type CompanionEvent, type LineContext } from './lines.js';

const KEY = 'kiyuv.companion';

function readEnabled(): boolean {
  try {
    return typeof localStorage === 'undefined' ? true : localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

/** Where on the screen something was tapped, in screen pixels. */
export interface ScreenPoint {
  x: number;
  y: number;
}

export interface ReactOptions {
  /** The thing to run to (for "play-tap"). */
  at?: ScreenPoint;
  ctx?: LineContext;
  /** Show this only once while the app is open (greetings). */
  once?: boolean;
  /** Keep Kiyu above the bottom tab bar. */
  aboveTabbar?: boolean;
}

export interface CompanionApi {
  react: (event: CompanionEvent, options?: ReactOptions) => void;
  enabled: boolean;
  setEnabled: (on: boolean) => void;
}

const NOOP: CompanionApi = { react: () => {}, enabled: false, setEnabled: () => {} };
const CompanionContext = createContext<CompanionApi>(NOOP);

/** Kiyu's controller. Without a provider (in tests, say) every call does nothing. */
export const useCompanion = (): CompanionApi => useContext(CompanionContext);

/** Quick taps should not pile up: one run to a tapped thing at a time. */
const MIN_PLAY_TAP_GAP_MS = 1800;
/** How long Kiyu takes to fade away at the end. */
const LEAVE_MS = 320;

export const CompanionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabledState] = useState(readEnabled);
  const [shown, setShown] = useState<CompanionShown | null>(null);
  const seq = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onceDone = useRef<Set<string>>(new Set());
  const lastPlayTap = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const react = useCallback((event: CompanionEvent, options: ReactOptions = {}) => {
    if (!enabledRef.current) return;
    if (options.once) {
      if (onceDone.current.has(event)) return;
      onceDone.current.add(event);
    }
    if (event === 'play-tap') {
      const now = Date.now();
      if (!options.at || now - lastPlayTap.current < MIN_PLAY_TAP_GAP_MS) return;
      lastPlayTap.current = now;
    }
    const r = reactionFor(event, options.ctx);
    // Without motion, Kiyu stays put in a corner and only shows the words.
    const quiet = prefersReducedMotion();
    if (quiet && !r.line) return;
    const move = quiet ? 'home' : r.move;
    clearTimers();
    seq.current += 1;
    setShown({
      seq: seq.current,
      mood: r.mood,
      line: r.line,
      move,
      ms: r.ms,
      at: move === 'to' ? options.at : undefined,
      aboveTabbar: Boolean(options.aboveTabbar),
      leaving: false,
    });
    timers.current.push(
      setTimeout(() => setShown((s) => (s ? { ...s, leaving: true } : s)), r.ms),
      setTimeout(() => setShown(null), r.ms + LEAVE_MS),
    );
  }, []);

  const setEnabled = useCallback((on: boolean) => {
    setEnabledState(on);
    try {
      localStorage.setItem(KEY, on ? '1' : '0');
    } catch {
      // The choice then lasts only until the app is closed.
    }
    if (!on) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setShown(null);
    }
  }, []);

  const api = useMemo<CompanionApi>(() => ({ react, enabled, setEnabled }), [react, enabled, setEnabled]);

  return (
    <CompanionContext.Provider value={api}>
      {children}
      <Companion shown={shown} />
    </CompanionContext.Provider>
  );
};
