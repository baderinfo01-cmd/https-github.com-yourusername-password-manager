"use client";
import clsx from "clsx";
import { Barcode, Copy, Download, Eye, FolderCog, ImageIcon, LayoutGrid, List, Pencil, Plus, Search, ShoppingBag, ShoppingCart, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { NewParam } from "./NewParam";
import { Badge, Button, Card, Confirm, Empty, Field, Input, Modal, PageHeader, Select, Stat, Table, Td, Textarea } from "./ui";
import { num, round } from "@/lib/calc";
import { UNITS } from "@/lib/defaults";
import { useMoney } from "@/lib/hooks";
import { toDataUrl } from "@/lib/image";
import { fmtDate, useT } from "@/lib/i18n";
import { exportXlsx, pick, pickTable } from "@/lib/io";
import { buildLabelsHtml } from "@/lib/labelsHtml";
import type { Item } from "@/lib/types";
import { useData } from "@/store/data";
import { openPreview } from "@/store/preview";
import { can, useUi } from "@/store/ui";

type Kind = "product" | "service";
const SERVICE_UNITS = ["service", "hour", "day", "visit", "m2", "pcs"] as const;
const fmtDuration = (m?: number) => (!m ? "" : m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`);

/** Shared catalogue screen: Products (stock, barcode, labels, buy) and Services (duration, materials, margin). */
export function CatalogPage({ kind }: { kind: Kind }) {
  const t = useT();
  const money = useMoney();
  const router = useRouter();
  const lang = useUi((s) => s.lang);
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const { items, docs, moves, suppliers, categories, settings, saveItem, removeItem, saveCategory, removeCategory } = useData();
  const isP = kind === "product";
  const writable = can(role, "products");
  const mine = useMemo(() => items.filter((i) => (isP ? i.type !== "service" : i.type === "service")), [items, isP]);
  const products = useMemo(() => items.filter((i) => i.type !== "service"), [items]);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const [view, setView] = useState<"table" | "grid">(() => { try { return (localStorage.getItem("blr-catalog-view") as any) || "table"; } catch { return "table"; } });
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<Partial<Item> | null>(null);
  const [tab, setTab] = useState<"basic" | "pricing" | "stock" | "materials" | "more">("basic");
  const [detail, setDetail] = useState<Item | null>(null);
  const [del, setDel] = useState<Item[] | null>(null);
  const [catMgr, setCatMgr] = useState(false);
  const [labels, setLabels] = useState<{ item: Item; copies: number }[] | null>(null);
  const img = useRef<HTMLInputElement>(null);

  const catNames = useMemo(() => [...new Set([...categories.filter((c) => c.kind === kind).map((c) => c.name), ...mine.map((i) => i.category).filter(Boolean) as string[]])].sort((a, b) => a.localeCompare(b)), [categories, mine, kind]);

  // sales / purchase statistics per item
  const stats = useMemo(() => {
    const m = new Map<string, { sold: number; revenue: number; last: string; bought: number }>();
    const get = (id: string) => m.get(id) || { sold: 0, revenue: 0, last: "", bought: 0 };
    for (const d of docs) {
      if (d.status === "draft" || d.status === "void") continue;
      for (const l of d.lines) {
        if (!l.itemId) continue;
        const s = get(l.itemId);
        const net = num(l.qty) * num(l.price) * (1 - num(l.discountPct) / 100);
        if (d.type === "invoice") { s.sold += num(l.qty); s.revenue += net; if (d.date > s.last) s.last = d.date; }
        else if (d.type === "credit") { s.sold -= num(l.qty); s.revenue -= net; }
        else if (d.type === "purchase") s.bought += num(l.qty);
        m.set(l.itemId, s);
      }
    }
    return m;
  }, [docs]);

  const stockState = (i: Item) => (!i.trackStock ? "none" : i.stock <= 0 ? "out" : i.stock <= i.minStock ? "low" : "ok");
  const materialCost = (i: Partial<Item>) => (i.materials || []).reduce((a, m) => a + num(m.qty) * (products.find((p) => p.id === m.itemId)?.cost || 0), 0);
  const totalCost = (i: Partial<Item>) => (isP ? num(i.cost) : num(i.cost) + materialCost(i));
  const marginPct = (i: Partial<Item>) => (totalCost(i) > 0 ? Math.round(((num(i.price) - totalCost(i)) / totalCost(i)) * 100) : null);

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    const list = mine.filter((i) => {
      if (cat && (cat === "__none" ? i.category : i.category !== cat)) return false;
      if (status === "inactive" ? i.active !== false : i.active === false && status !== "all") return false;
      if (isP && ["low", "out", "ok"].includes(status) && stockState(i) !== status) return false;
      return !k || [i.name, i.sku, i.barcode, i.category, i.location, i.description].some((v) => v?.toLowerCase().includes(k));
    });
    const by: Record<string, (a: Item, b: Item) => number> = {
      name: (a, b) => a.name.localeCompare(b.name), newest: (a, b) => (b.createdAt || 0) - (a.createdAt || 0), price: (a, b) => b.price - a.price,
      stock: (a, b) => a.stock - b.stock, best: (a, b) => (stats.get(b.id)?.revenue || 0) - (stats.get(a.id)?.revenue || 0),
    };
    return list.sort(by[sort] || by.name);
  }, [mine, q, cat, status, sort, stats, isP]);

  const active = mine.filter((i) => i.active !== false);
  const stockValue = products.reduce((a, i) => a + (i.trackStock ? Math.max(0, i.stock) * i.cost : 0), 0);
  const lowCount = products.filter((i) => i.active !== false && stockState(i) === "low").length;
  const outCount = products.filter((i) => i.active !== false && stockState(i) === "out").length;
  const avgPrice = mine.length ? mine.reduce((a, i) => a + i.price, 0) / mine.length : 0;
  const revenue = mine.reduce((a, i) => a + (stats.get(i.id)?.revenue || 0), 0);

  const blank = (): Partial<Item> => (isP
    ? { name: "", type: "product", cost: 0, price: 0, taxRate: settings.defaultTax, trackStock: true, stock: 0, minStock: 0, unit: "pcs", active: true }
    : { name: "", type: "service", cost: 0, price: 0, taxRate: settings.defaultTax, trackStock: false, stock: 0, minStock: 0, unit: "service", active: true, durationMin: 60, materials: [] });
  const openEdit = (i: Partial<Item>) => { setTab("basic"); setEdit(i); };
  const set = (k: keyof Item, v: any) => setEdit((e) => ({ ...e, [k]: v }));
  const toggleSel = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selected = mine.filter((i) => sel.has(i.id));
  const setViewMode = (v: "table" | "grid") => { setView(v); try { localStorage.setItem("blr-catalog-view", v); } catch {} };

  const save = async () => {
    if (!edit?.name?.trim()) { setTab("basic"); return notify(t("name_required"), "err"); }
    await saveItem({
      ...edit, name: edit.name.trim(), type: isP ? (edit.type === "service" ? "product" : "product") : "service", cost: num(edit.cost), price: num(edit.price), taxRate: num(edit.taxRate),
      trackStock: isP ? !!edit.trackStock : false, stock: num(edit.stock), minStock: num(edit.minStock), durationMin: num(edit.durationMin) || undefined, reorderQty: num(edit.reorderQty) || undefined,
      materials: (edit.materials || []).filter((m) => m.itemId && num(m.qty) > 0).map((m) => ({ itemId: m.itemId, qty: num(m.qty) })),
    } as Item);
    setEdit(null); notify(t("saved"));
  };
  const duplicate = async (i: Item) => { const { id, createdAt: _c, updatedAt: _u, ...rest } = i as any; const c = await saveItem({ ...rest, name: `${i.name} (${t("copy_suffix")})`, sku: "", barcode: "", stock: 0 }); notify(t("saved")); openEdit(c); };
  const go = (type: string, i: Item) => router.push(`/documents/edit/?type=${type}&item=${i.id}`);
  const doImport = async () => {
    try {
      const table = await pickTable();
      if (!table) return;
      let n = 0;
      for (const r of table) {
        const name = pick(r, "name");
        if (!name) continue;
        const tax = pick(r, "taxRate");
        await saveItem({ name, sku: pick(r, "sku"), barcode: pick(r, "barcode"), category: pick(r, "category"), unit: pick(r, "unit") || (isP ? "pcs" : "service"), type: isP ? "product" : "service", cost: num(pick(r, "cost")), price: num(pick(r, "price")), taxRate: tax === "" ? settings.defaultTax : num(tax), trackStock: isP, stock: num(pick(r, "stock")), minStock: num(pick(r, "minStock")), active: true });
        n++;
      }
      notify(t("imported", { n }));
    } catch { notify(t("import_failed"), "err"); }
  };
  const doExport = () => exportXlsx(isP ? "products" : "services", t(isP ? "products" : "services"), [
    [t("name"), "SKU", t("barcode"), t("category"), t("unit"), t("cost"), t("sale_price"), t("tax"), ...(isP ? [t("stock"), t("min_stock")] : [t("duration")]), t("status")],
    ...rows.map((i) => [i.name, i.sku || "", i.barcode || "", i.category || "", i.unit || "", totalCost(i), i.price, i.taxRate, ...(isP ? [i.stock, i.minStock] : [i.durationMin || 0]), i.active === false ? t("inactive") : t("active")]),
  ]);
  const openLabels = (list: Item[]) => setLabels(list.map((item) => ({ item, copies: Math.max(1, Math.min(48, Math.round(item.stock) || 1)) })));
  const printLabels = () => {
    if (!labels) return;
    const l = labels;
    setLabels(null);
    openPreview({ title: t("barcode_labels"), fileName: "labels.pdf", build: async () => buildLabelsHtml(l, settings, lang === "ar") });
  };

  const stockBadge = (i: Item) => {
    const s = stockState(i);
    if (s === "none") return <span className="text-xs text-muted">—</span>;
    return <Badge tone={s === "out" ? "bad" : s === "low" ? "warn" : "ok"}>{i.stock} {t("u_" + (i.unit || "pcs"))}</Badge>;
  };
  const Thumb = ({ i, size = 40 }: { i: Pick<Item, "image" | "name">; size?: number }) => (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-accent/10 text-accent" style={{ width: size, height: size }}>
      {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-bold">{(i.name || "?").slice(0, 1)}</span>}
    </span>
  );
  const Actions = ({ i }: { i: Item }) => (
    <span className="inline-flex items-center whitespace-nowrap">
      <button onClick={() => setDetail(i)} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("details")} title={t("details")}><Eye size={15} /></button>
      {can(role, "sales") && <button onClick={() => go("invoice", i)} className="rounded p-1.5 text-ok hover:bg-ok/10" aria-label={t("sell")} title={t("sell")}><ShoppingBag size={15} /></button>}
      {isP && can(role, "purchases") && <button onClick={() => go("purchase", i)} className="rounded p-1.5 text-accent hover:bg-accent/10" aria-label={t("buy")} title={t("buy")}><ShoppingCart size={15} /></button>}
      {writable && <button onClick={() => openEdit(i)} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")} title={t("edit")}><Pencil size={15} /></button>}
      {writable && <button onClick={() => duplicate(i)} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("duplicate")} title={t("duplicate")}><Copy size={15} /></button>}
      {can(role, "delete") && <button onClick={() => setDel([i])} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>}
    </span>
  );

  const statusOpts = isP ? ["all", "ok", "low", "out", "inactive"] : ["all", "inactive"];
  const detStats = detail ? stats.get(detail.id) : undefined;
  const detMoves = detail ? moves.filter((m) => m.itemId === detail.id).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)).slice(0, 8) : [];

  return (
    <div className="mx-auto max-w-7xl">
      <NewParam onNew={() => writable && openEdit(blank())} />
      <PageHeader title={t(isP ? "products" : "services")} subtitle={t(isP ? "products_hint" : "services_hint")} actions={<>
        <Button variant="secondary" size="sm" onClick={doExport}><Download size={14} />{t("export")}</Button>
        {writable && <Button variant="secondary" size="sm" onClick={doImport}><Upload size={14} />{t("import")}</Button>}
        {writable && <Button variant="secondary" size="sm" onClick={() => setCatMgr(true)}><FolderCog size={14} />{t("categories")}</Button>}
        {isP && <Button variant="secondary" size="sm" onClick={() => openLabels(selected.length ? selected : rows)}><Barcode size={14} />{t("barcode_labels")}</Button>}
        {writable && <Button onClick={() => openEdit(blank())}><Plus size={16} />{t(isP ? "add_product" : "add_service")}</Button>}
      </>} />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isP ? <>
          <Stat label={t("products")} value={active.length} sub={`${mine.length - active.length} ${t("inactive")}`} tone="info" />
          <Stat label={t("stock_value")} value={money(stockValue)} tone="ok" />
          <Stat label={t("low_stock")} value={lowCount} tone={lowCount ? "warn" : "ok"} />
          <Stat label={t("out_of_stock")} value={outCount} tone={outCount ? "bad" : "ok"} />
        </> : <>
          <Stat label={t("services")} value={active.length} sub={`${mine.length - active.length} ${t("inactive")}`} tone="info" />
          <Stat label={t("categories")} value={catNames.length} tone="ok" />
          <Stat label={t("avg_price")} value={money(avgPrice)} tone="warn" />
          <Stat label={t("service_revenue")} value={money(revenue)} tone="ok" />
        </>}
      </div>

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line/70 p-3">
          <div className="relative min-w-56 flex-1 sm:max-w-sm"><Search size={15} className="pointer-events-none absolute start-3 top-3 text-muted" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(isP ? "search_products" : "search_services")} className="ps-9" /></div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-44"><option value="">{t("all_categories")}</option><option value="__none">{t("uncategorized")}</option>{catNames.map((c) => <option key={c}>{c}</option>)}</Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">{statusOpts.map((s) => <option key={s} value={s}>{s === "all" ? t("all") : s === "inactive" ? t("inactive") : t("st_" + s)}</option>)}</Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44">{(isP ? ["name", "newest", "price", "stock", "best"] : ["name", "newest", "price", "best"]).map((s) => <option key={s} value={s}>{t("sort_" + s)}</option>)}</Select>
          <div className="ms-auto flex overflow-hidden rounded-xl border border-line">
            {([["table", List], ["grid", LayoutGrid]] as const).map(([v, Ic]) => <button key={v} onClick={() => setViewMode(v)} aria-label={v} className={clsx("px-3 py-2", view === v ? "bg-accent text-white" : "bg-surface text-muted hover:bg-surface2")}><Ic size={16} /></button>)}
          </div>
        </div>
        {selected.length > 0 && writable && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line/70 bg-accent/5 px-3 py-2 text-sm">
            <b>{selected.length}</b> {t("selected")}
            <Select className="h-8 w-40 text-xs" value="" onChange={async (e) => { if (!e.target.value) return; for (const i of selected) await saveItem({ ...i, category: e.target.value === "__clear" ? "" : e.target.value }); setSel(new Set()); notify(t("saved")); }}>
              <option value="">{t("set_category")}</option><option value="__clear">— {t("uncategorized")}</option>{catNames.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Button size="sm" variant="secondary" onClick={async () => { for (const i of selected) await saveItem({ ...i, active: true }); setSel(new Set()); }}>{t("activate")}</Button>
            <Button size="sm" variant="secondary" onClick={async () => { for (const i of selected) await saveItem({ ...i, active: false }); setSel(new Set()); }}>{t("deactivate")}</Button>
            {isP && <Button size="sm" variant="secondary" onClick={() => openLabels(selected)}><Barcode size={13} />{t("barcode_labels")}</Button>}
            {can(role, "delete") && <Button size="sm" variant="danger" onClick={() => setDel(selected)}><Trash2 size={13} />{t("delete")}</Button>}
            <button className="ms-auto text-xs text-muted hover:text-ink" onClick={() => setSel(new Set())}>{t("clear_selection")}</button>
          </div>
        )}

        {rows.length === 0 ? <Empty text={t("no_data")} action={writable ? <Button onClick={() => openEdit(blank())}>{t(isP ? "add_product" : "add_service")}</Button> : undefined} />
        : view === "grid" ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((i) => (
              <div key={i.id} className={clsx("group relative rounded-2xl border border-line/80 bg-surface p-3 transition hover:-translate-y-0.5 hover:shadow-lg", i.active === false && "opacity-55")}>
                <input type="checkbox" checked={sel.has(i.id)} onChange={() => toggleSel(i.id)} className="absolute end-3 top-3 h-4 w-4 accent-[var(--accent)]" aria-label="select" />
                <div className="flex items-center gap-3"><Thumb i={i} size={52} /><div className="min-w-0"><div className="truncate font-semibold">{i.name}</div><div className="truncate text-xs text-muted">{i.category || t("uncategorized")}{i.sku ? ` · ${i.sku}` : ""}</div></div></div>
                <div className="mt-3 flex items-end justify-between"><div className="num text-lg font-bold text-accent">{money(i.price)}</div>{isP ? stockBadge(i) : <span className="text-xs text-muted">{fmtDuration(i.durationMin)}</span>}</div>
                <div className="mt-2 flex justify-end"><Actions i={i} /></div>
              </div>
            ))}
          </div>
        ) : (
          <Table head={[<input key="all" type="checkbox" className="accent-[var(--accent)]" checked={rows.length > 0 && rows.every((r) => sel.has(r.id))} onChange={(e) => setSel(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} aria-label="all" />, t("name"), t("category"), t("cost"), t("sale_price"), isP ? t("stock") : t("duration"), t("status"), ""]}>
            {rows.map((i) => (
              <tr key={i.id} className={i.active === false ? "opacity-55" : ""}>
                <Td><input type="checkbox" className="accent-[var(--accent)]" checked={sel.has(i.id)} onChange={() => toggleSel(i.id)} aria-label="select" /></Td>
                <Td><div className="flex items-center gap-3"><Thumb i={i} /><div className="min-w-0"><button onClick={() => setDetail(i)} className="truncate text-start font-medium hover:text-accent">{i.name}</button><div className="num text-xs text-muted">{[i.sku, i.barcode].filter(Boolean).join(" · ")}</div></div></div></Td>
                <Td>{i.category ? <Badge tone="info">{i.category}</Badge> : <span className="text-muted">—</span>}</Td>
                <Td className="num">{money(totalCost(i))}</Td>
                <Td className="num font-semibold">{money(i.price)}{marginPct(i) !== null && <div className={`text-[10px] ${marginPct(i)! >= 0 ? "text-ok" : "text-bad"}`}>{marginPct(i)}%</div>}</Td>
                <Td>{isP ? stockBadge(i) : <span className="text-sm">{fmtDuration(i.durationMin) || "—"}</span>}</Td>
                <Td><Badge tone={i.active === false ? "muted" : "ok"}>{i.active === false ? t("inactive") : t("active")}</Badge></Td>
                <Td className="text-end"><Actions i={i} /></Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* ---------- add / edit ---------- */}
      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={edit?.id ? t("edit") : t(isP ? "add_product" : "add_service")} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>{t("cancel")}</Button><Button onClick={save}>{t("save")}</Button></>}>
        {edit && <>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["basic", "pricing", ...(isP ? ["stock"] : ["materials"]), "more"] as const).map((k) => <button key={k} onClick={() => setTab(k as any)} className={clsx("pill rounded-full border px-4 py-1 text-sm", tab === k ? "border-accent bg-accent text-white" : "border-line text-muted")}>{t("tab_" + k)}</button>)}
          </div>
          {tab === "basic" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("name") + " *"} className="sm:col-span-2"><Input value={edit.name || ""} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
              <Field label={t("category")}><Input value={edit.category || ""} onChange={(e) => set("category", e.target.value)} list="catlist" /><datalist id="catlist">{catNames.map((c) => <option key={c} value={c} />)}</datalist></Field>
              <Field label={t("unit")}><Select value={edit.unit || (isP ? "pcs" : "service")} onChange={(e) => set("unit", e.target.value)}>{(isP ? UNITS : SERVICE_UNITS).map((u) => <option key={u} value={u}>{t("u_" + u)}</option>)}</Select></Field>
              <Field label="SKU / ref"><Input value={edit.sku || ""} onChange={(e) => set("sku", e.target.value)} /></Field>
              {isP && <Field label={t("barcode")}><div className="flex gap-2"><Input value={edit.barcode || ""} onChange={(e) => set("barcode", e.target.value)} /><Button type="button" variant="secondary" onClick={() => set("barcode", "6" + String(Date.now()).slice(-11))} title={t("generate")}>#</Button></div></Field>}
              {!isP && <Field label={t("duration") + " (" + t("minutes") + ")"} hint={fmtDuration(num(edit.durationMin))}><Input type="number" min="0" value={edit.durationMin ?? ""} onChange={(e) => set("durationMin", e.target.value)} className="num" /></Field>}
              <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={edit.active !== false} onChange={(e) => set("active", e.target.checked)} />{t("active_item")}</label>
            </div>
          )}
          {tab === "pricing" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={isP ? t("cost") : t("labor_cost")}><Input type="number" step="any" value={edit.cost ?? ""} onChange={(e) => set("cost", e.target.value)} className="num" /></Field>
              <Field label={t("sale_price")} hint={marginPct(edit) !== null ? `${t("margin")}: ${marginPct(edit)}% · ${t("profit")}: ${money(round(num(edit.price) - totalCost(edit)))}` : undefined}><Input type="number" step="any" value={edit.price ?? ""} onChange={(e) => set("price", e.target.value)} className="num" /></Field>
              <Field label={t("tax") + " %"}><Select value={String(edit.taxRate)} onChange={(e) => set("taxRate", e.target.value)}>{[...new Set([...settings.taxes.map((x) => x.rate), num(edit.taxRate)])].sort((a, b) => a - b).map((r) => <option key={r} value={r}>{r}%</option>)}</Select></Field>
              {!isP && materialCost(edit) > 0 && <Field label={t("materials_cost")}><Input readOnly value={money(materialCost(edit))} className="num" /></Field>}
              <p className="text-xs text-muted sm:col-span-2">{t("price_hint")}</p>
            </div>
          )}
          {tab === "stock" && isP && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={!!edit.trackStock} onChange={(e) => set("trackStock", e.target.checked)} />{t("track_stock")}</label>
              {edit.trackStock && <>
                <Field label={edit.id ? t("stock") : t("opening_stock")} hint={edit.id ? t("stock_edit_hint") : undefined}><Input type="number" step="any" value={edit.stock ?? ""} onChange={(e) => set("stock", e.target.value)} disabled={!!edit.id} className="num" /></Field>
                <Field label={t("min_stock")}><Input type="number" step="any" value={edit.minStock ?? ""} onChange={(e) => set("minStock", e.target.value)} className="num" /></Field>
                <Field label={t("reorder_qty")}><Input type="number" step="any" value={edit.reorderQty ?? ""} onChange={(e) => set("reorderQty", e.target.value)} className="num" /></Field>
                <Field label={t("location")}><Input value={edit.location || ""} onChange={(e) => set("location", e.target.value)} placeholder={t("location_ph")} /></Field>
              </>}
              <Field label={t("supplier")} className="sm:col-span-2"><Select value={edit.supplierId || ""} onChange={(e) => set("supplierId", e.target.value || undefined)}><option value="">—</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            </div>
          )}
          {tab === "materials" && !isP && (
            <div className="space-y-3">
              <p className="text-sm text-muted">{t("materials_hint")}</p>
              {(edit.materials || []).map((m, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_90px_32px] items-center gap-2">
                  <Select value={m.itemId} onChange={(e) => set("materials", (edit.materials || []).map((x, k) => (k === idx ? { ...x, itemId: e.target.value } : x)))}><option value="">—</option>{products.filter((p) => p.trackStock).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</Select>
                  <Input type="number" step="any" min="0" value={m.qty} onChange={(e) => set("materials", (edit.materials || []).map((x, k) => (k === idx ? { ...x, qty: e.target.value as any } : x)))} className="num" />
                  <button onClick={() => set("materials", (edit.materials || []).filter((_, k) => k !== idx))} className="text-bad"><Trash2 size={15} /></button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => set("materials", [...(edit.materials || []), { itemId: "", qty: 1 }])}><Plus size={14} />{t("add_material")}</Button>
              <div className="num rounded-xl bg-surface2 p-3 text-sm">{t("materials_cost")}: <b>{money(materialCost(edit))}</b> · {t("total_cost")}: <b>{money(totalCost(edit))}</b></div>
            </div>
          )}
          {tab === "more" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 sm:col-span-2">
                <Thumb i={{ image: edit.image, name: edit.name || "?" }} size={72} />
                <input ref={img} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) set("image", await toDataUrl(f, 360)); }} />
                <div className="flex flex-col gap-2"><Button size="sm" variant="secondary" onClick={() => img.current?.click()}><ImageIcon size={14} />{t("upload")}</Button>{edit.image && <Button size="sm" variant="ghost" onClick={() => set("image", undefined)}>{t("remove")}</Button>}</div>
              </div>
              <Field label={t("description")} className="sm:col-span-2"><Textarea value={edit.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
              <Field label={t("notes")} className="sm:col-span-2"><Textarea value={edit.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
            </div>
          )}
        </>}
      </Modal>

      {/* ---------- details ---------- */}
      <Modal open={!!detail} onClose={() => setDetail(null)} wide title={detail?.name || ""} footer={detail && <>
        {can(role, "sales") && <Button onClick={() => go(isP ? "invoice" : "invoice", detail)}><ShoppingBag size={15} />{t("sell")}</Button>}
        {!isP && can(role, "sales") && <Button variant="secondary" onClick={() => go("quote", detail)}>{t("t_quote")}</Button>}
        {isP && can(role, "purchases") && <Button variant="secondary" onClick={() => go("purchase", detail)}><ShoppingCart size={15} />{t("buy")}</Button>}
        {isP && <Button variant="secondary" onClick={() => { const d = detail; setDetail(null); openLabels([d]); }}><Barcode size={15} />{t("barcode_labels")}</Button>}
        {writable && <Button variant="secondary" onClick={() => { const d = detail; setDetail(null); openEdit(d); }}><Pencil size={15} />{t("edit")}</Button>}
      </>}>
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-4"><Thumb i={detail} size={72} /><div><div className="flex flex-wrap items-center gap-2"><Badge tone={detail.active === false ? "muted" : "ok"}>{detail.active === false ? t("inactive") : t("active")}</Badge>{detail.category && <Badge tone="info">{detail.category}</Badge>}</div>
              <div className="num mt-1 text-sm text-muted">{[detail.sku, detail.barcode, detail.location && `📍 ${detail.location}`].filter(Boolean).join(" · ")}</div>{detail.description && <p className="mt-1 text-sm">{detail.description}</p>}</div></div>
            <div className="grid gap-3 sm:grid-cols-4">
              {([[t("sale_price"), money(detail.price)], [isP ? t("cost") : t("total_cost"), money(totalCost(detail))], [t("margin"), marginPct(detail) === null ? "—" : `${marginPct(detail)}%`], isP ? [t("stock"), detail.trackStock ? `${detail.stock} ${t("u_" + (detail.unit || "pcs"))}` : "—"] : [t("duration"), fmtDuration(detail.durationMin) || "—"]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-surface2 p-3"><div className="text-xs text-muted">{k}</div><div className="num mt-1 text-lg font-bold">{v}</div></div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line p-3"><div className="text-xs text-muted">{t("units_sold")}</div><div className="num text-lg font-bold">{round(detStats?.sold || 0, 2)}</div></div>
              <div className="rounded-xl border border-line p-3"><div className="text-xs text-muted">{t("revenue")}</div><div className="num text-lg font-bold">{money(detStats?.revenue || 0)}</div></div>
              <div className="rounded-xl border border-line p-3"><div className="text-xs text-muted">{isP ? t("units_bought") : t("last_sold")}</div><div className="num text-lg font-bold">{isP ? round(detStats?.bought || 0, 2) : fmtDate(detStats?.last, lang) || "—"}</div></div>
            </div>
            {!isP && (detail.materials || []).length > 0 && (
              <div><div className="mb-1.5 text-sm font-semibold">{t("tab_materials")}</div>
                <ul className="divide-y divide-line rounded-xl border border-line text-sm">{(detail.materials || []).map((m, i) => { const p = products.find((x) => x.id === m.itemId); return <li key={i} className="flex justify-between px-3 py-2"><span>{p?.name || "—"}</span><span className="num text-muted">× {m.qty} · {t("stock")}: {p?.stock ?? "—"}</span></li>; })}</ul></div>
            )}
            {isP && detMoves.length > 0 && (
              <div><div className="mb-1.5 text-sm font-semibold">{t("stock_moves")}</div>
                <ul className="divide-y divide-line rounded-xl border border-line text-sm">{detMoves.map((m) => <li key={m.id} className="flex justify-between px-3 py-2"><span>{fmtDate(m.date, lang)} · {m.note || (["invoice", "quote", "proforma", "delivery", "credit", "purchase", "order"].includes(m.reason) ? t("t_" + m.reason) : t("r_" + m.reason))}</span><span className={`num font-semibold ${m.qty < 0 ? "text-bad" : "text-ok"}`}>{m.qty > 0 ? "+" : ""}{m.qty}</span></li>)}</ul></div>
            )}
          </div>
        )}
      </Modal>

      <CategoryManager open={catMgr} onClose={() => setCatMgr(false)} kind={kind} names={catNames} items={mine} saveCategory={saveCategory} removeCategory={removeCategory} />

      {/* ---------- label sheet ---------- */}
      <Modal open={!!labels} onClose={() => setLabels(null)} title={t("barcode_labels")} footer={<><Button variant="secondary" onClick={() => setLabels(null)}>{t("cancel")}</Button><Button onClick={printLabels}>{t("preview_print")}</Button></>}>
        {labels && (
          <div className="space-y-2">
            <p className="text-sm text-muted">{t("labels_hint")}</p>
            {labels.map((l, idx) => (
              <div key={l.item.id} className="grid grid-cols-[1fr_80px] items-center gap-3 text-sm"><span className="truncate">{l.item.name} <span className="num text-xs text-muted">{l.item.barcode || l.item.sku || "—"}</span></span>
                <Input type="number" min="1" max="48" value={l.copies} onChange={(e) => setLabels(labels.map((x, k) => (k === idx ? { ...x, copies: Math.max(1, Math.min(48, Number(e.target.value) || 1)) } : x)))} className="num" /></div>
            ))}
          </div>
        )}
      </Modal>
      <Confirm open={!!del} message={del && del.length > 1 ? t("confirm_delete_many", { n: del.length }) : t("confirm_delete", { name: del?.[0]?.name || "" })} onNo={() => setDel(null)} onYes={async () => { for (const i of del || []) await removeItem(i.id); setDel(null); setSel(new Set()); }} />
    </div>
  );
}

function CategoryManager({ open, onClose, kind, names, items, saveCategory, removeCategory }: { open: boolean; onClose: () => void; kind: Kind; names: string[]; items: Item[]; saveCategory: (k: Kind, n: string, o?: string) => Promise<void>; removeCategory: (k: Kind, n: string) => Promise<void> }) {
  const t = useT();
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null);
  const [del, setDel] = useState<string | null>(null);
  return (
    <Modal open={open} onClose={onClose} title={t("categories")} footer={<Button variant="secondary" onClick={onClose}>{t("close")}</Button>}>
      <form className="mb-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (name.trim()) { await saveCategory(kind, name); setName(""); } }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("new_category")} autoFocus /><Button type="submit"><Plus size={15} />{t("add")}</Button>
      </form>
      {names.length === 0 ? <p className="text-sm text-muted">{t("no_data")}</p> : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {names.map((n) => (
            <li key={n} className="flex items-center gap-2 px-3 py-2 text-sm">
              {renaming?.from === n ? (
                <form className="flex flex-1 gap-2" onSubmit={async (e) => { e.preventDefault(); await saveCategory(kind, renaming.to, n); setRenaming(null); }}>
                  <Input value={renaming.to} onChange={(e) => setRenaming({ from: n, to: e.target.value })} autoFocus className="h-8" /><Button size="sm" type="submit">{t("save")}</Button>
                </form>
              ) : <><span className="flex-1 font-medium">{n}</span><Badge tone="muted">{items.filter((i) => i.category === n).length}</Badge>
                <button onClick={() => setRenaming({ from: n, to: n })} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")}><Pencil size={14} /></button>
                <button onClick={() => setDel(n)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={14} /></button></>}
            </li>
          ))}
        </ul>
      )}
      <Confirm open={!!del} message={t("confirm_delete_category", { name: del || "" })} onNo={() => setDel(null)} onYes={async () => { if (del) await removeCategory(kind, del); setDel(null); }} />
    </Modal>
  );
}
