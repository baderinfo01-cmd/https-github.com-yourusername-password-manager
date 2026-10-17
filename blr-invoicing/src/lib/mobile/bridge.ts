// Android bridge: same interface as the Electron `window.blr`, backed by IndexedDB on the phone.
// Records live in memory (loaded once) and every change is written through to IndexedDB.
import type { BlrBridge } from "../api";
import { htmlToPdfBase64 } from "./pdf";

type Res<T> = { ok: true; data: T } | { ok: false; error: string };
const ok = <T,>(data: T): Promise<Res<T>> => Promise.resolve({ ok: true, data });
const err = (error: string): Promise<Res<any>> => Promise.resolve({ ok: false, error });

// ---------- IndexedDB ----------
const DB = "blr-mobile";
const open = () => new Promise<IDBDatabase>((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => { r.result.createObjectStore("records"); r.result.createObjectStore("meta"); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const tx = <T,>(db: IDBDatabase, store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void) =>
  new Promise<T>((res, rej) => { const t = db.transaction(store, mode); const r = fn(t.objectStore(store)); t.oncomplete = () => res((r as IDBRequest<T>)?.result as T); t.onerror = () => rej(t.error); });

// ---------- crypto ----------
const enc = new TextEncoder();
const hex = (b: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (s: string) => Uint8Array.from(s.match(/.{2}/g) || [], (h) => parseInt(h, 16));
const b64e = (b: Uint8Array) => { let s = ""; b.forEach((x) => (s += String.fromCharCode(x))); return btoa(s); };
const b64d = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const ITER = 150000;
async function pbkdf2Bits(pw: string, salt: Uint8Array, bits = 256) {
  const k = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITER }, k, bits);
}
const hashPw = async (pw: string, saltHex: string) => hex(await pbkdf2Bits(pw, unhex(saltHex)));
const rnd = (n: number) => hex(crypto.getRandomValues(new Uint8Array(n)));
const newRecovery = () => Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("").match(/.{4}/g)!.join("-");

async function encryptJson(obj: unknown, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey("raw", await pbkdf2Bits(password, salt), "AES-GCM", false, ["encrypt"]);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj)));
  return JSON.stringify({ blr: 1, enc: true, salt: b64e(salt), iv: b64e(iv), data: b64e(new Uint8Array(ct)) });
}
async function decryptJson(text: string, password: string) {
  const f = JSON.parse(text);
  if (!f.blr) throw new Error("invalid-backup");
  if (!f.enc) return f.data;
  const key = await crypto.subtle.importKey("raw", await pbkdf2Bits(password, b64d(f.salt)), "AES-GCM", false, ["decrypt"]);
  try { return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(f.iv) as BufferSource }, key, b64d(f.data) as BufferSource))); } catch { throw new Error("wrong-password"); }
}

// ---------- native file helpers ----------
async function shareFile(name: string, base64: string, mime: string) {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
  const safe = name.replace(/[\\/:*?"<>|]/g, "_");
  const f = await Filesystem.writeFile({ path: safe, data: base64, directory: Directory.Cache });
  try { await Share.share({ title: safe, url: f.uri, dialogTitle: safe }); } catch { /* dismissed */ }
  void mime;
  return { saved: true, path: f.uri };
}
const textB64 = (t: string) => { const b = enc.encode(t); return b64e(b); };

const pub = (u: any) => { const { hash, salt, recoveryHash, recoverySalt, ...r } = u; return { ...r, hasRecovery: !!recoveryHash }; };

export function createMobileBridge(): BlrBridge {
  const recs: Record<string, Record<string, any>> = {};
  let counters: Record<string, number> = {};
  let users: any[] = [];
  let dbh: IDBDatabase;
  let session: any = null;
  const fails = new Map<string, { n: number; until: number }>();

  const ready = (async () => {
    dbh = await open();
    const keys = (await tx<IDBValidKey[]>(dbh, "records", "readonly", (s) => s.getAllKeys())) as string[];
    const vals = await tx<any[]>(dbh, "records", "readonly", (s) => s.getAll());
    keys.forEach((k, i) => { const kind = String(k).split("/")[0]; (recs[kind] ||= {})[vals[i].id] = vals[i]; });
    counters = (await tx<any>(dbh, "meta", "readonly", (s) => s.get("counters"))) || {};
    users = (await tx<any>(dbh, "meta", "readonly", (s) => s.get("users"))) || [];
    try { const id = sessionStorage.getItem("blr-sid"); const u = users.find((x) => x.id === id && x.active !== false); if (u) session = pub(u); } catch {}
  })();
  const putRec = (kind: string, doc: any) => {
    const d = { ...doc, id: doc.id || crypto.randomUUID(), updatedAt: Date.now() };
    d.createdAt ||= Date.now();
    (recs[kind] ||= {})[d.id] = d;
    void tx(dbh, "records", "readwrite", (s) => { s.put(d, `${kind}/${d.id}`); });
    return d;
  };
  const delRec = (kind: string, id: string) => { if (recs[kind]) delete recs[kind][id]; void tx(dbh, "records", "readwrite", (s) => { s.delete(`${kind}/${id}`); }); };
  const saveMeta = () => Promise.all([tx(dbh, "meta", "readwrite", (s) => { s.put(counters, "counters"); }), tx(dbh, "meta", "readwrite", (s) => { s.put(users, "users"); })]);
  const log = (action: string, detail: any = {}) => { if (session) putRec("audit", { action, detail, user: session.username, at: Date.now() }); };
  const W = <A extends any[], T>(fn: (...a: A) => Promise<Res<T>> | Res<T>) => async (...a: A): Promise<Res<T>> => { await ready; try { return await fn(...a); } catch (e: any) { return { ok: false, error: e?.message || "error" }; } };

  const aiKey = async () => { const { Preferences } = await import("@capacitor/preferences"); return (await Preferences.get({ key: "blr-ai-key" })).value; };
  const aiCall = async (body: any) => {
    const key = await aiKey(); if (!key) return { ok: false, error: "no-key" };
    try {
      const { CapacitorHttp } = await import("@capacitor/core");
      const r = await CapacitorHttp.post({ url: "https://api.anthropic.com/v1/messages", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, data: { model: "claude-sonnet-5-5", ...body }, readTimeout: 90000 });
      const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      if (r.status >= 400) return { ok: false, error: data?.error?.message || `HTTP ${r.status}` };
      return { ok: true, text: (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n") };
    } catch (e: any) { return { ok: false, error: e?.message || "network-error" }; }
  };
  const LANG: Record<string, string> = { ar: "العربية", en: "English", fr: "français" };

  return {
    db: {
      list: W((k: string) => ({ ok: true as const, data: Object.values(recs[k] || {}) })),
      get: W((k: string, id: string) => ({ ok: true as const, data: (recs[k] || {})[id] || null })),
      save: W((k: string, d: any) => (session ? { ok: true as const, data: putRec(k, d) } : { ok: false as const, error: "not-signed-in" })),
      remove: W((k: string, id: string) => { delRec(k, id); return { ok: true as const, data: true }; }),
      batch: W((ops: any[]) => ({ ok: true as const, data: ops.map((o) => (o.op === "save" ? putRec(o.kind, o.doc) : (delRec(o.kind, o.id), true))) })),
      next: W(async (n: string) => { counters[n] = (counters[n] || 0) + 1; await saveMeta(); return { ok: true as const, data: counters[n] }; }),
      audit: W((a: string, d?: any) => { log(String(a).slice(0, 40), d); return { ok: true as const, data: true }; }),
    },
    auth: {
      hasUsers: W(() => ({ ok: true as const, data: users.length > 0 })),
      setup: W(async (p: any) => {
        if (users.length) return { ok: false as const, error: "already-set-up" };
        const salt = rnd(16), rs = rnd(16), rk = newRecovery();
        const u = { id: crypto.randomUUID(), name: p.name, username: String(p.username).toLowerCase(), role: "admin", active: true, salt, hash: await hashPw(p.password, salt), recoverySalt: rs, recoveryHash: await hashPw(rk.replace(/-/g, ""), rs) };
        users.push(u); await saveMeta();
        return { ok: true as const, data: { user: pub(u), recoveryKey: rk } };
      }),
      login: W(async (un: string, pw: string): Promise<Res<any>> => {
        const name = String(un).toLowerCase(), f = fails.get(name) || { n: 0, until: 0 };
        if (Date.now() < f.until) return { ok: true as const, data: { ok: false, error: "locked", waitMs: f.until - Date.now() } };
        const u = users.find((x) => x.username === name && x.active !== false);
        if (!u || (await hashPw(pw, u.salt)) !== u.hash) {
          f.n++; if (f.n >= 5) { f.until = Date.now() + Math.min(300000, 15000 * 2 ** (f.n - 5)); }
          fails.set(name, f); return { ok: true as const, data: { ok: false, error: "invalid" } };
        }
        fails.delete(name); session = pub(u); try { sessionStorage.setItem("blr-sid", u.id); } catch {}
        log("login");
        return { ok: true as const, data: { ok: true, user: session } };
      }),
      logout: W(() => { session = null; try { sessionStorage.removeItem("blr-sid"); } catch {} return { ok: true as const, data: true }; }),
      current: W(() => ({ ok: true as const, data: session })),
      users: W(() => ({ ok: true as const, data: users.map(pub) })),
      saveUser: W(async (u: any) => {
        if (u.id) { const c = users.find((x) => x.id === u.id); if (!c) return { ok: false as const, error: "not-found" }; Object.assign(c, { name: u.name, role: u.role, active: u.active }); if (u.password) { c.salt = rnd(16); c.hash = await hashPw(u.password, c.salt); } await saveMeta(); return { ok: true as const, data: pub(c) }; }
        const username = String(u.username).toLowerCase();
        if (users.some((x) => x.username === username)) return { ok: false as const, error: "username-taken" };
        const salt = rnd(16); const n = { id: crypto.randomUUID(), name: u.name, username, role: u.role, active: true, salt, hash: await hashPw(u.password, salt) };
        users.push(n); await saveMeta(); return { ok: true as const, data: pub(n) };
      }),
      deleteUser: W(async (id: string) => { if (users.find((x) => x.id === id)?.role === "admin" && users.filter((x) => x.role === "admin").length < 2) return { ok: false as const, error: "last-admin" }; users = users.filter((x) => x.id !== id); await saveMeta(); return { ok: true as const, data: true }; }),
      changePassword: W(async (o: string, n: string) => { const u = users.find((x) => x.id === session?.id); if (!u || (await hashPw(o, u.salt)) !== u.hash) return { ok: false as const, error: "wrong-password" }; u.salt = rnd(16); u.hash = await hashPw(n, u.salt); await saveMeta(); return { ok: true as const, data: true }; }),
      recover: W(async (un: string, k: string, np: string) => {
        const u = users.find((x) => x.username === String(un).toLowerCase());
        const key = String(k).toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (!u || !u.recoveryHash || (await hashPw(key, u.recoverySalt)) !== u.recoveryHash) return { ok: false as const, error: "invalid-recovery" };
        const rk = newRecovery(); u.salt = rnd(16); u.hash = await hashPw(np, u.salt); u.recoverySalt = rnd(16); u.recoveryHash = await hashPw(rk.replace(/-/g, ""), u.recoverySalt);
        await saveMeta(); return { ok: true as const, data: { recoveryKey: rk } };
      }),
      newRecovery: W(async (pw: string) => {
        const u = users.find((x) => x.id === session?.id);
        if (!u || (await hashPw(pw, u.salt)) !== u.hash) return { ok: false as const, error: "wrong-password" };
        const rk = newRecovery(); u.recoverySalt = rnd(16); u.recoveryHash = await hashPw(rk.replace(/-/g, ""), u.recoverySalt);
        await saveMeta(); return { ok: true as const, data: { recoveryKey: rk } };
      }),
    },
    backup: {
      export: W(async (pw: string) => {
        const snap = { recs, counters, users };
        const text = pw ? await encryptJson(snap, pw) : JSON.stringify({ blr: 1, enc: false, data: snap });
        const day = new Date().toISOString().slice(0, 10);
        return { ok: true as const, data: await shareFile(`BLR-backup-${day}.blrbak`, textB64(text), "application/octet-stream") };
      }),
      restore: W(async (pw: string) => {
        const text = await new Promise<string | null>((resolve) => { const i = document.createElement("input"); i.type = "file"; i.onchange = () => { const f = i.files?.[0]; if (!f) return resolve(null); const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsText(f); }; i.click(); });
        if (text === null) return { ok: true as const, data: { restored: false } };
        const snap = await decryptJson(text, pw);
        if (!snap?.recs || !Array.isArray(snap.users)) return { ok: false as const, error: "invalid-backup" };
        await tx(dbh, "records", "readwrite", (s) => { s.clear(); });
        for (const k of Object.keys(recs)) delete recs[k];
        for (const [kind, m] of Object.entries<any>(snap.recs)) for (const d of Object.values<any>(m)) { (recs[kind] ||= {})[d.id] = d; await tx(dbh, "records", "readwrite", (s) => { s.put(d, `${kind}/${d.id}`); }); }
        counters = snap.counters || {}; users = snap.users; await saveMeta();
        return { ok: true as const, data: { restored: true } };
      }),
      openFolder: W(() => ({ ok: true as const, data: null })),
    },
    file: {
      saveText: W((n: string, t: string) => shareFile(n, textB64("﻿" + t), "text/plain").then((data) => ({ ok: true as const, data }))),
      saveBytes: W((n: string, b: string) => shareFile(n, b, "application/octet-stream").then((data) => ({ ok: true as const, data }))),
      openText: () => new Promise((resolve) => { const i = document.createElement("input"); i.type = "file"; i.accept = ".csv,.xlsx,.xls"; i.onchange = () => { const f = i.files?.[0]; if (!f) return resolve({ ok: true, data: null }); const r = new FileReader(); r.onload = () => resolve({ ok: true, data: { name: f.name, base64: String(r.result).split(",")[1] } }); r.readAsDataURL(f); }; i.click(); }),
    },
    print: {
      printers: async () => ({ ok: true as const, data: [] }),
      // no printer on the phone: both actions produce a PDF and open the Android share sheet (print / WhatsApp / save…)
      html: W(async (h: string, o?: any) => { const pdf = await htmlToPdfBase64(h, o?.paper || "a4"); await shareFile("BLR-document.pdf", pdf, "application/pdf"); return { ok: true as const, data: { printed: true } }; }),
      pdf: W(async (h: string, n: string, o?: any) => { const pdf = await htmlToPdfBase64(h, o?.paper || "a4"); return { ok: true as const, data: await shareFile(n, pdf, "application/pdf") }; }),
    },
    ai: {
      hasKey: async () => ({ ok: true as const, data: !!(await aiKey()) }),
      setKey: async (k: string) => { const { Preferences } = await import("@capacitor/preferences"); if (k === "") { await Preferences.remove({ key: "blr-ai-key" }); return { ok: true }; } if (!/^sk-ant-[\w-]{10,}$/.test(String(k).trim())) return { ok: false, error: "invalid-key" }; await Preferences.set({ key: "blr-ai-key", value: String(k).trim() }); return { ok: true }; },
      ask: async ({ messages, summary, locale }: any = {}) => {
        const clean = (messages || []).filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }));
        if (!clean.length || clean[clean.length - 1].role !== "user" || clean[0].role !== "user") return { ok: false, error: "invalid-question" };
        clean[0] = { role: "user", content: `Business data (JSON):\n${JSON.stringify(summary || {}).slice(0, 60000)}\n\n${clean[0].content}` };
        return aiCall({ max_tokens: 1500, system: `You are the business assistant inside BLR, an invoicing and accounting program for small businesses. You receive a JSON summary of the user's business. Answer ONLY from that data, never invent numbers; say clearly when the data does not contain the answer. Be concise and practical. Reply in ${LANG[locale] || LANG.en}. Never ask for passwords.`, messages: clean });
      },
      scan: async ({ dataUrl, locale }: any = {}) => {
        const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || "");
        if (!m || m[2].length > 7_000_000) return { ok: false, error: "invalid-image" };
        const r: any = await aiCall({ max_tokens: 1500, system: 'You extract data from a photo of an invoice or receipt. Reply with ONLY one JSON object, no prose: {"supplier":string,"date":"YYYY-MM-DD"|"","number":string,"currency":string,"total":number,"tax":number,"lines":[{"description":string,"qty":number,"unitPrice":number}]}. Use 0 or "" when unknown. Never guess amounts.', messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } }, { type: "text", text: `Extract this document (UI language: ${locale || "en"}).` }] }] });
        if (!r.ok) return r;
        try { return { ok: true, data: JSON.parse(r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1)) }; } catch { return { ok: false, error: "unreadable" }; }
      },
    },
    app: {
      info: async () => ({ ok: true as const, data: { version: "1.0.0", platform: "android", dataDir: "" } }),
      openExternal: async (u: string) => { try { window.open(u, "_system"); } catch {} return { ok: true as const, data: true }; },
    },
  };
}
