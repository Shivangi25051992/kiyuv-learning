import React, { useState } from 'react';
import { isGroupNameAllowed } from '@kiyuv/shared';
import {
  callGroupFunction,
  type GroupJoinRequest,
  type GroupMemberInfo,
} from '../../lib/firebase/index.js';
import { useGroupAction } from './useGroupAction.js';

interface OwnerPanelProps {
  uid: string;
  groupId: string;
  groupName: string;
  admin: { members: GroupMemberInfo[]; requests: GroupJoinRequest[] };
  requirePin: (action: () => void) => void;
  onChanged: () => void;
  onClosed: () => void;
}

interface InviteInfo {
  code: string;
  link: string;
  expiresAt: number;
  maxUses: number;
}

const boardNames = (shared: Record<string, { boardName: string }>): string =>
  Object.values(shared)
    .map((s) => s.boardName)
    .join(', ') || 'No children shared';

/** Everything only the group owner can do. */
export const OwnerPanel: React.FC<OwnerPanelProps> = ({
  uid,
  groupId,
  groupName,
  admin,
  requirePin,
  onChanged,
  onClosed,
}) => {
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [newName, setNewName] = useState(groupName);
  const [copied, setCopied] = useState('');
  const { busy, error, run } = useGroupAction(requirePin);

  const call = (name: string, extra: Record<string, unknown> = {}, then: () => void = onChanged) =>
    run(async () => void (await callGroupFunction(name, { groupId, ...extra })), then);

  const makeInvite = () =>
    run(async () => {
      setInvite(await callGroupFunction<InviteInfo>('createInvite', { groupId }));
      setCopied('');
    });

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`${label} copied.`);
    } catch {
      setCopied('Press and hold the text to copy it.');
    }
  };

  const others = admin.members.filter((m) => m.uid !== uid);

  return (
    <section className="owner-panel" aria-labelledby="owner-heading">
      <h2 className="groups-sub" id="owner-heading">
        You run this group
      </h2>

      <h3 className="groups-sub2">Families waiting to join</h3>
      {admin.requests.length === 0 ? (
        <p className="field-hint">Nobody is waiting.</p>
      ) : (
        <ul className="owner-list">
          {admin.requests.map((r, i) => (
            <li key={r.uid} className="owner-item">
              <span>
                <strong>New family {i + 1}</strong>
                <br />
                {Object.values(r.children)
                  .map((c) => `${c.avatar} ${c.boardName}`)
                  .join(', ')}
              </span>
              <span className="owner-item-actions">
                <button type="button" className="primary-btn small" disabled={busy} onClick={() => call('approveMember', { uid: r.uid })}>
                  Approve
                </button>
                <button type="button" className="secondary-btn small" disabled={busy} onClick={() => call('declineMember', { uid: r.uid })}>
                  Decline
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="groups-sub2">Invite a family</h3>
      <p className="field-hint">
        The link works for 3 days and 10 families. You still approve each family before it joins.
      </p>
      <div className="owner-row">
        <button type="button" className="primary-btn small" disabled={busy} onClick={makeInvite}>
          Make an invite link
        </button>
        <button type="button" className="secondary-btn small" disabled={busy} onClick={() => call('revokeInvites')}>
          Turn off old links
        </button>
      </div>
      {invite && (
        <div className="invite-box">
          <p>
            Code: <strong className="invite-code">{invite.code}</strong>
          </p>
          <p className="invite-link">{invite.link}</p>
          <div className="owner-row">
            <button type="button" className="secondary-btn small" onClick={() => void copy(invite.link, 'Link')}>
              Copy link
            </button>
            {typeof navigator.share === 'function' && (
              <button
                type="button"
                className="secondary-btn small"
                onClick={() => void navigator.share({ title: groupName, url: invite.link }).catch(() => undefined)}
              >
                Share
              </button>
            )}
          </div>
          <p role="status" className="field-hint">
            {copied}
          </p>
        </div>
      )}

      <h3 className="groups-sub2">Families in the group</h3>
      {others.length === 0 ? (
        <p className="field-hint">Only your family is here so far.</p>
      ) : (
        <ul className="owner-list">
          {others.map((m, i) => (
            <li key={m.uid} className="owner-item">
              <span>
                <strong>Family {i + 1}</strong>
                <br />
                {boardNames(m.shared)}
              </span>
              <span className="owner-item-actions">
                <button
                  type="button"
                  className="secondary-btn small"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm('Make this family the owner? You will become a member.')) {
                      call('transferOwnership', { uid: m.uid });
                    }
                  }}
                >
                  Make owner
                </button>
                <button
                  type="button"
                  className="danger-btn small"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm('Remove this family? They cannot rejoin with the same link.')) {
                      call('removeMember', { uid: m.uid });
                    }
                  }}
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="groups-sub2">Group name</h3>
      <div className="owner-row">
        <label className="sr-only" htmlFor="rename-group">
          Group name
        </label>
        <input id="rename-group" className="text-input" value={newName} maxLength={30} onChange={(e) => setNewName(e.target.value)} />
        <button
          type="button"
          className="secondary-btn small"
          disabled={busy || newName === groupName || !isGroupNameAllowed(newName)}
          onClick={() => call('renameGroup', { name: newName })}
        >
          Rename
        </button>
      </div>

      <h3 className="groups-sub2">Close the group</h3>
      <p className="field-hint">This removes the group and its board for everyone, straight away.</p>
      <button
        type="button"
        className="danger-btn"
        disabled={busy}
        onClick={() => {
          if (window.confirm(`Close "${groupName}" for everyone? This cannot be undone.`)) {
            call('closeGroup', {}, onClosed);
          }
        }}
      >
        Close group
      </button>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};
