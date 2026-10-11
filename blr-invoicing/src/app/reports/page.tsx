"use client";
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, Empty, Input, PageHeader, Select, Stat, Table, Td } from "@/components/ui";
import { openPreview } from "@/store/preview";
import { inRange, netOf, summarize, taxOf } from "@/lib/analytics";
import { round, todayIso } from "@/lib/calc";
import { useDocRows, useMoney } from "@/lib/hooks";
import { tr, useT } from "@/lib/i18n";
import { exportXlsx } from "@/lib/io";
import { useData } from "@/store/data";
import { useUi } from "@/store/ui";

type Tab = "sales" | "clients" | "products" | "tax" | "aging" | "profit" | "cash";
const TABS: Tab[] = ["sales", "clients", "products", "profit", "tax", "aging", "cash"];

function range(preset: string): [string, string] {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (preset === "month") return [iso(new Date(y, m, 1)), iso(new Date(y, m + 1, 0))];
  if (preset === "last_month") return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
  if (preset === "quarter") { const q = Math.floor(m / 3) * 3; return [iso(new Date(y, q, 1)), iso(new Date(y, q + 3, 0))]; }
  if (preset === "year") return [`${y}-01-01`, `${y}-12-31`];
  if (preset === "last_year") return [`${y - 1}-01-01`, `${y - 1}-12-31`];
  return ["", ""];
}

export default function Reports() {
  const t = useT();
  const money = useMoney();
  const lang = useUi((s) => s.lang);
  const { docs, expenses, payments, items, settings } = useData();
  const rows = useDocRows();
  const [tab, setTab] = useState<Tab>("sales");
  const [preset, setPreset] = useState("month");
  const [[from, to], setRange] = useState<[string, string]>(range("month"));
  const pick = (p: string) => { setPreset(p); if (p !== "custom") setRange(range(p)); };

  const sum = useMemo(() => summarize(docs, expenses, payments, items, from, to), [docs, expenses, payments, items, from, to]);
  const live = docs.filter((d) => d.status !== "draft" && d.status !== "void" && inRange(d.date, from, to));

  // each tab yields a table: head + rows (+ a total row)
  const table = useMemo(() => {
    const sales = live.filter((d) => d.type === "invoice" || d.type === "credit");
    if (tab === "sales") {
      const by = new Map<string, { net: number; tax: number; total: number; n: number }>();
      for (const d of sales) {
        const k = d.date.slice(0, 7);
        const r = by.get(k) || { net: 0, tax: 0, total: 0, n: 0 };
        const s = d.type === "credit" ? -1 : 1;
        r.net += netOf(d); r.tax += taxOf(d); r.total += s * d.total; r.n += d.type === "invoice" ? 1 : 0;
        by.set(k, r);
      }
      const data = [...by.entries()].sort().map(([k, r]) => [k, r.n, round(r.net), round(r.tax), round(r.total)]);
      return { plain: [1], head: [t("month"), t("invoices"), t("net_sales"), t("tax"), t("total")], data, total: ["", data.reduce((a, r) => a + (r[1] as number), 0), round(sum.sales), round(sum.taxCollected), round(sum.salesGross)] };
    }
    if (tab === "clients") {
      const by = new Map<string, { n: number; total: number }>();
      for (const d of sales) { const k = d.partyName || t("walk_in"); const r = by.get(k) || { n: 0, total: 0 }; r.n++; r.total += (d.type === "credit" ? -1 : 1) * d.total; by.set(k, r); }
      const data = [...by.entries()].sort((a, b) => b[1].total - a[1].total).map(([k, r]) => [k, r.n, round(r.total)]);
      return { plain: [1], head: [t("client"), t("count"), t("total")], data, total: ["", data.reduce((a, r) => a + (r[1] as number), 0), round(sum.salesGross)] };
    }
    if (tab === "products") {
      const by = new Map<string, { qty: number; rev: number; cost: number }>();
      for (const d of sales) for (const l of d.lines) {
        const s = d.type === "credit" ? -1 : 1;
        const it = items.find((i) => i.id === l.itemId);
        const k = l.desc || "—";
        const r = by.get(k) || { qty: 0, rev: 0, cost: 0 };
        r.qty += s * l.qty; r.rev += s * l.qty * l.price * (1 - l.discountPct / 100); r.cost += s * l.qty * (it?.type === "product" ? it.cost : 0);
        by.set(k, r);
      }
      const data = [...by.entries()].sort((a, b) => b[1].rev - a[1].rev).map(([k, r]) => [k, round(r.qty, 3), round(r.rev), round(r.rev - r.cost)]);
      return { plain: [1], head: [t("product"), t("qty"), t("net_sales"), t("profit")], data, total: ["", "", round(data.reduce((a, r) => a + (r[2] as number), 0)), round(data.reduce((a, r) => a + (r[3] as number), 0))] };
    }
    if (tab === "profit") {
      const data: (string | number)[][] = [
        [t("net_sales"), sum.sales], [t("cost_of_goods"), -sum.cost], [t("gross_profit"), sum.grossProfit], [t("expenses"), -sum.expenses], [t("net_profit"), sum.netProfit],
      ];
      return { plain: [] as number[], head: [t("item"), t("amount")], data, total: null };
    }
    if (tab === "tax") {
      const data: (string | number)[][] = [[t("tax_collected"), sum.taxCollected], [t("tax_deductible"), -sum.taxDeductible], [t("tax_due"), round(sum.taxCollected - sum.taxDeductible)]];
      return { plain: [] as number[], head: [t("item"), t("amount")], data, total: null };
    }
    if (tab === "aging") {
      const today = todayIso();
      const bucket = (due: string) => { const days = Math.floor((Date.parse(today) - Date.parse(due)) / 86400000); return days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4; };
      const by = new Map<string, number[]>();
      for (const r of rows) {
        if (!(r.doc.type === "invoice") || r.due <= 0 || r.doc.status === "draft" || r.doc.status === "void") continue;
        const k = r.doc.partyName || t("walk_in");
        const arr = by.get(k) || [0, 0, 0, 0, 0, 0];
        const b = bucket(r.doc.dueDate || r.doc.date);
        arr[b] += r.due; arr[5] += r.due; by.set(k, arr);
      }
      const data = [...by.entries()].sort((a, b) => b[1][5] - a[1][5]).map(([k, a]) => [k, ...a.map((x) => round(x))]);
      const tot = [0, 1, 2, 3, 4, 5].map((i) => round(data.reduce((s, r) => s + (r[i + 1] as number), 0)));
      return { plain: [] as number[], head: [t("client"), t("not_due"), "1-30", "31-60", "61-90", "90+", t("total")], data, total: ["", ...tot] };
    }
    // cash flow
    const m = new Map<string, { in: number; out: number }>();
    for (const p of payments) if (inRange(p.date, from, to)) { const k = p.date.slice(0, 7); const r = m.get(k) || { in: 0, out: 0 }; r[p.kind] += p.amount; m.set(k, r); }
    for (const e of expenses) if (inRange(e.date, from, to)) { const k = e.date.slice(0, 7); const r = m.get(k) || { in: 0, out: 0 }; r.out += e.amount; m.set(k, r); }
    const data = [...m.entries()].sort().map(([k, r]) => [k, round(r.in), round(r.out), round(r.in - r.out)]);
    return { plain: [] as number[], head: [t("month"), t("received"), t("paid_out"), t("net")], data, total: ["", ...[1, 2, 3].map((i) => round(data.reduce((s, r) => s + (r[i] as number), 0)))] };
  }, [tab, live, items, sum, rows, payments, expenses, from, to, t]);

  const fmt = (v: string | number, col: number) => (typeof v === "number" && !table.plain.includes(col) ? money(v) : String(v));
  const exportIt = () => exportXlsx(`report-${tab}`, t("rep_" + tab), [table.head, ...table.data, ...(table.total ? [table.total] : [])]);
  const buildReport = async () => {
    const body = [...table.data, ...(table.total ? [table.total] : [])].map((r) => `<tr>${r.map((c, i) => `<td class="${i ? "n" : ""}">${typeof c === "number" ? fmt(c, i) : c}</td>`).join("")}</tr>`).join("");
    const html = `<!doctype html><html dir="${lang === "ar" ? "rtl" : "ltr"}"><meta charset=utf-8><style>body{font-family:"El Messiri",Segoe UI,Tahoma,Arial;padding:16mm;font-size:12px}h1{font-size:20px;margin:0}p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:14px}th{background:#f1f5f9;text-align:start}td,th{padding:7px 8px;border-bottom:1px solid #e2e8f0}.n{text-align:end;direction:ltr}tr:last-child td{font-weight:700}</style><h1>${tr(lang, "rep_" + tab)}</h1><p>${settings.company.name} · ${from || "…"} → ${to || "…"}</p><table><tr>${table.head.map((h) => `<th>${h}</th>`).join("")}</tr>${body}</table></html>`;
    return html;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t("reports")} actions={<>
        <Button variant="secondary" size="sm" onClick={exportIt}><Download size={14} />{t("export")}</Button>
        <Button variant="secondary" size="sm" onClick={() => openPreview({ title: t("rep_" + tab), fileName: `report-${tab}.pdf`, build: buildReport })}><Printer size={14} />{t("print")}</Button>
      </>} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={preset} onChange={(e) => pick(e.target.value)} className="w-48">{["month", "last_month", "quarter", "year", "last_year", "all", "custom"].map((p) => <option key={p} value={p}>{t("p_" + p)}</option>)}</Select>
        <Input type="date" value={from} onChange={(e) => { setPreset("custom"); setRange([e.target.value, to]); }} className="w-40" />
        <Input type="date" value={to} onChange={(e) => { setPreset("custom"); setRange([from, e.target.value]); }} className="w-40" />
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("net_sales")} value={money(sum.sales)} tone="info" />
        <Stat label={t("gross_profit")} value={money(sum.grossProfit)} tone="ok" />
        <Stat label={t("expenses")} value={money(sum.expenses)} tone="warn" />
        <Stat label={t("net_profit")} value={money(sum.netProfit)} tone={sum.netProfit >= 0 ? "ok" : "bad"} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">{TABS.map((k) => <button key={k} onClick={() => setTab(k)} className={`pill rounded-full border px-4 py-1.5 text-sm ${tab === k ? "border-accent bg-accent text-white" : "border-line bg-surface text-muted"}`}>{t("rep_" + k)}</button>)}</div>
      <Card pad={false}>
        {table.data.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={table.head}>
            {table.data.map((r, i) => <tr key={i}>{r.map((c, j) => <Td key={j} className={j ? "num" : "font-medium"}>{typeof c === "number" ? fmt(c, j) : c}</Td>)}</tr>)}
            {table.total && <tr className="bg-surface2 font-bold">{table.total.map((c, j) => <Td key={j} className={j ? "num" : ""}>{typeof c === "number" ? fmt(c, j) : c}</Td>)}</tr>}
          </Table>
        )}
      </Card>
    </div>
  );
}
