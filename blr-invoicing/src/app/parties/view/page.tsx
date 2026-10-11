"use client";
import { ArrowLeft, Download, Printer, Wallet } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { PaymentModal } from "@/components/PaymentModal";
import { Badge, Button, Card, Empty, PageHeader, Stat, Table, Td } from "@/components/ui";
import { openPreview } from "@/store/preview";
import { useMoney } from "@/lib/hooks";
import { fmtDate, tr, useT } from "@/lib/i18n";
import { exportXlsx } from "@/lib/io";
import { partyBalance } from "@/lib/party";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

function Inner() {
  const t = useT();
  const money = useMoney();
  const sp = useSearchParams();
  const kind = (sp.get("kind") === "suppliers" ? "suppliers" : "clients") as "clients" | "suppliers";
  const id = sp.get("id") || "";
  const lang = useUi((s) => s.lang);
  const role = useUi((s) => s.user?.role);
  const { docs, payments, settings } = useData();
  const party = useData((s) => s[kind].find((p) => p.id === id));
  const [pay, setPay] = useState(false);

  const ledger = useMemo(() => {
    if (!party) return [];
    const ev: { date: string; label: string; ref: string; debit: number; credit: number; link?: string }[] = [];
    for (const d of docs) {
      if (d.partyId !== id || d.status === "draft" || d.status === "void") continue;
      if (kind === "clients" && d.type === "invoice") ev.push({ date: d.date, label: t("t_invoice"), ref: d.number, debit: d.total, credit: 0, link: d.id });
      if (kind === "clients" && d.type === "credit") ev.push({ date: d.date, label: t("t_credit"), ref: d.number, debit: 0, credit: d.total, link: d.id });
      if (kind === "suppliers" && d.type === "purchase") ev.push({ date: d.date, label: t("t_purchase"), ref: d.number, debit: d.total, credit: 0, link: d.id });
    }
    for (const p of payments) if (p.partyId === id && p.kind === (kind === "clients" ? "in" : "out")) ev.push({ date: p.date, label: t("payment"), ref: p.ref || t("m_" + p.method), debit: 0, credit: p.amount });
    ev.sort((a, b) => a.date.localeCompare(b.date));
    let run = party.openingBalance || 0;
    return ev.map((e) => ({ ...e, run: (run += e.debit - e.credit) }));
  }, [docs, payments, party, id, kind, t]);

  if (!party) return <Empty text={t("not_found")} />;
  const bal = partyBalance(kind, party, docs, payments);

  const buildStatement = async () => {
    const m = (n: number) => money(n);
    const rows = ledger.map((l) => `<tr><td>${l.date}</td><td>${l.label}</td><td>${l.ref}</td><td class=n>${l.debit ? m(l.debit) : ""}</td><td class=n>${l.credit ? m(l.credit) : ""}</td><td class=n>${m(l.run)}</td></tr>`).join("");
    const html = `<!doctype html><html dir="${lang === "ar" ? "rtl" : "ltr"}"><meta charset=utf-8><style>body{font-family:Segoe UI,Tahoma,Arial;padding:16mm;font-size:12px}h1{font-size:20px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:14px}th{background:#f1f5f9;text-align:start}td,th{padding:7px 8px;border-bottom:1px solid #e2e8f0}.n{text-align:end;direction:ltr}.tot{font-size:16px;font-weight:700;margin-top:14px}</style><h1>${tr(lang, "statement")} — ${party.name}</h1><div>${settings.company.name} · ${new Date().toISOString().slice(0, 10)}</div><table><tr><th>${tr(lang, "date")}</th><th>${tr(lang, "type")}</th><th>${tr(lang, "reference")}</th><th>${tr(lang, "debit")}</th><th>${tr(lang, "credit")}</th><th>${tr(lang, "balance")}</th></tr>${rows}</table><div class=tot>${tr(lang, "balance")}: ${m(bal)}</div></html>`;
    return html;
  };
  const exportIt = () => exportXlsx(`statement-${party.name}`, t("statement"), [[t("date"), t("type"), t("reference"), t("debit"), t("credit"), t("balance")], ...ledger.map((l) => [l.date, l.label, l.ref, l.debit, l.credit, l.run])]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/${kind}/`} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={14} className="rtl:rotate-180" />{t(kind)}</Link>
      <PageHeader title={party.name} subtitle={[party.company, party.phone, party.email].filter(Boolean).join(" · ")} actions={<>
        <Button variant="secondary" size="sm" onClick={exportIt}><Download size={14} />{t("export")}</Button>
        <Button variant="secondary" size="sm" onClick={() => openPreview({ title: `${t("statement")} — ${party.name}`, fileName: `statement-${party.name}.pdf`, build: buildStatement })}><Printer size={14} />{t("print")}</Button>
        {can(role, "payments") && <Button size="sm" onClick={() => setPay(true)}><Wallet size={14} />{t("record_payment")}</Button>}
      </>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label={kind === "clients" ? t("owes_us") : t("we_owe")} value={money(bal)} tone={bal > 0 ? "warn" : "ok"} />
        <Stat label={t("documents")} value={docs.filter((d) => d.partyId === id).length} />
        {party.creditLimit ? <Stat label={t("credit_limit")} value={money(party.creditLimit)} tone={bal > party.creditLimit ? "bad" : "ok"} sub={bal > party.creditLimit ? t("limit_exceeded") : undefined} /> : <Stat label={t("payments")} value={payments.filter((p) => p.partyId === id).length} />}
      </div>
      <Card title={t("statement")} pad={false}>
        {ledger.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={[t("date"), t("type"), t("reference"), t("debit"), t("credit"), t("balance")]}>
            {party.openingBalance ? <tr className="text-muted"><Td className="num">—</Td><Td colSpan={2}>{t("opening_balance")}</Td><Td /><Td /><Td className="num">{money(party.openingBalance)}</Td></tr> : null}
            {ledger.map((l, i) => (
              <tr key={i}>
                <Td className="num">{fmtDate(l.date, lang)}</Td><Td><Badge tone={l.credit ? "ok" : "info"}>{l.label}</Badge></Td>
                <Td>{l.link ? <Link className="text-accent" href={`/documents/view/?id=${l.link}`}>{l.ref}</Link> : l.ref}</Td>
                <Td className="num">{l.debit ? money(l.debit) : ""}</Td><Td className="num">{l.credit ? money(l.credit) : ""}</Td><Td className="num font-semibold">{money(l.run)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <PaymentModal open={pay} onClose={() => setPay(false)} kind={kind === "clients" ? "in" : "out"} partyId={id} due={bal > 0 ? bal : undefined} />
    </div>
  );
}
export default function Page() { return <Suspense><Inner /></Suspense>; }
