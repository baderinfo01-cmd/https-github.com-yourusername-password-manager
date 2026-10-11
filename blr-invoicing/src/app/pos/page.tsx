"use client";
import { Minus, Plus, Printer, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Empty, Input, Select } from "@/components/ui";
import { blr, call } from "@/lib/api";
import { computeTotals, num, round, stampDuty, todayIso } from "@/lib/calc";
import { PAYMENT_METHODS } from "@/lib/defaults";
import { buildDocHtml } from "@/lib/invoiceHtml";
import { withFont } from "@/lib/fontEmbed";
import { useMoney } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import type { Doc, Item } from "@/lib/types";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

interface CartLine { item: Item; qty: number }

export default function Pos() {
  const t = useT();
  const money = useMoney();
  const lang = useUi((s) => s.lang);
  const role = useUi((s) => s.user?.role);
  const username = useUi((s) => s.user?.username);
  const notify = useUi((s) => s.notify);
  const { items, clients, settings, saveDoc, addPayment } = useData();
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientId, setClientId] = useState("");
  const [method, setMethod] = useState("cash");
  const [received, setReceived] = useState("");
  const [discount, setDiscount] = useState("");
  const [busy, setBusy] = useState(false);
  const [printAfter, setPrintAfter] = useState(true);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => { search.current?.focus(); }, []);

  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return items.filter((i) => i.active !== false).filter((i) => !k || [i.name, i.sku, i.barcode].some((v) => v?.toLowerCase().includes(k))).slice(0, 40);
  }, [items, q]);

  const add = (i: Item) => setCart((c) => (c.some((l) => l.item.id === i.id) ? c.map((l) => (l.item.id === i.id ? { ...l, qty: l.qty + 1 } : l)) : [...c, { item: i, qty: 1 }]));
  const onEnter = () => {
    const k = q.trim();
    if (!k) return;
    const exact = items.find((i) => i.barcode === k || i.sku === k) || (shown.length === 1 ? shown[0] : undefined);
    if (exact) { add(exact); setQ(""); }
  };

  const lines = cart.map((l) => ({ id: l.item.id, itemId: l.item.id, desc: l.item.name, qty: l.qty, unit: l.item.unit, price: l.item.price, discountPct: 0, taxRate: l.item.taxRate }));
  const base = computeTotals(lines, num(discount), "percent", 0, 0, settings.pricesIncludeTax);
  const stamp = settings.stampDuty && method === "cash" ? stampDuty(base.total) : 0;
  const total = round(base.total + stamp);
  const change = Math.max(0, num(received) - total);

  const checkout = async () => {
    if (!cart.length) return;
    setBusy(true);
    try {
      const client = clients.find((c) => c.id === clientId);
      const date = todayIso();
      const draft: Doc = {
        id: crypto.randomUUID(), type: "invoice", number: "", date, dueDate: date, partyId: clientId || undefined, partyName: client?.name || t("walk_in"),
        lines, discount: num(discount), discountType: "percent", shipping: 0, stamp, paymentMethod: method, status: "sent", createdBy: username,
        subtotal: 0, discountAmount: 0, tax: 0, total: 0,
      };
      const saved = await saveDoc(draft);
      await addPayment({ docId: saved.id, partyId: saved.partyId, kind: "in", amount: saved.total, date, method });
      if (printAfter) {
        const h = await withFont(await buildDocHtml(saved, { lang, settings, party: client, paid: saved.total, paper: "thermal" }));
        await call(blr().print.html(h, { paper: "thermal" }));
      }
      notify(`${t("sale_done")} ${saved.number}`);
      setCart([]); setReceived(""); setDiscount(""); setClientId("");
      search.current?.focus();
    } catch { notify(t("error"), "err"); } finally { setBusy(false); }
  };

  if (!can(role, "pos")) return <Empty text={t("no_permission")} />;
  return (
    <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_400px]">
      <div>
        <div className="relative mb-4">
          <Search size={16} className="pointer-events-none absolute start-3 top-3.5 text-muted" />
          <Input ref={search} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onEnter()} placeholder={t("scan_or_search")} className="h-12 ps-10 text-base" />
        </div>
        {items.length === 0 ? <Empty text={t("no_products_pos")} /> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {shown.map((i) => (
              <button key={i.id} onClick={() => add(i)} className="rounded-xl border border-line bg-surface p-3 text-start transition hover:border-accent hover:shadow-md active:scale-[.98]">
                <div className="line-clamp-2 min-h-10 text-sm font-medium">{i.name}</div>
                <div className="mt-2 flex items-center justify-between"><span className="num font-bold text-accent">{money(i.price)}</span>{i.trackStock && <span className={`num text-xs ${i.stock <= 0 ? "text-bad" : "text-muted"}`}>{i.stock}</span>}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <Card title={t("cart")} className="lg:sticky lg:top-0 lg:self-start" pad={false}>
        <div className="max-h-[38vh] overflow-y-auto">
          {cart.length === 0 ? <Empty text={t("cart_empty")} /> : (
            <ul className="divide-y divide-line">
              {cart.map((l) => (
                <li key={l.item.id} className="flex items-center gap-2 px-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{l.item.name}</div><div className="num text-xs text-muted">{money(l.item.price)}</div></div>
                  <div className="flex items-center gap-1">
                    <button className="grid h-7 w-7 place-items-center rounded-md border border-line" onClick={() => setCart((c) => c.map((x) => (x.item.id === l.item.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}><Minus size={13} /></button>
                    <input value={l.qty} onChange={(e) => setCart((c) => c.map((x) => (x.item.id === l.item.id ? { ...x, qty: Math.max(0, num(e.target.value)) || 1 } : x)))} className="num h-7 w-12 rounded-md border border-line bg-surface text-center" />
                    <button className="grid h-7 w-7 place-items-center rounded-md border border-line" onClick={() => add(l.item)}><Plus size={13} /></button>
                  </div>
                  <div className="num w-24 text-end font-semibold">{money(l.qty * l.item.price)}</div>
                  <button onClick={() => setCart((c) => c.filter((x) => x.item.id !== l.item.id))} className="text-bad"><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-3 border-t border-line p-4">
          <div className="grid grid-cols-2 gap-2">
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)}><option value="">{t("walk_in")}</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t("m_" + m)}</option>)}</Select>
            <Input type="number" min="0" max="100" placeholder={t("discount") + " %"} value={discount} onChange={(e) => setDiscount(e.target.value)} className="num" />
            <Input type="number" placeholder={t("received")} value={received} onChange={(e) => setReceived(e.target.value)} className="num" />
          </div>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted">{t("subtotal")}</dt><dd className="num">{money(base.subtotal - base.discountAmount)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{t("tax")}</dt><dd className="num">{money(base.tax)}</dd></div>
            {stamp > 0 && <div className="flex justify-between"><dt className="text-muted">{t("stamp_duty")}</dt><dd className="num">{money(stamp)}</dd></div>}
            <div className="flex justify-between border-t border-line pt-2 text-xl font-bold"><dt>{t("total")}</dt><dd className="num text-accent">{money(total)}</dd></div>
            {num(received) > 0 && <div className="flex justify-between text-ok"><dt>{t("change")}</dt><dd className="num font-semibold">{money(change)}</dd></div>}
          </dl>
          <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={printAfter} onChange={(e) => setPrintAfter(e.target.checked)} /><Printer size={13} />{t("print_receipt")}</label>
          <Button className="h-12 w-full text-base" disabled={!cart.length || busy} onClick={checkout}>{t("charge")} {money(total)}</Button>
        </div>
      </Card>
    </div>
  );
}
