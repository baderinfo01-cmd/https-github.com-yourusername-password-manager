"use client";
import { create } from "zustand";
import { api, call } from "@/lib/api";
import type { __Type__ } from "@/lib/types";
import { onReset, upsert } from "./data";

/** Store of the "__kind__" module (SQLite kind "__kind__"). Pattern: load on page mount, upsert after each write. */
interface State {
  rows: __Type__[];
  load(): Promise<void>;
  save(x: Partial<__Type__>): Promise<__Type__>;
  remove(id: string): Promise<void>;
}
export const use__Type__Store = create<State>((set) => {
  onReset(() => set({ rows: [] }));
  return {
    rows: [],
    async load() { set({ rows: await call<__Type__[]>(api().db.list("__kind__")) }); },
    async save(x) {
      const saved = await call<__Type__>(api().db.save("__kind__", x));
      set((s) => ({ rows: upsert(s.rows, saved) }));
      void api().db.audit(x.id ? "update-__kind__" : "create-__kind__", { name: saved.name });
      return saved;
    },
    async remove(id) {
      await call(api().db.remove("__kind__", id));
      set((s) => ({ rows: s.rows.filter((r) => r.id !== id) }));
      void api().db.audit("delete-__kind__", { id });
    },
  };
});
