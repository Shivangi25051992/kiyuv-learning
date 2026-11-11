import React, { useCallback, useEffect, useState } from 'react';
import { isGroupNameAllowed, type KidProfile } from '@kiyuv/shared';
import { callGroupFunction, fetchMyGroups, type MyGroup } from '../../lib/firebase/index.js';
import { Mascot } from '../../ui/Mascot.js';
import { GroupDetail } from './GroupDetail.js';
import { JoinGroupForm } from './JoinGroupForm.js';
import { useGroupAction } from './useGroupAction.js';

interface GroupsViewProps {
  uid: string;
  profiles: readonly KidProfile[];
  /** Runs the action once the parent's PIN is fresh (asks for it if not). */
  requirePin: (action: () => void) => void;
  /** A code from a join link, if the parent opened one. */
  initialCode: string | null;
  onCodeHandled: () => void;
}

type View =
  | { kind: 'home' }
  | { kind: 'create' }
  | { kind: 'join' }
  | { kind: 'group'; groupId: string };

export const GroupsView: React.FC<GroupsViewProps> = ({
  uid,
  profiles,
  requirePin,
  initialCode,
  onCodeHandled,
}) => {
  const [view, setView] = useState<View>(initialCode ? { kind: 'join' } : { kind: 'home' });
  const [groups, setGroups] = useState<MyGroup[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(async () => {
    try {
      setGroups(await fetchMyGroups(uid));
      setLoadError('');
    } catch {
      setLoadError('Could not load your groups. Check your connection and try again.');
    }
  }, [uid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const goHome = () => {
    onCodeHandled();
    setView({ kind: 'home' });
    void reload();
  };

  if (view.kind === 'group') {
    return (
      <GroupDetail
        uid={uid}
        groupId={view.groupId}
        profiles={profiles}
        requirePin={requirePin}
        onBack={goHome}
      />
    );
  }
  if (view.kind === 'join') {
    return (
      <JoinGroupForm
        profiles={profiles}
        requirePin={requirePin}
        initialCode={initialCode ?? ''}
        onDone={goHome}
        onCancel={goHome}
      />
    );
  }
  if (view.kind === 'create') {
    return (
      <CreateGroupForm
        requirePin={requirePin}
        onCreated={(groupId) => setView({ kind: 'group', groupId })}
        onCancel={goHome}
      />
    );
  }

  return (
    <div className="groups">
      <h1 className="groups-title">Groups</h1>
      <p className="groups-lead">Play along with friends and family. Each week the stars start again.</p>

      {loadError && (
        <p className="field-error" role="alert">
          {loadError}
        </p>
      )}

      {groups && groups.length === 0 && !loadError && (
        <div className="groups-empty">
          <Mascot mood="cheer" size={110} />
          <p>You are not in a group yet.</p>
        </div>
      )}

      {groups && groups.length > 0 && (
        <ul className="group-list">
          {groups.map((g) => (
            <li key={g.groupId}>
              <button
                type="button"
                className="group-card"
                onClick={() => setView({ kind: 'group', groupId: g.groupId })}
              >
                <span className="group-card-name">{g.name}</span>
                <span className="group-card-role">
                  {g.role === 'owner' ? 'You run this group' : 'Member'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="groups-actions">
        <button type="button" className="primary-btn big" onClick={() => setView({ kind: 'create' })}>
          Create a group
        </button>
        <button type="button" className="secondary-btn big" onClick={() => setView({ kind: 'join' })}>
          Join with a code
        </button>
      </div>
    </div>
  );
};

interface CreateGroupFormProps {
  requirePin: (action: () => void) => void;
  onCreated: (groupId: string) => void;
  onCancel: () => void;
}

const CreateGroupForm: React.FC<CreateGroupFormProps> = ({ requirePin, onCreated, onCancel }) => {
  const [name, setName] = useState('');
  const { busy, error, run } = useGroupAction(requirePin);
  const valid = isGroupNameAllowed(name);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    run(async () => {
      const res = await callGroupFunction<{ groupId: string }>('createGroup', { name });
      onCreated(res.groupId);
    });
  };

  return (
    <form className="groups" onSubmit={submit}>
      <h1 className="groups-title">Create a group</h1>
      <p className="groups-lead">
        For example a class, a neighbourhood or the cousins. You invite other families with a link and
        approve each one.
      </p>
      <label htmlFor="group-name">Group name</label>
      <input
        id="group-name"
        className="text-input"
        value={name}
        maxLength={30}
        autoFocus
        onChange={(e) => setName(e.target.value)}
      />
      <p className="field-hint">
        3 to 30 letters or numbers. Keep it kind, and do not use a child's real name.
      </p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="groups-actions">
        <button type="submit" className="primary-btn big" disabled={!valid || busy}>
          {busy ? 'Creating…' : 'Create group'}
        </button>
        <button type="button" className="secondary-btn big" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};
