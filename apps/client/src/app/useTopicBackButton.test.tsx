import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTopicBackButton } from './useTopicBackButton.js';

describe('phone Back button during a round', () => {
  it('leaves the round when Back is pressed, without leaving the app', () => {
    const leave = vi.fn();
    const before = window.history.length;
    const { rerender } = renderHook(({ id }) => useTopicBackButton(id, leave), {
      initialProps: { id: null as string | null },
    });
    rerender({ id: 'y-add-e' });
    expect(window.history.length).toBe(before + 1);
    expect(window.history.state).toEqual({ kiyuvRound: true });

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('ignores Back when no round is open', () => {
    const leave = vi.fn();
    renderHook(() => useTopicBackButton(null, leave));
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(leave).not.toHaveBeenCalled();
  });

  it('removes its history entry when the on-screen button leaves the round', () => {
    const leave = vi.fn();
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const { rerender } = renderHook(({ id }) => useTopicBackButton(id, leave), {
      initialProps: { id: 'y-add-e' as string | null },
    });
    rerender({ id: null });
    expect(back).toHaveBeenCalledTimes(1);
    expect(leave).not.toHaveBeenCalled();
    back.mockRestore();
  });
});
