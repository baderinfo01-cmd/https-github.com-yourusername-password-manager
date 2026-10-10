"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bot, ShieldCheck, ShieldAlert, Send, KeyRound, Copy, RefreshCw, Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { auditAccounts, buildAiSummary } from "@/lib/securityAudit";

declare global {
  interface Window {
    baderAI?: {
      ask: (p: {
        apiKey: string;
        question: string;
        summary: unknown;
        locale: string;
      }) => Promise<{ ok: boolean; text?: string; error?: string }>;
    };
  }
}

export default function AiPage() {
  const t = useTranslations("ai");
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  const accounts = useStore((s) => s.accounts);
  const apiKey = useStore((s) => s.aiApiKey);
  const setApiKey = useStore((s) => s.setAiApiKey);

  const [keyInput, setKeyInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const audit = useMemo(() => auditAccounts(accounts), [accounts]);
  const categories = useMemo(() => {
    const m: Record<string, number> = {};
    accounts.forEach((a) => (m[a.category] = (m[a.category] || 0) + 1));
    return m;
  }, [accounts]);

  const scoreColor = audit.score >= 80 ? "#16a34a" : audit.score >= 50 ? "#f59e0b" : "#dc2626";
  const hasBridge = typeof window !== "undefined" && !!window.baderAI;

  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    if (!apiKey) return setAnswer(t("noKey"));
    if (!window.baderAI) return setAnswer(t("desktopOnly"));
    setBusy(true);
    setAnswer(t("thinking"));
    const res = await window.baderAI.ask({
      apiKey,
      question: q,
      summary: buildAiSummary(audit, categories),
      locale,
    });
    setAnswer(res.ok ? res.text || "" : t("error") + (res.error || ""));
    setBusy(false);
  };

  const label = (kind: string, count?: number) =>
    kind === "reused" ? t("reusedFor", { count: count ?? 2 }) : kind === "weak" ? t("weakFor") : t("oldFor");

  const stat = (icon: React.ReactNode, text: string, value: number) => (
    <div className="glass rounded-2xl p-4 flex items-center gap-3">
      <div className="p-2 rounded-xl bg-white/70">{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-gray-500">{text}</div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" /> {t("title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("subtitle")}</p>
        </div>

        <div className="glass rounded-3xl p-6 grid md:grid-cols-[200px_1fr] gap-6 items-center">
          <div className="flex flex-col items-center">
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center text-4xl font-bold"
              style={{
                background: `conic-gradient(${scoreColor} ${audit.score * 3.6}deg, #e5e7eb 0)`,
              }}
            >
              <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center" style={{ color: scoreColor }}>
                {audit.score}
              </div>
            </div>
            <div className="mt-2 text-sm font-medium">{t("scoreTitle")}</div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stat(<KeyRound className="w-5 h-5" />, t("total"), audit.total)}
            {stat(<ShieldAlert className="w-5 h-5 text-red-500" />, t("weak"), audit.weak)}
            {stat(<Copy className="w-5 h-5 text-amber-500" />, t("reused"), audit.reused)}
            {stat(<Clock className="w-5 h-5 text-gray-500" />, t("old"), audit.old)}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> {t("issues")}
          </h2>
          {audit.issues.length === 0 ? (
            <p className="text-green-700">{t("noIssues")}</p>
          ) : (
            <ul className="divide-y divide-border max-h-64 overflow-y-auto">
              {audit.issues.map((i, n) => (
                <li key={`${i.id}-${i.kind}-${n}`} className="py-2 flex justify-between text-sm">
                  <span className="font-medium">{i.siteName}</span>
                  <span className="text-gray-500">{label(i.kind, i.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> {t("ask")}
          </h2>
          <p className="text-xs text-gray-500">{t("privacy")}</p>

          {!hasBridge && <p className="text-sm text-amber-700">{t("desktopOnly")}</p>}

          {!apiKey ? (
            <div className="flex gap-2">
              <input
                type="password"
                dir="ltr"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-white"
              />
              <button
                onClick={() => {
                  setApiKey(keyInput.trim());
                  setKeyInput("");
                }}
                disabled={!keyInput.trim()}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                {t("saveKey")}
              </button>
            </div>
          ) : null}
          {!apiKey && <p className="text-xs text-gray-500">{t("apiKeyHint")}</p>}

          <div className="flex flex-wrap gap-2">
            {[t("quick1"), t("quick2"), t("quick3")].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q);
                  ask(q);
                }}
                className="px-3 py-1.5 rounded-full bg-white/70 border border-border text-xs hover:bg-white"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(question)}
              placeholder={t("placeholder")}
              maxLength={1000}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-white"
            />
            <button
              onClick={() => ask(question)}
              disabled={busy || !question.trim()}
              className="px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("send")}
            </button>
          </div>

          {answer && (
            <div className="rounded-xl bg-white/80 border border-border p-4 text-sm whitespace-pre-wrap leading-7">
              {answer}
            </div>
          )}

          {apiKey && (
            <button onClick={() => setApiKey("")} className="text-xs text-red-600 underline">
              {t("apiKey")} ✕
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
