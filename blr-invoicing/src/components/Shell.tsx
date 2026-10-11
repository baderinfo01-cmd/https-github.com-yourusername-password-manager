"use client";
import clsx from "clsx";
import {
  BarChart3, BookUser, Boxes, Building2, ClipboardList, FileText, LayoutDashboard, CalendarDays, CheckSquare, ChevronDown, Clock3, Lock, Menu, Moon, Palette, Package,
  Receipt, Repeat, ScanLine, Settings as Cog, ShieldCheck, ShoppingCart, Sparkles, Sun, Truck, Users, Wallet, Wrench, BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Toast, Button, Input, Field } from "./ui";
import { PrintPreviewHost } from "./PrintPreview";
import { useT } from "@/lib/i18n";
import { can, COLORS, useUi, type Lang } from "@/store/ui";
import { useData } from "@/store/data";
import { LOCALE } from "@/lib/i18n";

type NavItem = { href: string; key: string; icon: ReactNode; perm?: string };
const NAV: { group: string; items: NavItem[] }[] = [
  { group: "nav_main", items: [{ href: "/", key: "dashboard", icon: <LayoutDashboard size={18} /> }, { href: "/pos/", key: "pos", icon: <ScanLine size={18} />, perm: "pos" }] },
  {
    group: "nav_sales",
    items: [
      { href: "/documents/?type=invoice", key: "invoices", icon: <FileText size={18} />, perm: "sales:read" },
      { href: "/documents/?type=quote", key: "quotes", icon: <ClipboardList size={18} />, perm: "sales:read" },
      { href: "/documents/?type=proforma", key: "proformas", icon: <FileText size={18} />, perm: "sales:read" },
      { href: "/documents/?type=delivery", key: "deliveries", icon: <Truck size={18} />, perm: "sales:read" },
      { href: "/documents/?type=credit", key: "credits", icon: <Receipt size={18} />, perm: "sales:read" },
      { href: "/recurring/", key: "recurring", icon: <Repeat size={18} />, perm: "sales" },
      { href: "/clients/", key: "clients", icon: <BookUser size={18} />, perm: "clients:read" },
    ],
  },
  {
    group: "nav_purchases",
    items: [
      { href: "/documents/?type=purchase", key: "purchases", icon: <ShoppingCart size={18} />, perm: "purchases:read" },
      { href: "/documents/?type=order", key: "orders", icon: <ClipboardList size={18} />, perm: "purchases:read" },
      { href: "/suppliers/", key: "suppliers", icon: <Building2 size={18} />, perm: "purchases:read" },
      { href: "/expenses/", key: "expenses", icon: <Wallet size={18} />, perm: "expenses" },
    ],
  },
  {
    group: "nav_inventory",
    items: [
      { href: "/products/", key: "products", icon: <Package size={18} />, perm: "products:read" },
      { href: "/stock/", key: "stock", icon: <Boxes size={18} />, perm: "stock:read" },
    ],
  },
  {
    group: "nav_finance",
    items: [
      { href: "/payments/", key: "payments", icon: <Wallet size={18} />, perm: "payments" },
      { href: "/reports/", key: "reports", icon: <BarChart3 size={18} />, perm: "reports" },
      { href: "/ai/", key: "ai", icon: <Sparkles size={18} />, perm: "ai" },
    ],
  },
  {
    group: "nav_tools",
    items: [
      { href: "/calendar/", key: "calendar", icon: <CalendarDays size={18} /> },
      { href: "/tasks/", key: "tasks", icon: <CheckSquare size={18} /> },
    ],
  },
  {
    group: "nav_system",
    items: [
      { href: "/users/", key: "users", icon: <Users size={18} />, perm: "*" },
      { href: "/settings/", key: "settings", icon: <Cog size={18} />, perm: "*" },
      { href: "/audit/", key: "audit", icon: <ShieldCheck size={18} />, perm: "*" },
      { href: "/license/", key: "license", icon: <BadgeCheck size={18} /> },
    ],
  },
];

export function Shell({ children }: { children: ReactNode }) {
  const { hydrated, hydrate, authState, boot, user } = useUi();
  const { loaded, load, runRecurring, settings } = useData();
  useEffect(() => { hydrate(); boot().catch(() => useUi.setState({ authState: "login" })); }, [hydrate, boot]);
  useEffect(() => {
    if (authState !== "in") { useData.getState().reset(); return; }
    load().then(async () => {
      const made = await runRecurring().catch(() => 0);
      if (made) useUi.getState().notify(`${made} ↻`);
    });
  }, [authState, load, runRecurring]);

  // idle auto-lock
  useEffect(() => {
    if (authState !== "in" || !settings.autoLockMin) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => useUi.getState().signOut(), settings.autoLockMin * 60000); };
    const ev = ["mousemove", "keydown", "click"] as const;
    ev.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(timer); ev.forEach((e) => window.removeEventListener(e, reset)); };
  }, [authState, settings.autoLockMin]);

  if (!hydrated || authState === "loading") return <Splash />;
  if (authState !== "in") return <><AuthScreen mode={authState} /><Toast /></>;
  if (!loaded || !user) return <Splash />;
  return <Suspense fallback={<Splash />}><Frame>{children}</Frame></Suspense>;
}

function Splash() {
  return <div className="grid h-screen place-items-center bg-bg"><img src="/brand/icon-192.png" alt="BLR Fatourati" width={80} height={80} className="animate-pulse rounded-2xl" /></div>;
}

function Frame({ children }: { children: ReactNode }) {
  const t = useT();
  const path = usePathname();
  const router = useRouter();
  const search = useSearchParams().toString();
  const { user, theme, setTheme, lang, setLang, signOut } = useUi();
  const company = useData((s) => s.settings.company);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => {
    const [p, q] = href.split("?");
    return (p === "/" ? path === "/" : path.startsWith(p.replace(/\/$/, ""))) && (!q || search === q);
  };
  return (
    <div className="flex h-screen overflow-hidden">
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={clsx("no-print fixed inset-y-0 start-0 z-40 flex w-64 shrink-0 flex-col bg-[var(--side)] text-[var(--side-text)] transition-transform lg:static side-bg", open ? "translate-x-0" : "max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full")}>
        <div className="flex items-center gap-3 px-5 py-5">
          <img src="/brand/icon-192.png" alt="BLR Fatourati" width={42} height={42} className="rounded-xl shadow-lg" />
          <div className="min-w-0">
            <div className="text-lg font-bold leading-none text-white">BLR Fatourati</div>
            <div className="mt-1.5 truncate text-[11px] text-slate-400">{company.name || t("tagline")}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          {NAV.map((g) => {
            const items = g.items.filter((i) => !i.perm || can(user?.role, i.perm));
            if (!items.length) return null;
            return (
              <div key={g.group}>
                <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t(g.group)}</div>
                {items.map((i) => (
                  <Link key={i.href + i.key} href={i.href} className={clsx("flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200", active(i.href) ? "nav-active text-white" : "hover:bg-white/8 hover:text-white hover:ps-4")}>
                    {i.icon}<span className="truncate">{t(i.key)}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3 text-[11px] text-slate-500">BLR Fatourati v1.0 · Baderinfo</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4">
          <div className="flex items-center gap-2">
            <button className="rounded-md p-2 text-muted hover:bg-surface2 lg:hidden" onClick={() => setOpen(true)} aria-label="menu"><Menu size={20} /></button>
            <QuickCreate />
          </div>
          <HeaderClock />
          <div className="flex items-center gap-1.5">
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="h-8 rounded-md border border-line bg-surface px-2 text-xs" aria-label="language">
              <option value="ar">العربية</option><option value="fr">Français</option><option value="en">English</option>
            </select>
            <ColorPicker />
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-md p-2 text-muted hover:bg-surface2" aria-label="theme">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
            <div className="mx-1 hidden text-end leading-tight sm:block">
              <div className="text-xs font-semibold">{user?.name}</div>
              <div className="text-[10px] text-muted">{t("role_" + user?.role)}</div>
            </div>
            <button onClick={() => signOut()} title={t("lock")} className="rounded-md p-2 text-muted hover:bg-surface2"><Lock size={17} /></button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
      <PrintPreviewHost />
      <Toast />
    </div>
  );
}

function AuthScreen({ mode }: { mode: "setup" | "login" }) {
  const t = useT();
  const { lang, setLang, signIn, setup } = useUi();
  const [name, setName] = useState("");
  const [username, setUsername] = useState(mode === "setup" ? "admin" : "");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (mode === "setup") {
      if (password.length < 6) return setErr(t("err_weak"));
      if (password !== again) return setErr(t("err_mismatch"));
    }
    setBusy(true);
    try {
      if (mode === "setup") await setup({ name: name || username, username, password });
      else {
        const r = await signIn(username, password);
        if (!r.ok) setErr(r.error === "locked" ? t("err_locked", { s: Math.ceil((r.waitMs || 0) / 1000) }) : t("err_login"));
      }
    } catch (e2: any) {
      setErr(t("err_" + (e2?.message || "generic")) === "err_" + e2?.message ? String(e2?.message) : t("err_" + e2.message));
    } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top,#1e3a8a_0%,#0b1220_60%)] p-4">
      <form onSubmit={submit} className="pop w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-surface p-7 shadow-2xl">
        <div className="text-center">
          <img src="/brand/app-icon.png" alt="BLR Fatourati" width={84} height={84} className="mx-auto rounded-2xl shadow-lg" />
          <h1 className="mt-1 text-2xl font-extrabold">BLR Fatourati</h1>
          <p className="text-xs text-muted">{mode === "setup" ? t("setup_sub") : t("login_sub")}</p>
        </div>
        {mode === "setup" && <Field label={t("full_name")}><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>}
        <Field label={t("username")}><Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus={mode === "login"} required /></Field>
        <Field label={t("password")}><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "setup" ? "new-password" : "current-password"} required /></Field>
        {mode === "setup" && <Field label={t("password_again")}><Input type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required /></Field>}
        {err && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-xs text-bad">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{mode === "setup" ? t("create_account") : t("login")}</Button>
        {mode === "setup" && <p className="text-center text-[11px] text-muted">{t("setup_note")}</p>}
        <div className="flex justify-center gap-2 pt-1">
          {(["ar", "fr", "en"] as Lang[]).map((l) => (
            <button key={l} type="button" onClick={() => setLang(l)} className={clsx("rounded-md px-2.5 py-1 text-xs", lang === l ? "bg-accent text-white" : "text-muted hover:bg-surface2")}>{l.toUpperCase()}</button>
          ))}
        </div>
      </form>
    </div>
  );
}

function ColorPicker() {
  const t = useT();
  const { color, setColor } = useUi();
  const [open, setOpen] = useState(false);
  const HEX: Record<string, string> = { sky: "#0284c7", purple: "#7c3aed", blue: "#2563eb", green: "#059669", teal: "#0d9488", orange: "#ea580c", rose: "#e11d48", slate: "#475569" };
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="rounded-md p-2 text-muted hover:bg-surface2" aria-label={t("color_theme")} title={t("color_theme")}><Palette size={17} /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="pop absolute end-0 top-full z-50 mt-2 w-56 rounded-xl border border-line bg-surface p-3 shadow-xl">
            <div className="mb-2 text-xs font-medium text-muted">{t("color_theme")}</div>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button key={c} onClick={() => { setColor(c); setOpen(false); }} aria-label={c} className="swatch" style={{ background: HEX[c], outline: color === c ? `2px solid ${HEX[c]}` : "none", outlineOffset: 2 }} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function HeaderClock() {
  const lang = useUi((s) => s.lang);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  if (!now) return <div />;
  const loc = LOCALE[lang];
  return (
    <div className="hidden items-center gap-3 rounded-xl border border-line bg-surface2 px-4 py-1.5 md:flex" dir="ltr">
      <Clock3 size={18} className="text-accent" />
      <div className="leading-tight">
        <div className="num text-base font-bold tracking-wide">{now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
      </div>
      <div className="h-7 w-px bg-line" />
      <div className="text-xs leading-tight text-muted" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="font-semibold text-ink">{now.toLocaleDateString(loc, { weekday: "long" })}</div>
        <div className="num">{now.toLocaleDateString(loc, { day: "2-digit", month: "long", year: "numeric" })}</div>
      </div>
    </div>
  );
}

function QuickCreate() {
  const t = useT();
  const router = useRouter();
  const role = useUi((s) => s.user?.role);
  const [open, setOpen] = useState(false);
  const items: { label: string; href: string; perm: string; keys?: string }[] = [
    { label: t("new_invoice"), href: "/documents/edit/?type=invoice", perm: "sales", keys: "Ctrl+Shift+O" },
    { label: t("new_quote"), href: "/documents/edit/?type=quote", perm: "sales", keys: "Ctrl+Shift+E" },
    { label: t("new_purchase"), href: "/documents/edit/?type=purchase", perm: "purchases" },
    { label: t("add_client"), href: "/clients/?new=1", perm: "clients" },
    { label: t("add_product"), href: "/products/?new=1", perm: "products" },
    { label: t("add_expense"), href: "/expenses/?new=1", perm: "expenses" },
    { label: t("record_payment"), href: "/payments/?new=1", perm: "payments", keys: "Ctrl+Shift+P" },
  ].filter((i) => can(role, i.perm));
  // keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      const go = (href: string) => { e.preventDefault(); router.push(href); };
      if (e.shiftKey && k === "o" && can(role, "sales")) go("/documents/edit/?type=invoice");
      else if (e.shiftKey && k === "e" && can(role, "sales")) go("/documents/edit/?type=quote");
      else if (e.shiftKey && k === "p" && can(role, "payments")) go("/payments/?new=1");
      else if (!e.shiftKey && k === "o") go("/documents/?type=invoice");
      else if (!e.shiftKey && k === "e") go("/documents/?type=quote");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [router, role]);
  if (!items.length) return null;
  return (
    <div className="relative">
      <Button size="sm" onClick={() => setOpen((o) => !o)}>＋ {t("new")}<ChevronDown size={14} /></Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="pop absolute start-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
            {items.map((i) => (
              <button key={i.href} onClick={() => { setOpen(false); router.push(i.href); }} className="flex w-full items-center justify-between gap-3 px-4 py-2 text-start text-sm hover:bg-surface2">
                <span>{i.label}</span>{i.keys && <kbd className="num rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">{i.keys}</kbd>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
