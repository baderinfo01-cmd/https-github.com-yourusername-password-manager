"use client";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Banknote, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card, Empty, PageHeader, Stat, Table, Td } from "@/components/ui";
import { lastMonths, summarize } from "@/lib/analytics";
import { todayIso } from "@/lib/calc";
import { PAY_TONE, useDocRows, useMoney, usePayLabel } from "@/lib/hooks";
import { fmtDate, useT } from "@/lib/i18n";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

export default function Dashboard() {
  const t = useT();
  const money = useMoney();
  const payLabel = usePayLabel();
  const lang = useUi((s) => s.lang);
  const user = useUi((s) => s.user);
  const role = user?.role;
  const { docs, expenses, payments, items, clients, settings } = useData();
  const rows = useDocRows();
  const today = todayIso();
  const monthStart = today.slice(0, 7) + "-01";

  const month = useMemo(() => summarize(docs, expenses, payments, items, monthStart, today), [docs, expenses, payments, items, monthStart, today]);
  const receivable = rows.filter((r) => r.doc.type === "invoice" && r.pay && r.pay !== "void" && r.pay !== "draft").reduce((a, r) => a + r.due, 0);
  const payable = rows.filter((r) => r.doc.type === "purchase" && r.pay && r.pay !== "void" && r.pay !== "draft").reduce((a, r) => a + r.due, 0);
  const overdue = rows.filter((r) => r.pay === "overdue");
  const lowStock = items.filter((i) => i.trackStock && i.stock <= i.minStock);

  const months = lastMonths(6);
  const chart = months.map((m) => {
    const s = summarize(docs, expenses, payments, items, m + "-01", m + "-31");
    return { m: m.slice(5) + "/" + m.slice(2, 4), [t("sales")]: s.sales, [t("expenses")]: s.expenses + s.purchases, [t("profit")]: s.netProfit };
  });

  const top = useMemo(() => {
    const by = new Map<string, number>();
    for (const r of rows) if (r.doc.type === "invoice" && r.doc.status !== "draft" && r.doc.status !== "void" && r.doc.partyId) by.set(r.doc.partyId, (by.get(r.doc.partyId) || 0) + r.doc.total);
    return [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, v]) => ({ c: clients.find((c) => c.id === id), v }));
  }, [rows, clients]);

  const recent = [...rows].filter((r) => r.doc.type === "invoice").sort((a, b) => b.doc.date.localeCompare(a.doc.date) || b.doc.number.localeCompare(a.doc.number)).slice(0, 6);
  const welcome = !settings.company.name;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("dashboard")} subtitle={fmtDate(today, lang)} />
      {user && !user.hasRecovery && can(role, "*") && (
        <Link href="/settings/" className="mb-3 flex items-center justify-between rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn hover:bg-warn/15">
          <span>🔑 {t("recovery_banner")}</span><span className="font-semibold">{t("open_settings")} →</span>
        </Link>
      )}
      {welcome && can(role, "*") && (
        <Link href="/settings/" className="mb-5 flex items-center justify-between rounded-xl border border-accent/30 bg-accent/8 px-4 py-3 text-sm text-accent hover:bg-accent/12">
          <span>👋 {t("welcome_setup")}</span><span className="font-semibold">{t("open_settings")} →</span>
        </Link>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("sales_month")} value={money(month.salesGross)} sub={`${month.invoices} ${t("invoices")}`} tone="info" icon={<TrendingUp size={17} />} />
        <Stat label={t("receivables")} value={money(receivable)} sub={`${overdue.length} ${t("pay_overdue")}`} tone={overdue.length ? "bad" : "ok"} icon={<ArrowDownLeft size={17} />} />
        <Stat label={t("payables")} value={money(payable)} tone="warn" icon={<ArrowUpRight size={17} />} />
        <Stat label={t("net_profit_month")} value={money(month.netProfit)} sub={`${t("expenses")}: ${money(month.expenses)}`} tone={month.netProfit >= 0 ? "ok" : "bad"} icon={<Banknote size={17} />} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title={t("last_6_months")} className="lg:col-span-2">
          <div dir="ltr" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={56} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} formatter={(v) => money(Number(v), false)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={t("sales")} fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t("expenses")} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t("profit")} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={t("top_clients")} pad={false}>
          {top.length === 0 ? <Empty text={t("no_data")} /> : (
            <ul className="divide-y divide-line">
              {top.map(({ c, v }, i) => (
                <li key={c?.id || i} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-accent/12 text-xs font-bold text-accent">{i + 1}</span>{c?.name || "—"}</span>
                  <span className="num font-semibold">{money(v)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title={t("recent_invoices")} className="lg:col-span-2" pad={false} actions={<Link className="text-xs text-accent" href="/documents/?type=invoice">{t("view_all")}</Link>}>
          {recent.length === 0 ? <Empty text={t("no_invoices_yet")} action={can(role, "sales") ? <Link className="text-accent" href="/documents/edit/?type=invoice">＋ {t("new_invoice")}</Link> : undefined} /> : (
            <Table head={[t("number"), t("client"), t("date"), t("total"), t("status")]}>
              {recent.map((r) => (
                <tr key={r.doc.id}>
                  <Td><Link href={`/documents/view/?id=${r.doc.id}`} className="font-medium text-accent">{r.doc.number}</Link></Td>
                  <Td>{r.doc.partyName}</Td><Td className="num">{fmtDate(r.doc.date, lang)}</Td><Td className="num font-semibold">{money(r.doc.total)}</Td>
                  <Td>{r.pay && <Badge tone={PAY_TONE[r.pay]}>{payLabel(r.pay)}</Badge>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <div className="space-y-5">
          <Card title={<span className="flex items-center gap-2"><AlertTriangle size={15} className="text-warn" />{t("low_stock")}</span>} pad={false}>
            {lowStock.length === 0 ? <Empty text={t("stock_ok")} /> : (
              <ul className="divide-y divide-line">
                {lowStock.slice(0, 6).map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-4 py-2.5 text-sm"><span className="truncate">{i.name}</span><Badge tone={i.stock <= 0 ? "bad" : "warn"}>{i.stock}</Badge></li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={<span className="flex items-center gap-2"><Receipt size={15} className="text-bad" />{t("pay_overdue")}</span>} pad={false}>
            {overdue.length === 0 ? <Empty text={t("none_overdue")} /> : (
              <ul className="divide-y divide-line">
                {overdue.slice(0, 5).map((r) => (
                  <li key={r.doc.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <Link href={`/documents/view/?id=${r.doc.id}`} className="truncate text-accent">{r.doc.number} · {r.doc.partyName}</Link><span className="num font-semibold text-bad">{money(r.due)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
