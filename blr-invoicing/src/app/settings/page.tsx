"use client";
import { Download, FolderOpen, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Card, Empty, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { blr, call } from "@/lib/api";
import { DOC_TYPES } from "@/lib/defaults";
import { toDataUrl } from "@/lib/image";
import { useT } from "@/lib/i18n";
import type { DocType, Settings } from "@/lib/types";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

type Tab = "company" | "invoice" | "tax" | "security" | "backup" | "ai";
const TABS: Tab[] = ["company", "invoice", "tax", "security", "backup", "ai"];

export default function SettingsPage() {
  const t = useT();
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const stored = useData((s) => s.settings);
  const saveSettings = useData((s) => s.saveSettings);
  const [tab, setTab] = useState<Tab>("company");
  const [s, setS] = useState<Settings>(structuredClone(stored));
  const [dirty, setDirty] = useState(false);
  if (!can(role, "*")) return <Empty text={t("no_permission")} />;

  const upd = (fn: (d: Settings) => void) => { const d = structuredClone(s); fn(d); setS(d); setDirty(true); };
  const save = async () => { try { await saveSettings(s); setDirty(false); notify(t("saved")); } catch { notify(t("error"), "err"); } };

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <PageHeader title={t("settings")} />
      <div className="mb-5 flex flex-wrap gap-2">{TABS.map((k) => <button key={k} onClick={() => setTab(k)} className={`pill rounded-full border px-4 py-1.5 text-sm ${tab === k ? "border-accent bg-accent text-white" : "border-line bg-surface text-muted"}`}>{t("set_" + k)}</button>)}</div>

      {tab === "company" && <CompanyTab s={s} upd={upd} />}
      {tab === "invoice" && <InvoiceTab s={s} upd={upd} />}
      {tab === "tax" && <TaxTab s={s} upd={upd} />}
      {tab === "security" && <SecurityTab s={s} upd={upd} />}
      {tab === "backup" && <BackupTab />}
      {tab === "ai" && <AiTab />}

      {dirty && tab !== "backup" && tab !== "ai" && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-end gap-2 border-t border-line bg-surface/95 px-6 py-3 backdrop-blur lg:start-64">
          <Button variant="secondary" onClick={() => { setS(structuredClone(stored)); setDirty(false); }}>{t("cancel")}</Button>
          <Button onClick={save}>{t("save")}</Button>
        </div>
      )}
    </div>
  );
}

type TabProps = { s: Settings; upd: (fn: (d: Settings) => void) => void };

function CompanyTab({ s, upd }: TabProps) {
  const t = useT();
  const logo = useRef<HTMLInputElement>(null);
  const sig = useRef<HTMLInputElement>(null);
  const stp = useRef<HTMLInputElement>(null);
  const c = s.company;
  const set = (k: keyof Settings["company"], v: string) => upd((d) => { (d.company as any)[k] = v; });
  const img = async (f: File | undefined, k: "logo" | "signature" | "stamp") => { if (f) set(k, await toDataUrl(f, k === "logo" ? 420 : 320)); };
  return (
    <Card title={t("set_company")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("company_name") + " *"}><Input value={c.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label={t("legal_name")}><Input value={c.legalName || ""} onChange={(e) => set("legalName", e.target.value)} /></Field>
        <Field label={t("address")} className="sm:col-span-2"><Input value={c.address || ""} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label={t("phone")}><Input value={c.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label={t("email")}><Input value={c.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label={t("website")}><Input value={c.website || ""} onChange={(e) => set("website", e.target.value)} /></Field>
        <Field label="NIF"><Input value={c.taxId || ""} onChange={(e) => set("taxId", e.target.value)} /></Field>
        <Field label="RC"><Input value={c.rc || ""} onChange={(e) => set("rc", e.target.value)} /></Field>
        <Field label="AI"><Input value={c.ai || ""} onChange={(e) => set("ai", e.target.value)} /></Field>
        <Field label="NIS"><Input value={c.nis || ""} onChange={(e) => set("nis", e.target.value)} /></Field>
        <Field label={t("bank_details")} className="sm:col-span-2"><Textarea value={c.bank || ""} onChange={(e) => set("bank", e.target.value)} placeholder="RIB / IBAN" /></Field>
        {(["logo", "signature", "stamp"] as const).map((k) => (
          <div key={k} className="space-y-2">
            <div className="text-xs font-medium text-muted">{t(k === "stamp" ? "stamp_image" : k)}</div>
            <div className="flex items-center gap-3">
              <div className="grid h-20 w-32 place-items-center rounded-lg border border-dashed border-line bg-surface2">{c[k] ? <img src={c[k]} alt="" className="max-h-16 max-w-28 object-contain" /> : <span className="text-xs text-muted">—</span>}</div>
              <input ref={k === "logo" ? logo : k === "signature" ? sig : stp} type="file" accept="image/*" hidden onChange={(e) => img(e.target.files?.[0], k)} />
              <div className="flex flex-col gap-2"><Button size="sm" variant="secondary" onClick={() => (k === "logo" ? logo : k === "signature" ? sig : stp).current?.click()}><Upload size={13} />{t("upload")}</Button>{c[k] && <Button size="sm" variant="ghost" onClick={() => set(k, "")}><Trash2 size={13} />{t("remove")}</Button>}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InvoiceTab({ s, upd }: TabProps) {
  const t = useT();
  return (
    <div className="space-y-5">
      <Card title={t("appearance")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("template")}><Select value={s.template} onChange={(e) => upd((d) => { d.template = e.target.value as any; })}>{["modern", "classic", "minimal"].map((x) => <option key={x} value={x}>{t("tpl_" + x)}</option>)}</Select></Field>
          <Field label={t("accent_color")}><div className="flex gap-2"><input type="color" value={s.accent} onChange={(e) => upd((d) => { d.accent = e.target.value; })} className="h-10 w-14 rounded-lg border border-line bg-surface" /><Input value={s.accent} onChange={(e) => upd((d) => { d.accent = e.target.value; })} className="num" /></div></Field>
          <Field label={t("due_days")}><Input type="number" min="0" value={s.dueDays} onChange={(e) => upd((d) => { d.dueDays = Number(e.target.value) || 0; })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.showQr} onChange={(e) => upd((d) => { d.showQr = e.target.checked; })} />{t("show_qr")}</label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("default_terms")}><Textarea value={s.terms} onChange={(e) => upd((d) => { d.terms = e.target.value; })} /></Field>
          <Field label={t("footer_text")}><Textarea value={s.footer} onChange={(e) => upd((d) => { d.footer = e.target.value; })} /></Field>
        </div>
      </Card>
      <Card title={t("numbering")}>
        <div className="space-y-3">
          {DOC_TYPES.map((k: DocType) => (
            <div key={k} className="grid grid-cols-[1fr_90px_80px_auto] items-center gap-3 text-sm">
              <span>{t("t_" + k)}</span>
              <Input value={s.numbering[k].prefix} onChange={(e) => upd((d) => { d.numbering[k].prefix = e.target.value.toUpperCase().slice(0, 6); })} className="num" />
              <Input type="number" min="3" max="9" value={s.numbering[k].pad} onChange={(e) => upd((d) => { d.numbering[k].pad = Math.min(9, Math.max(3, Number(e.target.value) || 5)); })} />
              <label className="flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={s.numbering[k].yearly} onChange={(e) => upd((d) => { d.numbering[k].yearly = e.target.checked; })} />{t("yearly_reset")}</label>
              <span className="col-span-4 -mt-1 text-[11px] text-muted num">{s.numbering[k].prefix}{s.numbering[k].yearly ? "-" + new Date().getFullYear() : ""}-{"1".padStart(s.numbering[k].pad, "0")}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TaxTab({ s, upd }: TabProps) {
  const t = useT();
  return (
    <div className="space-y-5">
      <Card title={t("currency")}>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label={t("code")}><Input value={s.currency.code} onChange={(e) => upd((d) => { d.currency.code = e.target.value.toUpperCase().slice(0, 4); })} /></Field>
          <Field label={t("symbol")}><Input value={s.currency.symbol} onChange={(e) => upd((d) => { d.currency.symbol = e.target.value.slice(0, 5); })} /></Field>
          <Field label={t("position")}><Select value={s.currency.position} onChange={(e) => upd((d) => { d.currency.position = e.target.value as any; })}><option value="after">{t("after")}</option><option value="before">{t("before")}</option></Select></Field>
          <Field label={t("decimals")}><Select value={s.currency.decimals} onChange={(e) => upd((d) => { d.currency.decimals = Number(e.target.value); })}>{[0, 2, 3].map((n) => <option key={n}>{n}</option>)}</Select></Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {[["DZD", "DA"], ["MAD", "DH"], ["TND", "DT"], ["EUR", "€"], ["USD", "$"], ["SAR", "SR"], ["AED", "AED"]].map(([c, sym]) => <button key={c} onClick={() => upd((d) => { d.currency.code = c; d.currency.symbol = sym; })} className="rounded-md border border-line px-2.5 py-1 hover:bg-surface2">{c}</button>)}
        </div>
      </Card>
      <Card title={t("taxes")}>
        <div className="space-y-2">
          {s.taxes.map((x, i) => (
            <div key={x.id} className="grid grid-cols-[1fr_100px_36px] gap-2">
              <Input value={x.name} onChange={(e) => upd((d) => { d.taxes[i].name = e.target.value; })} />
              <Input type="number" min="0" step="any" value={x.rate} onChange={(e) => upd((d) => { d.taxes[i].rate = Number(e.target.value) || 0; })} className="num" />
              <button className="text-bad" onClick={() => upd((d) => { d.taxes.splice(i, 1); })}><Trash2 size={15} /></button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => upd((d) => { d.taxes.push({ id: crypto.randomUUID(), name: "TVA", rate: 0 }); })}><Plus size={14} />{t("add")}</Button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("default_tax")}><Select value={s.defaultTax} onChange={(e) => upd((d) => { d.defaultTax = Number(e.target.value); })}>{[...new Set([0, ...s.taxes.map((x) => x.rate)])].sort((a, b) => a - b).map((r) => <option key={r} value={r}>{r}%</option>)}</Select></Field>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.pricesIncludeTax} onChange={(e) => upd((d) => { d.pricesIncludeTax = e.target.checked; })} />{t("prices_include_tax")}</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.stampDuty} onChange={(e) => upd((d) => { d.stampDuty = e.target.checked; })} />{t("stamp_duty_option")}</label>
        </div>
      </Card>
    </div>
  );
}

function SecurityTab({ s, upd }: TabProps) {
  const t = useT();
  const notify = useUi((st) => st.notify);
  const [o, setO] = useState(""), [n, setN] = useState(""), [n2, setN2] = useState("");
  const change = async () => {
    if (n !== n2) return notify(t("err_mismatch"), "err");
    try { await call(blr().auth.changePassword(o, n)); setO(""); setN(""); setN2(""); notify(t("saved")); }
    catch (e: any) { notify(e?.message === "weak-password" ? t("err_weak") : t("err_login"), "err"); }
  };
  const user = useUi((st) => st.user);
  const [rpw, setRpw] = useState("");
  const renew = async () => {
    try {
      const r = await call<{ recoveryKey: string }>(blr().auth.newRecovery(rpw));
      setRpw("");
      useUi.setState((st) => ({ recoveryKey: r.recoveryKey, user: st.user ? { ...st.user, hasRecovery: true } : st.user }));
    } catch { notify(t("err_login"), "err"); }
  };
  return (
    <div className="space-y-5">
      <Card title={t("recovery_key")}>
        <p className="mb-3 text-sm text-muted">{t("recovery_explain")}</p>
        <p className="mb-4 text-sm">{user?.hasRecovery ? <span className="text-ok">● {t("recovery_active")}</span> : <span className="text-warn">○ {t("recovery_missing")}</span>}</p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("current_password")} className="w-64"><Input type="password" value={rpw} onChange={(e) => setRpw(e.target.value)} autoComplete="current-password" /></Field>
          <Button onClick={renew} disabled={!rpw}>{user?.hasRecovery ? t("recovery_renew") : t("recovery_create")}</Button>
        </div>
      </Card>
      <Card title={t("auto_lock")}>
        <Field label={t("auto_lock_min")} hint={t("auto_lock_hint")}><Select value={s.autoLockMin} onChange={(e) => upd((d) => { d.autoLockMin = Number(e.target.value); })} className="w-56">{[0, 5, 10, 15, 30, 60].map((m) => <option key={m} value={m}>{m ? `${m} ${t("minutes")}` : t("never")}</option>)}</Select></Field>
      </Card>
      <Card title={t("change_password")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("current_password")}><Input type="password" value={o} onChange={(e) => setO(e.target.value)} autoComplete="current-password" /></Field>
          <Field label={t("new_password")}><Input type="password" value={n} onChange={(e) => setN(e.target.value)} autoComplete="new-password" /></Field>
          <Field label={t("password_again")}><Input type="password" value={n2} onChange={(e) => setN2(e.target.value)} autoComplete="new-password" /></Field>
        </div>
        <Button className="mt-4" onClick={change} disabled={!o || !n}>{t("change_password")}</Button>
      </Card>
    </div>
  );
}

function BackupTab() {
  const t = useT();
  const notify = useUi((st) => st.notify);
  const [pw, setPw] = useState("");
  const [rpw, setRpw] = useState("");
  const doExport = async () => {
    try { const r = await call<{ saved: boolean }>(blr().backup.export(pw)); if (r.saved) notify(t("backup_saved")); } catch { notify(t("error"), "err"); }
  };
  const doRestore = async () => {
    if (!confirm(t("restore_confirm"))) return;
    try {
      const r = await call<{ restored: boolean }>(blr().backup.restore(rpw));
      if (r.restored) { notify(t("restore_done")); useData.getState().reset(); await useUi.getState().boot(); }
    } catch (e: any) { notify(e?.message === "wrong-password" || e?.message === "password-required" ? t("wrong_backup_password") : t("error"), "err"); }
  };
  return (
    <div className="space-y-5">
      <Card title={t("backup_export")}>
        <p className="mb-4 text-sm text-muted">{t("backup_hint")}</p>
        <div className="flex flex-wrap items-end gap-3"><Field label={t("backup_password")} className="w-64"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("optional_but_recommended")} /></Field>
          <Button onClick={doExport}><Download size={15} />{t("backup_now")}</Button>
          <Button variant="secondary" onClick={() => call(blr().backup.openFolder())}><FolderOpen size={15} />{t("auto_backups_folder")}</Button></div>
        <p className="mt-3 text-xs text-muted">{t("auto_backup_note")}</p>
      </Card>
      <Card title={t("backup_restore")}>
        <p className="mb-4 text-sm text-warn">{t("restore_warning")}</p>
        <div className="flex flex-wrap items-end gap-3"><Field label={t("backup_password")} className="w-64"><Input type="password" value={rpw} onChange={(e) => setRpw(e.target.value)} /></Field><Button variant="danger" onClick={doRestore}><Upload size={15} />{t("restore_now")}</Button></div>
      </Card>
    </div>
  );
}

function AiTab() {
  const t = useT();
  const notify = useUi((st) => st.notify);
  const [has, setHas] = useState<boolean | null>(null);
  const [key, setKey] = useState("");
  useState(() => { Promise.resolve(blr().ai.hasKey()).then((r: any) => setHas(typeof r === "boolean" ? r : !!r?.data)).catch(() => setHas(false)); });
  const save = async () => {
    const r: any = await blr().ai.setKey(key);
    if (r?.ok) { setHas(!!key); setKey(""); notify(t("saved")); } else notify(r?.error === "desktop-only" ? t("desktop_only") : t("ai_bad_key"), "err");
  };
  return (
    <Card title={t("set_ai")}>
      <p className="mb-3 text-sm text-muted">{t("ai_settings_hint")}</p>
      <p className="mb-4 text-sm">{has ? <span className="text-ok">● {t("ai_key_saved")}</span> : <span className="text-muted">○ {t("ai_key_missing")}</span>}</p>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Anthropic API key" className="w-96 max-w-full"><Input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-..." autoComplete="off" /></Field>
        <Button onClick={save} disabled={!key}>{t("save")}</Button>
        {has && <Button variant="secondary" onClick={async () => { await blr().ai.setKey(""); setHas(false); }}>{t("remove")}</Button>}
      </div>
      <p className="mt-3 text-xs text-muted">{t("ai_privacy")}</p>
    </Card>
  );
}
