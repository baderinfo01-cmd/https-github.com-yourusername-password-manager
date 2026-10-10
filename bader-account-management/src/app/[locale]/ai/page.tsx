"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bot, ShieldCheck, ShieldAlert, Send, KeyRound, Copy, RefreshCw, Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { auditAccounts } from "@/lib/securityAudit";
import { breachCount, buildRadar, buildSummary, type ToolId } from "@/lib/aiTools";

declare global {
  interface Window {
    baderAI?: {
      breachRange: (prefix: string) => Promise<{ ok: boolean; text?: string }>;
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
  const subscriptions = useStore((s) => s.subscriptions);
  const cards = useStore((s) => s.cards);
  const documents = useStore((s) => s.documents);
  const apiKey = useStore((s) => s.aiApiKey);
  const setApiKey = useStore((s) => s.setAiApiKey);

  const [keyInput, setKeyInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<ToolId | "chat">("security");
  const [breach, setBreach] = useState<Record<string, number | null>>({});
  const [scanning, setScanning] = useState(false);

  const audit = useMemo(() => auditAccounts(accounts), [accounts]);
  const categories = useMemo(() => {
    const m: Record<string, number> = {};
    accounts.forEach((a) => (m[a.category] = (m[a.category] || 0) + 1));
    return m;
  }, [accounts]);

  const radar = useMemo(
    () =>
      buildRadar(subscriptions, [
        ...cards.map((c) => ({ label: c.issuerBank || c.type, type: "card", expiryDate: c.expiryDate })),
        ...documents.map((d) => ({ label: d.customTypeName || d.type, type: "document", expiryDate: d.expiryDate })),
      ]),
    [subscriptions, cards, documents]
  );

  const scanBreaches = async () => {
    if (!window.baderAI || scanning) return;
    setScanning(true);
    const out: Record<string, number | null> = {};
    const seen = new Map<string, number | null>();
    for (const a of accounts) {
      if (!a.password) continue;
      if (!seen.has(a.password)) seen.set(a.password, await breachCount(a.password, window.baderAI.breachRange));
      out[a.id] = seen.get(a.password) ?? null;
    }
    setBreach(out);
    setScanning(false);
  };

  const scoreColor = audit.score >= 80 ? "#16a34a" : audit.score >= 50 ? "#f59e0b" : "#dc2626";
  const hasBridge = typeof window !== "undefined" && !!window.baderAI;

  const ask = async (q: string, tool: ToolId = "security") => {
    if (!q.trim() || busy) return;
    if (!apiKey) return setAnswer(t("noKey"));
    if (!window.baderAI) return setAnswer(t("desktopOnly"));
    setBusy(true);
    setAnswer(t("thinking"));
    const res = await window.baderAI.ask({
      apiKey,
      question: q,
      summary: buildSummary(tool, audit, categories, radar, subscriptions),
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

  const tabs: { id: ToolId | "chat"; label: string }[] = [
    { id: "security", label: t("tabSecurity") },
    { id: "subscriptions", label: t("tabSubs") },
    { id: "expiry", label: t("tabExpiry") },
    { id: "organize", label: t("tabOrganize") },
    { id: "chat", label: t("tabChat") },
  ];

  const prompts: Record<ToolId, string> = {
    security: t("pSecurity"),
    subscriptions: t("pSubs"),
    expiry: t("pExpiry"),
    organize: t("pOrganize"),
  };

  const list = (title: string, rows: { key: string; left: string; right?: string }[]) => (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-bold mb-2 text-sm">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-green-700">{t("nothing")}</p>
      ) : (
        <ul className="divide-y divide-border max-h-56 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.key} className="py-2 flex justify-between text-sm">
              <span className="font-medium">{r.left}</span>
              <span className="text-gray-500">{r.right}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const analyzeButton = (tool: ToolId) => (
    <button
      onClick={() => ask(prompts[tool], tool)}
      disabled={busy}
      className="px-4 py-2 rounded-xl text-white text-sm flex items-center gap-2 disabled:opacity-50"
      style={{ background: "rgb(var(--color-primary))" }}
    >
      <Bot className="w-4 h-4" /> {t("analyze")}
    </button>
  );

  const money = Object.entries(radar.monthlySpend)
    .map(([c, v]) => `${v.toLocaleString(locale)} ${c}`)
    .join(" + ");

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" /> {t("title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("subtitle")}</p>
        </div>

        <div className="glass rounded-full p-1.5 flex flex-wrap gap-1 w-fit">
          {tabs.map((x) => (
            <button
              key={x.id}
              onClick={() => setTab(x.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tab === x.id ? "text-white shadow" : "text-gray-600 hover:bg-white/50"
              }`}
              style={tab === x.id ? { background: "rgb(var(--color-primary))" } : {}}
            >
              {x.label}
            </button>
          ))}
        </div>

        {tab === "security" && (
          <>
            <div className="glass rounded-3xl p-6 grid md:grid-cols-[200px_1fr] gap-6 items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-36 h-36 rounded-full flex items-center justify-center text-4xl font-bold"
                  style={{ background: `conic-gradient(${scoreColor} ${audit.score * 3.6}deg, #e5e7eb 0)` }}
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

            {list(
              t("issues"),
              audit.issues.map((i, n) => ({ key: `${i.id}-${i.kind}-${n}`, left: i.siteName, right: label(i.kind, i.count) }))
            )}

            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> {t("breachTitle")}
              </h3>
              <p className="text-xs text-gray-500">{t("breachDesc")}</p>
              <button
                onClick={scanBreaches}
                disabled={scanning || !hasBridge}
                className="px-4 py-2 rounded-xl text-white text-sm disabled:opacity-50"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                {scanning ? t("breachRunning") : t("breachRun")}
              </button>
              {Object.keys(breach).length > 0 && (
                <ul className="divide-y divide-border max-h-56 overflow-y-auto">
                  {accounts
                    .filter((a) => a.id in breach)
                    .map((a) => {
                      const c = breach[a.id];
                      return (
                        <li key={a.id} className="py-2 flex justify-between text-sm">
                          <span className="font-medium">{a.siteName}</span>
                          <span className={c === null ? "text-gray-500" : c > 0 ? "text-red-600 font-medium" : "text-green-700"}>
                            {c === null ? t("breachFail") : c > 0 ? t("breachFound", { count: c.toLocaleString(locale) }) : t("breachClean")}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
            {analyzeButton("security")}
          </>
        )}

        {tab === "subscriptions" && (
          <>
            <div className="glass rounded-2xl p-5 text-sm">
              <span className="text-gray-500">{t("spend")}: </span>
              <span className="font-bold text-lg">{money || "—"}</span>
            </div>
            {list(
              t("soon"),
              radar.subscriptionsSoon.map((x) => ({ key: x.name, left: x.name, right: `${t("daysN", { n: x.days })} · ${x.price} ${x.currency}` }))
            )}
            {list(
              t("expiredSubs"),
              radar.subscriptionsExpired.map((x) => ({ key: x.name, left: x.name }))
            )}
            {analyzeButton("subscriptions")}
          </>
        )}

        {tab === "expiry" && (
          <>
            {list(
              t("expiringItems"),
              radar.itemsExpiring.map((x, n) => ({ key: `${x.label}${n}`, left: `${x.type === "card" ? "💳" : "📄"} ${x.label}`, right: t("daysN", { n: x.days }) }))
            )}
            {list(
              t("expiredItems"),
              radar.itemsExpired.map((x, n) => ({ key: `${x.label}${n}`, left: `${x.type === "card" ? "💳" : "📄"} ${x.label}` }))
            )}
            {analyzeButton("expiry")}
          </>
        )}

        {tab === "organize" && (
          <>
            {list(
              t("tabOrganize"),
              Object.entries(categories).map(([k, v]) => ({ key: k, left: k, right: String(v) }))
            )}
            {analyzeButton("organize")}
          </>
        )}

        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> {tab === "chat" ? t("ask") : t("tabChat")}
          </h2>
          <p className="text-xs text-gray-500">{t("privacy")}</p>

          {!hasBridge && <p className="text-sm text-amber-700">{t("desktopOnly")}</p>}

          {!apiKey && (
            <>
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
              <p className="text-xs text-gray-500">{t("apiKeyHint")}</p>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            {[t("quick1"), t("quick2"), t("quick3")].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q);
                  ask(q, tab === "chat" ? "security" : tab);
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
              onKeyDown={(e) => e.key === "Enter" && ask(question, tab === "chat" ? "security" : tab)}
              placeholder={t("placeholder")}
              maxLength={1000}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-white"
            />
            <button
              onClick={() => ask(question, tab === "chat" ? "security" : tab)}
              disabled={busy || !question.trim()}
              className="px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("send")}
            </button>
          </div>

          {answer && (
            <div className="rounded-xl bg-white/80 border border-border p-4 text-sm whitespace-pre-wrap leading-7">{answer}</div>
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
