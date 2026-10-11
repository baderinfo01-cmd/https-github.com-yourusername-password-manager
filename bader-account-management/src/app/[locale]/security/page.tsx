"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldAlert, Trash2, MapPin, Monitor, Smartphone, Globe } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { clearLoginLog, readLoginLog, type LoginEvent } from "@/lib/vaultCrypto";
import { formatWhen, geoEnabled, placeText, setGeoEnabled } from "@/lib/security";

export default function SecurityPage() {
  const t = useTranslations("security");
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "failed">("all");
  const [geo, setGeo] = useState(true);

  const load = useCallback(() => setEvents(readLoginLog()), []);

  useEffect(() => {
    load();
    setGeo(geoEnabled());
    // events may arrive while the page is open (place lookups, linked devices)
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  const failed = useMemo(() => events.filter((e) => e.result !== "success").length, [events]);
  const shown = filter === "failed" ? events.filter((e) => e.result !== "success") : events;

  const sourceIcon = (s: LoginEvent["source"]) =>
    s === "phone" ? <Smartphone className="w-4 h-4" /> : s === "web" ? <Globe className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;

  const badge = (r: LoginEvent["result"]) => {
    const cls = r === "success" ? "bg-green-100 text-green-800" : r === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{t(r)}</span>;
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" /> {t("title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("subtitle")}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="glass rounded-2xl p-4">
            <div className="text-2xl font-bold">{events.length}</div>
            <div className="text-xs text-gray-500">{t("total")}</div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className={`text-2xl font-bold ${failed ? "text-red-600" : ""}`}>{failed}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              {failed > 0 && <ShieldAlert className="w-3.5 h-3.5 text-red-500" />} {t("failedCount")}
            </div>
          </div>
          <div className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" /> {t("geoTitle")}
              </div>
              <div className="text-[11px] text-gray-500 leading-4 mt-0.5">{t("geoHint")}</div>
            </div>
            <button
              onClick={() => {
                setGeoEnabled(!geo);
                setGeo(!geo);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${geo ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              {geo ? t("geoOn") : t("geoOff")}
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(["all", "failed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm ${filter === f ? "text-white" : "bg-white border border-border text-gray-600"}`}
                style={filter === f ? { background: "rgb(var(--color-primary))" } : {}}
              >
                {f === "all" ? t("all") : t("onlyFailed")}
              </button>
            ))}
            <button
              onClick={() => {
                if (confirm(t("confirmClear"))) {
                  clearLoginLog();
                  load();
                }
              }}
              className="ms-auto px-3 py-1.5 rounded-full text-sm bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> {t("clear")}
            </button>
          </div>

          {shown.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-gray-500 text-xs text-start">
                    {["time", "result", "device", "os", "place", "ip"].map((k) => (
                      <th key={k} className="py-2 px-2 text-start font-medium">
                        {t(k)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.id} className={`border-t border-border ${e.result !== "success" ? "bg-red-50/60" : ""}`}>
                      <td className="py-2 px-2 whitespace-nowrap">{formatWhen(e.t, locale)}</td>
                      <td className="py-2 px-2">{badge(e.result)}</td>
                      <td className="py-2 px-2">
                        <span className="inline-flex items-center gap-1.5">
                          {sourceIcon(e.source)} {e.device}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-600">{e.os}</td>
                      <td className="py-2 px-2 text-gray-600">{placeText(e) || "—"}</td>
                      <td className="py-2 px-2 font-mono text-xs" dir="ltr">
                        {e.ip || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
