"use client";
import { Copy, Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Badge, Button, Card, Confirm, Empty, Input, PageHeader, Select, Stat, Table, Td } from "@/components/ui";
import { DOC_TYPES } from "@/lib/defaults";
import { PAY_TONE, TYPE_LIST_KEY, useDocRows, useMoney, usePayLabel } from "@/lib/hooks";
import { fmtDate, useT } from "@/lib/i18n";
import { exportXlsx } from "@/lib/io";
import type { Doc, DocType } from "@/lib/types";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

const STATUS_TONE: Record<string, "ok" | "warn" | "bad" | "info" | "muted"> = { draft: "muted", sent: "info", accepted: "ok", rejected: "bad", void: "muted", issued: "ok" };

function Inner() {
  const t = useT();
  const money = useMoney();
  const payLabel = usePayLabel();
  const router = useRouter();
  const sp = useSearchParams();
  const type = (DOC_TYPES.includes(sp.get("type") as DocType) ? sp.get("type") : "invoice") as DocType;
  const lang = useUi((s) => s.lang);
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const { removeDoc, saveDoc } = useData();
  const rows = useDocRows();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [del, setDel] = useState<Doc | null>(null);
  const isPurchase = type === "purchase" || type === "order";
  const perm = isPurchase ? "purchases" : "sales";
  const hasPay = type === "invoice" || type === "purchase";

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return rows
      .filter((r) => r.doc.type === type)
      .filter((r) => !k || r.doc.number.toLowerCase().includes(k) || r.doc.partyName.toLowerCase().includes(k))
      .filter((r) => (!from || r.doc.date >= from) && (!to || r.doc.date <= to))
      .filter((r) => filter === "all" || (hasPay ? r.pay === filter : r.doc.status === filter))
      .sort((a, b) => b.doc.date.localeCompare(a.doc.date) || b.doc.number.localeCompare(a.doc.number));
  }, [rows, type, q, from, to, filter, hasPay]);

  const total = list.reduce((a, r) => a + (type === "credit" ? -r.doc.total : r.doc.total), 0);
  const due = list.reduce((a, r) => a + (r.pay && r.pay !== "void" && r.pay !== "draft" ? r.due : 0), 0);
  const filters = hasPay ? ["all", "unpaid", "partial", "paid", "overdue", "draft"] : type === "quote" || type === "proforma" ? ["all", "draft", "sent", "accepted", "rejected"] : ["all", "draft", "issued"];

  const duplicate = async (d: Doc) => {
    const copy = await saveDoc({ ...d, id: crypto.randomUUID(), number: "", status: "draft", refId: undefined, refNumber: undefined, stockApplied: {}, createdAt: undefined, updatedAt: undefined, lines: d.lines.map((l) => ({ ...l, id: crypto.randomUUID() })) });
    notify(t("duplicated", { n: copy.number }));
    router.push(`/documents/edit/?type=${type}&id=${copy.id}`);
  };
  const doExport = () => exportXlsx(type, t(TYPE_LIST_KEY[type]), [[t("number"), t("date"), t("due_date"), isPurchase ? t("supplier") : t("client"), t("subtotal"), t("tax"), t("total"), t("paid"), t("balance_due"), t("status")], ...list.map((r) => [r.doc.number, r.doc.date, r.doc.dueDate || "", r.doc.partyName, r.doc.subtotal - r.doc.discountAmount, r.doc.tax, r.doc.total, r.paid, r.due, r.pay ? payLabel(r.pay) : t("s_" + r.doc.status)])]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t(TYPE_LIST_KEY[type])} subtitle={`${list.length}`} actions={<>
        <Button variant="secondary" size="sm" onClick={doExport}><Download size={14} />{t("export")}</Button>
        {can(role, perm) && <Button onClick={() => router.push(`/documents/edit/?type=${type}`)}><Plus size={16} />{t("new_" + type)}</Button>}
      </>} />
      {hasPay && <div className="mb-5 grid gap-4 sm:grid-cols-3"><Stat label={t("total")} value={money(total)} tone="info" /><Stat label={t("balance_due")} value={money(due)} tone={due > 0 ? "warn" : "ok"} /><Stat label={t("count")} value={list.length} /></div>}
      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
          <div className="relative min-w-56 flex-1 sm:max-w-xs"><Search size={15} className="pointer-events-none absolute start-3 top-3 text-muted" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="ps-9" /></div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">{filters.map((f) => <option key={f} value={f}>{f === "all" ? t("all") : hasPay ? t("pay_" + f) : t("s_" + f)}</option>)}</Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" aria-label={t("from")} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" aria-label={t("to")} />
        </div>
        {list.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={[t("number"), isPurchase ? t("supplier") : t("client"), t("date"), hasPay ? t("due_date") : t("status"), t("total"), hasPay ? t("balance_due") : "", hasPay ? t("status") : "", ""]}>
            {list.map((r) => (
              <tr key={r.doc.id}>
                <Td><Link href={`/documents/view/?id=${r.doc.id}`} className="font-semibold text-accent">{r.doc.number}</Link></Td>
                <Td>{r.doc.partyName || "—"}</Td><Td className="num">{fmtDate(r.doc.date, lang)}</Td>
                <Td className="num">{hasPay ? fmtDate(r.doc.dueDate, lang) : <Badge tone={STATUS_TONE[r.doc.status]}>{t("s_" + r.doc.status)}</Badge>}</Td>
                <Td className="num font-semibold">{money(type === "credit" ? -r.doc.total : r.doc.total)}</Td>
                <Td className="num">{hasPay ? money(r.due) : ""}</Td>
                <Td>{hasPay && r.pay && <Badge tone={PAY_TONE[r.pay]}>{payLabel(r.pay)}</Badge>}</Td>
                <Td className="text-end whitespace-nowrap">
                  <Link href={`/documents/view/?id=${r.doc.id}`} className="inline-block rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("view")}><Eye size={15} /></Link>
                  {can(role, perm) && <Link href={`/documents/edit/?type=${type}&id=${r.doc.id}`} className="inline-block rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")}><Pencil size={15} /></Link>}
                  {can(role, perm) && <button onClick={() => duplicate(r.doc)} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("duplicate")}><Copy size={15} /></button>}
                  {can(role, "delete") && <button onClick={() => setDel(r.doc)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <Confirm open={!!del} message={t("confirm_delete", { name: del?.number || "" })} onNo={() => setDel(null)} onYes={async () => { if (del) await removeDoc(del.id); setDel(null); notify(t("deleted")); }} />
    </div>
  );
}
export default function Page() { return <Suspense><Inner /></Suspense>; }
