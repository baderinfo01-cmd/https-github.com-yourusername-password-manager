"use client";
// Thin client for the Electron bridge (window.bridge, see electron/preload.js). In a plain browser (npm run dev,
// Playwright against out/) a small localStorage-backed stand-in with the SAME interface is used instead.
// The stand-in is for development/tests only (weak hashing, no real permissions); inside the .exe window.bridge
// always exists so it is never used. Keep both sides in sync when you add an IPC method.

import type { User } from "./types";

type Res<T> = { ok: true; data: T } | { ok: false; error: string };

export interface Bridge {
  db: {
    list(kind: string): Promise<Res<any[]>>; get(kind: string, id: string): Promise<Res<any>>;
    save(kind: string, doc: any): Promise<Res<any>>; remove(kind: string, id: string): Promise<Res<boolean>>;
    batch(ops: any[]): Promise<Res<any[]>>; next(name: string): Promise<Res<number>>; audit(a: string, d?: any): Promise<Res<boolean>>;
  };
  auth: {
    recover(u: string, k: string, n: string): Promise<Res<{ recoveryKey: string }>>; newRecovery(pw: string): Promise<Res<{ recoveryKey: string }>>;
    hasUsers(): Promise<Res<boolean>>; setup(p: any): Promise<Res<{ user: User; recoveryKey: string }>>; login(u: string, p: string): Promise<Res<any>>;
    logout(): Promise<Res<boolean>>; current(): Promise<Res<User | null>>; users(): Promise<Res<User[]>>;
    saveUser(u: any): Promise<Res<User>>; deleteUser(id: string): Promise<Res<boolean>>; changePassword(o: string, n: string): Promise<Res<boolean>>;
  };
  backup: { export(pw: string): Promise<Res<any>>; restore(pw: string): Promise<Res<any>>; openFolder(): Promise<Res<any>> };
  file: { saveText(n: string, t: string): Promise<Res<any>>; saveBytes(n: string, b64: string): Promise<Res<any>>; openText(exts: string[]): Promise<Res<{ name: string; base64: string } | null>> };
  print: { printers(): Promise<Res<{ name: string; displayName: string; isDefault: boolean }[]>>; html(h: string, o?: any): Promise<Res<any>>; pdf(h: string, n: string, o?: any): Promise<Res<any>> };
  app: { info(): Promise<Res<any>>; openExternal(u: string): Promise<Res<boolean>> };
}

declare global {
  interface Window { bridge?: Bridge; baderLicense?: { status(): Promise<any>; recheck(): Promise<any> } }
}

export const isDesktop = () => typeof window !== "undefined" && !!window.bridge;

// ---------- browser stand-in (never used inside the .exe) ----------
function webBridge(): Bridge {
  const KEY = "template-app-web-db";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const state = load() as { recs?: Record<string, Record<string, any>>; counters?: Record<string, number>; users?: any[] };
  state.recs ||= {}; state.counters ||= {}; state.users ||= [];
  let session: any = null;
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const ok = <T,>(data: T): Promise<Res<T>> => Promise.resolve({ ok: true, data });
  const err = (error: string): Promise<Res<any>> => Promise.resolve({ ok: false, error });
  const sha = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))).map((b) => b.toString(16).padStart(2, "0")).join("");
  const pub = (u: any) => { const { hash, salt, recoveryHash, recoverySalt, ...r } = u; return { ...r, hasRecovery: !!recoveryHash }; };
  const put = (kind: string, doc: any) => {
    const d = { ...doc, id: doc.id || crypto.randomUUID(), updatedAt: Date.now() };
    d.createdAt ||= Date.now();
    (state.recs![kind] ||= {})[d.id] = d;
    return d;
  };
  return {
    db: {
      list: (k) => ok(Object.values(state.recs![k] || {})),
      get: (k, id) => ok((state.recs![k] || {})[id] || null),
      save: (k, d) => { if (!session) return err("not-signed-in"); const r = put(k, d); persist(); return ok(r); },
      remove: (k, id) => { delete (state.recs![k] || {})[id]; persist(); return ok(true); },
      batch: (ops) => { const out = ops.map((o) => (o.op === "save" ? put(o.kind, o.doc) : (delete (state.recs![o.kind] || {})[o.id], true))); persist(); return ok(out); },
      next: (n) => { state.counters![n] = (state.counters![n] || 0) + 1; persist(); return ok(state.counters![n]); },
      audit: () => ok(true),
    },
    auth: {
      hasUsers: () => ok(state.users!.length > 0),
      setup: async (p) => { if (state.users!.length) return err("already-set-up"); const salt = crypto.randomUUID(); const rk = Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join(""); const rs = crypto.randomUUID(); const u = { id: crypto.randomUUID(), name: p.name, username: String(p.username).toLowerCase(), role: "admin", active: true, salt, hash: await sha(salt + p.password), recoverySalt: rs, recoveryHash: await sha(rs + rk) }; state.users!.push(u); persist(); return { ok: true, data: { user: pub(u), recoveryKey: rk.match(/.{4}/g)!.join("-") } }; },
      recover: async (un, k, np) => { const u = state.users!.find((x) => x.username === String(un).toLowerCase()); const key = String(k).toUpperCase().replace(/[^A-Z0-9]/g, ""); if (!u || !u.recoveryHash || (await sha(u.recoverySalt + key)) !== u.recoveryHash) return { ok: false, error: "invalid-recovery" }; u.salt = crypto.randomUUID(); u.hash = await sha(u.salt + np); persist(); return { ok: true, data: { recoveryKey: "WEB0-ONLY-0000-0000-0000" } }; },
      newRecovery: async () => ({ ok: true, data: { recoveryKey: "WEB0-ONLY-0000-0000-0000" } }),
      login: async (un, pw) => { const u = state.users!.find((x) => x.username === String(un).toLowerCase()); if (!u || (await sha(u.salt + pw)) !== u.hash) return { ok: true, data: { ok: false, error: "invalid" } }; session = pub(u); return { ok: true, data: { ok: true, user: session } }; },
      logout: () => { session = null; return ok(true); },
      current: () => ok(session),
      users: () => ok(state.users!.map(pub)),
      saveUser: async (u) => { if (u.id) { const c = state.users!.find((x) => x.id === u.id); Object.assign(c, { name: u.name, role: u.role, active: u.active }); if (u.password) { c.salt = crypto.randomUUID(); c.hash = await sha(c.salt + u.password); } persist(); return { ok: true, data: pub(c) }; } const salt = crypto.randomUUID(); const n = { id: crypto.randomUUID(), name: u.name, username: String(u.username).toLowerCase(), role: u.role, active: true, salt, hash: await sha(salt + u.password) }; state.users!.push(n); persist(); return { ok: true, data: pub(n) }; },
      deleteUser: (id) => { state.users = state.users!.filter((x) => x.id !== id); persist(); return ok(true); },
      changePassword: () => ok(true),
    },
    backup: { export: async () => { const blob = new Blob([JSON.stringify(state)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "backup.json"; a.click(); return { ok: true, data: { saved: true } }; }, restore: () => ok({ restored: false }), openFolder: () => ok(null) },
    file: {
      saveText: async (n, t) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + t], { type: "text/plain;charset=utf-8" })); a.download = n; a.click(); return { ok: true, data: { saved: true } }; },
      saveBytes: async (n, b64) => { const a = document.createElement("a"); a.href = "data:application/octet-stream;base64," + b64; a.download = n; a.click(); return { ok: true, data: { saved: true } }; },
      openText: () => new Promise((resolve) => { const i = document.createElement("input"); i.type = "file"; i.onchange = () => { const f = i.files?.[0]; if (!f) return resolve({ ok: true, data: null }); const r = new FileReader(); r.onload = () => resolve({ ok: true, data: { name: f.name, base64: String(r.result).split(",")[1] } }); r.readAsDataURL(f); }; i.click(); }),
    },
    print: {
      printers: async () => ({ ok: true as const, data: [] }),
      html: async (h) => { const w = window.open("", "_blank"); if (w) { w.document.write(h); w.document.close(); w.print(); } return { ok: true, data: { printed: !!w } }; },
      pdf: async (h) => { const w = window.open("", "_blank"); if (w) { w.document.write(h); w.document.close(); w.print(); } return { ok: true, data: { saved: !!w } }; },
    },
      app: { info: () => ok({ version: "web", platform: "web", dataDir: "" }), openExternal: async (u) => { window.open(u, "_blank"); return { ok: true, data: true }; } },
  };
}

let bridge: Bridge | null = null;
export const api = (): Bridge => (bridge ||= (typeof window !== "undefined" && window.bridge) || webBridge());

/** unwrap { ok, data } results, throwing Error(code) on failure */
export async function call<T>(p: Promise<Res<T>>): Promise<T> {
  const r = await p;
  if (!r.ok) throw new Error(r.error);
  return r.data;
}
