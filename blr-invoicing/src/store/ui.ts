"use client";
import { create } from "zustand";
import { blr, call } from "@/lib/api";
import type { Role, User } from "@/lib/types";

export type Lang = "ar" | "en" | "fr";
export type Theme = "light" | "dark";

const read = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
};
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

interface UiState {
  lang: Lang; theme: Theme; hydrated: boolean;
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
  lang: "ar", theme: "light", hydrated: false, user: null, authState: "loading", toast: null,
  hydrate() {
    const lang = read<Lang>("blr-lang", "ar");
    const theme = read<Theme>("blr-theme", "light");
    set({ lang, theme, hydrated: true });
    apply(lang, theme);
  },
  setLang(lang) { write("blr-lang", lang); set({ lang }); apply(lang, get().theme); },
  setTheme(theme) { write("blr-theme", theme); set({ theme }); apply(get().lang, theme); },
  async boot() {
    const has = await call<boolean>(blr().auth.hasUsers());
    if (!has) return set({ authState: "setup", user: null });
    const cur = await call<User | null>(blr().auth.current());
    set(cur ? { authState: "in", user: cur } : { authState: "login", user: null });
  },
  async signIn(username, password) {
    const r = await call<any>(blr().auth.login(username, password));
    if (r.ok) set({ user: r.user, authState: "in" });
    return r;
  },
  async setup(p) {
    await call(blr().auth.setup(p));
    await get().signIn(p.username, p.password);
  },
  async signOut() {
    await call(blr().auth.logout());
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

// what each role may do
const PERMS: Record<Role, string[]> = {
  admin: ["*"],
  manager: ["sales", "purchases", "clients", "products", "payments", "expenses", "reports", "stock", "pos", "ai", "delete"],
  cashier: ["sales", "clients", "products:read", "payments", "pos"],
  accountant: ["reports", "payments", "expenses", "sales:read", "purchases:read", "clients:read", "products:read", "stock:read", "ai"],
};
export function can(role: Role | undefined, perm: string) {
  if (!role) return false;
  const p = PERMS[role];
  if (p.includes("*") || p.includes(perm)) return true;
  // "x" grants "x:read"
  return perm.endsWith(":read") && p.includes(perm.slice(0, -5));
}
