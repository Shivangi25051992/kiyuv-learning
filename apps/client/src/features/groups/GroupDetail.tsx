import React, { useCallback, useEffect, useState } from 'react';
import type { KidProfile } from '@kiyuv/shared';
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
import { BoardList } from './BoardList.js';
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
        <BoardList
          board={board}
          mineEntryIds={mine}
          isOwner={isOwner}
          disabled={busy}
          onReport={(entryId) => act('reportEntry', { entryId }, 'Thank you. We will look at it.')}
          onHide={(entryId) => act('hideEntry', { entryId }, 'Hidden from the board.')}
        />
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
