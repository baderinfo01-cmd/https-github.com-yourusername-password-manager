"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert, ShieldCheck, X } from "lucide-react";
import { onRemoteAlerts, startAlertPolling } from "@/lib/sync/controller";
import { formatWhen, placeText } from "@/lib/security";
import type { LoginEvent } from "@/lib/vaultCrypto";
import { notify } from "@/lib/notify";

/**
 * Runs for the whole life of the page (even on the lock screen): polls the security-alert channel and
 * tells the user when ANOTHER device (PC / phone) signed in or failed to.
 */
export default function BackgroundServices() {
  const t = useTranslations("sync");
  const [toasts, setToasts] = useState<LoginEvent[]>([]);

  useEffect(() => {
    startAlertPolling();
    return onRemoteAlerts((events) => {
      const recent = events.filter((e) => Date.now() - e.t < 6 * 3600_000).slice(0, 4);
      if (!recent.length) return;
      setToasts((cur) => [...recent, ...cur].slice(0, 4));
      for (const e of recent) {
        void notify(e.result === "success" ? t("alertLogin") : t("alertFailed"), `${e.device} · ${placeText(e) || t("unknownPlace")}`);
      }
    });
  }, [t]);

  if (!toasts.length) return null;
  return (
    <div className="fixed z-[70] bottom-4 end-4 space-y-2 w-[min(92vw,360px)]">
      {toasts.map((e) => (
        <div key={e.id} className={`rounded-2xl border shadow-xl bg-white p-3 flex gap-3 ${e.result === "success" ? "border-green-200" : "border-red-300"}`}>
          <div className={`p-2 rounded-xl h-fit ${e.result === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {e.result === "success" ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div className="flex-1 text-xs text-gray-600 min-w-0">
            <div className="font-bold text-sm text-gray-900">{e.result === "success" ? t("alertLogin") : t("alertFailed")}</div>
            <div>{e.device} · {e.os}</div>
            <div>{placeText(e) || t("unknownPlace")}{e.ip ? ` · ${e.ip}` : ""}</div>
            <div className="text-gray-400">{formatWhen(e.t, typeof document !== "undefined" ? document.documentElement.lang || "ar" : "ar")}</div>
          </div>
          <button onClick={() => setToasts((c) => c.filter((x) => x.id !== e.id))} aria-label="close" className="text-gray-400 h-fit">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
