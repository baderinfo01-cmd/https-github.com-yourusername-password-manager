"use client";
import { Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { NewParam } from "@/components/NewParam";
import { Badge, Button, Card, Confirm, Empty, Field, Input, Modal, PageHeader, Select, Table, Td, Textarea } from "@/components/ui";
import { num } from "@/lib/calc";
import { UNITS } from "@/lib/defaults";
import { useMoney } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { exportXlsx, pick, pickTable } from "@/lib/io";
import type { Item } from "@/lib/types";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

export default function Products() {
  const t = useT();
  const money = useMoney();
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const { items, settings, saveItem, removeItem } = useData();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [edit, setEdit] = useState<Partial<Item> | null>(null);
  const [del, setDel] = useState<Item | null>(null);
  const writable = can(role, "products");
  const cats = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))] as string[], [items]);
  const blank = (): Partial<Item> => ({ name: "", type: "product", cost: 0, price: 0, taxRate: settings.defaultTax, trackStock: true, stock: 0, minStock: 0, unit: "pcs" });

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return items.filter((i) => (!cat || i.category === cat) && (!k || [i.name, i.sku, i.barcode, i.category].some((v) => v?.toLowerCase().includes(k)))).sort((a, b) => a.name.localeCompare(b.name));
  }, [items, q, cat]);

  const save = async () => {
    if (!edit?.name?.trim()) return notify(t("name_required"), "err");
    const isService = edit.type === "service";
    await saveItem({
      ...edit, name: edit.name.trim(), cost: num(edit.cost), price: num(edit.price), taxRate: num(edit.taxRate),
      trackStock: isService ? false : !!edit.trackStock, stock: num(edit.stock), minStock: num(edit.minStock),
    } as Item);
    setEdit(null);
    notify(t("saved"));
  };
  const doImport = async () => {
    try {
      const table = await pickTable();
      if (!table) return;
      let n = 0;
      for (const r of table) {
        const name = pick(r, "name");
        if (!name) continue;
        const tax = pick(r, "taxRate");
        await saveItem({ name, sku: pick(r, "sku"), barcode: pick(r, "barcode"), category: pick(r, "category"), unit: pick(r, "unit") || "pcs", type: "product", cost: num(pick(r, "cost")), price: num(pick(r, "price")), taxRate: tax === "" ? settings.defaultTax : num(tax), trackStock: true, stock: num(pick(r, "stock")), minStock: num(pick(r, "minStock")) });
        n++;
      }
      notify(t("imported", { n }));
    } catch { notify(t("import_failed"), "err"); }
  };
  const doExport = () => exportXlsx("products", t("products"), [[t("name"), "SKU", t("barcode"), t("category"), t("unit"), t("cost"), t("sale_price"), t("tax"), t("stock"), t("min_stock")], ...rows.map((i) => [i.name, i.sku || "", i.barcode || "", i.category || "", i.unit || "", i.cost, i.price, i.taxRate, i.stock, i.minStock])]);
  const set = (k: keyof Item, v: any) => setEdit((e) => ({ ...e, [k]: v }));
  const margin = edit && num(edit.cost) > 0 ? Math.round(((num(edit.price) - num(edit.cost)) / num(edit.cost)) * 100) : null;

  return (
    <div className="mx-auto max-w-7xl">
      <NewParam onNew={() => writable && setEdit(blank())} />
      <PageHeader title={t("products")} subtitle={`${items.length}`} actions={<>
        <Button variant="secondary" size="sm" onClick={doExport}><Download size={14} />{t("export")}</Button>
        {writable && <Button variant="secondary" size="sm" onClick={doImport}><Upload size={14} />{t("import")}</Button>}
        {writable && <Button onClick={() => setEdit(blank())}><Plus size={16} />{t("add_product")}</Button>}
      </>} />
      <Card pad={false}>
        <div className="flex flex-wrap gap-3 border-b border-line p-3">
          <div className="relative min-w-56 flex-1 sm:max-w-sm"><Search size={15} className="pointer-events-none absolute start-3 top-3 text-muted" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_products")} className="ps-9" /></div>
          {cats.length > 0 && <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-48"><option value="">{t("all_categories")}</option>{cats.map((c) => <option key={c}>{c}</option>)}</Select>}
        </div>
        {rows.length === 0 ? <Empty text={t("no_data")} action={writable ? <Button onClick={() => setEdit(blank())}>{t("add_product")}</Button> : undefined} /> : (
          <Table head={[t("name"), "SKU", t("category"), t("cost"), t("sale_price"), t("stock"), ""]}>
            {rows.map((i) => (
              <tr key={i.id}>
                <Td><div className="font-medium">{i.name}</div>{i.barcode && <div className="num text-xs text-muted">{i.barcode}</div>}</Td>
                <Td className="num">{i.sku}</Td><Td>{i.category}</Td><Td className="num">{money(i.cost)}</Td><Td className="num font-semibold">{money(i.price)}</Td>
                <Td>{i.trackStock ? <Badge tone={i.stock <= 0 ? "bad" : i.stock <= i.minStock ? "warn" : "ok"}>{i.stock} {i.unit}</Badge> : <span className="text-xs text-muted">{i.type === "service" ? t("service") : "—"}</span>}</Td>
                <Td className="text-end whitespace-nowrap">
                  {writable && <button onClick={() => setEdit(i)} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")}><Pencil size={15} /></button>}
                  {can(role, "delete") && <button onClick={() => setDel(i)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={edit?.id ? t("edit") : t("add_product")} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>{t("cancel")}</Button><Button onClick={save}>{t("save")}</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("name") + " *"} className="sm:col-span-2"><Input value={edit.name || ""} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
            <Field label={t("type")}><Select value={edit.type} onChange={(e) => set("type", e.target.value)}><option value="product">{t("product")}</option><option value="service">{t("service")}</option></Select></Field>
            <Field label={t("category")}><Input value={edit.category || ""} onChange={(e) => set("category", e.target.value)} list="cats" /><datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist></Field>
            <Field label="SKU"><Input value={edit.sku || ""} onChange={(e) => set("sku", e.target.value)} /></Field>
            <Field label={t("barcode")}><div className="flex gap-2"><Input value={edit.barcode || ""} onChange={(e) => set("barcode", e.target.value)} /><Button type="button" variant="secondary" onClick={() => set("barcode", String(Date.now()).slice(-12))}>#</Button></div></Field>
            <Field label={t("cost")}><Input type="number" step="any" value={edit.cost ?? ""} onChange={(e) => set("cost", e.target.value)} /></Field>
            <Field label={t("sale_price")} hint={margin !== null ? `${t("margin")}: ${margin}%` : undefined}><Input type="number" step="any" value={edit.price ?? ""} onChange={(e) => set("price", e.target.value)} /></Field>
            <Field label={t("tax") + " %"}><Select value={String(edit.taxRate)} onChange={(e) => set("taxRate", e.target.value)}>{[...new Set([...settings.taxes.map((x) => x.rate), num(edit.taxRate)])].sort((a, b) => a - b).map((r) => <option key={r} value={r}>{r}%</option>)}</Select></Field>
            <Field label={t("unit")}><Select value={edit.unit || "pcs"} onChange={(e) => set("unit", e.target.value)}>{UNITS.map((u) => <option key={u} value={u}>{t("u_" + u)}</option>)}</Select></Field>
            {edit.type !== "service" && <>
              <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={!!edit.trackStock} onChange={(e) => set("trackStock", e.target.checked)} />{t("track_stock")}</label>
              {edit.trackStock && <>
                <Field label={edit.id ? t("stock") : t("opening_stock")}><Input type="number" step="any" value={edit.stock ?? ""} onChange={(e) => set("stock", e.target.value)} disabled={!!edit.id} /></Field>
                <Field label={t("min_stock")}><Input type="number" step="any" value={edit.minStock ?? ""} onChange={(e) => set("minStock", e.target.value)} /></Field>
              </>}
            </>}
            <Field label={t("notes")} className="sm:col-span-2"><Textarea value={edit.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
          </div>
        )}
      </Modal>
      <Confirm open={!!del} message={t("confirm_delete", { name: del?.name || "" })} onNo={() => setDel(null)} onYes={async () => { if (del) await removeItem(del.id); setDel(null); }} />
    </div>
  );
}
