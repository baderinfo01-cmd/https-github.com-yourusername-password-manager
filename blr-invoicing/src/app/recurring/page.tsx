"use client";
import { Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ItemPicker } from "@/components/ItemPicker";
import { Badge, Button, Card, Confirm, Empty, Field, Input, Modal, PageHeader, Select, Table, Td } from "@/components/ui";
import { computeTotals, num, todayIso } from "@/lib/calc";
import { useMoney } from "@/lib/hooks";
import { fmtDate, useT } from "@/lib/i18n";
import type { Line, Recurring } from "@/lib/types";
import { newLine, useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

export default function RecurringPage() {
  const t = useT();
  const money = useMoney();
  const lang = useUi((s) => s.lang);
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const { recurring, clients, items, settings, saveRecurring, removeRecurring, runRecurring } = useData();
  const [edit, setEdit] = useState<Partial<Recurring> | null>(null);
  const [del, setDel] = useState<Recurring | null>(null);
  const writable = can(role, "sales");
  const blank = (): Partial<Recurring> => ({ name: "", partyId: "", lines: [newLine(settings.defaultTax)], every: "month", nextDate: todayIso(), active: true, discount: 0, discountType: "percent", dueDays: settings.dueDays });
  const lines = edit?.lines || [];
  const patchLine = (id: string, p: Partial<Line>) => setEdit((e) => e && { ...e, lines: (e.lines || []).map((l) => (l.id === id ? { ...l, ...p } : l)) });
  const tot = (r: Partial<Recurring>) => computeTotals(r.lines || [], num(r.discount), r.discountType || "percent", 0, 0, settings.pricesIncludeTax).total;

  const save = async () => {
    if (!edit?.partyId) return notify(t("pick_client"), "err");
    const ls = (edit.lines || []).filter((l) => l.desc.trim()).map((l) => ({ ...l, qty: num(l.qty), price: num(l.price), taxRate: num(l.taxRate), discountPct: num(l.discountPct) }));
    if (!ls.length) return notify(t("add_a_line"), "err");
    await saveRecurring({ ...edit, name: edit.name || clients.find((c) => c.id === edit.partyId)?.name || "", lines: ls, discount: num(edit.discount), dueDays: num(edit.dueDays) });
    setEdit(null);
    const made = await runRecurring();
    notify(made ? t("generated", { n: made }) : t("saved"));
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t("recurring")} subtitle={t("recurring_hint")} actions={writable && <Button onClick={() => setEdit(blank())}><Plus size={16} />{t("new_recurring")}</Button>} />
      <Card pad={false}>
        {recurring.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={[t("name"), t("client"), t("frequency"), t("next_date"), t("total"), t("status"), ""]}>
            {recurring.map((r) => (
              <tr key={r.id}>
                <Td className="font-medium">{r.name}</Td><Td>{clients.find((c) => c.id === r.partyId)?.name}</Td><Td>{t("every_" + r.every)}</Td><Td className="num">{fmtDate(r.nextDate, lang)}</Td><Td className="num font-semibold">{money(tot(r))}</Td>
                <Td><Badge tone={r.active ? "ok" : "muted"}>{r.active ? t("active") : t("paused")}</Badge></Td>
                <Td className="text-end whitespace-nowrap">
                  {writable && <button onClick={() => saveRecurring({ ...r, active: !r.active })} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label="toggle">{r.active ? <Pause size={15} /> : <Play size={15} />}</button>}
                  {writable && <button onClick={() => setEdit(structuredClone(r))} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")}><Pencil size={15} /></button>}
                  {can(role, "delete") && <button onClick={() => setDel(r)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={edit?.id ? t("edit") : t("new_recurring")} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>{t("cancel")}</Button><Button onClick={save}>{t("save")}</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("name")}><Input value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label={t("client")}><Select value={edit.partyId || ""} onChange={(e) => setEdit({ ...edit, partyId: e.target.value })}><option value="">—</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            <Field label={t("frequency")}><Select value={edit.every} onChange={(e) => setEdit({ ...edit, every: e.target.value as any })}>{["week", "month", "quarter", "year"].map((f) => <option key={f} value={f}>{t("every_" + f)}</option>)}</Select></Field>
            <Field label={t("next_date")}><Input type="date" value={edit.nextDate || ""} onChange={(e) => setEdit({ ...edit, nextDate: e.target.value })} /></Field>
            <Field label={t("end_date")} hint={t("optional")}><Input type="date" value={edit.endDate || ""} onChange={(e) => setEdit({ ...edit, endDate: e.target.value || undefined })} /></Field>
            <Field label={t("due_days")}><Input type="number" value={edit.dueDays ?? 30} onChange={(e) => setEdit({ ...edit, dueDays: e.target.value as any })} /></Field>
            <div className="space-y-2 sm:col-span-2">
              <div className="text-xs font-medium text-muted">{t("lines")}</div>
              {lines.map((l) => (
                <div key={l.id} className="grid grid-cols-[1fr_70px_100px_32px] items-center gap-2">
                  <ItemPicker value={l.desc} items={items} onText={(v) => patchLine(l.id, { desc: v })} onPick={(it) => patchLine(l.id, { itemId: it.id, desc: it.name, price: it.price, taxRate: it.taxRate })} />
                  <Input type="number" value={l.qty} onChange={(e) => patchLine(l.id, { qty: e.target.value as any })} className="num" /><Input type="number" value={l.price} onChange={(e) => patchLine(l.id, { price: e.target.value as any })} className="num" />
                  <button onClick={() => setEdit({ ...edit, lines: lines.length > 1 ? lines.filter((x) => x.id !== l.id) : lines })} className="text-bad"><Trash2 size={15} /></button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setEdit({ ...edit, lines: [...lines, newLine(settings.defaultTax)] })}><Plus size={14} />{t("add_line")}</Button>
              <div className="num text-end text-sm font-semibold">{t("total")}: {money(tot(edit))}</div>
            </div>
          </div>
        )}
      </Modal>
      <Confirm open={!!del} message={t("confirm_delete", { name: del?.name || "" })} onNo={() => setDel(null)} onYes={async () => { if (del) await removeRecurring(del.id); setDel(null); }} />
    </div>
  );
}
