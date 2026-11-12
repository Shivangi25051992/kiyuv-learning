import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Makes something wiggle each time it is tapped, even when it is tapped again straight away.
 * The class alternates between "pulse-a" and "pulse-b" (two copies of the same animation),
 * which restarts the animation without needing to rebuild the element.
 */
export function useTapPulse(ms = 650): {
  pulseClass: (id: string) => string;
  trigger: (id: string) => void;
} {
  const [state, setState] = useState<{ id: string; n: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const trigger = useCallback(
    (id: string) => {
      setState((prev) => ({ id, n: (prev?.n ?? 0) + 1 }));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setState(null), ms);
    },
    [ms],
  );

  const pulseClass = (id: string): string => (state?.id === id ? (state.n % 2 === 0 ? 'pulse-a' : 'pulse-b') : '');
  return { pulseClass, trigger };
}
