"use client";
import { Download, FolderOpen, Upload } from "lucide-react";
import { useState } from "react";
import { Button, Card, Empty, Field, Input, PageHeader } from "@/components/ui";
import { api, call } from "@/lib/api";
import { num } from "@/lib/calc";
import { useT } from "@/lib/i18n";
import type { Settings } from "@/lib/types";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

type Tab = "company" | "security" | "backup";
const TABS: Tab[] = ["company", "security", "backup"];

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
  const label: Record<Tab, string> = { company: t("set_company"), security: t("settings_security"), backup: t("settings_backup") };

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <PageHeader title={t("settings")} />
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((k) => <button key={k} onClick={() => setTab(k)} className={`pill rounded-full border px-4 py-1.5 text-sm ${tab === k ? "border-accent bg-accent text-white" : "border-line bg-surface hover:bg-surface2"}`}>{label[k]}</button>)}
      </div>

      {tab === "company" && (
        <Card title={t("set_company")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("company_name")}><Input value={s.company.name} onChange={(e) => upd((d) => { d.company.name = e.target.value; })} /></Field>
            <Field label={t("phone")}><Input value={s.company.phone || ""} onChange={(e) => upd((d) => { d.company.phone = e.target.value; })} /></Field>
            <Field label={t("address")} className="sm:col-span-2"><Input value={s.company.address || ""} onChange={(e) => upd((d) => { d.company.address = e.target.value; })} /></Field>
            <Field label={t("currency_symbol")}><Input value={s.currency.symbol} onChange={(e) => upd((d) => { d.currency.symbol = e.target.value; })} /></Field>
            <Field label={t("default_tax")}><Input inputMode="decimal" className="num" value={s.defaultTax} onChange={(e) => upd((d) => { d.defaultTax = num(e.target.value); })} /></Field>
          </div>
        </Card>
      )}
      {tab === "security" && (
        <div className="space-y-5">
          <Card title={t("auto_lock")}>
            <Field label={`${t("auto_lock_min")} (${t("minutes")}, 0 = ${t("never")})`} className="max-w-xs"><Input inputMode="numeric" className="num" value={s.autoLockMin} onChange={(e) => upd((d) => { d.autoLockMin = Math.max(0, Math.round(num(e.target.value))); })} /></Field>
          </Card>
          <PasswordCard />
        </div>
      )}
      {tab === "backup" && <BackupTab />}

      {dirty && tab !== "backup" && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-end gap-2 border-t border-line bg-surface/95 px-6 py-3 backdrop-blur lg:start-64">
          <Button variant="secondary" onClick={() => { setS(structuredClone(stored)); setDirty(false); }}>{t("cancel")}</Button>
          <Button onClick={save}>{t("save")}</Button>
        </div>
      )}
    </div>
  );
}

function PasswordCard() {
  const t = useT();
  const notify = useUi((s) => s.notify);
  const [oldPw, setOld] = useState("");
  const [newPw, setNew] = useState("");
  const change = async () => {
    try { await call(api().auth.changePassword(oldPw, newPw)); setOld(""); setNew(""); notify(t("password_changed")); }
    catch (e: any) { notify(t("err_" + (e?.message || "generic")), "err"); }
  };
  return (
    <Card title={t("change_password")}>
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("current_password")} className="w-64"><Input type="password" value={oldPw} onChange={(e) => setOld(e.target.value)} autoComplete="current-password" /></Field>
        <Field label={t("new_password")} className="w-64"><Input type="password" value={newPw} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" /></Field>
        <Button onClick={change} disabled={!oldPw || !newPw}>{t("change_password")}</Button>
      </div>
    </Card>
  );
}

function BackupTab() {
  const t = useT();
  const notify = useUi((st) => st.notify);
  const [pw, setPw] = useState("");
  const [rpw, setRpw] = useState("");
  const doExport = async () => {
    try { const r = await call<{ saved: boolean }>(api().backup.export(pw)); if (r.saved) notify(t("backup_saved")); } catch { notify(t("error"), "err"); }
  };
  const doRestore = async () => {
    if (!confirm(t("restore_confirm"))) return;
    try {
      const r = await call<{ restored: boolean }>(api().backup.restore(rpw));
      // restore signs everyone out in the main process: reset the page state and go back to the login screen
      if (r.restored) { notify(t("restore_done")); useData.getState().reset(); await useUi.getState().boot(); }
    } catch (e: any) { notify(e?.message === "wrong-password" || e?.message === "password-required" ? t("wrong_backup_password") : t("error"), "err"); }
  };
  return (
    <div className="space-y-5">
      <Card title={t("backup_export")}>
        <p className="mb-4 text-sm text-muted">{t("backup_hint")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("backup_password")} className="w-64"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("optional_but_recommended")} /></Field>
          <Button onClick={doExport}><Download size={15} />{t("backup_now")}</Button>
          <Button variant="secondary" onClick={() => call(api().backup.openFolder())}><FolderOpen size={15} />{t("auto_backups_folder")}</Button>
        </div>
        <p className="mt-3 text-xs text-muted">{t("auto_backup_note")}</p>
      </Card>
      <Card title={t("backup_restore")}>
        <p className="mb-4 text-sm text-warn">{t("restore_warning")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("backup_password")} className="w-64"><Input type="password" value={rpw} onChange={(e) => setRpw(e.target.value)} /></Field>
          <Button variant="danger" onClick={doRestore}><Upload size={15} />{t("restore_now")}</Button>
        </div>
      </Card>
    </div>
  );
}
