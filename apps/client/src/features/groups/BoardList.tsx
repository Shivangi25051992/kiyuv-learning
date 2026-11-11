import React, { useMemo } from 'react';
import { FAV_COLOR_THEMES, visibleWeekStars, weekKey } from '@kiyuv/shared';
import type { GroupBoard } from '../../lib/firebase/index.js';

interface BoardListProps {
  board: GroupBoard;
  /** Entry ids of this family's own children, so they can be highlighted. */
  mineEntryIds: ReadonlySet<string>;
  isOwner: boolean;
  disabled?: boolean;
  onReport: (entryId: string) => void;
  onHide: (entryId: string) => void;
}

/** The weekly ranking for one group. Last week's stars never count. */
export const BoardList: React.FC<BoardListProps> = ({
  board,
  mineEntryIds,
  isOwner,
  disabled = false,
  onReport,
  onHide,
}) => {
  const ranked = useMemo(() => {
    const week = weekKey(Date.now(), board.timezone);
    return board.entries
      .map((e) => ({ ...e, stars: visibleWeekStars(e, week) }))
      .sort((a, b) => b.stars - a.stars || a.boardName.localeCompare(b.boardName));
  }, [board]);

  if (ranked.length === 0) {
    return (
      <p className="groups-lead">
        No children are on the board yet. Share a child from the Groups tab to start.
      </p>
    );
  }

  return (
    <>
      <ol className="board-list">
        {ranked.map((e, i) => {
          const theme =
            FAV_COLOR_THEMES[e.favColor as keyof typeof FAV_COLOR_THEMES] ?? FAV_COLOR_THEMES.blue;
          const isMine = mineEntryIds.has(e.entryId);
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
                    disabled={disabled}
                    onClick={() => {
                      if (window.confirm('Report this name to the group owner?')) onReport(e.entryId);
                    }}
                  >
                    Report
                  </button>
                  {isOwner && (
                    <button
                      type="button"
                      className="link-btn"
                      disabled={disabled}
                      onClick={() => onHide(e.entryId)}
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
      <p className="field-hint">
        Stars come from each child's app and are not checked, so this board is just for fun.
      </p>
    </>
  );
};
