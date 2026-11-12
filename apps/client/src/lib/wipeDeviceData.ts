/**
 * Removes everything this app stored on the device: saved rounds, check-ins, looks,
 * settings and the offline copy of the database. Used after an account is deleted.
 */
export async function wipeDeviceData(): Promise<void> {
  for (const store of [safeStorage('localStorage'), safeStorage('sessionStorage')]) {
    if (!store) continue;
    for (const key of Object.keys(store)) {
      if (key.startsWith('kiyuv') || key.startsWith('kidsAcad') || key.startsWith('firebase:')) {
        try {
          store.removeItem(key);
        } catch {
          // Ignore: the browser may block storage.
        }
      }
    }
  }
  try {
    const dbs = (await indexedDB.databases?.()) ?? [];
    await Promise.all(
      dbs
        .map((d) => d.name ?? '')
        .filter((name) => name.startsWith('firestore') || name.startsWith('firebase'))
        .map(
          (name) =>
            new Promise<void>((resolve) => {
              const req = indexedDB.deleteDatabase(name);
              req.onsuccess = req.onerror = req.onblocked = () => resolve();
            }),
        ),
    );
  } catch {
    // Offline copy stays if the browser cannot list databases; it holds nothing the server still has.
  }
}

function safeStorage(kind: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    return globalThis[kind];
  } catch {
    return null;
  }
}
