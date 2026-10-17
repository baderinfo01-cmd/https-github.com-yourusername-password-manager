"use client";
import clsx from "clsx";
import { BadgeCheck, Eye, EyeOff, LayoutDashboard, Lock, Menu, Moon, Package, Settings as Cog, ShieldCheck, Sparkles, Sun, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Button, Field, Input, Toast } from "./ui";
import { PrintPreviewHost } from "./PrintPreview";
import { RecoveryKeyDialog } from "./RecoveryKeyDialog";
import { api, call } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { useT } from "@/lib/i18n";
import { can, useUi, type Lang } from "@/store/ui";
import { useData } from "@/store/data";

/**
 * Sidebar. To add a module: one entry here (href with trailing slash because next.config has trailingSlash:true,
 * dictionary key for the label, lucide icon, permission checked with can()) + src/app/<module>/page.tsx.
 */
type NavItem = { href: string; key: string; icon: ReactNode; perm?: string };
const NAV: { group: string; items: NavItem[] }[] = [
  { group: "nav_main", items: [{ href: "/", key: "dashboard", icon: <LayoutDashboard size={18} /> }] },
  {
    group: "nav_data",
    items: [
      // @nav:nav_data  (scripts/add_module.py inserts new module links right below this marker; keep it)
      { href: "/items/", key: "items", icon: <Package size={18} />, perm: "items:read" },
    ],
  },
  {
    group: "nav_system",
    items: [
      { href: "/users/", key: "users", icon: <Users size={18} />, perm: "*" },
      { href: "/settings/", key: "settings", icon: <Cog size={18} />, perm: "*" },
      { href: "/license/", key: "license", icon: <BadgeCheck size={18} /> },
    ],
  },
];

export function Shell({ children }: { children: ReactNode }) {
  const { hydrated, hydrate, authState, boot, user } = useUi();
  const { loaded, load, settings } = useData();
  useEffect(() => { hydrate(); boot().catch(() => useUi.setState({ authState: "login" })); }, [hydrate, boot]);
  useEffect(() => {
    if (authState !== "in") { useData.getState().reset(); return; } // sign-out wipes the in-memory data
    load();
  }, [authState, load]);

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
  if (authState !== "in") return <><AuthScreen mode={authState} /><RecoveryKeyDialog /><PrintPreviewHost /><Toast /></>;
  if (!loaded || !user) return <Splash />;
  // useSearchParams() in pages needs a Suspense boundary for the static export
  return <Suspense fallback={<Splash />}><Frame>{children}</Frame></Suspense>;
}

function Splash() {
  return <div className="grid h-screen place-items-center"><img src="/brand/icon-192.png" alt={BRAND.name} width={80} height={80} className="animate-pulse rounded-2xl" /></div>;
}

function Frame({ children }: { children: ReactNode }) {
  const t = useT();
  const path = usePathname();
  const { user, theme, setTheme, lang, setLang, signOut } = useUi();
  const company = useData((s) => s.settings.company);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, "")));
  const initials = (user?.name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex h-screen gap-3 overflow-hidden p-3">
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      {/* start-3 / ltr:/rtl: variants make the sidebar flip sides automatically with the language direction */}
      <aside className={clsx("glass no-print fixed inset-y-3 start-3 z-40 flex w-64 shrink-0 flex-col rounded-3xl transition-transform lg:static", open ? "translate-x-0" : "max-lg:ltr:-translate-x-[110%] max-lg:rtl:translate-x-[110%]")}>
        <div className="flex items-center gap-3 px-5 pb-3 pt-5">
          <img src="/brand/icon-192.png" alt={BRAND.name} width={44} height={44} className="glow-ring rounded-2xl" />
          <div className="min-w-0">
            <div className="text-[17px] font-bold leading-none">{BRAND.name}</div>
            <div className="mt-1.5 truncate text-[11px] text-muted">{company.name || t("tagline")}</div>
          </div>
        </div>
        <div className="mx-4 mb-2 flex items-center gap-2.5 rounded-2xl border border-line/70 bg-surface2/60 px-3 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-xs font-bold text-white" style={{ backgroundImage: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{initials}</span>
          <div className="min-w-0 leading-tight"><div className="truncate text-sm font-semibold">{user?.name}</div><div className="text-[10px] text-muted">{t("role_" + user?.role)}</div></div>
        </div>
        <nav className="flex-1 space-y-3.5 overflow-y-auto px-3 pb-3 pt-1">
          {NAV.map((g) => {
            const items = g.items.filter((i) => !i.perm || can(user?.role, i.perm));
            if (!items.length) return null;
            return (
              <div key={g.group}>
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted/80">{t(g.group)}</div>
                {items.map((i) => (
                  <Link key={i.href} href={i.href} className={clsx("flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200", active(i.href) ? "nav-active font-semibold text-white" : "text-ink/80 hover:bg-accent/10 hover:text-accent")}>
                    {i.icon}<span className="truncate">{t(i.key)}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-line/70 p-3 text-center text-[11px] text-muted">{BRAND.name} · {BRAND.developer}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="glass no-print flex h-[60px] shrink-0 items-center gap-3 rounded-2xl px-3">
          <button className="rounded-lg p-2 text-muted hover:bg-surface2 lg:hidden" onClick={() => setOpen(true)} aria-label="menu"><Menu size={20} /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="h-9 rounded-xl border border-line bg-surface px-2 text-xs" aria-label="language">
              <option value="ar">العربية</option><option value="fr">Français</option><option value="en">English</option>
            </select>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-xl p-2.5 text-muted hover:bg-surface2" aria-label="theme">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={() => signOut()} title={t("lock")} aria-label="lock" className="rounded-xl p-2.5 text-muted hover:bg-surface2"><Lock size={18} /></button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto rounded-2xl px-1 pb-2 pe-2 pt-1 sm:px-2">{children}</main>
      </div>
      <PrintPreviewHost />
      <RecoveryKeyDialog />
      <Toast />
    </div>
  );
}

/** First run (no user yet) = create the administrator; afterwards = sign in; "forgot password" = recovery key flow. */
function AuthScreen({ mode }: { mode: "setup" | "login" }) {
  const t = useT();
  const { lang, setLang, signIn, setup } = useUi();
  const [name, setName] = useState("");
  const [username, setUsername] = useState(mode === "setup" ? "admin" : "");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [recover, setRecover] = useState(false);
  const [rkey, setRkey] = useState("");
  const notify = useUi((s) => s.notify);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (recover) {
      if (password.length < 6) return setErr(t("err_weak"));
      if (password !== again) return setErr(t("err_mismatch"));
      setBusy(true);
      try {
        const r = await call<{ recoveryKey: string }>(api().auth.recover(username, rkey, password));
        useUi.setState({ recoveryKey: r.recoveryKey }); // a NEW key is issued; the old one is dead
        notify(t("password_reset_ok"));
        setRecover(false); setPassword(""); setAgain(""); setRkey("");
      } catch (e3: any) {
        setErr(e3?.message === "locked" ? t("err_locked", { s: 60 }) : e3?.message === "weak-password" ? t("err_weak") : t("err_invalid_recovery"));
      } finally { setBusy(false); }
      return;
    }
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
      const k = "err_" + (e2?.message || "generic");
      setErr(t(k) === k ? String(e2?.message) : t(k));
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-bg relative grid min-h-screen place-items-center overflow-hidden p-4">
      <div className="glass absolute top-5 flex gap-1 rounded-full p-1">
        {(["ar", "en", "fr"] as Lang[]).map((l) => (
          <button key={l} type="button" onClick={() => setLang(l)} className={clsx("pill rounded-full px-4 py-1.5 text-sm font-medium", lang === l ? "text-white shadow-md" : "text-muted hover:text-ink")} style={lang === l ? { backgroundImage: "linear-gradient(135deg, var(--accent), var(--accent-2))" } : undefined}>
            {l === "ar" ? "العربية" : l === "en" ? "English" : "Français"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="glass pop w-full max-w-[400px] space-y-4 rounded-[28px] p-8">
        <div className="text-center">
          <img src="/brand/app-icon.png" alt={BRAND.name} width={88} height={88} className="glow-ring mx-auto rounded-[26px]" />
          <h1 className="mt-4 text-[26px] font-bold leading-tight text-accent">{BRAND.name}</h1>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[11px] text-muted"><ShieldCheck size={13} />{t("secure_badge")}</span>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{recover ? <>🔑 {t("recover_title")}</> : <>👋 {mode === "setup" ? t("welcome_new") : t("welcome_back")}</>}</div>
          <p className="mt-1 text-xs text-muted">{recover ? t("recover_sub") : mode === "setup" ? t("setup_sub") : t("login_sub")}</p>
        </div>
        {mode === "setup" && <Field label={t("full_name")}><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="h-11 rounded-xl" /></Field>}
        <Field label={t("username")}><Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus={mode === "login"} required className="h-11 rounded-xl" /></Field>
        {recover && <Field label={t("recovery_key")}><Input dir="ltr" value={rkey} onChange={(e) => setRkey(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" required className="num h-11 rounded-xl tracking-widest" /></Field>}
        <Field label={recover ? t("new_password") : t("password")}>
          <div className="relative">
            <Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "setup" ? "new-password" : "current-password"} required className="h-11 rounded-xl pe-10" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute end-3 top-3 text-muted hover:text-ink" aria-label="show">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
        </Field>
        {(mode === "setup" || recover) && <Field label={t("password_again")}><Input type={show ? "text" : "password"} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required className="h-11 rounded-xl" /></Field>}
        {err && <p role="alert" className="rounded-xl bg-bad/10 px-3 py-2 text-xs text-bad">{err}</p>}
        <Button type="submit" className="h-12 w-full rounded-2xl text-base" disabled={busy}><Sparkles size={17} />{recover ? t("reset_password") : mode === "setup" ? t("create_account") : t("enter")}</Button>
        {mode === "login" && <button type="button" onClick={() => { setRecover((v) => !v); setErr(""); setPassword(""); setAgain(""); }} className="block w-full text-center text-sm font-medium text-accent hover:underline">{recover ? t("back_to_login") : t("forgot_password")}</button>}
        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-muted"><ShieldCheck size={12} />{mode === "setup" ? t("setup_note") : recover ? t("recover_note") : t("data_local")}</p>
      </form>
    </div>
  );
}
