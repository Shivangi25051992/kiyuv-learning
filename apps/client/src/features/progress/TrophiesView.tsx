import React, { useEffect, useState } from 'react';
import type { KidProfile } from '@kiyuv/shared';
import { fetchMyGroups, type MyGroup } from '../../lib/firebase/index.js';
import { GroupBoardPanel } from '../groups/GroupBoardPanel.js';
import { IconGroup } from '../../ui/Icons.js';
import { LeaderboardView } from './LeaderboardView.js';

interface TrophiesViewProps {
  uid: string;
  profiles: readonly KidProfile[];
  /** Runs the action once the parent's PIN is fresh (asks for it if not). */
  requirePin: (action: () => void) => void;
  onOpenParentReset: () => void;
  onManageGroups: () => void;
}

const FAMILY = 'family';

/** Trophies: the family board, plus a weekly board for each group the family is in. */
export const TrophiesView: React.FC<TrophiesViewProps> = ({
  uid,
  profiles,
  requirePin,
  onOpenParentReset,
  onManageGroups,
}) => {
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [selected, setSelected] = useState<string>(FAMILY);

  useEffect(() => {
    let cancelled = false;
    fetchMyGroups(uid)
      .then((list) => {
        if (!cancelled) setGroups(list);
      })
      .catch(() => {
        // Offline or not allowed yet: the family board still works on its own.
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // If the chosen group disappears (left or closed), go back to the family board.
  const current = selected === FAMILY || groups.some((g) => g.groupId === selected) ? selected : FAMILY;

  return (
    <div className="trophies">
      {groups.length > 0 && (
        <div className="board-choices" role="group" aria-label="Choose a leaderboard">
          <button
            type="button"
            className={`board-choice ${current === FAMILY ? 'active' : ''}`}
            aria-pressed={current === FAMILY}
            onClick={() => setSelected(FAMILY)}
          >
            My family
          </button>
          {groups.map((g) => (
            <button
              key={g.groupId}
              type="button"
              className={`board-choice ${current === g.groupId ? 'active' : ''}`}
              aria-pressed={current === g.groupId}
              onClick={() => setSelected(g.groupId)}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {current === FAMILY ? (
        <LeaderboardView profiles={profiles} onOpenParentReset={onOpenParentReset} />
      ) : (
        <GroupBoardPanel key={current} uid={uid} groupId={current} requirePin={requirePin} />
      )}

      <div className="trophies-groups">
        {groups.length === 0 && (
          <p className="groups-lead">Play along with friends and family in a group.</p>
        )}
        <button type="button" className="secondary-btn big" onClick={onManageGroups}>
          <IconGroup size={22} /> {groups.length === 0 ? 'Play with friends' : 'Manage groups'}
        </button>
      </div>
    </div>
  );
};
