import { useCallback, useState } from 'react';

/** Turns a Cloud Function error into a sentence a parent can act on. */
export function friendlyGroupError(err: unknown): string {
  const raw = err instanceof Error ? err.message : '';
  const message = raw.replace(/^(Firebase|FirebaseError):\s*/i, '').trim();
  if (!message || /^internal$/i.test(message)) {
    return 'Something went wrong. Please try again.';
  }
  return message;
}

/**
 * Runs a group change behind the parent PIN check and tracks "working" and
 * error state. Group changes need a PIN entered in the last 5 minutes.
 */
export function useGroupAction(requirePin: (action: () => void) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(
    (task: () => Promise<void>, onDone?: () => void) => {
      requirePin(() => {
        setBusy(true);
        setError('');
        task()
          .then(() => onDone?.())
          .catch((err: unknown) => setError(friendlyGroupError(err)))
          .finally(() => setBusy(false));
      });
    },
    [requirePin],
  );

  return { busy, error, run, setError };
}
