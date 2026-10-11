"use client";
import { AlertTriangle, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ItemPicker } from "@/components/ItemPicker";
import { Button, Card, Empty, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { addDays, computeTotals, num, stampDuty, todayIso } from "@/lib/calc";
import { DOC_TYPES, PAYMENT_METHODS } from "@/lib/defaults";
import { useMoney } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import type { Doc, DocStatus, DocType, Item, Line } from "@/lib/types";
import { newLine, useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

const STATUSES: Record<DocType, DocStatus[]> = {
  invoice: ["draft", "sent", "void"], purchase: ["draft", "sent", "void"],
  quote: ["draft", "sent", "accepted", "rejected"], proforma: ["draft", "sent", "accepted", "rejected"],
  delivery: ["draft", "issued"], credit: ["draft", "issued", "void"], order: ["draft", "issued"],
};

function Inner() {
  const t = useT();
  const money = useMoney();
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id");
  const notify = useUi((s) => s.notify);
  const role = useUi((s) => s.user?.role);
  const username = useUi((s) => s.user?.username);
  const { settings, items, clients, suppliers, docs, saveDoc, saveParty } = useData();
  const existing = id ? docs.find((d) => d.id === id) : undefined;
  const type = (existing?.type || (DOC_TYPES.includes(sp.get("type") as DocType) ? sp.get("type") : "invoice")) as DocType;
  const isPurchase = type === "purchase" || type === "order";
  const parties = isPurchase ? suppliers : clients;
  const hasDue = type === "invoice" || type === "purchase";

  const [doc, setDoc] = useState<Doc | null>(null);
  const [saving, setSaving] = useState(false);
  const [quick, setQuick] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    if (id && !existing) return;
    if (doc) return;
    if (existing) { setDoc(structuredClone(existing)); return; }
    const date = todayIso();
    setDoc({
      id: crypto.randomUUID(), type, number: "", date, dueDate: hasDue ? addDays(date, settings.dueDays) : undefined, partyName: "",
      lines: [newLine(settings.defaultTax)], discount: 0, discountType: "percent", shipping: 0, stamp: 0, paymentMethod: "cash",
      notes: "", terms: settings.terms, status: type === "invoice" || type === "purchase" || type === "quote" || type === "proforma" ? "sent" : "issued",
      subtotal: 0, discountAmount: 0, tax: 0, total: 0, createdBy: username,
    });
  }, [existing, id, doc, type, hasDue, settings, username]);

  const totals = useMemo(() => (doc ? computeTotals(doc.lines, doc.discount, doc.discountType, doc.shipping, doc.stamp, settings.pricesIncludeTax) : null), [doc, settings.pricesIncludeTax]);

  if (!doc || !totals) return <Empty text={id && !existing ? t("not_found") : "…"} />;
  const perm = isPurchase ? "purchases" : "sales";
  if (!can(role, perm)) return <Empty text={t("no_permission")} />;
  const patch = (p: Partial<Doc>) => setDoc((d) => (d ? { ...d, ...p } : d));
  const patchLine = (lid: string, p: Partial<Line>) => setDoc((d) => (d ? { ...d, lines: d.lines.map((l) => (l.id === lid ? { ...l, ...p } : l)) } : d));
  const priceFor = (i: Item) => (isPurchase ? i.cost : i.price);
  const pickItem = (lid: string, i: Item) => patchLine(lid, { itemId: i.id, desc: i.name, price: priceFor(i), taxRate: i.taxRate, unit: i.unit });
  const party = parties.find((p) => p.id === doc.partyId);
  const autoStamp = settings.stampDuty && doc.paymentMethod === "cash" && (type === "invoice") ? stampDuty(totals.total - doc.stamp) : 0;
  const shortage = doc.lines.filter((l) => {
    const it = items.find((i) => i.id === l.itemId);
    return it?.trackStock && (type === "invoice" || type === "delivery") && num(l.qty) > it.stock + (existing?.stockApplied?.[it.id] ? -(existing.stockApplied[it.id]) : 0);
  });

  const submit = async (then: "stay" | "view") => {
    const lines = doc.lines.filter((l) => l.desc.trim() || num(l.price)).map((l) => ({ ...l, qty: num(l.qty), price: num(l.price), discountPct: num(l.discountPct), taxRate: num(l.taxRate) }));
    if (!lines.length) return notify(t("add_a_line"), "err");
    if (lines.some((l) => num(l.qty) <= 0)) return notify(t("qty_positive"), "err");
    if (doc.type !== "delivery" && !doc.partyName.trim() && isPurchase) return notify(t("pick_supplier"), "err");
    setSaving(true);
    try {
      const next = { ...doc, lines, discount: num(doc.discount), shipping: num(doc.shipping), stamp: settings.stampDuty && type === "invoice" ? (doc.paymentMethod === "cash" ? stampDuty(computeTotals(lines, doc.discount, doc.discountType, doc.shipping, 0, settings.pricesIncludeTax).total) : 0) : doc.stamp };
      const saved = await saveDoc(next);
      notify(t("saved"));
      router.push(then === "view" ? `/documents/view/?id=${saved.id}` : `/documents/edit/?type=${type}&id=${saved.id}`);
    } catch (e: any) {
      notify(e?.message === "not-signed-in" ? t("err_session") : t("error"), "err");
    } finally { setSaving(false); }
  };
  const addQuick = async () => {
    if (!quick?.name.trim()) return;
    const p = await saveParty(isPurchase ? "suppliers" : "clients", { name: quick.name.trim(), phone: quick.phone });
    patch({ partyId: p.id, partyName: p.name });
    setQuick(null);
  };

  return (
    <div className="mx-auto max-w-6xl pb-24">
      <Link href={`/documents/?type=${type}`} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={14} className="rtl:rotate-180" />{t("back")}</Link>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{existing ? t("edit") : t("new_" + type)} {existing && <span className="text-muted">· {existing.number}</span>}</h1>
        {doc.refNumber && <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">{t("from_doc")}: {doc.refNumber}</span>}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={isPurchase ? t("supplier") : t("client")}>
              <div className="flex gap-2">
                <Select value={doc.partyId || ""} onChange={(e) => { const p = parties.find((x) => x.id === e.target.value); patch({ partyId: p?.id, partyName: p?.name || "" }); }}>
                  <option value="">{type === "invoice" || type === "delivery" ? t("walk_in") : t("select")}</option>
                  {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
                <Button type="button" variant="secondary" onClick={() => setQuick({ name: "", phone: "" })} aria-label={t("add_" + (isPurchase ? "supplier" : "client"))}><Plus size={16} /></Button>
              </div>
            </Field>
            {!doc.partyId && !isPurchase && <Field label={t("client_name_free")}><Input value={doc.partyName} onChange={(e) => patch({ partyName: e.target.value })} /></Field>}
            <Field label={t("date")}><Input type="date" value={doc.date} onChange={(e) => patch({ date: e.target.value, dueDate: hasDue ? addDays(e.target.value, settings.dueDays) : doc.dueDate })} /></Field>
            {hasDue && <Field label={t("due_date")}><Input type="date" value={doc.dueDate || ""} onChange={(e) => patch({ dueDate: e.target.value })} /></Field>}
            <Field label={t("status")}><Select value={doc.status} onChange={(e) => patch({ status: e.target.value as DocStatus })}>{STATUSES[type].map((s) => <option key={s} value={s}>{t("s_" + s)}</option>)}</Select></Field>
            {type === "invoice" && <Field label={t("payment_method")}><Select value={doc.paymentMethod || "cash"} onChange={(e) => patch({ paymentMethod: e.target.value })}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t("m_" + m)}</option>)}</Select></Field>}
          </div>
          {party && (party.creditLimit || 0) > 0 && type === "invoice" && <p className="mt-3 flex items-center gap-2 text-xs text-warn"><AlertTriangle size={14} />{t("credit_limit")}: {money(party.creditLimit!)}</p>}
        </Card>

        <Card title={t("summary")}>
          <dl className="space-y-2 text-sm">
            <Row k={t("subtotal")} v={money(totals.subtotal)} />
            {totals.discountAmount > 0 && <Row k={t("discount")} v={"- " + money(totals.discountAmount)} />}
            <Row k={t("tax")} v={money(totals.tax)} />
            {num(doc.shipping) > 0 && <Row k={t("shipping")} v={money(num(doc.shipping))} />}
            {autoStamp > 0 && <Row k={t("stamp_duty")} v={money(autoStamp)} />}
            <div className="flex items-center justify-between border-t border-line pt-3 text-lg font-bold"><span>{t("total")}</span><span className="num text-accent">{money(totals.total + autoStamp - doc.stamp)}</span></div>
          </dl>
        </Card>
      </div>

      <Card title={t("lines")} className="mt-5" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr className="border-b border-line bg-surface2 text-xs text-muted">
              <th className="w-8 px-2 py-2">#</th><th className="px-2 py-2 text-start">{t("description")}</th><th className="w-24 px-2 py-2 text-start">{t("qty")}</th>
              <th className="w-32 px-2 py-2 text-start">{t("unit_price")}</th><th className="w-20 px-2 py-2 text-start">{t("discount")} %</th><th className="w-24 px-2 py-2 text-start">{t("tax")} %</th>
              <th className="w-32 px-2 py-2 text-end">{t("amount")}</th><th className="w-10" />
            </tr></thead>
            <tbody>
              {doc.lines.map((l, i) => (
                <tr key={l.id} className="border-b border-line align-top">
                  <td className="px-2 py-2 text-center text-xs text-muted">{i + 1}</td>
                  <td className="px-2 py-2"><ItemPicker value={l.desc} items={items} placeholder={t("search_or_type")} onText={(v) => patchLine(l.id, { desc: v, itemId: undefined })} onPick={(it) => pickItem(l.id, it)} autoFocus={i === doc.lines.length - 1 && !l.desc && doc.lines.length > 1} /></td>
                  <td className="px-2 py-2"><Input type="number" step="any" min="0" value={l.qty} onChange={(e) => patchLine(l.id, { qty: e.target.value as any })} className="num" /></td>
                  <td className="px-2 py-2"><Input type="number" step="any" min="0" value={l.price} onChange={(e) => patchLine(l.id, { price: e.target.value as any })} className="num" /></td>
                  <td className="px-2 py-2"><Input type="number" step="any" min="0" max="100" value={l.discountPct} onChange={(e) => patchLine(l.id, { discountPct: e.target.value as any })} className="num" /></td>
                  <td className="px-2 py-2"><Select value={String(l.taxRate)} onChange={(e) => patchLine(l.id, { taxRate: parseFloat(e.target.value) })}>{[...new Set([...settings.taxes.map((x) => x.rate), num(l.taxRate)])].sort((a, b) => a - b).map((r) => <option key={r} value={r}>{r}%</option>)}</Select></td>
                  <td className="num px-2 py-2 pt-4 text-end font-semibold">{money(num(l.qty) * num(l.price) * (1 - num(l.discountPct) / 100))}</td>
                  <td className="px-1 py-2"><button onClick={() => patch({ lines: doc.lines.length > 1 ? doc.lines.filter((x) => x.id !== l.id) : [newLine(settings.defaultTax)] })} className="rounded p-2 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3"><Button variant="secondary" size="sm" onClick={() => patch({ lines: [...doc.lines, newLine(settings.defaultTax)] })}><Plus size={14} />{t("add_line")}</Button></div>
        {shortage.length > 0 && <p className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-warn"><AlertTriangle size={14} />{t("stock_shortage", { names: shortage.map((l) => l.desc).join("، ") })}</p>}
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("notes")}><Textarea value={doc.notes || ""} onChange={(e) => patch({ notes: e.target.value })} /></Field>
            <Field label={t("terms")}><Textarea value={doc.terms || ""} onChange={(e) => patch({ terms: e.target.value })} /></Field>
          </div>
        </Card>
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("discount")}><div className="flex gap-1"><Input type="number" step="any" min="0" value={doc.discount} onChange={(e) => patch({ discount: e.target.value as any })} className="num" />
              <Select value={doc.discountType} onChange={(e) => patch({ discountType: e.target.value as any })} className="w-16"><option value="percent">%</option><option value="amount">{settings.currency.symbol}</option></Select></div></Field>
            <Field label={t("shipping")}><Input type="number" step="any" min="0" value={doc.shipping} onChange={(e) => patch({ shipping: e.target.value as any })} className="num" /></Field>
          </div>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface/95 px-6 py-3 backdrop-blur lg:start-64">
        <Button variant="secondary" onClick={() => router.push(`/documents/?type=${type}`)}>{t("cancel")}</Button>
        <Button variant="secondary" disabled={saving} onClick={() => submit("stay")}>{t("save")}</Button>
        <Button disabled={saving} onClick={() => submit("view")}>{t("save_and_view")}</Button>
      </div>

      <Modal open={!!quick} onClose={() => setQuick(null)} title={t("add_" + (isPurchase ? "supplier" : "client"))} footer={<><Button variant="secondary" onClick={() => setQuick(null)}>{t("cancel")}</Button><Button onClick={addQuick}>{t("save")}</Button></>}>
        {quick && <div className="grid gap-4"><Field label={t("name")}><Input value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} autoFocus /></Field><Field label={t("phone")}><Input value={quick.phone} onChange={(e) => setQuick({ ...quick, phone: e.target.value })} /></Field></div>}
      </Modal>
    </div>
  );
}
const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between"><dt className="text-muted">{k}</dt><dd className="num font-medium">{v}</dd></div>;
export default function Page() { return <Suspense><Inner /></Suspense>; }
