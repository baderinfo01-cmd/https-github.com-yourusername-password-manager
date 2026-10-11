import type { Doc, DocType, Line, Payment, Settings } from "./types";

export const round = (n: number, d = 2) => {
  const f = 10 ** d;
  return Math.round((n + Number.EPSILON) * f) / f;
};
export const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const lineNet = (l: Line) => round(num(l.qty) * num(l.price) * (1 - num(l.discountPct) / 100), 4);

/** Algerian "droit de timbre" on cash payments: 1% up to 300 000, 1.5% up to 3 000 000, 2% above; min 5, max 2 500. */
export function stampDuty(total: number): number {
  if (total <= 0) return 0;
  const rate = total <= 300000 ? 0.01 : total <= 3000000 ? 0.015 : 0.02;
  const raw = total * rate;
  return Math.min(2500, Math.max(5, Math.ceil(raw)));
}

export interface Totals { subtotal: number; discountAmount: number; tax: number; total: number; taxByRate: Record<string, number> }

export function computeTotals(
  lines: Line[],
  discount: number,
  discountType: "amount" | "percent",
  shipping: number,
  stamp: number,
  pricesIncludeTax = false
): Totals {
  // when prices include tax, extract the tax instead of adding it
  const nets = lines.map((l) => {
    const gross = lineNet(l);
    const r = num(l.taxRate) / 100;
    return pricesIncludeTax ? gross / (1 + r) : gross;
  });
  const subtotal = nets.reduce((a, b) => a + b, 0);
  const discountAmount = discountType === "percent" ? subtotal * (num(discount) / 100) : Math.min(num(discount), subtotal);
  const ratio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;
  const taxByRate: Record<string, number> = {};
  let tax = 0;
  lines.forEach((l, i) => {
    const t = nets[i] * ratio * (num(l.taxRate) / 100);
    tax += t;
    const k = String(num(l.taxRate));
    taxByRate[k] = (taxByRate[k] || 0) + t;
  });
  const total = subtotal - discountAmount + tax + num(shipping) + num(stamp);
  return {
    subtotal: round(subtotal), discountAmount: round(discountAmount), tax: round(tax), total: round(total),
    taxByRate: Object.fromEntries(Object.entries(taxByRate).map(([k, v]) => [k, round(v)])),
  };
}

export const isSales = (t: DocType) => t === "invoice" || t === "credit";
export const hasBalance = (t: DocType) => t === "invoice" || t === "purchase";
export const affectsStock = (t: DocType) => t === "invoice" || t === "delivery" || t === "credit" || t === "purchase";
/** +1 stock in, -1 stock out */
export const stockSign = (t: DocType): 1 | -1 | 0 => (t === "credit" || t === "purchase" ? 1 : t === "invoice" || t === "delivery" ? -1 : 0);

export function paymentStatus(doc: Doc, paid: number, credits: number, today: string): "paid" | "partial" | "unpaid" | "overdue" {
  const due = round(doc.total - paid - credits);
  if (doc.total > 0 && due <= 0.005) return "paid";
  if (doc.dueDate && doc.dueDate < today && due > 0.005) return "overdue";
  return paid + credits > 0.005 ? "partial" : "unpaid";
}

export function balances(docs: Doc[], payments: Payment[]) {
  const paidBy = new Map<string, number>();
  for (const p of payments) if (p.docId) paidBy.set(p.docId, (paidBy.get(p.docId) || 0) + p.amount);
  const creditBy = new Map<string, number>();
  for (const d of docs) if (d.type === "credit" && d.refId && d.status !== "void") creditBy.set(d.refId, (creditBy.get(d.refId) || 0) + d.total);
  return { paidBy, creditBy };
}

export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toIso(d);
};
export const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayIso = () => toIso(new Date());
export function addPeriod(iso: string, every: "week" | "month" | "quarter" | "year") {
  const d = new Date(iso + "T00:00:00");
  if (every === "week") d.setDate(d.getDate() + 7);
  else if (every === "month") d.setMonth(d.getMonth() + 1);
  else if (every === "quarter") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return toIso(d);
}

export function formatNumber(n: number, s: Settings, withSymbol = true) {
  const dec = s.currency.decimals;
  const body = new Intl.NumberFormat("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(round(n, dec)).replace(/,/g, " ");
  if (!withSymbol) return body;
  return s.currency.position === "before" ? `${s.currency.symbol} ${body}` : `${body} ${s.currency.symbol}`;
}
