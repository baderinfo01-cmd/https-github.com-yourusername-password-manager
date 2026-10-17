"use client";
import { Clipboard, Copy, KeyRound, ShieldCheck, ShoppingBag, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { MOBILE_LICENSE } from "@/lib/mobile/config";
import { useT } from "@/lib/i18n";
import { useUi, type Lang } from "@/store/ui";

/** First screen of the Android app until a licence code is activated on this phone. */
export function ActivationGate({ onActivated }: { onActivated: () => void }) {
  const t = useT();
  const { lang, setLang } = useUi();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [device, setDevice] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { (window as any).baderLicense?.deviceId?.().then((d: string) => setDevice(d)).catch(() => {}); }, []);

  // BLRM-ABCD-EFGH-JKLM: uppercase, strip junk, keep the dashes the server expects
  const fmt = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
  const submit = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await (window as any).baderLicense.activate(code);
      if (r.success) onActivated(); else setMsg(r.message || t("error"));
    } catch { setMsg(t("error")); } finally { setBusy(false); }
  };
  const paste = async () => { try { setCode(fmt(await navigator.clipboard.readText())); } catch {} };

  return (
    <div className="auth-bg flex min-h-screen flex-col items-center justify-center overflow-y-auto px-5 py-8 [padding-top:max(2rem,env(safe-area-inset-top))] [padding-bottom:max(2rem,env(safe-area-inset-bottom))]">
      <div className="glass pop w-full max-w-md rounded-[28px] p-6">
        <div className="flex flex-col items-center text-center">
          <img src="/brand/icon-192.png" alt="" width={84} height={84} className="glow-ring rounded-[22px]" />
          <h1 className="mt-4 text-2xl font-bold text-accent">BLR Fatourati</h1>
          <p className="mt-1 text-sm font-semibold">{t("act_title")}</p>
          <p className="mt-2 text-xs leading-6 text-muted">{t("act_hint")}</p>
        </div>
        <label className="mt-5 block text-xs font-medium text-muted">{t("act_code")}</label>
        <div className="mt-1.5 flex gap-2">
          <div className="relative flex-1">
            <KeyRound size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
            <input dir="ltr" autoCapitalize="characters" autoCorrect="off" spellCheck={false} inputMode="text" value={code} onChange={(e) => setCode(fmt(e.target.value))} onKeyDown={(e) => e.key === "Enter" && code && submit()} placeholder="BLRM-XXXX-XXXX-XXXX" className="h-12 w-full rounded-2xl border border-line bg-surface ps-9 pe-3 text-center font-mono text-base tracking-wider outline-none focus:border-accent" />
          </div>
          <button onClick={paste} aria-label={t("act_paste")} className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-surface text-muted"><Clipboard size={18} /></button>
        </div>
        {msg && <p className="mt-3 rounded-xl bg-bad/10 px-3 py-2 text-xs leading-6 text-bad">{msg}</p>}
        <Button className="mt-4 h-12 w-full text-base" disabled={busy || code.length < 12} onClick={submit}><ShieldCheck size={18} />{busy ? "…" : t("act_btn")}</Button>
        <p className="mt-3 text-center text-[11px] leading-5 text-muted">{t("act_needs_net")}</p>
        {device && (
          <button onClick={() => { navigator.clipboard?.writeText(device); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-line bg-surface2/70 px-3 py-2.5 text-start">
            <Smartphone size={16} className="text-muted" />
            <span className="min-w-0 flex-1"><span className="block text-[10px] text-muted">{t("act_device")}</span><span className="block truncate font-mono text-[11px]" dir="ltr">{device.slice(0, 16)}…{device.slice(-8)}</span></span>
            {copied ? <span className="text-xs text-ok">✓</span> : <Copy size={14} className="text-muted" />}
          </button>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <a href={MOBILE_LICENSE.purchase_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-accent"><ShoppingBag size={14} />{t("act_buy")}</a>
          <div className="flex overflow-hidden rounded-xl border border-line text-xs">
            {(["ar", "fr", "en"] as Lang[]).map((l) => <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 ${lang === l ? "bg-accent text-white" : "bg-surface"}`}>{l.toUpperCase()}</button>)}
          </div>
        </div>
      </div>
      <p className="mt-5 text-[11px] text-muted">Baderinfo · Bader Eddine Hamidane</p>
    </div>
  );
}
