"use client";
import { ArrowDownUp, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Stat, Table, Td } from "@/components/ui";
import { num } from "@/lib/calc";
import { useMoney } from "@/lib/hooks";
import { fmtDate, useT } from "@/lib/i18n";
import { exportXlsx } from "@/lib/io";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

export default function Stock() {
  const t = useT();
  const money = useMoney();
  const lang = useUi((s) => s.lang);
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const { items, moves, adjustStock } = useData();
  const [tab, setTab] = useState<"levels" | "moves">("levels");
  const [adj, setAdj] = useState<{ itemId: string; qty: string; reason: string; note: string } | null>(null);
  const tracked = items.filter((i) => i.trackStock);
  const value = tracked.reduce((a, i) => a + Math.max(0, i.stock) * i.cost, 0);
  const saleValue = tracked.reduce((a, i) => a + Math.max(0, i.stock) * i.price, 0);
  const low = tracked.filter((i) => i.stock <= i.minStock);
  const recent = useMemo(() => [...moves].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)).slice(0, 300), [moves]);
  const writable = can(role, "stock");

  const apply = async () => {
    if (!adj || !adj.itemId || !num(adj.qty)) return notify(t("amount_required"), "err");
    await adjustStock(adj.itemId, num(adj.qty), adj.reason, adj.note);
    setAdj(null);
    notify(t("saved"));
  };
  const reasonLabel = (r: string) => (["invoice", "quote", "proforma", "delivery", "credit", "purchase", "order"].includes(r) ? t("t_" + r) : t("r_" + r));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("stock")} actions={<>
        <Button variant="secondary" size="sm" onClick={() => exportXlsx("inventory", t("stock"), [[t("name"), "SKU", t("stock"), t("cost"), t("stock_value")], ...tracked.map((i) => [i.name, i.sku || "", i.stock, i.cost, i.stock * i.cost])])}><Download size={14} />{t("export")}</Button>
        {writable && <Button onClick={() => setAdj({ itemId: tracked[0]?.id || "", qty: "", reason: "adjust", note: "" })}><ArrowDownUp size={16} />{t("adjust_stock")}</Button>}
      </>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label={t("stock_value")} value={money(value)} tone="info" />
        <Stat label={t("stock_sale_value")} value={money(saleValue)} tone="ok" />
        <Stat label={t("low_stock")} value={low.length} tone={low.length ? "warn" : "ok"} />
      </div>
      <div className="mb-3 flex gap-2">
        {(["levels", "moves"] as const).map((k) => <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-1.5 text-sm ${tab === k ? "bg-accent text-white" : "bg-surface text-muted border border-line"}`}>{t(k === "levels" ? "stock_levels" : "stock_moves")}</button>)}
      </div>
      <Card pad={false}>
        {tab === "levels" ? (tracked.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={[t("name"), "SKU", t("stock"), t("min_stock"), t("cost"), t("stock_value")]}>
            {tracked.sort((a, b) => a.name.localeCompare(b.name)).map((i) => (
              <tr key={i.id}><Td className="font-medium">{i.name}</Td><Td className="num">{i.sku}</Td><Td><Badge tone={i.stock <= 0 ? "bad" : i.stock <= i.minStock ? "warn" : "ok"}>{i.stock} {i.unit}</Badge></Td><Td className="num">{i.minStock}</Td><Td className="num">{money(i.cost)}</Td><Td className="num font-semibold">{money(Math.max(0, i.stock) * i.cost)}</Td></tr>
            ))}
          </Table>
        )) : recent.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={[t("date"), t("name"), t("reason"), t("qty"), t("reference")]}>
            {recent.map((m) => (
              <tr key={m.id}><Td className="num">{fmtDate(m.date, lang)}</Td><Td>{items.find((i) => i.id === m.itemId)?.name || "—"}</Td><Td>{reasonLabel(m.reason)}</Td><Td className={`num font-semibold ${m.qty < 0 ? "text-bad" : "text-ok"}`}>{m.qty > 0 ? "+" : ""}{m.qty}</Td><Td>{m.note}</Td></tr>
            ))}
          </Table>
        )}
      </Card>
      <Modal open={!!adj} onClose={() => setAdj(null)} title={t("adjust_stock")} footer={<><Button variant="secondary" onClick={() => setAdj(null)}>{t("cancel")}</Button><Button onClick={apply}>{t("save")}</Button></>}>
        {adj && (
          <div className="grid gap-4">
            <Field label={t("product")}><Select value={adj.itemId} onChange={(e) => setAdj({ ...adj, itemId: e.target.value })}>{tracked.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.stock})</option>)}</Select></Field>
            <Field label={t("qty_change")} hint={t("qty_change_hint")}><Input type="number" step="any" value={adj.qty} onChange={(e) => setAdj({ ...adj, qty: e.target.value })} /></Field>
            <Field label={t("reason")}><Select value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })}>{["adjust", "damaged", "count", "return", "gift"].map((r) => <option key={r} value={r}>{t("r_" + r)}</option>)}</Select></Field>
            <Field label={t("notes")}><Input value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
