"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, Edit, Eye, EyeOff, KeyRound, Plus, Printer, Search, Star, Trash2, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { CATEGORIES, type Account } from "@/types";
import { checkPasswordStrength, findDuplicates } from "@/lib/passwordStrength";
import { copyToClipboard } from "@/lib/utils";
import { printAccounts } from "@/lib/reports";

const EMPTY = { siteName: "", siteUrl: "", category: "other", username: "", password: "", notes: "", isFavorite: false };
const STRENGTH_COLOR: Record<string, string> = { red: "bg-red-500", orange: "bg-orange-500", yellow: "bg-yellow-500", green: "bg-green-500" };

/**
 * REFERENCE MODULE (hand written): search, filters, add/edit dialog, copy-with-auto-clear, reveal toggle,
 * strength meter, favourites, delete confirmation, printable report with secrets hidden by default.
 * Generated modules (scripts/add_module.py) follow the same shape with simpler fields.
 */
export default function AccountsPage() {
  const t = useTranslations("accounts");
  const tp = useTranslations("print") as unknown as (k: string, v?: Record<string, string | number>) => string;
  const tc = useTranslations("common");
  const ts = useTranslations("strength");
  const locale = useLocale();

  const accounts = useStore((s) => s.accounts);
  const add = useStore((s) => s.addAccount);
  const update = useStore((s) => s.updateAccount);
  const remove = useStore((s) => s.deleteAccount);
  const toggleFav = useStore((s) => s.toggleFavoriteAccount);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites" | "weak" | "duplicate">("all");
  const [editing, setEditing] = useState<Partial<Account> | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [toDelete, setToDelete] = useState<Account | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  const dupes = useMemo(() => findDuplicates(accounts), [accounts]);
  const catLabel = (v: string) => t(`categories.${v}` as never);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts
      .filter((a) => {
        if (q && ![a.siteName, a.username, a.siteUrl, catLabel(a.category)].some((x) => x?.toLowerCase().includes(q))) return false;
        if (filter === "favorites") return a.isFavorite;
        if (filter === "weak") return checkPasswordStrength(a.password).score <= 2;
        if (filter === "duplicate") return (dupes.get(a.password) || 0) > 1;
        return true;
      })
      .sort((a, b) => a.siteName.localeCompare(b.siteName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, search, filter, dupes, locale]);

  const save = () => {
    if (!editing?.siteName?.trim()) return setError(t("nameRequired"));
    if (!editing.password) return setError(t("passwordRequired"));
    const data = {
      siteName: editing.siteName.trim(),
      siteUrl: editing.siteUrl?.trim() || undefined,
      category: editing.category || "other",
      username: editing.username?.trim() || undefined,
      password: editing.password,
      notes: editing.notes?.trim() || undefined,
      isFavorite: !!editing.isFavorite,
    };
    if (editing.id) update(editing.id, data);
    else add(data);
    setEditing(null);
    setError("");
  };

  const copy = async (a: Account) => {
    if (await copyToClipboard(a.password)) {
      setCopied(a.id);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  const input = "w-full px-3 py-2 rounded-lg border border-border bg-card text-fg";
  const filters = ["all", "favorites", "weak", "duplicate"] as const;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><KeyRound className="w-8 h-8 text-primary" />{t("title")}</h1>
            <p className="text-muted mt-1">{t("subtitle", { count: accounts.length })}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => printAccounts({ locale, tp, title: t("title") }, rows, catLabel)} className="px-4 py-2 rounded-xl border border-border bg-card flex items-center gap-2 text-sm" aria-label={tc("print")}>
              <Printer className="w-4 h-4" />{tc("print")}
            </button>
            <button onClick={() => { setEditing({ ...EMPTY }); setError(""); }} className="btn-3d px-5 py-2 rounded-xl text-white bg-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />{t("add")}
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tc("search")} aria-label={tc("search")} className={`${input} ps-9`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm ${filter === f ? "text-white bg-primary" : "border border-border bg-card text-muted"}`}>
                {tc(f)}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted">{accounts.length === 0 ? t("empty") : tc("noResults")}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((a) => {
              const st = checkPasswordStrength(a.password);
              const dup = (dupes.get(a.password) || 0) > 1;
              return (
                <div key={a.id} className="glass rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold truncate" dir="auto">{a.siteName}</div>
                      <div className="text-xs text-muted">{catLabel(a.category)}</div>
                    </div>
                    <button onClick={() => toggleFav(a.id)} aria-label={tc("favorite")} className="p-1">
                      <Star className={`w-5 h-5 ${a.isFavorite ? "fill-yellow-400 text-yellow-500" : "text-muted"}`} />
                    </button>
                  </div>
                  {a.username && <div className="text-sm num truncate" dir="ltr">{a.username}</div>}
                  <div className="flex items-center gap-2">
                    <code className="flex-1 min-w-0 truncate text-sm num" dir="ltr">{revealed[a.id] ? a.password : "••••••••••"}</code>
                    <button onClick={() => setRevealed((r) => ({ ...r, [a.id]: !r[a.id] }))} className="p-1.5 rounded-lg hover:bg-accent" aria-label={revealed[a.id] ? t("hide") : t("show")}>
                      {revealed[a.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => copy(a)} className="p-1.5 rounded-lg hover:bg-accent" aria-label={tc("copy")}>
                      {copied === a.id ? <span className="text-xs text-green-600">{tc("copied")}</span> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 flex-1 rounded-full bg-accent overflow-hidden"><div className={`h-full ${STRENGTH_COLOR[st.color]}`} style={{ width: `${Math.min(100, (st.score / 7) * 100)}%` }} /></div>
                    <span className="text-muted">{ts(st.level)}</span>
                    {dup && <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700">{t("reused")}</span>}
                  </div>
                  <div className="flex justify-end gap-1 pt-1">
                    <button onClick={() => { setEditing(a); setError(""); }} className="p-2 rounded-lg hover:bg-accent" aria-label={tc("edit")}><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setToDelete(a)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-600" aria-label={tc("delete")}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="bg-card text-fg border border-border rounded-2xl p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editing.id ? t("edit") : t("add")}</h3>
              <button onClick={() => setEditing(null)} aria-label={tc("cancel")} className="p-1.5 rounded-lg hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <label className="block text-sm">{t("siteName")} *<input className={input} value={editing.siteName || ""} onChange={(e) => setEditing({ ...editing, siteName: e.target.value })} autoFocus dir="auto" /></label>
            <label className="block text-sm">{t("siteUrl")}<input className={input} dir="ltr" inputMode="url" value={editing.siteUrl || ""} onChange={(e) => setEditing({ ...editing, siteUrl: e.target.value })} /></label>
            <label className="block text-sm">{t("category")}
              <select className={input} value={editing.category || "other"} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {catLabel(c.value)}</option>)}
              </select>
            </label>
            <label className="block text-sm">{t("username")}<input className={input} dir="ltr" autoComplete="off" value={editing.username || ""} onChange={(e) => setEditing({ ...editing, username: e.target.value })} /></label>
            <label className="block text-sm">{t("password")} *<input className={input} dir="ltr" autoComplete="off" value={editing.password || ""} onChange={(e) => setEditing({ ...editing, password: e.target.value })} /></label>
            <label className="block text-sm">{t("notes")}<textarea className={input} rows={3} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} dir="auto" /></label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg bg-accent">{tc("cancel")}</button>
              <button onClick={save} className="px-5 py-2 rounded-lg text-white bg-primary">{tc("save")}</button>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="alertdialog" aria-modal="true">
          <div className="bg-card text-fg border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <p>{t("confirmDelete", { name: toDelete.siteName })}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setToDelete(null)} className="px-4 py-2 rounded-lg bg-accent">{tc("cancel")}</button>
              <button onClick={() => { remove(toDelete.id); setToDelete(null); }} className="px-4 py-2 rounded-lg text-white bg-red-600">{tc("delete")}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
