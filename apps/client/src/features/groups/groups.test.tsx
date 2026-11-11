import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { KidProfile } from '@kiyuv/shared';

const h = vi.hoisted(() => ({
  calls: [] as Array<{ name: string; data: Record<string, unknown> }>,
  groups: [] as Array<{ groupId: string; name: string; role: 'owner' | 'member' }>,
  board: null as null | Record<string, unknown>,
}));

vi.mock('../../lib/firebase/index.js', () => ({
  fetchMyGroups: vi.fn(async () => h.groups),
  fetchGroupBoard: vi.fn(async () => h.board),
  fetchMyMembership: vi.fn(async () => ({ uid: 'u1', role: 'member', shared: {} })),
  fetchGroupAdmin: vi.fn(async () => ({ members: [], requests: [] })),
  callGroupFunction: vi.fn(async (name: string, data: Record<string, unknown>) => {
    h.calls.push({ name, data });
    if (name === 'requestJoin') return { groupName: 'Sunrise Club' };
    if (name === 'createGroup') return { groupId: 'g1' };
    return { ok: true };
  }),
}));

import { GroupsView } from './GroupsView.js';
import { clearJoinCode, readJoinCode } from './joinLink.js';

const kid = (over: Partial<KidProfile>): KidProfile => ({
  kidId: 'k1', name: '', nickname: 'Ari', age: 6, country: 'IN', state: '', favColor: 'blue',
  avatar: '👦', ageBand: '5-7', track: 'primary', stars: 3, streak: 0, bestStreak: 0,
  totalCorrect: 0, totalWrong: 0, badges: [], topics: {}, resetEpoch: 0, ...over,
});

// A PIN that is always fresh, so the action runs straight away.
const requirePin = (action: () => void) => action();

beforeEach(() => {
  h.calls.length = 0;
  h.groups = [];
  h.board = null;
  sessionStorage.clear();
});
afterEach(() => cleanup());

describe('Groups tab', () => {
  it('shows an empty state with create and join choices', async () => {
    render(<GroupsView uid="u1" profiles={[kid({})]} requirePin={requirePin} initialCode={null} onCodeHandled={() => {}} />);
    expect(await screen.findByText('You are not in a group yet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create a group' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Join with a code' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('lists the groups a family is in', async () => {
    h.groups = [{ groupId: 'g1', name: 'Sunrise Club', role: 'owner' }];
    render(<GroupsView uid="u1" profiles={[kid({})]} requirePin={requirePin} initialCode={null} onCodeHandled={() => {}} />);
    expect(await screen.findByRole('button', { name: /Sunrise Club/ })).toBeTruthy();
    expect(screen.getByText('You run this group')).toBeTruthy();
  });

  it('will not create a group with a rude or too short name', async () => {
    render(<GroupsView uid="u1" profiles={[kid({})]} requirePin={requirePin} initialCode={null} onCodeHandled={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Create a group' }));
    const input = screen.getByLabelText('Group name');
    const submit = screen.getByRole('button', { name: 'Create group' }) as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Hi' } });
    expect(submit.disabled).toBe(true);
    fireEvent.change(input, { target: { value: 'fuck club' } });
    expect(submit.disabled).toBe(true);
    fireEvent.change(input, { target: { value: 'Sunrise Club' } });
    expect(submit.disabled).toBe(false);
  });

  it('joins from a link: needs a child, a clean board name and the parent agreeing', async () => {
    render(<GroupsView uid="u1" profiles={[kid({})]} requirePin={requirePin} initialCode="ABCD2345" onCodeHandled={() => {}} />);
    const send = (await screen.findByRole('button', { name: 'Ask to join' })) as HTMLButtonElement;
    expect((screen.getByLabelText('Invite code or link') as HTMLInputElement).value).toBe('ABCD2345');
    expect(send.disabled).toBe(true);

    fireEvent.click(screen.getByRole('checkbox', { name: /Share Ari/ }));
    expect(send.disabled).toBe(true); // still needs the parent's agreement

    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: 'Sh1t' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /I am the parent/ }));
    expect(send.disabled).toBe(true); // the board name is not allowed

    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: 'Brave Otter' } });
    expect(send.disabled).toBe(false);
    fireEvent.click(send);

    expect(await screen.findByText('Request sent')).toBeTruthy();
    expect(h.calls).toEqual([
      { name: 'requestJoin', data: { code: 'ABCD2345', children: [{ kidId: 'k1', boardName: 'Brave Otter' }] } },
    ]);
  });

  it('never sends the real name or nickname when joining', async () => {
    render(<GroupsView uid="u1" profiles={[kid({ nickname: 'SecretNick', name: 'Real Name' })]} requirePin={requirePin} initialCode="ABCD2345" onCodeHandled={() => {}} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Share SecretNick/ }));
    fireEvent.change(screen.getByLabelText('Name on the board'), { target: { value: 'Happy Fox' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /I am the parent/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ask to join' }));
    await waitFor(() => expect(h.calls).toHaveLength(1));
    const sent = JSON.stringify(h.calls[0]);
    expect(sent).not.toContain('SecretNick');
    expect(sent).not.toContain('Real Name');
  });

  it('ranks the board by this week only, and marks your own child', async () => {
    h.groups = [{ groupId: 'g1', name: 'Sunrise Club', role: 'member' }];
    const thisWeek = (await import('@kiyuv/shared')).weekKey(Date.now(), 'Asia/Kolkata');
    h.board = {
      groupId: 'g1', name: 'Sunrise Club', ownerUid: 'boss', memberCount: 3, timezone: 'Asia/Kolkata',
      entries: [
        { entryId: 'e1', boardName: 'Brave Otter', avatar: '🦦', favColor: 'blue', weekKey: thisWeek, weekStars: 5 },
        { entryId: 'e2', boardName: 'Happy Fox', avatar: '🦊', favColor: 'red', weekKey: thisWeek, weekStars: 9 },
        { entryId: 'e3', boardName: 'Old Owl', avatar: '🦉', favColor: 'teal', weekKey: '2020-01-06', weekStars: 99 },
      ],
    };
    render(<GroupsView uid="u1" profiles={[kid({})]} requirePin={requirePin} initialCode={null} onCodeHandled={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /Sunrise Club/ }));
    await screen.findByRole('heading', { name: 'This week' });
    const rows = screen.getAllByRole('listitem').filter((li) => li.className.includes('board-row'));
    expect(rows.map((r) => r.querySelector('.board-name')?.textContent?.trim())).toEqual(['Happy Fox', 'Brave Otter', 'Old Owl']);
    expect(rows[2]!.textContent).toContain('⭐ 0'); // last week's stars do not count
  });
});

describe('join links', () => {
  afterEach(() => clearJoinCode());

  it('keeps the code for this tab and reads it from /join#CODE', () => {
    expect(readJoinCode({ pathname: '/join', hash: '#abcd2345' })).toBe('ABCD2345');
    expect(readJoinCode({ pathname: '/', hash: '' })).toBe('ABCD2345'); // remembered across sign-in
    clearJoinCode();
    expect(readJoinCode({ pathname: '/', hash: '' })).toBeNull();
  });

  it('ignores a malformed code', () => {
    expect(readJoinCode({ pathname: '/join', hash: '#nope' })).toBeNull();
  });
});
