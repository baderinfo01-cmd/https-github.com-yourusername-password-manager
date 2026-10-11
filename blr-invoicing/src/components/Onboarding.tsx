"use client";
import { Printer, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LicenseStamp } from "./LicenseStamp";
import { Button, Field, Input, Modal, Select } from "./ui";
import { blr, call } from "@/lib/api";
import { toDataUrl } from "@/lib/image";
import { LOCALE, useT } from "@/lib/i18n";
import { licenseApi, type LicenseStatus } from "@/lib/license";
import { buildLicenseHtml } from "@/lib/licenseHtml";
import { useData } from "@/store/data";
import { openPreview } from "@/store/preview";
import { useUi } from "@/store/ui";

const FLAG_LICENSE = "blr-first-license-step";
const FLAG_COMPANY = "blr-first-company-step";
const flag = (k: string) => { try { return localStorage.getItem(k) === "1"; } catch { return true; } };
const setFlag = (k: string) => { try { localStorage.setItem(k, "1"); } catch {} };

export function printLicense(s: LicenseStatus, lang: "ar" | "en" | "fr", version: string) {
  openPreview({ title: "BLR Fatourati", fileName: "BLR-Fatourati-license.pdf", build: async () => buildLicenseHtml(s, lang, version, window.location.origin) });
}

/** First run, right after activation: the license certificate can be printed / saved as PDF, or skipped. */
export function LicenseStep({ onDone }: { onDone: () => void }) {
  const t = useT();
  const lang = useUi((u) => u.lang);
  const [s, setS] = useState<LicenseStatus | null>(null);
  const [version, setVersion] = useState("");
  useEffect(() => {
    licenseApi()?.status().then(setS).catch(() => setS(null));
    call<any>(blr().app.info()).then((i) => setVersion(i.version)).catch(() => {});
  }, []);
  const ok = !!s?.valid;
  const tone = s?.dev ? "amber" : ok ? "green" : "red";
  const fmt = (n: number) => (n ? new Date(n * 1000).toLocaleDateString(LOCALE[lang]) : "—");
  const done = () => { setFlag(FLAG_LICENSE); onDone(); };
  const pdf = async () => {
    if (!s) return;
    const html = buildLicenseHtml(s, lang, version, window.location.origin);
    const r = await call<{ saved: boolean }>(blr().print.pdf(html, "BLR-Fatourati-license.pdf"));
    if (r.saved) useUi.getState().notify(t("saved"));
  };
  return (
    <div className="auth-bg grid min-h-screen place-items-center overflow-y-auto p-4">
      <div className="glass pop w-full max-w-2xl rounded-[28px] p-7">
        <div className="flex items-center gap-4">
          <img src="/brand/app-icon.png" alt="" width={64} height={64} className="glow-ring rounded-2xl" />
          <div><div className="text-xs text-muted">{t("license_certificate")}</div><h1 className="text-2xl font-bold text-accent">BLR Fatourati</h1></div>
          <span className={`ms-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${s?.dev ? "bg-warn/15 text-warn" : ok ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"}`}><ShieldCheck size={15} />{!s ? "…" : s.dev ? t("lic_dev") : ok ? t("lic_active") : t("lic_inactive")}</span>
        </div>
        <p className="mt-3 text-sm text-muted">{t("license_step_hint")}</p>
        {s && (
          <div className="mt-4 grid items-center gap-5 md:grid-cols-[1fr_auto]">
            <dl className="divide-y divide-line text-sm">
              {([[t("lic_owner"), s.customer || "—"], [t("lic_plan"), s.plan || s.edition || "—"], [t("lic_number"), s.license_id || "—"], [t("lic_activated"), fmt(s.activated)], [t("lic_expires"), s.expires ? fmt(s.expires) : t("lic_lifetime")]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="font-semibold" dir="ltr">{v}</dd></div>
              ))}
            </dl>
            <div className="mx-auto flex flex-col items-center gap-2">
              <LicenseStamp width={168} tone={tone} title={s.dev ? t("stamp_dev") : ok ? t("stamp_title_ok") : t("stamp_title_bad")} subtitle={s.dev ? "DEVELOPMENT BUILD" : ok ? "GENUINE LICENSE" : "NOT ACTIVATED"} detail={`BLR FATOURATI · ${(s.plan || s.edition || "").toUpperCase() || "LICENSE"}`} footer={`ID: ${s.license_id || "—"} · BADERINFO`} />
              <img src="/brand/seal.png" alt="Baderinfo" className="h-[96px] w-[96px]" />
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" onClick={done}>{t("skip")}</Button>
          <Button variant="secondary" onClick={pdf} disabled={!s}>PDF</Button>
          <Button variant="secondary" onClick={() => s && printLicense(s, lang, version)} disabled={!s}><Printer size={15} />{t("print")}</Button>
          <Button onClick={done}>{t("continue")}</Button>
        </div>
      </div>
    </div>
  );
}

/** First sign-in of the administrator: company details for the invoices. Can be skipped and filled later in Settings. */
export function CompanyWizard() {
  const t = useT();
  const { settings, saveSettings } = useData();
  const user = useUi((u) => u.user);
  const recoveryKey = useUi((u) => u.recoveryKey);
  const notify = useUi((u) => u.notify);
  const [open, setOpen] = useState(false);
  const [c, setC] = useState(settings.company);
  const [cur, setCur] = useState(settings.currency.code);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (user?.role === "admin" && !recoveryKey && !settings.company.name && !flag(FLAG_COMPANY)) setOpen(true);
  }, [user, recoveryKey, settings.company.name]);
  if (!open) return null;
  const set = (k: keyof typeof c, v: string) => setC((x) => ({ ...x, [k]: v }));
  const skip = () => { setFlag(FLAG_COMPANY); setOpen(false); };
  const save = async () => {
    if (!c.name.trim()) return notify(t("name_required"), "err");
    const SYM: Record<string, string> = { DZD: "DA", MAD: "DH", TND: "DT", EUR: "€", USD: "$", SAR: "SR", AED: "AED" };
    await saveSettings({ ...settings, company: { ...c, name: c.name.trim() }, currency: { ...settings.currency, code: cur, symbol: SYM[cur] || cur } });
    setFlag(FLAG_COMPANY); setOpen(false); notify(t("saved"));
  };
  return (
    <Modal open wide onClose={skip} title={t("company_wizard_title")} footer={<><Button variant="ghost" onClick={skip}>{t("skip")}</Button><Button onClick={save}>{t("save")}</Button></>}>
      <p className="mb-4 text-sm text-muted">{t("company_wizard_hint")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("company_name") + " *"}><Input value={c.name} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
        <Field label={t("phone")}><Input value={c.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label={t("address")} className="sm:col-span-2"><Input value={c.address || ""} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label={t("email")}><Input value={c.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label={t("currency")}><Select value={cur} onChange={(e) => setCur(e.target.value)}>{["DZD", "MAD", "TND", "EUR", "USD", "SAR", "AED"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
        <Field label="NIF"><Input value={c.taxId || ""} onChange={(e) => set("taxId", e.target.value)} /></Field>
        <Field label="RC"><Input value={c.rc || ""} onChange={(e) => set("rc", e.target.value)} /></Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <div className="grid h-16 w-28 place-items-center rounded-xl border border-dashed border-line bg-surface2">{c.logo ? <img src={c.logo} alt="" className="max-h-14 max-w-24 object-contain" /> : <span className="text-xs text-muted">{t("logo")}</span>}</div>
          <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) set("logo", await toDataUrl(f, 420)); }} />
          <Button size="sm" variant="secondary" onClick={() => file.current?.click()}>{t("upload")}</Button>
        </div>
      </div>
    </Modal>
  );
}
