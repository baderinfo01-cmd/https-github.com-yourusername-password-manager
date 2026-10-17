"use client";
import { create } from "zustand";
import { api, call } from "@/lib/api";
import { round } from "@/lib/calc";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import type { Item, Settings } from "@/lib/types";

/**
 * Data store = in-memory mirror of the SQLite records + the business actions.
 * Pattern for EVERY entity (copy it):
 *   1. a `kind` string ("items": /^[a-z_]{2,32}$/) -- no schema change needed
 *   2. state array + load() entry + reset() entry
 *   3. saveX / removeX that call api().db.* then upsert into state
 * Anything touching several records (a document + stock + payments) goes through api().db.batch(ops):
 * one SQLite transaction, all-or-nothing. See references/data-model.md (the reference saveDoc is described in the skill's references/data-model.md).
 */
interface DataState {
  loaded: boolean;
  settings: Settings;
  items: Item[];
  audit: any[];
  load(): Promise<void>;
  reset(): void;
  saveSettings(s: Settings): Promise<void>;
  saveItem(i: Partial<Item>): Promise<Item>;
  removeItem(id: string): Promise<void>;
  adjustQty(id: string, delta: number): Promise<void>;
  nextNumber(prefix: string, year: string): Promise<string>;
  log(action: string, detail?: object): void;
}

const list = <T,>(kind: string) => call<T[]>(api().db.list(kind));

// Extra stores (scripts/add_module.py creates one per module) register here so that signing out wipes their data too.
const resetters = new Set<() => void>();
export const onReset = (fn: () => void) => { resetters.add(fn); };

export const useData = create<DataState>((set, get) => ({
  loaded: false,
  settings: DEFAULT_SETTINGS,
  items: [],
  audit: [],

  async load() {
    const [settingsArr, items, audit] = await Promise.all([list<Settings>("settings"), list<Item>("items"), list<any>("audit")]);
    const saved = settingsArr.find((s) => s.id === "main");
    // merge over defaults so settings saved by an OLDER version still have every new field (cheap "migration")
    const settings: Settings = saved
      ? { ...DEFAULT_SETTINGS, ...saved, company: { ...DEFAULT_SETTINGS.company, ...saved.company }, currency: { ...DEFAULT_SETTINGS.currency, ...saved.currency } }
      : DEFAULT_SETTINGS;
    set({ settings, items, audit: audit.sort((a, b) => b.at - a.at), loaded: true });
  },
  reset: () => { resetters.forEach((fn) => fn()); set({ loaded: false, items: [], audit: [] }); },

  async saveSettings(s) {
    const saved = await call<Settings>(api().db.save("settings", s));
    set({ settings: saved });
  },

  async saveItem(i) {
    const saved = await call<Item>(api().db.save("items", i));
    set((st) => ({ items: upsert(st.items, saved) }));
    get().log(i.id ? "update-item" : "create-item", { name: saved.name });
    return saved;
  },
  async removeItem(id) {
    await call(api().db.remove("items", id));
    set((st) => ({ items: st.items.filter((x) => x.id !== id) }));
    get().log("delete-item", { id });
  },

  // Example of a multi-record change: item + an audit-style movement in ONE transaction.
  async adjustQty(id, delta) {
    const it = get().items.find((i) => i.id === id);
    if (!it || !delta) return;
    const updated = { ...it, qty: round(it.qty + delta, 4) };
    const res = await call<any[]>(api().db.batch([
      { op: "save", kind: "items", doc: updated },
      { op: "save", kind: "moves", doc: { id: crypto.randomUUID(), itemId: id, qty: delta, date: new Date().toISOString().slice(0, 10) } },
    ]));
    set((st) => ({ items: upsert(st.items, res[0]) }));
  },

  // Sequential, gap-free numbers come from a counter in the MAIN process (atomic), e.g. FA-2026-00001.
  async nextNumber(prefix, year) {
    const n = await call<number>(api().db.next(`${prefix}:${year}`));
    return `${prefix}-${year}-${String(n).padStart(5, "0")}`;
  },

  log(action, detail) {
    void api().db.audit(action, detail);
  },
}));

export function upsert<T extends { id: string }>(arr: T[], item: T): T[] {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i < 0) return [...arr, item];
  const copy = arr.slice();
  copy[i] = item;
  return copy;
}
