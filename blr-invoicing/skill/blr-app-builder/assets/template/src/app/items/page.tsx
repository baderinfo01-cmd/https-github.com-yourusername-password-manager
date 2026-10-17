"use client";
import { Download, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NewParam } from "@/components/NewParam";
import { Badge, Button, Card, Confirm, Empty, Field, Input, Modal, PageHeader, Table, Td, Textarea } from "@/components/ui";
import { api, call } from "@/lib/api";
import { num } from "@/lib/calc";
import { toCsv, useMoney } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { buildItemsReport } from "@/lib/reportHtml";
import type { Item } from "@/lib/types";
import { useData } from "@/store/data";
import { openPreview } from "@/store/preview";
import { can, useUi } from "@/store/ui";

/**
 * REFERENCE ENTITY PAGE. To make a new module: copy this folder to src/app/<name>/, rename Item -> your type,
 * change the `kind` in the store (saveItem/removeItem -> saveX/removeX), the permission, the dictionary keys,
 * and add a NAV entry in components/Shell.tsx. Keep: permission gate, ?new=1 support, search, confirm-delete,
 * toasts, export, print preview.
 */
const EMPTY: Partial<Item> = { name: "", price: 0, qty: 0, taxRate: 19, active: true };

export default function ItemsPage() {
  const t = useT();
  const money = useMoney();
  const role = useUi((s) => s.user?.role);
  const lang = useUi((s) => s.lang);
  const notify = useUi((s) => s.notify);
  const settings = useData((s) => s.settings);
  const { items, saveItem, removeItem } = useData();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<Item> | null>(null);
  const [del, setDel] = useState<Item | null>(null);
  const writable = can(role, "items");

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return items.filter((i) => !k || [i.name, i.category].some((v) => v?.toLowerCase().includes(k))).sort((a, b) => a.name.localeCompare(b.name));
  }, [items, q]);

  if (!can(role, "items:read")) return <Empty text={t("no_permission")} />;

  const save = async () => {
    if (!edit?.name?.trim()) return notify(t("name_required"), "err");
    try {
      // num() on every numeric input: the fields are strings while typing and may contain "12,5"
      await saveItem({ ...edit, name: edit.name.trim(), price: num(edit.price), qty: num(edit.qty), taxRate: num(edit.taxRate) });
      setEdit(null);
      notify(t("saved"));
    } catch (e: any) { notify(t("err_" + (e?.message || "generic")) , "err"); }
  };
  const exportCsv = async () => {
    const csv = toCsv([[t("name"), t("category"), t("qty"), t("price")], ...rows.map((i) => [i.name, i.category || "", i.qty, i.price])]);
    const r = await call<{ saved: boolean }>(api().file.saveText("items.csv", csv));
    if (r.saved) notify(t("saved"));
  };
  const printList = () =>
    openPreview({
      title: t("report_title"), fileName: "items.pdf", papers: ["a4", "thermal"],
      build: async (paper) => buildItemsReport(rows, { lang, settings, paper }),
    });

  const set = (k: keyof Item, v: string) => setEdit((e) => ({ ...e, [k]: v }));
  return (
    <div className="mx-auto max-w-5xl">
      <NewParam onNew={() => writable && setEdit(EMPTY)} />
      <PageHeader
        title={t("items")} subtitle={`${items.length}`}
        actions={<>
          <Button variant="secondary" size="sm" onClick={exportCsv}><Download size={14} />{t("export")}</Button>
          <Button variant="secondary" size="sm" onClick={printList}><Printer size={14} />{t("print")}</Button>
          {writable && <Button onClick={() => setEdit(EMPTY)}><Plus size={16} />{t("add_item")}</Button>}
        </>}
      />
      <Card pad={false}>
        <div className="border-b border-line p-3">
          <div className="relative max-w-sm">
            <Search size={15} className="pointer-events-none absolute start-3 top-3 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="ps-9" aria-label={t("search")} />
          </div>
        </div>
        {rows.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={[t("name"), t("category"), t("qty"), t("price"), t("status"), ""]}>
            {rows.map((i) => (
              <tr key={i.id}>
                <Td className="font-medium">{i.name}</Td><Td>{i.category || "—"}</Td><Td className="num">{i.qty}</Td><Td className="num">{money(i.price)}</Td>
                <Td><Badge tone={i.active === false ? "bad" : "ok"}>{i.active === false ? t("disabled") : t("active")}</Badge></Td>
                <Td className="whitespace-nowrap text-end">
                  {writable && <button onClick={() => setEdit(i)} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")}><Pencil size={15} /></button>}
                  {can(role, "delete") && <button onClick={() => setDel(i)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? t("edit_item") : t("add_item")} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>{t("cancel")}</Button><Button onClick={save}>{t("save")}</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("name") + " *"} className="sm:col-span-2"><Input value={edit.name || ""} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
            <Field label={t("category")}><Input value={edit.category || ""} onChange={(e) => set("category", e.target.value)} /></Field>
            <Field label={t("price")}><Input inputMode="decimal" className="num" value={edit.price ?? ""} onChange={(e) => set("price", e.target.value)} /></Field>
            <Field label={t("qty")}><Input inputMode="decimal" className="num" value={edit.qty ?? ""} onChange={(e) => set("qty", e.target.value)} /></Field>
            <Field label={t("tax") + " %"}><Input inputMode="decimal" className="num" value={edit.taxRate ?? ""} onChange={(e) => set("taxRate", e.target.value)} /></Field>
            <Field label={t("notes")} className="sm:col-span-2"><Textarea value={edit.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />{t("active")}</label>
          </div>
        )}
      </Modal>
      <Confirm open={!!del} message={t("confirm_delete", { name: del?.name || "" })} onNo={() => setDel(null)} onYes={async () => { if (del) await removeItem(del.id); setDel(null); notify(t("deleted")); }} />
    </div>
  );
}
