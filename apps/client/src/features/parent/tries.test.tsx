import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { KidProfileSchema, triesLabel, type KidProfile } from '@kiyuv/shared';

vi.mock('../../lib/firebase/index.js', () => ({
  loadChildNames: vi.fn().mockResolvedValue({}),
  writeKidMaxTries: vi.fn().mockResolvedValue(undefined),
  writeKidProfileDirect: vi.fn().mockResolvedValue(undefined),
}));

import { ParentAreaModal } from './ParentAreaModal.js';
import { loadLocalProfiles, mergeKidProfiles, saveLocalProfiles, setProfileMaxTries } from '../../lib/sync/index.js';
import { writeKidMaxTries, writeKidProfileDirect } from '../../lib/firebase/index.js';

afterEach(() => cleanup());

const kid = (over: Partial<KidProfile> = {}): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 8, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '8-10', track: 'primary', stars: 0, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0, ...over,
});

const user = { uid: 'u1', email: 'p@example.com', displayName: 'P', photoURL: null, emailVerified: true, providerId: 'google.com' };

function renderModal(profile: KidProfile, onChangeTries: (k: string, n: number) => Promise<void>) {
  return render(
    <ParentAreaModal
      user={user}
      profiles={[profile]}
      onAddProfile={() => {}}
      onEditProfile={() => {}}
      onResetProgress={async () => {}}
      onChangeTries={onChangeTries as never}
      onClose={() => {}}
    />,
  );
}

describe('tries per question setting', () => {
  it('is Unlimited by default and offers Unlimited and 1 to 4 tries', () => {
    renderModal(kid(), async () => {});
    const select = screen.getByLabelText('Tries per question') as HTMLSelectElement;
    expect(select.value).toBe('0');
    expect(Array.from(select.options).map((o) => o.text)).toEqual(['Unlimited', '1 try', '2 tries', '3 tries', '4 tries']);
  });

  it('shows the saved choice and saves a new one for that child', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    renderModal(kid({ maxTries: 3 }), save);
    const select = screen.getByLabelText('Tries per question') as HTMLSelectElement;
    expect(select.value).toBe('3');
    fireEvent.change(select, { target: { value: '1' } });
    await waitFor(() => expect(save).toHaveBeenCalledWith('k1', 1));
  });

  it('asks for the PIN again when the save is refused', async () => {
    renderModal(kid(), vi.fn().mockRejectedValue(Object.assign(new Error('denied'), { code: 'permission-denied' })));
    fireEvent.change(screen.getByLabelText('Tries per question'), { target: { value: '2' } });
    expect((await screen.findByRole('alert')).textContent).toContain('enter your PIN again');
  });

  it('points at the connection for any other failure', async () => {
    renderModal(kid(), vi.fn().mockRejectedValue(new Error('offline')));
    fireEvent.change(screen.getByLabelText('Tries per question'), { target: { value: '2' } });
    expect((await screen.findByRole('alert')).textContent).toContain('connection');
  });
});

describe('the setting in the data', () => {
  it('only allows 0 to 4, and leaves it out when unset', () => {
    expect(KidProfileSchema.safeParse(kid({ maxTries: 4 })).success).toBe(true);
    expect(KidProfileSchema.safeParse(kid({ maxTries: 5 })).success).toBe(false);
    expect(KidProfileSchema.safeParse(kid({ maxTries: 1.5 })).success).toBe(false);
    expect(KidProfileSchema.safeParse(kid()).success).toBe(true);
    expect(triesLabel(0)).toBe('Unlimited');
    expect(triesLabel(1)).toBe('1 try');
  });

  it('survives a sync merge, and this device wins when both have a value', () => {
    expect(mergeKidProfiles(kid(), kid({ maxTries: 2 })).maxTries).toBe(2);
    expect(mergeKidProfiles(kid({ maxTries: 1 }), kid({ maxTries: 3 })).maxTries).toBe(1);
    expect('maxTries' in mergeKidProfiles(kid(), kid())).toBe(false);
  });
});

describe('saving the setting', () => {
  it('changes only the tries field, so the encrypted name is never touched', async () => {
    localStorage.clear();
    saveLocalProfiles('u1', [kid({ name: '' })]);
    const next = await setProfileMaxTries('u1', 'k1', 2);
    expect(writeKidMaxTries).toHaveBeenCalledWith('u1', 'k1', 2);
    expect(writeKidProfileDirect).not.toHaveBeenCalled();
    expect(next[0]!.maxTries).toBe(2);
    expect(loadLocalProfiles('u1')[0]!.maxTries).toBe(2);
  });

  it('keeps the old value on this device when the cloud save fails', async () => {
    localStorage.clear();
    saveLocalProfiles('u1', [kid({ maxTries: 1 })]);
    vi.mocked(writeKidMaxTries).mockRejectedValueOnce(new Error('denied'));
    await expect(setProfileMaxTries('u1', 'k1', 4)).rejects.toThrow();
    expect(loadLocalProfiles('u1')[0]!.maxTries).toBe(1);
  });
});
