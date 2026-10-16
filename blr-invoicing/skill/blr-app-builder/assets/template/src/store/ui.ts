"use client";
import { create } from "zustand";
import { api, call } from "@/lib/api";
import type { Role, User } from "@/lib/types";

export type Lang = "ar" | "en" | "fr";
export type Theme = "light" | "dark";
const PREFIX = "template-app"; // localStorage key prefix: unique per program (each Electron app has its own origin anyway)

// localStorage only for per-user conveniences (language/theme). Always wrapped: it can throw or come back empty.
const read = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(`${PREFIX}-${k}`); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
};
const write = (k: string, v: unknown) => { try { localStorage.setItem(`${PREFIX}-${k}`, JSON.stringify(v)); } catch {} };

interface UiState {
  lang: Lang; theme: Theme; hydrated: boolean;
  recoveryKey: string | null; clearRecovery(): void;
  user: User | null; authState: "loading" | "setup" | "login" | "in";
  toast: { msg: string; kind: "ok" | "err" } | null;
  hydrate(): void;
  setLang(l: Lang): void;
  setTheme(t: Theme): void;
  boot(): Promise<void>;
  signIn(username: string, password: string): Promise<{ ok: boolean; error?: string; waitMs?: number }>;
  setup(p: { name: string; username: string; password: string }): Promise<void>;
  signOut(): Promise<void>;
  notify(msg: string, kind?: "ok" | "err"): void;
}

export const useUi = create<UiState>((set, get) => ({
  lang: "ar", theme: "light", hydrated: false, recoveryKey: null, clearRecovery: () => set({ recoveryKey: null }), user: null, authState: "loading", toast: null,
  hydrate() {
    const lang = read<Lang>("lang", "ar"); // Arabic is the default language
    const theme = read<Theme>("theme", "light");
    set({ lang, theme, hydrated: true });
    apply(lang, theme);
  },
  setLang(lang) { write("lang", lang); set({ lang }); apply(lang, get().theme); },
  setTheme(theme) { write("theme", theme); set({ theme }); apply(get().lang, theme); },
  // The session lives in the MAIN process (electron/db.js). The page only asks "who is signed in?".
  async boot() {
    const has = await call<boolean>(api().auth.hasUsers());
    if (!has) return set({ authState: "setup", user: null });
    const cur = await call<User | null>(api().auth.current());
    set(cur ? { authState: "in", user: cur } : { authState: "login", user: null });
  },
  async signIn(username, password) {
    const r = await call<any>(api().auth.login(username, password));
    if (r.ok) set({ user: r.user, authState: "in" });
    return r;
  },
  async setup(p) {
    const r = await call<{ recoveryKey: string }>(api().auth.setup(p));
    set({ recoveryKey: r.recoveryKey }); // shown ONCE by <RecoveryKeyDialog/>
    await get().signIn(p.username, p.password);
  },
  async signOut() {
    await call(api().auth.logout());
    set({ user: null, authState: "login" });
  },
  notify(msg, kind = "ok") {
    set({ toast: { msg, kind } });
    setTimeout(() => get().toast?.msg === msg && set({ toast: null }), 3500);
  },
}));

function apply(lang: Lang, theme: Theme) {
  const el = document.documentElement;
  el.lang = lang;
  el.dir = lang === "ar" ? "rtl" : "ltr";
  el.classList.toggle("dark", theme === "dark");
}

/**
 * What each role may do. A permission "x" also grants "x:read". "*" = everything (admin only).
 * UI gating only; the main process additionally protects `users` and `settings` (electron/db.js).
 * When you add a module, add its permission names here AND to the NAV entry in components/Shell.tsx.
 */
const PERMS: Record<Role, string[]> = {
  admin: ["*"],
  manager: ["items", "reports", "delete"],
  cashier: ["items:read"],
  accountant: ["items:read", "reports"],
};
export function can(role: Role | undefined, perm: string) {
  if (!role) return false;
  const p = PERMS[role];
  if (p.includes("*") || p.includes(perm)) return true;
  return perm.endsWith(":read") && p.includes(perm.slice(0, -5));
}
