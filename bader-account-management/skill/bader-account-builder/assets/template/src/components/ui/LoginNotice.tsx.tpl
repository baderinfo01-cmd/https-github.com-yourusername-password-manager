"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldAlert, X, Monitor, MapPin, Clock, Globe } from "lucide-react";
import { appendLoginEvent, loginSummary, type LoginEvent } from "@/lib/vaultCrypto";
import { formatWhen, getSessionInfo, placeText } from "@/lib/security";
import { notify } from "@/lib/notify";

const PENDING = "bader-login-pending";

interface Notice {
  now: LoginEvent;
  prev: LoginEvent | null;
  failed: LoginEvent[];
}

/**
 * Shown once after unlocking: details of this sign-in (time, device, system, place),
 * the previous sign-in, and a warning when there were failed attempts in between.
 */
export default function LoginNotice() {
  const t = useTranslations("security");
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const [n, setN] = useState<Notice | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      let pending: string | null = null;
      try {
        pending = sessionStorage.getItem(PENDING);
        sessionStorage.removeItem(PENDING);
      } catch {
        /* ignore */
      }
      if (!pending) return;
      const { lastSuccess, failedSince } = loginSummary(); // BEFORE adding this sign-in
      const info = await getSessionInfo();
      const ev = appendLoginEvent({ t: Date.now(), result: "success", ...info });
      if (!alive || !ev) return;
      setN({ now: ev, prev: lastSuccess, failed: failedSince });

      if (failedSince.length > 0) {
        void notify(t("notifTitle"), t("notifBody", { count: failedSince.length }));
      } else {
        timer = setTimeout(() => alive && setN(null), 14000);
      }
    })();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [t]);

  if (!n) return null;
  const warn = n.failed.length > 0;

  const line = (icon: React.ReactNode, text: string) => (
    <div className="flex items-start gap-2 text-xs text-muted">
      <span className="mt-0.5 text-muted">{icon}</span>
      <span className="min-w-0 break-words">{text}</span>
    </div>
  );

  return (
    <div
      role="status"
      className={`fixed z-[60] top-4 end-4 w-[min(92vw,380px)] rounded-2xl border shadow-2xl p-4 bg-card ${warn ? "border-amber-300" : "border-green-200"}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${warn ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
          {warn ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{t("loginDone")}</div>
          <div className="space-y-1 mt-2">
            {line(<Clock className="w-3.5 h-3.5" />, formatWhen(n.now.t, locale))}
            {line(<Monitor className="w-3.5 h-3.5" />, `${n.now.device} · ${n.now.os}`)}
            {line(<MapPin className="w-3.5 h-3.5" />, placeText(n.now) || t("unknownPlace"))}
            {n.now.ip && line(<Globe className="w-3.5 h-3.5" />, `IP ${n.now.ip}`)}
          </div>

          <div className="mt-2 pt-2 border-t border-dashed border-border text-xs text-muted">
            {t("prevLogin")}: {n.prev ? `${formatWhen(n.prev.t, locale)} — ${n.prev.device}` : t("noPrev")}
          </div>

          {warn && (
            <div className="mt-2 p-2 rounded-lg bg-amber-50 text-amber-800 text-xs space-y-1">
              <div className="font-semibold">{t("failedWarn", { count: n.failed.length })}</div>
              {n.failed.slice(0, 3).map((f) => (
                <div key={f.id} className="opacity-90">
                  • {formatWhen(f.t, locale)} — {f.device}
                  {placeText(f) ? ` (${placeText(f)})` : ""}
                </div>
              ))}
              <div>{t("failedHint")}</div>
            </div>
          )}

          <Link href={`/${locale}/security`} className="inline-block mt-2 text-xs text-primary underline">
            {t("viewLog")}
          </Link>
        </div>
        <button onClick={() => setN(null)} aria-label={t("dismiss")} className="p-1 rounded-lg hover:bg-accent text-muted">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
