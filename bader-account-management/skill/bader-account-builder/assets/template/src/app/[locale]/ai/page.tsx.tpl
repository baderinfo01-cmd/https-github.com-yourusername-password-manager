"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bot, Send, ShieldAlert, ShieldCheck } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { auditAccounts } from "@/lib/securityAudit";
import { breachCount, buildSummary } from "@/lib/aiTools";

declare global {
  interface Window {
    baderAI?: {
      breachRange: (prefix: string) => Promise<{ ok: boolean; text?: string }>;
      ask: (p: { apiKey: string; question: string; summary: unknown; locale: string }) => Promise<{ ok: boolean; text?: string; error?: string }>;
    };
  }
}

/**
 * Smart assistant. Everything in the first block is LOCAL (works offline). The chat and the breach check are
 * desktop-only (window.baderAI exists only in Electron) and send a privacy-safe summary: see aiTools.buildSummary.
 */
export default function AiPage() {
  const t = useTranslations("ai");
  const locale = useLocale();
  const accounts = useStore((s) => s.accounts);
  const apiKey = useStore((s) => s.aiApiKey);
  const setApiKey = useStore((s) => s.setAiApiKey);
  const [keyInput, setKeyInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [breach, setBreach] = useState<Record<string, number | null>>({});
  const [scanning, setScanning] = useState(false);

  const audit = useMemo(() => auditAccounts(accounts), [accounts]);
  const categories = useMemo(() => {
    const m: Record<string, number> = {};
    accounts.forEach((a) => (m[a.category] = (m[a.category] || 0) + 1));
    return m;
  }, [accounts]);
  const hasBridge = typeof window !== "undefined" && !!window.baderAI;
  const scoreColor = audit.score >= 80 ? "#16a34a" : audit.score >= 50 ? "#f59e0b" : "#dc2626";

  const scan = async () => {
    if (!window.baderAI || scanning) return;
    setScanning(true);
    const out: Record<string, number | null> = {};
    const seen = new Map<string, number | null>();
    for (const a of accounts) {
      if (!seen.has(a.password)) seen.set(a.password, await breachCount(a.password, window.baderAI.breachRange));
      out[a.id] = seen.get(a.password) ?? null;
    }
    setBreach(out);
    setScanning(false);
  };

  const ask = async () => {
    if (!question.trim() || busy) return;
    if (!apiKey) return setAnswer(t("noKey"));
    if (!window.baderAI) return setAnswer(t("desktopOnly"));
    setBusy(true);
    setAnswer(t("thinking"));
    const res = await window.baderAI.ask({ apiKey, question, summary: buildSummary("security", audit, categories), locale });
    setAnswer(res.ok ? res.text || "" : t("error") + (res.error || ""));
    setBusy(false);
  };

  const kindLabel = (k: string, count?: number) => (k === "reused" ? t("reusedFor", { count: count ?? 2 }) : k === "weak" ? t("weakFor") : t("oldFor"));
  const input = "w-full px-3 py-2 rounded-lg border border-border bg-card text-fg";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Bot className="w-8 h-8 text-primary" />{t("title")}</h1>

        <div className="glass rounded-2xl p-6 flex items-center gap-6">
          <div className="text-5xl font-extrabold num" style={{ color: scoreColor }} data-testid="score">{accounts.length ? audit.score : "—"}</div>
          <div className="flex-1 text-sm space-y-1">
            <div className="font-bold flex items-center gap-2">{audit.issues.length ? <ShieldAlert className="w-5 h-5 text-amber-500" /> : <ShieldCheck className="w-5 h-5 text-green-600" />}{t("score")}</div>
            <div className="text-muted">{t("counts", { weak: audit.weak, reused: audit.reused, old: audit.old })}</div>
            <div className="text-xs text-muted">{t("localNote")}</div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="font-bold mb-2 text-sm">{t("issues")}</h2>
          {audit.issues.length === 0 ? (
            <p className="text-sm text-green-700">{t("nothing")}</p>
          ) : (
            <ul className="divide-y divide-border max-h-64 overflow-y-auto">
              {audit.issues.map((i, n) => (
                <li key={`${i.id}-${n}`} className="py-2 flex justify-between text-sm gap-3">
                  <span className="font-medium" dir="auto">{i.siteName}</span>
                  <span className="text-muted">{kindLabel(i.kind, i.count)}{breach[i.id] ? ` · ${t("breached", { count: breach[i.id] as number })}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <h2 className="font-bold text-sm">{t("breachTitle")}</h2>
          <p className="text-xs text-muted">{t("breachHint")}</p>
          <button onClick={scan} disabled={!hasBridge || scanning || !accounts.length} className="px-4 py-2 rounded-xl text-white bg-primary disabled:opacity-50 text-sm">{scanning ? t("scanning") : t("scan")}</button>
          {!hasBridge && <p className="text-xs text-amber-700">{t("desktopOnly")}</p>}
        </div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <h2 className="font-bold text-sm">{t("chatTitle")}</h2>
          <p className="text-xs text-muted">{t("privacy")}</p>
          <div className="flex gap-2">
            <input className={input} dir="ltr" type="password" autoComplete="off" placeholder="sk-ant-…" aria-label={t("apiKey")} value={keyInput} onChange={(e) => setKeyInput(e.target.value)} />
            <button onClick={() => { setApiKey(keyInput.trim()); setKeyInput(""); }} className="px-4 py-2 rounded-xl border border-border bg-card text-sm whitespace-nowrap">{t("saveKey")}</button>
          </div>
          {apiKey && <p className="text-xs text-green-700">{t("keySaved")}</p>}
          <div className="flex gap-2">
            <input className={input} value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder={t("askPlaceholder")} aria-label={t("askPlaceholder")} dir="auto" />
            <button onClick={ask} disabled={busy} className="px-4 py-2 rounded-xl text-white bg-primary disabled:opacity-50" aria-label={t("send")}><Send className="w-4 h-4 rtl:rotate-180" /></button>
          </div>
          {answer && <div className="whitespace-pre-wrap text-sm p-4 rounded-xl bg-accent" dir="auto">{answer}</div>}
        </div>
      </div>
    </AppLayout>
  );
}
