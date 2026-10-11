"use client";
import { Download, Pencil, Plus, ScanLine, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Confirm, Empty, Field, Input, Modal, PageHeader, Select, Stat, Table, Td } from "@/components/ui";
import { blr, call } from "@/lib/api";
import { num, todayIso } from "@/lib/calc";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/defaults";
import { useMoney } from "@/lib/hooks";
import { fmtDate, useT } from "@/lib/i18n";
import { exportXlsx } from "@/lib/io";
import type { Expense } from "@/lib/types";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

export default function Expenses() {
  const t = useT();
  const money = useMoney();
  const lang = useUi((s) => s.lang);
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const { expenses, suppliers, saveExpense, removeExpense } = useData();
  const [edit, setEdit] = useState<Partial<Expense> | null>(null);
  const [del, setDel] = useState<Expense | null>(null);
  const [from, setFrom] = useState(todayIso().slice(0, 7) + "-01");
  const [to, setTo] = useState("");
  const [cat, setCat] = useState("");
  const [scanning, setScanning] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const writable = can(role, "expenses");
  const catLabel = (c: string) => ((EXPENSE_CATEGORIES as readonly string[]).includes(c) ? t("c_" + c) : c);

  const list = useMemo(() => expenses.filter((e) => (!from || e.date >= from) && (!to || e.date <= to) && (!cat || e.category === cat)).sort((a, b) => b.date.localeCompare(a.date)), [expenses, from, to, cat]);
  const total = list.reduce((a, e) => a + e.amount, 0);
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of list) m.set(e.category, (m.get(e.category) || 0) + e.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [list]);
  const blank = (): Partial<Expense> => ({ date: todayIso(), category: "other", description: "", amount: 0, tax: 0, method: "cash" });

  const save = async () => {
    if (!edit || num(edit.amount) <= 0) return notify(t("amount_required"), "err");
    await saveExpense({ ...edit, amount: num(edit.amount), tax: num(edit.tax) });
    setEdit(null);
    notify(t("saved"));
  };

  // AI: read a photographed receipt/invoice and pre-fill the form
  const scan = async (f: File) => {
    setScanning(true);
    try {
      const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
      const r: any = await blr().ai.scan({ dataUrl, locale: lang });
      if (!r.ok) return notify(r.error === "no-key" ? t("ai_no_key") : t("scan_failed"), "err");
      const d = r.data;
      setEdit({ ...blank(), date: d.date || todayIso(), description: [d.supplier, d.number && `#${d.number}`].filter(Boolean).join(" "), amount: num(d.total), tax: num(d.tax) });
      notify(t("scan_done"));
    } catch { notify(t("scan_failed"), "err"); } finally { setScanning(false); }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("expenses")} actions={<>
        <Button variant="secondary" size="sm" onClick={() => exportXlsx("expenses", t("expenses"), [[t("date"), t("category"), t("description"), t("amount"), t("tax"), t("method")], ...list.map((e) => [e.date, catLabel(e.category), e.description, e.amount, e.tax, t("m_" + e.method)])])}><Download size={14} />{t("export")}</Button>
        {writable && <><input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && scan(e.target.files[0])} />
          <Button variant="secondary" size="sm" disabled={scanning} onClick={() => file.current?.click()}><ScanLine size={14} />{scanning ? "…" : t("scan_receipt")}</Button>
          <Button onClick={() => setEdit(blank())}><Plus size={16} />{t("add_expense")}</Button></>}
      </>} />
      <div className="mb-5 grid gap-4 lg:grid-cols-4">
        <Stat label={t("total")} value={money(total)} tone="warn" />
        {byCat.slice(0, 3).map(([c, v]) => <Stat key={c} label={catLabel(c)} value={money(v)} sub={`${Math.round((v / (total || 1)) * 100)}%`} />)}
      </div>
      <Card pad={false}>
        <div className="flex flex-wrap gap-3 border-b border-line p-3">
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-48"><option value="">{t("all_categories")}</option>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t("c_" + c)}</option>)}</Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" aria-label={t("from")} /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" aria-label={t("to")} />
        </div>
        {list.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={[t("date"), t("category"), t("description"), t("method"), t("amount"), ""]}>
            {list.map((e) => (
              <tr key={e.id}>
                <Td className="num">{fmtDate(e.date, lang)}</Td><Td><Badge tone="info">{catLabel(e.category)}</Badge></Td><Td>{e.description}</Td><Td>{t("m_" + e.method)}</Td><Td className="num font-semibold">{money(e.amount)}</Td>
                <Td className="text-end whitespace-nowrap">{writable && <button onClick={() => setEdit(e)} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")}><Pencil size={15} /></button>}{can(role, "delete") && <button onClick={() => setDel(e)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={edit?.id ? t("edit") : t("add_expense")} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>{t("cancel")}</Button><Button onClick={save}>{t("save")}</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("date")}><Input type="date" value={edit.date || ""} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></Field>
            <Field label={t("category")}><Select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t("c_" + c)}</option>)}</Select></Field>
            <Field label={t("description")} className="sm:col-span-2"><Input value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} autoFocus /></Field>
            <Field label={t("amount") + " (" + t("incl_tax") + ")"}><Input type="number" step="any" value={edit.amount ?? ""} onChange={(e) => setEdit({ ...edit, amount: e.target.value as any })} /></Field>
            <Field label={t("tax_amount")}><Input type="number" step="any" value={edit.tax ?? ""} onChange={(e) => setEdit({ ...edit, tax: e.target.value as any })} /></Field>
            <Field label={t("supplier")}><Select value={edit.supplierId || ""} onChange={(e) => setEdit({ ...edit, supplierId: e.target.value || undefined })}><option value="">—</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            <Field label={t("method")}><Select value={edit.method} onChange={(e) => setEdit({ ...edit, method: e.target.value })}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t("m_" + m)}</option>)}</Select></Field>
          </div>
        )}
      </Modal>
      <Confirm open={!!del} message={t("confirm_delete", { name: del?.description || "" })} onNo={() => setDel(null)} onYes={async () => { if (del) await removeExpense(del.id); setDel(null); }} />
    </div>
  );
}
