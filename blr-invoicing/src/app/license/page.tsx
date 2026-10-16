"use client";
import { Clock, Copy, Mail, MessageCircle, Phone, Printer, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CertPreview } from "@/components/CertPreview";
import { printLicense } from "@/components/Onboarding";
import { buildLicenseHtml } from "@/lib/licenseHtml";
import { withFont } from "@/lib/fontEmbed";
import { Button, Card, PageHeader } from "@/components/ui";
import { blr, call } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { useT } from "@/lib/i18n";
import { useUi } from "@/store/ui";

interface Status { valid: boolean; message: string; plan: string; edition: string; customer: string; license_id: string; domain: string; activated: number; expires: number; days_left: number | null; dev?: boolean }

export default function LicensePage() {
  const t = useT();
  const lang = useUi((s) => s.lang);
  const [s, setS] = useState<Status | null>(null);
  const [bridge, setBridge] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [version, setVersion] = useState("");

  const load = useCallback(async (recheck = false) => {
    if (!window.baderLicense) return setBridge(false);
    setBusy(true);
    try { setS(await (recheck ? window.baderLicense.recheck() : window.baderLicense.status())); } finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); call<any>(blr().app.info()).then((i) => setVersion(i.version)).catch(() => {}); }, [load]);

  const ok = !!s?.valid;
  const contacts = [
    { icon: <Mail size={16} />, label: "Email", text: BRAND.email, href: `mailto:${BRAND.email}` },
    { icon: <Phone size={16} />, label: t("phone"), text: BRAND.phone, href: `tel:${BRAND.phone}` },
    { icon: <MessageCircle size={16} />, label: "WhatsApp", text: BRAND.phone, href: BRAND.whatsapp },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("license")} />
      {!bridge ? <Card><p className="text-sm text-muted">{t("license_desktop_only")}</p></Card> : (
        <Card pad={false} className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${s?.dev ? "bg-warn/15 text-warn" : ok ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"}`}>
              {s?.dev ? <Clock size={15} /> : <ShieldCheck size={15} />}{!s ? "…" : s.dev ? t("lic_dev") : ok ? t("lic_active") : t("lic_inactive")}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-muted">{s?.message}</span>
            {s && s.days_left !== null && <span className="text-sm text-muted">{t("lic_days_left")}: <b>{s.days_left}</b></span>}
            {s && <button className="inline-flex items-center gap-1 font-mono text-xs text-muted" dir="ltr" onClick={() => { navigator.clipboard?.writeText(s.domain); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{s.domain ? `${s.domain.slice(0, 10)}…${s.domain.slice(-6)}` : "—"} <Copy size={12} />{copied && <span className="text-ok">✓</span>}</button>}
          </div>
          <div className="bg-surface2 p-3 sm:p-5">
            {s && <CertPreview s={s} lang={lang} version={version} />}
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            <Button className="flex-1" disabled={busy} onClick={() => load(true)}><RefreshCw size={15} className={busy ? "animate-spin" : ""} />{t("lic_check_now")}</Button>
            <Button variant="secondary" disabled={!s} onClick={() => s && printLicense(s, lang, version)}><Printer size={15} />{t("print")}</Button>
            <Button variant="secondary" disabled={!s} onClick={async () => { if (!s) return; const r = await call<{ saved: boolean }>(blr().print.pdf(await withFont(await buildLicenseHtml(s, lang, version, window.location.origin)), "BLR-Fatourati-license.pdf")); if (r.saved) useUi.getState().notify(t("saved")); }}>PDF</Button>
          </div>
        </Card>
      )}
      <Card className="mt-5" title={t("support")}>
        <p className="mb-4 text-sm text-muted">{t("developer")}: <b dir="ltr">{BRAND.developer}</b> — Baderinfo</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {contacts.map((c) => (
            <button key={c.label} onClick={() => call(blr().app.openExternal(c.href.startsWith("http") ? c.href : c.href))} className="flex items-center gap-2 rounded-xl border border-line bg-surface2 px-4 py-3 text-start text-sm hover:shadow-md">
              {c.icon}<span className="min-w-0"><span className="block text-[11px] text-muted">{c.label}</span><span className="block truncate font-medium" dir="ltr">{c.text}</span></span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
