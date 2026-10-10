"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BadgeCheck, ShieldAlert, Copy, RefreshCw, Monitor, KeyRound, User, CalendarDays, Mail } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { copyToClipboard } from "@/lib/utils";
import { branding } from "@/config/branding";

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
  const dateLocale = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-GB";

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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        {icon}
        {label}
      </div>
      <div className="font-medium text-sm text-end break-all">{value}</div>
    </div>
  );

  const ok = !!s?.valid;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BadgeCheck className="w-8 h-8 text-primary" /> {t("title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("subtitle")}</p>
        </div>

        {!bridge && <div className="glass rounded-2xl p-6 text-amber-700">{t("desktopOnly")}</div>}

        {bridge && (
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl ${ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {ok ? <BadgeCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
              </div>
              <div>
                <div className="text-xl font-bold">
                  {!s ? t("checking") : s.dev ? t("dev") : ok ? t("active") : t("inactive")}
                </div>
                {s && <div className="text-sm text-gray-500">{s.message}</div>}
              </div>
            </div>

            {s && (
              <div>
                {row(<User className="w-4 h-4" />, t("customer"), s.customer || "—")}
                {row(<BadgeCheck className="w-4 h-4" />, t("plan"), s.plan || s.edition || "—")}
                {row(<KeyRound className="w-4 h-4" />, t("licenseNo"), s.license_id || "—")}
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
                  >
                    {s.domain || "—"} <Copy className="w-3 h-3" />
                    {copied && <span className="text-green-600">{t("copied")}</span>}
                  </button>
                )}
                {row(<CalendarDays className="w-4 h-4" />, t("activated"), fmt(s.activated))}
                {row(<CalendarDays className="w-4 h-4" />, t("expires"), s.expires ? fmt(s.expires) : t("lifetime"))}
                {s.days_left !== null && row(<CalendarDays className="w-4 h-4" />, t("daysLeft"), s.days_left)}
                {row(<BadgeCheck className="w-4 h-4" />, t("version"), branding.version)}
              </div>
            )}

            <button
              onClick={() => load(true)}
              disabled={busy}
              className="mt-5 w-full btn-3d py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> {t("checkNow")}
            </button>
          </div>
        )}

        <div className="glass rounded-2xl p-5 text-sm text-gray-600 space-y-2">
          <p>🔒 {t("onlyOneDevice")}</p>
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> {t("support")}:{" "}
            <a className="text-primary underline" href={`mailto:${branding.email}`}>
              {branding.email}
            </a>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
