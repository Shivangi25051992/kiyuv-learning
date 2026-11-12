import React, { useState } from 'react';
import { isNativeApp } from '../../lib/native.js';
import { shareTextFile } from '../../lib/nativeInit.js';

/** Word the parent types to confirm. Typing it makes a slip-up on a phone unlikely. */
export const DELETE_WORD = 'DELETE';

interface AccountDataSectionProps {
  childCount: number;
  /** Returns the file text to save. Throws when the PIN is no longer fresh. */
  onExport: () => Promise<string>;
  /** Deletes everything on the server and on this device. */
  onDelete: () => Promise<void>;
  /** Saves text as a file. Replaced on phones, where a browser download does not work. */
  onSaveFile?: (fileName: string, text: string) => void | Promise<void>;
}

function friendly(err: unknown, what: string): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code.includes('permission-denied') || code.includes('unauthenticated')) {
    return 'Your PIN has timed out. Close this window, open the Parent area again with your PIN, then try again.';
  }
  return `Could not ${what}. Check your connection and try again.`;
}

export function saveTextFile(fileName: string, text: string): void | Promise<void> {
  if (isNativeApp()) return shareTextFile(fileName, text);
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const AccountDataSection: React.FC<AccountDataSectionProps> = ({
  childCount,
  onExport,
  onDelete,
  onSaveFile = saveTextFile,
}) => {
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');

  const handleExport = async () => {
    setBusy('export');
    setError('');
    setMessage('');
    try {
      const text = await onExport();
      await onSaveFile('kiyuv-my-data.json', text);
      setMessage('Your data file is ready.');
    } catch (err) {
      setError(friendly(err, 'prepare your data'));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setBusy('delete');
    setError('');
    try {
      await onDelete();
    } catch (err) {
      setError(friendly(err, 'delete the account'));
      setBusy(null);
    }
  };

  const canDelete = typed.trim().toUpperCase() === DELETE_WORD && busy === null;

  return (
    <section className="parent-section" aria-labelledby="acct-data-h" style={{ marginTop: 20 }}>
      <h4 id="acct-data-h" style={{ margin: '0 0 6px' }}>Your data</h4>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--muted)' }}>
        Download everything we keep about your family, or delete your account and all of it.
      </p>
      <button
        type="button"
        className="secondary-btn"
        disabled={busy !== null}
        onClick={() => void handleExport()}
      >
        {busy === 'export' ? 'Preparing...' : '⬇️ Download my data'}
      </button>
      {message && (
        <p role="status" style={{ fontSize: 13, margin: '8px 0 0' }}>
          {message}
        </p>
      )}

      <div style={{ marginTop: 14 }}>
        {!confirming ? (
          <button
            type="button"
            className="danger-outline-btn"
            disabled={busy !== null}
            onClick={() => setConfirming(true)}
          >
            Delete my account
          </button>
        ) : (
          <div className="delete-confirm-box">
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#b91c1c', fontWeight: 700 }}>
              This permanently deletes your account, {childCount === 1 ? 'the child profile' : `all ${childCount} child profiles`},
              their stars and progress, and any groups you are in. It cannot be undone.
            </p>
            <label htmlFor="acct-delete-word" style={{ fontSize: 13 }}>
              Type <b>{DELETE_WORD}</b> to confirm
            </label>
            <input
              id="acct-delete-word"
              className="text-input"
              value={typed}
              autoComplete="off"
              autoCapitalize="characters"
              onChange={(e) => setTyped(e.target.value)}
              style={{ margin: '6px 0 10px' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ flex: 1 }}
                disabled={busy === 'delete'}
                onClick={() => {
                  setConfirming(false);
                  setTyped('');
                }}
              >
                Keep my account
              </button>
              <button
                type="button"
                className="danger-btn"
                style={{ flex: 1 }}
                disabled={!canDelete}
                onClick={() => void handleDelete()}
              >
                {busy === 'delete' ? 'Deleting...' : 'Delete everything'}
              </button>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};
