"use client";
import { BadgeCheck, Clock, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { api, call } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { licenseApi, type LicenseStatus } from "@/lib/license";
import { useT } from "@/lib/i18n";

/** Read-only view of the license: the decision is made by the main process (bader-license/), never by this page. */
export default function LicensePage() {
  const t = useT();
  const [s, setS] = useState<LicenseStatus | null>(null);
  const [bridge, setBridge] = useState(true);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState("");
  const fmt = (n: number) => (n ? new Date(n * 1000).toLocaleDateString("en-GB") : "—");

  const load = useCallback(async (recheck = false) => {
    const lic = licenseApi();
    if (!lic) return setBridge(false); // plain browser (npm run dev / Playwright against out/)
    setBusy(true);
    try { setS(await (recheck ? lic.recheck() : lic.status())); } finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); call<any>(api().app.info()).then((i) => setVersion(i.version)).catch(() => {}); }, [load]);

  const ok = !!s?.valid;
  const row = (label: string, value: ReactNode) => (
    <div className="flex items-center gap-3 border-b border-line py-2.5 text-sm last:border-0"><span className="w-40 text-muted">{label}</span><span className="min-w-0 flex-1 font-medium">{value}</span></div>
  );
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("license")} />
      {!bridge ? <Card><p className="text-sm text-muted">{t("license_desktop_only")}</p></Card> : (
        <Card>
          <span className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${s?.dev ? "bg-warn/15 text-warn" : ok ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"}`}>
            {s?.dev ? <Clock size={15} /> : <ShieldCheck size={15} />}{!s ? "…" : s.dev ? t("lic_dev") : ok ? t("lic_active") : t("lic_inactive")}
          </span>
          {s && <>
            <p className="mb-3 text-sm text-muted">{s.message}</p>
            {row(t("lic_owner"), s.customer || "—")}
            {row(t("lic_plan"), s.plan || s.edition || "—")}
            {row(t("lic_number"), <span dir="ltr">{s.license_id || "—"}</span>)}
            {row(t("lic_activated"), fmt(s.activated))}
            {row(t("lic_expires"), s.expires ? fmt(s.expires) : t("lic_lifetime"))}
            {s.days_left !== null && row(t("lic_days_left"), s.days_left)}
          </>}
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><BadgeCheck size={13} />{t("lic_signed_note")}</p>
          <Button className="mt-4" disabled={busy} onClick={() => load(true)}><RefreshCw size={15} className={busy ? "animate-spin" : ""} />{t("lic_check_now")}</Button>
        </Card>
      )}
      <Card className="mt-5" title={t("support")}>
        <p className="text-sm text-muted">{t("developer")}: <b dir="ltr">{BRAND.developer}</b> · v{version || "—"}</p>
      </Card>
    </div>
  );
}
