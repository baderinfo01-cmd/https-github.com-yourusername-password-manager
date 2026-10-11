"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, PageHeader } from "@/components/ui";
import { toIso, todayIso } from "@/lib/calc";
import { useDocRows, useMoney } from "@/lib/hooks";
import { LOCALE, useT } from "@/lib/i18n";
import { useData } from "@/store/data";
import { useUi } from "@/store/ui";

interface Ev { kind: "due" | "quote" | "task" | "recurring"; label: string; href?: string; amount?: number }
const DOT = { due: "bg-bad", quote: "bg-warn", task: "bg-accent", recurring: "bg-ok" } as const;

export default function CalendarPage() {
  const t = useT();
  const money = useMoney();
  const lang = useUi((s) => s.lang);
  const { tasks, recurring, clients } = useData();
  const rows = useDocRows();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState(todayIso());
  const loc = LOCALE[lang];

  const events = useMemo(() => {
    const m = new Map<string, Ev[]>();
    const add = (d: string | undefined, e: Ev) => { if (d) m.set(d, [...(m.get(d) || []), e]); };
    for (const r of rows) {
      if (r.doc.type === "invoice" && r.due > 0 && r.doc.status !== "draft" && r.doc.status !== "void") add(r.doc.dueDate, { kind: "due", label: `${r.doc.number} · ${r.doc.partyName}`, href: `/documents/view/?id=${r.doc.id}`, amount: r.due });
      if ((r.doc.type === "quote" || r.doc.type === "proforma") && r.doc.status !== "accepted" && r.doc.status !== "rejected") add(r.doc.validUntil, { kind: "quote", label: `${r.doc.number} · ${r.doc.partyName}`, href: `/documents/view/?id=${r.doc.id}`, amount: r.doc.total });
    }
    for (const x of tasks) if (!x.done) add(x.due, { kind: "task", label: x.title, href: "/tasks/" });
    for (const r of recurring) if (r.active) add(r.nextDate, { kind: "recurring", label: `${r.name} · ${clients.find((c) => c.id === r.partyId)?.name || ""}`, href: "/recurring/" });
    return m;
  }, [rows, tasks, recurring, clients]);

  const y = cursor.getFullYear(), mo = cursor.getMonth();
  const first = new Date(y, mo, 1);
  const sundayFirst = lang === "ar";
  const startOffset = sundayFirst ? first.getDay() : (first.getDay() + 6) % 7;
  const Prev = lang === "ar" ? ChevronRight : ChevronLeft;
  const Next = lang === "ar" ? ChevronLeft : ChevronRight;
  const days = new Date(y, mo + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: days }, (_, i) => toIso(new Date(y, mo, i + 1)))];
  while (cells.length % 7) cells.push(null);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, (sundayFirst ? 0 : 1) + i).toLocaleDateString(loc, { weekday: "short" }));
  const today = todayIso();
  const selEvents = events.get(sel) || [];

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_320px]">
      <div>
        <PageHeader title={t("calendar")} subtitle={t("calendar_hint")} />
        <Card pad={false}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <button onClick={() => setCursor(new Date(y, mo - 1, 1))} className="rounded-lg border border-line p-2 hover:bg-surface2" aria-label="prev"><Prev size={16} /></button>
            <div className="font-bold">{cursor.toLocaleDateString(loc, { month: "long", year: "numeric" })}</div>
            <button onClick={() => setCursor(new Date(y, mo + 1, 1))} className="rounded-lg border border-line p-2 hover:bg-surface2" aria-label="next"><Next size={16} /></button>
          </div>
          <div className="grid grid-cols-7 border-b border-line bg-surface2 text-center text-xs text-muted">{weekdays.map((w) => <div key={w} className="py-2">{w}</div>)}</div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const ev = d ? events.get(d) || [] : [];
              return (
                <button key={i} disabled={!d} onClick={() => d && setSel(d)} className={`relative min-h-20 border-b border-e border-line p-1.5 text-start align-top transition ${d ? "hover:bg-surface2" : "bg-surface2/40"} ${d === sel ? "bg-accent/10 ring-1 ring-inset ring-accent" : ""}`}>
                  {d && <span className={`num inline-grid h-6 w-6 place-items-center rounded-full text-xs ${d === today ? "bg-accent font-bold text-white" : ""}`}>{Number(d.slice(8))}</span>}
                  <div className="mt-1 flex flex-wrap gap-1">{ev.slice(0, 6).map((e, k) => <span key={k} className={`h-2 w-2 rounded-full ${DOT[e.kind]}`} />)}</div>
                </button>
              );
            })}
          </div>
        </Card>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">{(["due", "quote", "task", "recurring"] as const).map((k) => <span key={k} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${DOT[k]}`} />{t("cal_" + k)}</span>)}</div>
      </div>
      <Card title={new Date(sel + "T00:00:00").toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" })} className="lg:mt-[4.5rem] lg:self-start">
        {selEvents.length === 0 ? <p className="text-sm text-muted">{t("no_events")}</p> : (
          <ul className="space-y-2.5">
            {selEvents.map((e, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[e.kind]}`} />
                <div className="min-w-0 flex-1"><div className="text-xs text-muted">{t("cal_" + e.kind)}</div>{e.href ? <Link href={e.href} className="text-accent">{e.label}</Link> : e.label}{e.amount ? <div className="num font-semibold">{money(e.amount)}</div> : null}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
