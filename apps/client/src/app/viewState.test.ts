import { afterEach, describe, expect, it } from 'vitest';
import { clearView, loadView, saveView } from './viewState.js';

afterEach(() => sessionStorage.clear());

describe('saved view', () => {
  it('round-trips the profile and tab', () => {
    saveView('u1', { mode: 'app', kidId: 'k3', tab: 'leader' });
    expect(loadView('u1')).toEqual({ mode: 'app', kidId: 'k3', tab: 'leader' });
    saveView('u1', { mode: 'picker' });
    expect(loadView('u1')).toEqual({ mode: 'picker' });
  });

  it('keeps each parent separate, and clears one or all', () => {
    saveView('u1', { mode: 'app', kidId: 'k1', tab: 'games' });
    saveView('u2', { mode: 'app', kidId: 'k2', tab: 'groups' });
    clearView('u1');
    expect(loadView('u1')).toBeNull();
    expect(loadView('u2')).not.toBeNull();
    clearView();
    expect(loadView('u2')).toBeNull();
  });

  it('refuses anything that is not a real profile slot and tab', () => {
    for (const bad of [
      '{"mode":"app","kidId":"k9","tab":"games"}',
      '{"mode":"app","kidId":"k1","tab":"admin"}',
      '{"mode":"app"}',
      '{"mode":"other"}',
      'not json',
      '[]',
    ]) {
      sessionStorage.setItem('kiyuv_view:u1', bad);
      expect(loadView('u1'), bad).toBeNull();
    }
  });

  it('holds only a slot and a tab, never a name', () => {
    saveView('u1', { mode: 'app', kidId: 'k1', tab: 'curriculum' });
    expect(sessionStorage.getItem('kiyuv_view:u1')).toBe('{"mode":"app","kidId":"k1","tab":"curriculum"}');
  });
});
