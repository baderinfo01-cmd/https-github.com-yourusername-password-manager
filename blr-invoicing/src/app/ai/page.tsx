"use client";
import { AlertTriangle, Lightbulb, Send, Sparkles, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { blr } from "@/lib/api";
import { buildSummary } from "@/lib/aiSummary";
import { summarize } from "@/lib/analytics";
import { todayIso } from "@/lib/calc";
import { useDocRows, useMoney } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { useData } from "@/store/data";
import { useUi } from "@/store/ui";

interface Msg { role: "user" | "assistant"; content: string }

export default function AiPage() {
  const t = useT();
  const money = useMoney();
  const lang = useUi((s) => s.lang);
  const { docs, expenses, payments, items, clients, suppliers, settings } = useData();
  const rows = useDocRows();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { Promise.resolve(blr().ai.hasKey()).then((r: any) => setHasKey(typeof r === "boolean" ? r : !!r?.data)).catch(() => setHasKey(false)); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  // insights computed locally (work without an API key)
  const insights = useMemo(() => {
    const out: { tone: "bad" | "warn" | "info"; text: string }[] = [];
    const today = todayIso();
    const overdue = rows.filter((r) => r.pay === "overdue");
    if (overdue.length) out.push({ tone: "bad", text: t("ins_overdue", { n: overdue.length, amount: money(overdue.reduce((a, r) => a + r.due, 0)) }) });
    const out0 = items.filter((i) => i.trackStock && i.stock <= 0);
    if (out0.length) out.push({ tone: "bad", text: t("ins_out_of_stock", { names: out0.slice(0, 4).map((i) => i.name).join("، ") }) });
    const low = items.filter((i) => i.trackStock && i.stock > 0 && i.stock <= i.minStock);
    if (low.length) out.push({ tone: "warn", text: t("ins_low_stock", { n: low.length }) });
    const m = summarize(docs, expenses, payments, items, today.slice(0, 7) + "-01", today);
    const prev = new Date(); prev.setMonth(prev.getMonth() - 1);
    const pm = prev.toISOString().slice(0, 7);
    const p = summarize(docs, expenses, payments, items, pm + "-01", pm + "-31");
    if (p.sales > 0 && m.sales < p.sales * 0.7 && Number(today.slice(8)) > 20) out.push({ tone: "warn", text: t("ins_sales_down", { pct: Math.round((1 - m.sales / p.sales) * 100) }) });
    if (m.netProfit < 0) out.push({ tone: "bad", text: t("ins_loss") });
    const unsold = items.filter((i) => i.trackStock && i.stock > 0 && !docs.some((d) => d.type === "invoice" && d.date >= new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10) && d.lines.some((l) => l.itemId === i.id)));
    if (unsold.length) out.push({ tone: "info", text: t("ins_dead_stock", { n: unsold.length }) });
    if (!out.length) out.push({ tone: "info", text: t("ins_all_good") });
    return out;
  }, [rows, items, docs, expenses, payments, money, t]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs(next); setQ(""); setBusy(true);
    const r: any = await blr().ai.ask({ messages: next, locale: lang, summary: buildSummary({ docs, expenses, payments, items, clients, suppliers, currency: settings.currency.code }) });
    setBusy(false);
    setMsgs([...next, { role: "assistant", content: r?.ok ? r.text : r?.error === "no-key" ? t("ai_no_key") : `⚠ ${r?.error || t("error")}` }]);
  };

  const quick = ["ai_q1", "ai_q2", "ai_q3", "ai_q4", "ai_q5"];
  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[320px_1fr]">
      <div className="space-y-5">
        <PageHeader title={t("ai")} />
        <Card title={<span className="flex items-center gap-2"><Lightbulb size={15} className="text-warn" />{t("smart_insights")}</span>}>
          <ul className="space-y-2.5 text-sm">
            {insights.map((i, k) => (
              <li key={k} className="flex gap-2">{i.tone === "bad" ? <TrendingDown size={16} className="mt-0.5 shrink-0 text-bad" /> : i.tone === "warn" ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" /> : <Sparkles size={16} className="mt-0.5 shrink-0 text-accent" />}<span>{i.text}</span></li>
            ))}
          </ul>
        </Card>
      </div>
      <Card pad={false} className="flex h-[calc(100vh-9rem)] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.length === 0 && (
            <div className="grid h-full place-items-center text-center">
              <div className="max-w-md space-y-4">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent"><Sparkles size={26} /></div>
                <h2 className="text-lg font-bold">{t("ai_welcome")}</h2>
                <p className="text-sm text-muted">{t("ai_welcome_sub")}</p>
                {hasKey === false && <p className="rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn">{t("ai_no_key")} <Link href="/settings/" className="underline">{t("open_settings")}</Link></p>}
                <div className="flex flex-wrap justify-center gap-2">{quick.map((k) => <button key={k} onClick={() => send(t(k))} className="rounded-full border border-line bg-surface2 px-3 py-1.5 text-xs hover:border-accent">{t(k)}</button>)}</div>
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-accent text-white" : "border border-line bg-surface2"}`}>{m.content}</div>
            </div>
          ))}
          {busy && <div className="text-sm text-muted">… {t("thinking")}</div>}
          <div ref={end} />
        </div>
        <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); send(q); }}>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ai_placeholder")} maxLength={1000} />
          <Button type="submit" disabled={busy || !q.trim()}><Send size={16} className="rtl:rotate-180" /></Button>
        </form>
      </Card>
    </div>
  );
}
