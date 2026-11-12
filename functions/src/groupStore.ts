/**
 * A tiny database interface for the group service. The real one is backed by
 * Firestore; tests use the in-memory copy below, so the rules of the feature
 * (limits, races, expiry) are checked without an emulator.
 *
 * Like Firestore, a transaction must do all its reads before its writes.
 */

export type Doc = Record<string, unknown>;

/** Use as a value in `update` to remove that field. */
export const DELETE_FIELD: unique symbol = Symbol('deleteField');

export interface Tx {
  get(path: string): Promise<Doc | null>;
  set(path: string, data: Doc): void;
  /** Keys may be dotted paths such as `entries.abc123`. */
  update(path: string, patch: Record<string, unknown>): void;
  delete(path: string): void;
}

export interface Store {
  transact<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  /** Ids of the documents directly inside a collection. */
  ids(collectionPath: string): Promise<string[]>;
  /** Ids of documents in a top-level collection where `field` matches. */
  where(
    collectionPath: string,
    field: string,
    op: '==' | '<',
    value: string | number,
  ): Promise<string[]>;
  /** Full paths of every document, in any collection with this id, whose `field` equals `value`. */
  whereAnywhere(collectionId: string, field: string, value: string): Promise<string[]>;
}

// ------------------------------------------------------------------ memory

function clone<T>(v: T): T {
  return structuredClone(v);
}

function setNested(target: Doc, dotted: string, value: unknown): void {
  const parts = dotted.split('.');
  let node = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const next = node[key];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) node[key] = {};
    node = node[key] as Doc;
  }
  const last = parts[parts.length - 1]!;
  if (value === DELETE_FIELD) delete node[last];
  else node[last] = value;
}

function getNested(source: Doc, dotted: string): unknown {
  let node: unknown = source;
  for (const key of dotted.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Doc)[key];
  }
  return node;
}

export class MemoryStore implements Store {
  readonly data = new Map<string, Doc>();

  /** Test helper: seed a document. */
  put(path: string, doc: Doc): void {
    this.data.set(path, clone(doc));
  }

  read(path: string): Doc | undefined {
    const doc = this.data.get(path);
    return doc ? clone(doc) : undefined;
  }

  async transact<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    const writes: Array<() => void> = [];
    let wrote = false;
    const tx: Tx = {
      get: async (path) => {
        if (wrote) throw new Error('A transaction must read before it writes.');
        const doc = this.data.get(path);
        return doc ? clone(doc) : null;
      },
      set: (path, data) => {
        wrote = true;
        const copy = clone(data);
        writes.push(() => void this.data.set(path, copy));
      },
      update: (path, patch) => {
        wrote = true;
        const copy = { ...patch };
        writes.push(() => {
          const existing = this.data.get(path);
          if (!existing) throw new Error(`Cannot update a missing document: ${path}`);
          for (const [key, value] of Object.entries(copy)) {
            setNested(existing, key, value === DELETE_FIELD ? value : clone(value));
          }
        });
      },
      delete: (path) => {
        wrote = true;
        writes.push(() => void this.data.delete(path));
      },
    };
    const result = await fn(tx);
    for (const apply of writes) apply();
    return result;
  }

  async ids(collectionPath: string): Promise<string[]> {
    const prefix = `${collectionPath}/`;
    const out: string[] = [];
    for (const key of this.data.keys()) {
      if (key.startsWith(prefix) && !key.slice(prefix.length).includes('/')) {
        out.push(key.slice(prefix.length));
      }
    }
    return out;
  }

  async where(
    collectionPath: string,
    field: string,
    op: '==' | '<',
    value: string | number,
  ): Promise<string[]> {
    const out: string[] = [];
    for (const id of await this.ids(collectionPath)) {
      const found = getNested(this.data.get(`${collectionPath}/${id}`)!, field);
      if (op === '==' ? found === value : typeof found === 'number' && found < Number(value)) {
        out.push(id);
      }
    }
    return out;
  }

  async whereAnywhere(collectionId: string, field: string, value: string): Promise<string[]> {
    const out: string[] = [];
    for (const [path, doc] of this.data) {
      const parts = path.split('/');
      if (parts.length % 2 === 0 && parts[parts.length - 2] === collectionId && getNested(doc, field) === value) {
        out.push(path);
      }
    }
    return out;
  }
}
