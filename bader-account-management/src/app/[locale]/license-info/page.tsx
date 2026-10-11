"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Copy, RefreshCw, Monitor, KeyRound, User, CalendarDays, Mail, Phone, MessageCircle, BadgeCheck, ShieldCheck, Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import LicenseStamp from "@/components/ui/LicenseStamp";
import { copyToClipboard } from "@/lib/utils";
import { branding, whatsappLink } from "@/config/branding";

/** Real license state, signed by the license server and verified in the Electron main process. */
interface LicenseStatus {
  valid: boolean;
  status: string;
  message: string;
  plan: string;
  edition: string;
  customer: string;
  license_id: string;
  domain: string; // device fingerprint
  activated: number;
  expires: number;
  days_left: number | null;
  dev?: boolean;
}

declare global {
  interface Window {
    baderLicense?: {
      status: () => Promise<LicenseStatus>;
      recheck: () => Promise<LicenseStatus>;
    };
  }
}

export default function LicenseInfoPage() {
  const t = useTranslations("licenseReal");
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const dateLocale = locale === "ar" ? "ar-DZ-u-nu-latn" : locale === "fr" ? "fr-FR" : "en-GB";

  const [s, setS] = useState<LicenseStatus | null>(null);
  const [bridge, setBridge] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (recheck = false) => {
    if (!window.baderLicense) return setBridge(false);
    setBusy(true);
    try {
      setS(await (recheck ? window.baderLicense.recheck() : window.baderLicense.status()));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (ts: number) => (ts ? new Date(ts * 1000).toLocaleDateString(dateLocale, { dateStyle: "long" }) : "—");

  const row = (icon: ReactNode, label: string, value: ReactNode) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-dashed border-border last:border-0">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-sm text-end break-all">{value}</div>
    </div>
  );

  const ok = !!s?.valid;
  const dev = !!s?.dev;
  const tone = dev ? "amber" : ok ? "green" : "red";
  const stampTitle = dev ? t("devStamp") : ok ? t("genuine") : t("invalidStamp");
  const stampSub = dev ? t("devSub") : ok ? t("genuineSub") : t("invalidSub");

  const contacts = [
    { icon: <MessageCircle className="w-4 h-4 text-emerald-600" />, label: t("whatsapp"), text: branding.developer.phone, href: whatsappLink() },
    { icon: <Phone className="w-4 h-4 text-primary" />, label: t("phone"), text: branding.developer.phone, href: `tel:${branding.developer.phoneIntl}` },
    { icon: <Mail className="w-4 h-4 text-primary" />, label: t("email"), text: branding.developer.email, href: `mailto:${branding.developer.email}` },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {!bridge && <div className="glass rounded-2xl p-6 text-amber-700">{t("desktopOnly")}</div>}

        {bridge && (
          <div
            className="relative glass rounded-[28px] overflow-hidden"
            style={{ boxShadow: "0 0 0 6px rgba(var(--color-primary),0.08), 0 20px 50px -20px rgba(15,23,42,.35)" }}
          >
            {/* certificate header */}
            <div
              className="px-7 py-6 text-white flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.65))" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={branding.assets.logo} alt="" className="w-14 h-14 rounded-2xl shadow-lg bg-white/10" />
              <div className="min-w-0">
                <div className="text-xs opacity-80 tracking-wide">{t("certificate")}</div>
                <h1 className="text-2xl font-bold truncate">{branding.appName}</h1>
              </div>
              <div className="ms-auto text-xs opacity-90 hidden sm:block text-end">
                <div>{branding.version}</div>
                <div>{t("issuedBy")} Baderinfo</div>
              </div>
            </div>

            <div className="p-7 relative">
              {/* faint watermark seal */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.assets.seal}
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none absolute -end-10 top-6 w-72 opacity-[0.07]"
              />

              <div className="relative grid gap-6 md:grid-cols-[1fr_auto] items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${dev ? "bg-amber-100 text-amber-800" : ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {dev ? <Clock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      {!s ? t("checking") : dev ? t("dev") : ok ? t("active") : t("inactive")}
                    </span>
                  </div>
                  {s && <p className="text-sm text-gray-500 mb-3">{s.message}</p>}

                  {s && (
                    <div>
                      {row(<User className="w-4 h-4" />, t("ownerOfLicense"), s.customer || "—")}
                      {row(<BadgeCheck className="w-4 h-4" />, t("plan"), s.plan || s.edition || "—")}
                      {row(<KeyRound className="w-4 h-4" />, t("licenseNo"), <span dir="ltr">{s.license_id || "—"}</span>)}
                      {row(
                        <Monitor className="w-4 h-4" />,
                        t("device"),
                        <button
                          className="inline-flex items-center gap-1 font-mono text-xs hover:text-primary"
                          onClick={async () => {
                            await copyToClipboard(s.domain, 60_000);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                          title={t("copy")}
                          dir="ltr"
                        >
                          {s.domain ? `${s.domain.slice(0, 12)}…${s.domain.slice(-6)}` : "—"} <Copy className="w-3 h-3" />
                          {copied && <span className="text-green-600">{t("copied")}</span>}
                        </button>
                      )}
                      {row(<CalendarDays className="w-4 h-4" />, t("activated"), fmt(s.activated))}
                      {row(<CalendarDays className="w-4 h-4" />, t("expires"), s.expires ? fmt(s.expires) : t("lifetime"))}
                      {s.days_left !== null && row(<Clock className="w-4 h-4" />, t("daysLeft"), s.days_left)}
                    </div>
                  )}
                </div>

                {/* stamps */}
                <div className="flex md:flex-col items-center justify-center gap-2 mx-auto">
                  {s && <LicenseStamp tone={tone} title={stampTitle} subtitle={stampSub} footer={`BADERINFO · ${branding.version}`} />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={branding.assets.seal} alt="Baderinfo" className="w-36 h-36 -mt-3 md:mt-0" />
                </div>
              </div>

              <p className="relative mt-4 text-xs text-gray-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> {t("signedNote")}
              </p>

              <button
                onClick={() => load(true)}
                disabled={busy}
                className="relative mt-5 w-full btn-3d py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> {t("checkNow")}
              </button>
            </div>
          </div>
        )}

        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold mb-1">{t("supportTitle")}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {t("developer")}: <b dir="ltr">{branding.developer.name}</b> — Baderinfo
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-border hover:shadow-md transition-shadow text-sm"
              >
                {c.icon}
                <span className="min-w-0">
                  <span className="block text-[11px] text-gray-500">{c.label}</span>
                  <span className="block font-medium truncate" dir="ltr">{c.text}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
