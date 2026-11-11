import React, { useState } from 'react';
import { extractInviteCode, isInviteCodeShape, type KidProfile } from '@kiyuv/shared';
import { callGroupFunction } from '../../lib/firebase/index.js';
import { Mascot } from '../../ui/Mascot.js';
import {
  ChildSharePicker,
  SHARING_NOTE,
  shareChoiceIsValid,
  type ShareChoice,
} from './ChildSharePicker.js';
import { useGroupAction } from './useGroupAction.js';

interface JoinGroupFormProps {
  profiles: readonly KidProfile[];
  requirePin: (action: () => void) => void;
  initialCode: string;
  onDone: () => void;
  onCancel: () => void;
}

export const JoinGroupForm: React.FC<JoinGroupFormProps> = ({
  profiles,
  requirePin,
  initialCode,
  onDone,
  onCancel,
}) => {
  const [codeText, setCodeText] = useState(initialCode);
  const [choice, setChoice] = useState<ShareChoice>({});
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const { busy, error, run } = useGroupAction(requirePin);

  const code = extractInviteCode(codeText);
  const chosen = Object.keys(choice).length;
  const ready = isInviteCodeShape(code) && chosen > 0 && shareChoiceIsValid(choice) && agreed;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    run(async () => {
      const children = Object.entries(choice).map(([kidId, boardName]) => ({ kidId, boardName }));
      const res = await callGroupFunction<{ groupName: string }>('requestJoin', { code, children });
      setSent(res.groupName);
    });
  };

  if (sent !== null) {
    return (
      <div className="groups groups-empty">
        <Mascot mood="cheer" size={110} />
        <h1 className="groups-title">Request sent</h1>
        <p>
          The owner of <strong>{sent}</strong> needs to approve your family. Come back here later to
          see the group.
        </p>
        <button type="button" className="primary-btn big" onClick={onDone}>
          Done
        </button>
      </div>
    );
  }

  return (
    <form className="groups" onSubmit={submit}>
      <h1 className="groups-title">Join a group</h1>

      <label htmlFor="join-code">Invite code or link</label>
      <input
        id="join-code"
        className="text-input"
        value={codeText}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setCodeText(e.target.value)}
      />

      <h2 className="groups-sub">Who will take part?</h2>
      <ChildSharePicker profiles={profiles} value={choice} onChange={setChoice} idPrefix="join" />
      <p className="field-hint">{SHARING_NOTE}</p>

      <label className="share-check consent">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>I am the parent, and I agree to share what is described above.</span>
      </label>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="groups-actions">
        <button type="submit" className="primary-btn big" disabled={!ready || busy}>
          {busy ? 'Sending…' : 'Ask to join'}
        </button>
        <button type="button" className="secondary-btn big" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};
