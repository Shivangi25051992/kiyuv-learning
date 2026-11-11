import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FAV_COLOR_THEMES, visibleWeekStars, weekKey, type KidProfile } from '@kiyuv/shared';
import {
  callGroupFunction,
  fetchGroupAdmin,
  fetchGroupBoard,
  fetchMyMembership,
  type GroupBoard,
  type GroupJoinRequest,
  type GroupMemberInfo,
} from '../../lib/firebase/index.js';
import { IconBack, IconRefresh } from '../../ui/Icons.js';
import {
  ChildSharePicker,
  SHARING_NOTE,
  shareChoiceIsValid,
  type ShareChoice,
} from './ChildSharePicker.js';
import { OwnerPanel } from './OwnerPanel.js';
import { useGroupAction } from './useGroupAction.js';

interface GroupDetailProps {
  uid: string;
  groupId: string;
  profiles: readonly KidProfile[];
  requirePin: (action: () => void) => void;
  onBack: () => void;
}

interface Loaded {
  board: GroupBoard;
  membership: GroupMemberInfo | null;
  admin: { members: GroupMemberInfo[]; requests: GroupJoinRequest[] } | null;
}

function choiceFrom(membership: GroupMemberInfo | null): ShareChoice {
  const out: ShareChoice = {};
  for (const [kidId, entry] of Object.entries(membership?.shared ?? {})) out[kidId] = entry.boardName;
  return out;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({
  uid,
  groupId,
  profiles,
  requirePin,
  onBack,
}) => {
  const [data, setData] = useState<Loaded | null>(null);
  const [gone, setGone] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [choice, setChoice] = useState<ShareChoice>({});
  const [notice, setNotice] = useState('');
  const { busy, error, run } = useGroupAction(requirePin);

  const load = useCallback(async () => {
    try {
      const board = await fetchGroupBoard(groupId);
      if (!board) {
        setGone(true);
        return;
      }
      const membership = await fetchMyMembership(groupId, uid);
      const admin = board.ownerUid === uid ? await fetchGroupAdmin(groupId) : null;
      setData({ board, membership, admin });
      setChoice(choiceFrom(membership));
      setLoadError('');
    } catch {
      // A removed family can no longer read the group, so treat that the same way.
      setLoadError('Could not open this group. You may have been removed, or the group was closed.');
    }
  }, [groupId, uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const ranked = useMemo(() => {
    if (!data) return [];
    const week = weekKey(Date.now(), data.board.timezone);
    return data.board.entries
      .map((e) => ({ ...e, stars: visibleWeekStars(e, week) }))
      .sort((a, b) => b.stars - a.stars || a.boardName.localeCompare(b.boardName));
  }, [data]);

  if (gone || loadError) {
    return (
      <div className="groups">
        <button type="button" className="secondary-btn small" onClick={onBack}>
          <IconBack size={18} /> Back
        </button>
        <p className="field-error" role="alert">
          {gone ? 'This group is no longer available.' : loadError}
        </p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="groups">
        <p role="status">Loading…</p>
      </div>
    );
  }

  const { board, membership, admin } = data;
  const isOwner = board.ownerUid === uid;
  const mine = new Set(Object.values(membership?.shared ?? {}).map((s) => s.entryId));
  const changed = JSON.stringify(choice) !== JSON.stringify(choiceFrom(membership));

  const saveChildren = () =>
    run(
      async () => {
        const children = Object.entries(choice).map(([kidId, boardName]) => ({ kidId, boardName }));
        await callGroupFunction('setSharedChildren', { groupId, children });
        setNotice('Saved.');
      },
      () => void load(),
    );

  const act = (name: string, extra: Record<string, unknown>, message: string) =>
    run(
      async () => {
        await callGroupFunction(name, { groupId, ...extra });
        setNotice(message);
      },
      () => void load(),
    );

  const leave = () => {
    if (!window.confirm('Leave this group? Your children will be taken off the board.')) return;
    run(
      async () => {
        await callGroupFunction('leaveGroup', { groupId });
      },
      onBack,
    );
  };

  return (
    <div className="groups">
      <div className="groups-head">
        <button type="button" className="secondary-btn small" onClick={onBack}>
          <IconBack size={18} /> Back
        </button>
        <button type="button" className="icon-btn" aria-label="Refresh the board" onClick={() => void load()}>
          <IconRefresh />
        </button>
      </div>

      <h1 className="groups-title">{board.name}</h1>
      <p className="groups-lead">
        {board.memberCount} {board.memberCount === 1 ? 'family' : 'families'} · weekly stars, new week every Monday
      </p>

      <section aria-labelledby="board-heading">
        <h2 className="groups-sub" id="board-heading">
          This week
        </h2>
        {ranked.length === 0 ? (
          <p className="groups-lead">No children are on the board yet. Share a child below to start.</p>
        ) : (
          <ol className="board-list">
            {ranked.map((e, i) => {
              const theme = FAV_COLOR_THEMES[e.favColor as keyof typeof FAV_COLOR_THEMES] ?? FAV_COLOR_THEMES.blue;
              const isMine = mine.has(e.entryId);
              return (
                <li
                  key={e.entryId}
                  className={`board-row ${isMine ? 'mine' : ''}`}
                  style={{ borderColor: theme.accent, background: theme.bgLight }}
                >
                  <span className="board-rank">{i === 0 && e.stars > 0 ? '👑' : `#${i + 1}`}</span>
                  <span className="board-avatar" aria-hidden="true">
                    {e.avatar}
                  </span>
                  <span className="board-name" style={{ color: theme.hex }}>
                    {e.boardName}
                    {isMine && <span className="board-you"> (yours)</span>}
                  </span>
                  <span className="board-stars">⭐ {e.stars}</span>
                  {!isMine && (
                    <span className="board-actions">
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => {
                          if (window.confirm('Report this name to the group owner?')) {
                            act('reportEntry', { entryId: e.entryId }, 'Thank you. We will look at it.');
                          }
                        }}
                      >
                        Report
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => act('hideEntry', { entryId: e.entryId }, 'Hidden from the board.')}
                        >
                          Hide
                        </button>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <p className="field-hint">
          Stars come from each child's app and are not checked, so this board is just for fun.
        </p>
      </section>

      <section aria-labelledby="mine-heading">
        <h2 className="groups-sub" id="mine-heading">
          Your children in this group
        </h2>
        <ChildSharePicker profiles={profiles} value={choice} onChange={setChoice} idPrefix="mine" />
        <p className="field-hint">{SHARING_NOTE}</p>
        <button
          type="button"
          className="primary-btn"
          disabled={!changed || !shareChoiceIsValid(choice) || busy}
          onClick={saveChildren}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </section>

      {isOwner && admin && (
        <OwnerPanel
          uid={uid}
          groupId={groupId}
          groupName={board.name}
          admin={admin}
          requirePin={requirePin}
          onChanged={() => void load()}
          onClosed={onBack}
        />
      )}

      {!isOwner && (
        <button type="button" className="danger-btn" onClick={leave} disabled={busy}>
          Leave group
        </button>
      )}

      <div role="status" aria-live="polite">
        {notice && <p className="field-hint">{notice}</p>}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
