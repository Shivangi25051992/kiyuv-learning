import React, { useEffect, useRef, useState } from 'react';

const STEP_MS = 45;
const STEPS = 12;

/**
 * A number that counts up to its new value instead of jumping, with a small sparkle.
 * The first value is shown as it is, and anyone who asked for less motion gets the number at once.
 */
export const CountUp: React.FC<{ value: number }> = ({ value }) => {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    const calm =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (start === value || value < start || calm) {
      from.current = value;
      setShown(value);
      return;
    }
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      const next = step >= STEPS ? value : Math.round(start + ((value - start) * step) / STEPS);
      setShown(next);
      if (step >= STEPS) {
        clearInterval(id);
        from.current = value;
      }
    }, STEP_MS);
    return () => clearInterval(id);
  }, [value]);

  return <>{shown}</>;
};
