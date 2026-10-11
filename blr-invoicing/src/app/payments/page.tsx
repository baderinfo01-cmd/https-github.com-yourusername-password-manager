"use client";
import { Download, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Confirm, Empty, Field, Input, Modal, PageHeader, Select, Stat, Table, Td } from "@/components/ui";
import { num, round, todayIso } from "@/lib/calc";
import { PAYMENT_METHODS } from "@/lib/defaults";
import { useDocRows, useMoney } from "@/lib/hooks";
import { fmtDate, useT } from "@/lib/i18n";
import { exportXlsx } from "@/lib/io";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

export default function Payments() {
  const t = useT();
  const money = useMoney();
  const lang = useUi((s) => s.lang);
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const { payments, docs, clients, suppliers, addPayment, removePayment } = useData();
  const rows = useDocRows();
  const [kind, setKind] = useState<"all" | "in" | "out">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState<{ kind: "in" | "out"; partyId: string; docId: string; amount: string; date: string; method: string; ref: string } | null>(null);
  const [del, setDel] = useState<string | null>(null);

  const list = useMemo(() => payments.filter((p) => (kind === "all" || p.kind === kind) && (!from || p.date >= from) && (!to || p.date <= to)).sort((a, b) => b.date.localeCompare(a.date)), [payments, kind, from, to]);
  const tin = list.filter((p) => p.kind === "in").reduce((a, p) => a + p.amount, 0);
  const tout = list.filter((p) => p.kind === "out").reduce((a, p) => a + p.amount, 0);
  const partyName = (id?: string) => [...clients, ...suppliers].find((p) => p.id === id)?.name || "—";
  const docNo = (id?: string) => docs.find((d) => d.id === id);

  const openDocs = form ? rows.filter((r) => r.doc.partyId === form.partyId && r.doc.type === (form.kind === "in" ? "invoice" : "purchase") && r.due > 0 && r.doc.status !== "draft" && r.doc.status !== "void") : [];
  const parties = form?.kind === "out" ? suppliers : clients;

  const save = async () => {
    if (!form) return;
    const a = round(num(form.amount));
    if (a <= 0) return notify(t("amount_required"), "err");
    const d = rows.find((r) => r.doc.id === form.docId);
    if (d && a > d.due + 0.005) return notify(t("exceeds_due"), "err");
    await addPayment({ kind: form.kind, partyId: form.partyId || undefined, docId: form.docId || undefined, amount: a, date: form.date, method: form.method, ref: form.ref });
    setForm(null);
    notify(t("payment_saved"));
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("payments")} actions={<>
        <Button variant="secondary" size="sm" onClick={() => exportXlsx("payments", t("payments"), [[t("date"), t("type"), t("party"), t("document"), t("method"), t("reference"), t("amount")], ...list.map((p) => [p.date, p.kind === "in" ? t("received") : t("paid_out"), partyName(p.partyId), docNo(p.docId)?.number || "", t("m_" + p.method), p.ref || "", p.amount])])}><Download size={14} />{t("export")}</Button>
        <Button onClick={() => setForm({ kind: "in", partyId: "", docId: "", amount: "", date: todayIso(), method: "cash", ref: "" })}><Plus size={16} />{t("record_payment")}</Button>
      </>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label={t("received")} value={money(tin)} tone="ok" /><Stat label={t("paid_out")} value={money(tout)} tone="warn" /><Stat label={t("net")} value={money(tin - tout)} tone={tin - tout >= 0 ? "ok" : "bad"} />
      </div>
      <Card pad={false}>
        <div className="flex flex-wrap gap-3 border-b border-line p-3">
          <Select value={kind} onChange={(e) => setKind(e.target.value as any)} className="w-44"><option value="all">{t("all")}</option><option value="in">{t("received")}</option><option value="out">{t("paid_out")}</option></Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" aria-label={t("from")} /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" aria-label={t("to")} />
        </div>
        {list.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={[t("date"), t("type"), t("party"), t("document"), t("method"), t("amount"), ""]}>
            {list.map((p) => {
              const d = docNo(p.docId);
              return (
                <tr key={p.id}>
                  <Td className="num">{fmtDate(p.date, lang)}</Td><Td><Badge tone={p.kind === "in" ? "ok" : "warn"}>{p.kind === "in" ? t("received") : t("paid_out")}</Badge></Td>
                  <Td>{partyName(p.partyId)}</Td><Td>{d ? <Link className="text-accent" href={`/documents/view/?id=${d.id}`}>{d.number}</Link> : <span className="text-muted">{t("on_account")}</span>}</Td>
                  <Td>{t("m_" + p.method)}{p.ref && <span className="text-xs text-muted"> · {p.ref}</span>}</Td><Td className="num font-semibold">{money(p.amount)}</Td>
                  <Td className="text-end">{can(role, "delete") && <button onClick={() => setDel(p.id)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>}</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
      <Modal open={!!form} onClose={() => setForm(null)} wide title={t("record_payment")} footer={<><Button variant="secondary" onClick={() => setForm(null)}>{t("cancel")}</Button><Button onClick={save}>{t("save")}</Button></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("type")}><Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as any, partyId: "", docId: "" })}><option value="in">{t("received")}</option><option value="out">{t("paid_out")}</option></Select></Field>
            <Field label={form.kind === "in" ? t("client") : t("supplier")}><Select value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value, docId: "" })}><option value="">—</option>{parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <Field label={t("document")} className="sm:col-span-2"><Select value={form.docId} onChange={(e) => { const r = rows.find((x) => x.doc.id === e.target.value); setForm({ ...form, docId: e.target.value, amount: r ? String(r.due) : form.amount }); }}><option value="">{t("on_account")}</option>{openDocs.map((r) => <option key={r.doc.id} value={r.doc.id}>{r.doc.number} — {money(r.due)}</option>)}</Select></Field>
            <Field label={t("amount")}><Input type="number" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label={t("date")}><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label={t("method")}><Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t("m_" + m)}</option>)}</Select></Field>
            <Field label={t("reference")}><Input value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
      <Confirm open={!!del} message={t("confirm_delete_payment")} onNo={() => setDel(null)} onYes={async () => { if (del) await removePayment(del); setDel(null); }} />
    </div>
  );
}
