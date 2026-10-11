"use client";
import { BadgeCheck, CalendarDays, Clock, Copy, KeyRound, Mail, MessageCircle, Monitor, Phone, RefreshCw, ShieldCheck, User } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LicenseStamp } from "@/components/LicenseStamp";
import { Button, Card, PageHeader } from "@/components/ui";
import { blr, call } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { LOCALE, useT } from "@/lib/i18n";
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
  const fmt = (n: number) => (n ? new Date(n * 1000).toLocaleDateString(LOCALE[lang]) : "—");

  const load = useCallback(async (recheck = false) => {
    if (!window.baderLicense) return setBridge(false);
    setBusy(true);
    try { setS(await (recheck ? window.baderLicense.recheck() : window.baderLicense.status())); } finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); call<any>(blr().app.info()).then((i) => setVersion(i.version)).catch(() => {}); }, [load]);

  const ok = !!s?.valid;
  const tone = s?.dev ? "amber" : ok ? "green" : "red";
  const row = (icon: ReactNode, label: string, value: ReactNode) => (
    <div className="flex items-center gap-3 border-b border-line py-2.5 text-sm last:border-0"><span className="text-muted">{icon}</span><span className="w-36 text-muted">{label}</span><span className="min-w-0 flex-1 font-medium">{value}</span></div>
  );
  const contacts = [
    { icon: <Mail size={16} />, label: "Email", text: BRAND.email, href: `mailto:${BRAND.email}` },
    { icon: <Phone size={16} />, label: t("phone"), text: BRAND.phone, href: `tel:${BRAND.phone}` },
    { icon: <MessageCircle size={16} />, label: "WhatsApp", text: BRAND.phone, href: BRAND.whatsapp },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("license")} />
      {!bridge ? <Card><p className="text-sm text-muted">{t("license_desktop_only")}</p></Card> : (
        <Card pad={false} className="overflow-hidden">
          <div className="flex items-center gap-4 bg-gradient-to-l from-indigo-600 to-blue-600 px-6 py-5 text-white">
            <img src="/brand/icon-192.png" alt="" width={56} height={56} className="rounded-2xl shadow-lg" />
            <div className="min-w-0"><div className="text-xs opacity-80">{t("license_certificate")}</div><div className="text-2xl font-bold">BLR</div></div>
            <div className="ms-auto hidden text-end text-xs opacity-90 sm:block"><div>v{version}</div><div>{t("issued_by")} Baderinfo</div></div>
          </div>
          <div className="relative p-6">
            <img src="/brand/seal.png" alt="" aria-hidden className="pointer-events-none absolute -end-8 top-4 w-64 opacity-[0.07]" />
            <div className="relative grid items-start gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <span className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${s?.dev ? "bg-warn/15 text-warn" : ok ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"}`}>
                  {s?.dev ? <Clock size={15} /> : <ShieldCheck size={15} />}{!s ? "…" : s.dev ? t("lic_dev") : ok ? t("lic_active") : t("lic_inactive")}
                </span>
                {s && <>
                  <p className="mb-3 text-sm text-muted">{s.message}</p>
                  {row(<User size={15} />, t("lic_owner"), s.customer || "—")}
                  {row(<BadgeCheck size={15} />, t("lic_plan"), s.plan || s.edition || "—")}
                  {row(<KeyRound size={15} />, t("lic_number"), <span dir="ltr">{s.license_id || "—"}</span>)}
                  {row(<Monitor size={15} />, t("lic_device"), <button className="inline-flex items-center gap-1 font-mono text-xs" dir="ltr" onClick={() => { navigator.clipboard?.writeText(s.domain); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{s.domain ? `${s.domain.slice(0, 12)}…${s.domain.slice(-6)}` : "—"} <Copy size={12} />{copied && <span className="text-ok">✓</span>}</button>)}
                  {row(<CalendarDays size={15} />, t("lic_activated"), fmt(s.activated))}
                  {row(<CalendarDays size={15} />, t("lic_expires"), s.expires ? fmt(s.expires) : t("lic_lifetime"))}
                  {s.days_left !== null && row(<Clock size={15} />, t("lic_days_left"), s.days_left)}
                </>}
              </div>
              <div className="mx-auto flex items-center justify-center gap-2 md:flex-col">
                {s && <LicenseStamp tone={tone} title={s.dev ? "DEV" : ok ? t("stamp_title_ok") : t("stamp_title_bad")} subtitle={ok ? "GENUINE LICENSE" : "NOT ACTIVATED"} footer={`BADERINFO · BLR`} />}
                <img src="/brand/seal.png" alt="Baderinfo" className="-mt-3 h-36 w-36 md:mt-0" />
              </div>
            </div>
            <p className="relative mt-4 flex items-center gap-1.5 text-xs text-muted"><ShieldCheck size={13} />{t("lic_signed_note")}</p>
            <Button className="relative mt-5 w-full" disabled={busy} onClick={() => load(true)}><RefreshCw size={15} className={busy ? "animate-spin" : ""} />{t("lic_check_now")}</Button>
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
