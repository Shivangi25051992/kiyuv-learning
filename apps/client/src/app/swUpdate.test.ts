import { describe, expect, it, vi } from 'vitest';
import { EARLY_MS, refreshOnEarlyUpdate } from './swUpdate.js';

const container = (controller: unknown) => Object.assign(new EventTarget(), { controller });
const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};
const fire = (c: EventTarget) => c.dispatchEvent(new Event('controllerchange'));

describe('refresh when the new version takes over early', () => {
  it('reloads once when an older version was in charge and the change comes soon after opening', () => {
    const c = container({});
    const reload = vi.fn();
    let t = 1000;
    refreshOnEarlyUpdate(c, { now: () => t, reload, store: memory() });
    t += 2000;
    fire(c);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('never reloads twice in one visit, so it cannot loop', () => {
    const c = container({});
    const reload = vi.fn();
    refreshOnEarlyUpdate(c, { now: () => 0, reload, store: memory() });
    fire(c);
    fire(c);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload later in the visit, so a child is never interrupted mid-question', () => {
    const c = container({});
    const reload = vi.fn();
    let t = 0;
    refreshOnEarlyUpdate(c, { now: () => t, reload, store: memory() });
    t += EARLY_MS + 1;
    fire(c);
    expect(reload).not.toHaveBeenCalled();
  });

  it('does nothing on a first visit, when there was no older version to replace', () => {
    const c = container(null);
    const reload = vi.fn();
    refreshOnEarlyUpdate(c, { now: () => 0, reload, store: memory() });
    fire(c);
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload when it cannot remember that it already did, rather than risk a loop', () => {
    const c = container({});
    const reload = vi.fn();
    refreshOnEarlyUpdate(c, {
      now: () => 0,
      reload,
      store: { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } },
    });
    fire(c);
    expect(reload).not.toHaveBeenCalled();
  });
});
