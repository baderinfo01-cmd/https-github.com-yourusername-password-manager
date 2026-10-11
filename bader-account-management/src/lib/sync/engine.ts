/**
 * Sync engine: item-level, last-writer-wins, end-to-end encrypted.
 * No UI / store imports, so it is unit-testable in Node with a fake store and the real PHP relay.
 */
import { canonical, deriveKeys, hashItem, itemKey, open, seal, type SyncKeys } from "./crypto.ts";

export type Item = Record<string, any>;

export interface CollectionSpec {
  name: string;
  idOf: (item: Item) => string;
}

export const COLLECTIONS: CollectionSpec[] = [
  { name: "accounts", idOf: (x) => x.id },
  { name: "subscriptions", idOf: (x) => x.id },
  { name: "cards", idOf: (x) => x.id },
  { name: "documents", idOf: (x) => x.id },
  { name: "contacts", idOf: (x) => x.id },
  { name: "cardCategories", idOf: (x) => x.value },
  { name: "documentCategories", idOf: (x) => x.value },
  { name: "contactCategories", idOf: (x) => x.value },
  { name: "generatedPasswords", idOf: (x) => x.id },
  // the personal profile is one record
  { name: "myInfo", idOf: () => "me" },
];

export interface Meta {
  c: string; // collection
  i: string; // id
  ts: number; // time of the last change we know about
  h: string; // hash of the item as it exists locally
  del?: boolean;
  dirty?: boolean;
  dev?: string;
}

export interface SyncState {
  cursor: number;
  meta: Record<string, Meta>;
}

/** What the engine needs from the app's data store. */
export interface Adapter {
  /** current data: arrays per collection (myInfo as a one-element array) */
  read(): Record<string, Item[]>;
  write(next: Record<string, Item[]>): void;
  getState(): SyncState;
  setState(s: SyncState): void;
}

export interface Transport {
  post(url: string, body: unknown): Promise<{ ok: boolean; status: number; json: any }>;
}

export interface EngineOptions {
  serverUrl: string;
  K: Uint8Array;
  deviceId: string; // 32 hex
  adapter: Adapter;
  transport: Transport;
  now?: () => number;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  applied: number;
  conflictsKeptLocal: number;
}

const beats = (a: { ts: number; dev?: string }, b: { ts: number; dev?: string }) =>
  a.ts > b.ts || (a.ts === b.ts && (a.dev || "") > (b.dev || ""));

export class SyncEngine {
  private keys!: SyncKeys;
  private ready: Promise<void>;
  private busy = false;
  private o: EngineOptions;

  constructor(o: EngineOptions) {
    this.o = o;
    this.ready = deriveKeys(o.K).then((d) => {
      this.keys = d.keys;
    });
  }

  get accountId() {
    return this.keys?.accountId;
  }

  private url(action: string) {
    return this.o.serverUrl.replace(/\/+$/, "") + (this.o.serverUrl.endsWith(".php") ? "" : "/api.php") + `?a=${action}`;
  }

  private async call(action: string, body: Record<string, unknown>) {
    const r = await this.o.transport.post(this.url(action), { id: this.keys.accountId, auth: this.keys.auth, ...body });
    if (!r.ok || !r.json?.ok) {
      const err = new Error(r.json?.error || `HTTP ${r.status}`);
      (err as any).code = r.json?.error || String(r.status);
      throw err;
    }
    return r.json;
  }

  /** Registers this sync account on the server (first device only). */
  async register(registerKey: string) {
    await this.ready;
    const { alert } = await deriveKeys(this.o.K);
    const r = await this.o.transport.post(this.url("register"), {
      id: this.keys.accountId,
      auth: this.keys.auth,
      alert_auth: alert.auth,
      register_key: registerKey,
    });
    if (!r.ok || !r.json?.ok) {
      const e = new Error(r.json?.error || `HTTP ${r.status}`);
      (e as any).code = r.json?.error || String(r.status);
      throw e;
    }
  }

  /** Verifies the key against the server (used when joining from the pairing code). */
  async verify() {
    await this.ready;
    await this.call("pull", { since: 0 });
  }

  async syncOnce(): Promise<SyncResult> {
    if (this.busy) return { pushed: 0, pulled: 0, applied: 0, conflictsKeptLocal: 0 };
    this.busy = true;
    try {
      await this.ready;
      const now = this.o.now ?? Date.now;
      const st = this.o.adapter.getState();
      const meta: Record<string, Meta> = { ...st.meta };
      let cols = this.o.adapter.read();
      const res: SyncResult = { pushed: 0, pulled: 0, applied: 0, conflictsKeptLocal: 0 };

      // A device that joins an account that already has data must not overwrite it with its own
      // defaults (empty profile, default categories): its pre-existing items get the oldest possible time.
      let t = now();
      if (st.cursor === 0 && Object.keys(st.meta).length === 0) {
        const peek = await this.call("pull", { since: 0 });
        if ((peek.ops as any[]).length > 0) t = 1;
      }

      // 1) detect local changes
      const seen = new Set<string>();
      for (const spec of COLLECTIONS) {
        for (const item of cols[spec.name] || []) {
          const id = spec.idOf(item);
          if (!id) continue;
          const k = await itemKey(this.keys.mac, spec.name, id);
          seen.add(k);
          const h = await hashItem(item);
          const m = meta[k];
          if (!m || m.del || m.h !== h) meta[k] = { c: spec.name, i: id, ts: t, h, dirty: true, dev: this.o.deviceId };
        }
      }
      for (const [k, m] of Object.entries(meta)) {
        if (!seen.has(k) && !m.del && COLLECTIONS.some((s) => s.name === m.c)) {
          meta[k] = { ...m, del: true, ts: t, dirty: true, dev: this.o.deviceId };
        }
      }

      // 2) pull + merge
      let cursor = st.cursor;
      let more = true;
      let changed = false;
      const next: Record<string, Item[]> = {};
      for (const spec of COLLECTIONS) next[spec.name] = [...(cols[spec.name] || [])];

      while (more) {
        const page = await this.call("pull", { since: cursor });
        for (const op of page.ops as any[]) {
          res.pulled++;
          cursor = Math.max(cursor, op.seq);
          const p = await open<{ c: string; i: string; d?: boolean; v?: Item; ts: number; dev: string }>(this.keys.enc, op.iv, op.ct, op.k);
          if (!p || !COLLECTIONS.some((s) => s.name === p.c)) continue;
          const spec = COLLECTIONS.find((s) => s.name === p.c)!;
          const k = await itemKey(this.keys.mac, p.c, p.i);
          if (k !== op.k) continue; // payload does not match its opaque key: ignore
          const local = meta[k];
          const remote = { ts: p.ts, dev: p.dev };
          if (local && !beats(remote, local) && !(local.ts === remote.ts && (local.dev || "") === (remote.dev || ""))) {
            if (local.dirty) res.conflictsKeptLocal++;
            continue;
          }
          if (local && local.ts === remote.ts && (local.dev || "") === (remote.dev || "")) continue; // our own echo

          const arr = next[p.c];
          const idx = arr.findIndex((x) => spec.idOf(x) === p.i);
          if (p.d) {
            if (idx >= 0) arr.splice(idx, 1);
            meta[k] = { c: p.c, i: p.i, ts: p.ts, h: "", del: true, dirty: false, dev: p.dev };
          } else if (p.v) {
            if (idx >= 0) arr[idx] = p.v;
            else arr.push(p.v);
            meta[k] = { c: p.c, i: p.i, ts: p.ts, h: await hashItem(p.v), dirty: false, dev: p.dev };
          }
          changed = true;
          res.applied++;
        }
        more = !!page.more;
        cursor = Math.max(cursor, page.cursor || 0);
      }

      if (changed) {
        this.o.adapter.write(next);
        cols = next;
      }

      // 3) push our dirty items
      const ops: { k: string; ts: number; iv: string; ct: string }[] = [];
      for (const [k, m] of Object.entries(meta)) {
        if (!m.dirty) continue;
        const spec = COLLECTIONS.find((s) => s.name === m.c)!;
        const item = m.del ? undefined : (cols[m.c] || []).find((x) => spec.idOf(x) === m.i);
        if (!m.del && !item) continue;
        const payload = { c: m.c, i: m.i, d: !!m.del, v: item, ts: m.ts, dev: m.dev || this.o.deviceId };
        const sealed = await seal(this.keys.enc, payload, k);
        ops.push({ k, ts: m.ts, ...sealed });
      }
      for (let i = 0; i < ops.length; i += 200) {
        const batch = ops.slice(i, i + 200);
        const r = await this.call("push", { device: this.o.deviceId, ops: batch });
        cursor = Math.max(cursor, 0);
        for (const op of batch) meta[op.k] = { ...meta[op.k], dirty: false };
        res.pushed += batch.length;
        void r;
      }

      this.o.adapter.setState({ cursor, meta });
      return res;
    } finally {
      this.busy = false;
    }
  }
}

export { canonical };
