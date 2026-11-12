import { useSyncExternalStore } from 'react';

/** The things Kiyu can wear. Each is unlocked by a rank, earned with stars. */
export type AccessoryKey = 'butterfly' | 'star' | 'medal' | 'cape' | 'jetpack' | 'crown';

/**
 * What Kiyu is wearing right now, for the child who is using the app. Every Kiyu on screen
 * reads this, so a new look appears everywhere at once. It is set from the child's stars
 * and their choice, and is empty (no accessory) when nobody is signed in.
 */
let active: AccessoryKey | null = null;
const listeners = new Set<() => void>();

export const getActiveLook = (): AccessoryKey | null => active;

export function setActiveLook(next: AccessoryKey | null): void {
  if (next === active) return;
  active = next;
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useActiveLook = (): AccessoryKey | null => useSyncExternalStore(subscribe, getActiveLook, () => null);
