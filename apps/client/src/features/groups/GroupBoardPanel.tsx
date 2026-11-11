import React, { useCallback, useEffect, useState } from 'react';
import {
  callGroupFunction,
  fetchGroupBoard,
  fetchMyMembership,
  type GroupBoard,
  type GroupMemberInfo,
} from '../../lib/firebase/index.js';
import { IconRefresh } from '../../ui/Icons.js';
import { BoardList } from './BoardList.js';
import { useGroupAction } from './useGroupAction.js';

interface GroupBoardPanelProps {
  uid: string;
  groupId: string;
  requirePin: (action: () => void) => void;
}

/** One group's weekly board, as shown under Trophies. Changes to the group are in Manage groups. */
export const GroupBoardPanel: React.FC<GroupBoardPanelProps> = ({ uid, groupId, requirePin }) => {
  const [board, setBoard] = useState<GroupBoard | null>(null);
  const [membership, setMembership] = useState<GroupMemberInfo | null>(null);
  const [problem, setProblem] = useState('');
  const [notice, setNotice] = useState('');
  const { busy, error, run } = useGroupAction(requirePin);

  const load = useCallback(async () => {
    try {
      const loaded = await fetchGroupBoard(groupId);
      if (!loaded) {
        setBoard(null);
        setProblem('This group is no longer available.');
        return;
      }
      setBoard(loaded);
      setMembership(await fetchMyMembership(groupId, uid));
      setProblem('');
    } catch {
      setProblem('Could not open this board. Check your connection, or you may no longer be in the group.');
    }
  }, [groupId, uid]);

  useEffect(() => {
    setBoard(null);
    setNotice('');
    void load();
  }, [load]);

  if (problem) {
    return (
      <p className="field-error" role="alert">
        {problem}
      </p>
    );
  }
  if (!board) return <p role="status">Loading…</p>;

  const mine = new Set(Object.values(membership?.shared ?? {}).map((s) => s.entryId));
  const act = (name: string, entryId: string, message: string) =>
    run(
      async () => {
        await callGroupFunction(name, { groupId, entryId });
        setNotice(message);
      },
      () => void load(),
    );

  return (
    <div className="groups">
      <div className="groups-head">
        <h2 className="groups-sub">{board.name}</h2>
        <button type="button" className="icon-btn" aria-label="Refresh the board" onClick={() => void load()}>
          <IconRefresh />
        </button>
      </div>
      <p className="groups-lead">
        {board.memberCount} {board.memberCount === 1 ? 'family' : 'families'} · weekly stars, a new week every Monday
      </p>
      <BoardList
        board={board}
        mineEntryIds={mine}
        isOwner={board.ownerUid === uid}
        disabled={busy}
        onReport={(id) => act('reportEntry', id, 'Thank you. We will look at it.')}
        onHide={(id) => act('hideEntry', id, 'Hidden from the board.')}
      />
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
