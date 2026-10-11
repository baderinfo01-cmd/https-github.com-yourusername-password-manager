"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { RefreshCw, Link2, Smartphone, Eye, EyeOff, Copy, Bell, Unplug, QrCode, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PasswordDialog from "@/components/ui/PasswordDialog";
import { useStore } from "@/store/useStore";
import {
  createSyncAccount,
  defaultSyncServer,
  disconnectSync,
  getPairingCode,
  getSyncStatus,
  joinSyncAccount,
  subscribeSyncStatus,
  syncNow,
} from "@/lib/sync/controller";
import { copyToClipboard } from "@/lib/utils";
import { requestNotifyPermission } from "@/lib/notify";

export default function SyncPage() {
  const t = useTranslations("sync");
  const cfg = useStore((s) => s.syncConfig);
  const status = useSyncExternalStore(subscribeSyncStatus, getSyncStatus, getSyncStatus);

  const [serverUrl, setServerUrl] = useState(defaultSyncServer);
  const [registerKey, setRegisterKey] = useState("");
  const [code, setCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [perm, setPerm] = useState<string>("default");
  const [scanning, setScanning] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setDeviceName(cfg?.deviceName || (navigator.userAgent.includes("Android") ? "Android" : navigator.userAgent.includes("Windows") ? "Windows PC" : "Device"));
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, [cfg?.deviceName]);

  const pairing = cfg ? getPairingCode() : null;
  useEffect(() => {
    if (pairing && showCode) QRCode.toDataURL(pairing, { margin: 1, width: 240, errorCorrectionLevel: "L" }).then(setQr).catch(() => setQr(""));
    else setQr("");
  }, [pairing, showCode]);

  const errText = (e: any) => {
    const c = e?.code || e?.message || "default";
    const key = ["bad_register_key", "exists", "rate_limited", "server_full", "unauthorized", "bad_code", "https_required", "network_error"].includes(c) ? c : c === "Failed to fetch" ? "network_error" : "default";
    return t(`errors.${key}`);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const scan = async () => {
    const BD = (window as any).BarcodeDetector;
    if (!BD) return;
    setScanning(true);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (video.current) {
        video.current.srcObject = stream;
        await video.current.play();
      }
      const det = new BD({ formats: ["qr_code"] });
      const started = Date.now();
      while (Date.now() - started < 40_000 && video.current) {
        const found = await det.detect(video.current);
        if (found?.[0]?.rawValue?.startsWith("BSYNC1:")) {
          setCode(found[0].rawValue);
          break;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch {
      /* camera denied */
    } finally {
      stream?.getTracks().forEach((x) => x.stop());
      setScanning(false);
    }
  };

  const card = "glass rounded-2xl p-6 space-y-4";
  const input = "w-full px-3 py-2 rounded-lg border border-border bg-white text-sm";
  const btn = "px-5 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2 justify-center";
  const primary = { background: "rgb(var(--color-primary))" };
  const lastSync = status.lastSync ?? cfg?.lastSync;

  return (
    <AppLayout>
      {confirmOff && <PasswordDialog mode="confirm" onClose={() => setConfirmOff(false)} onDone={() => disconnectSync()} />}
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-primary" /> {t("title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("subtitle")}</p>
        </div>

        <div className="rounded-2xl bg-green-50 border border-green-200 text-green-900 text-sm p-4 flex gap-2">
          <ShieldCheck className="w-5 h-5 shrink-0" /> {t("e2eNote")}
        </div>

        {err && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex gap-2 items-center">
            <AlertTriangle className="w-4 h-4" /> {err}
          </div>
        )}

        {!cfg && (
          <>
            <div className={card}>
              <h2 className="font-bold text-lg">{t("createTitle")}</h2>
              <p className="text-sm text-gray-500">{t("createDesc")}</p>
              <label className="block text-xs text-gray-500">{t("serverUrl")}</label>
              <input dir="ltr" className={input} value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
              <label className="block text-xs text-gray-500">{t("registerKey")}</label>
              <input dir="ltr" type="password" className={input} value={registerKey} onChange={(e) => setRegisterKey(e.target.value)} autoComplete="off" />
              <label className="block text-xs text-gray-500">{t("deviceName")}</label>
              <input className={input} value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
              <button disabled={busy || !serverUrl} onClick={() => run(() => createSyncAccount(serverUrl.trim(), registerKey, deviceName))} className={btn} style={primary}>
                <Link2 className="w-4 h-4" /> {busy ? t("syncing") : t("create")}
              </button>
            </div>

            <div className={card}>
              <h2 className="font-bold text-lg">{t("joinTitle")}</h2>
              <p className="text-sm text-gray-500">{t("joinDesc")}</p>
              <textarea dir="ltr" rows={3} className={input + " font-mono text-xs"} placeholder="BSYNC1:..." value={code} onChange={(e) => setCode(e.target.value)} />
              <label className="block text-xs text-gray-500">{t("deviceName")}</label>
              <input className={input} value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
              {scanning && (
                <div>
                  <video ref={video} className="w-full max-w-xs rounded-xl" muted playsInline />
                  <p className="text-xs text-gray-500">{t("scanning")}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button disabled={busy || !code.trim()} onClick={() => run(() => joinSyncAccount(code, deviceName))} className={btn} style={primary}>
                  <Link2 className="w-4 h-4" /> {busy ? t("syncing") : t("join")}
                </button>
                {typeof window !== "undefined" && "BarcodeDetector" in window && (
                  <button onClick={scan} disabled={scanning} className={btn + " !text-gray-700 bg-white border border-border"}>
                    <QrCode className="w-4 h-4" /> {t("scan")}
                  </button>
                )}
              </div>
            </div>

            <div className={card}>
              <h2 className="font-bold">{t("howTitle")}</h2>
              <ol className="text-sm text-gray-600 list-decimal ms-5 space-y-1">
                {["how1", "how2", "how3", "how4"].map((k) => (
                  <li key={k}>{t(k)}</li>
                ))}
              </ol>
            </div>
          </>
        )}

        {cfg && (
          <>
            <div className={card}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> {t("connected")}
                </div>
                <button disabled={status.running} onClick={() => void syncNow()} className={btn} style={primary}>
                  <RefreshCw className={`w-4 h-4 ${status.running ? "animate-spin" : ""}`} /> {status.running ? t("syncing") : t("syncNow")}
                </button>
              </div>
              <dl className="text-sm divide-y divide-dashed divide-border">
                <div className="flex justify-between py-2"><dt className="text-gray-500">{t("lastSync")}</dt><dd>{lastSync ? new Date(lastSync).toLocaleString() : t("never")}</dd></div>
                <div className="flex justify-between py-2"><dt className="text-gray-500">{t("server")}</dt><dd dir="ltr" className="text-xs break-all">{cfg.serverUrl}</dd></div>
                <div className="flex justify-between py-2"><dt className="text-gray-500">{t("deviceName")}</dt><dd>{cfg.deviceName}</dd></div>
                {status.lastResult && (
                  <div className="py-2 text-xs text-gray-500">{t("result", status.lastResult)}</div>
                )}
              </dl>
              {status.error && <div className="text-sm text-red-600">⚠️ {errText({ code: status.error })}</div>}
            </div>

            <div className={card}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{t("yourCode")}</h2>
                <button onClick={() => setShowCode((v) => !v)} className="text-sm text-primary flex items-center gap-1">
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showCode ? t("hide") : t("show")}
                </button>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">{t("codeWarn")}</p>
              {showCode && pairing && (
                <div className="space-y-3">
                  <textarea readOnly dir="ltr" rows={3} className={input + " font-mono text-xs"} value={pairing} />
                  <div className="flex flex-wrap items-center gap-4">
                    {qr && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qr} alt="QR" className="w-44 h-44 rounded-xl border border-border bg-white" />
                    )}
                    <button
                      onClick={async () => {
                        await copyToClipboard(pairing, 60_000);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className={btn + " !text-gray-700 bg-white border border-border"}
                    >
                      <Copy className="w-4 h-4" /> {copied ? t("copied") : t("copy")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={card}>
              <h2 className="font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> {t("notifTitle")}</h2>
              <p className="text-sm text-gray-500">{t("notifDesc")}</p>
              {perm === "granted" ? (
                <div className="text-sm text-green-700">✅ {t("notifOn")}</div>
              ) : perm === "denied" ? (
                <div className="text-sm text-amber-700">{t("notifDenied")}</div>
              ) : (
                <button onClick={async () => setPerm(await requestNotifyPermission())} className={btn} style={primary}>
                  <Bell className="w-4 h-4" /> {t("enableNotif")}
                </button>
              )}
            </div>

            <div className={card}>
              <p className="text-sm text-gray-500">{t("disconnectNote")}</p>
              <button onClick={() => setConfirmOff(true)} className={btn + " !text-red-700 bg-red-50 hover:bg-red-100"}>
                <Unplug className="w-4 h-4" /> {t("disconnect")}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
