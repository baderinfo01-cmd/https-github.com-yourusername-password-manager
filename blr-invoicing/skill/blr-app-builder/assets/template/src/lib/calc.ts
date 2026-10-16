import type { Line, Settings } from "./types";

// ---- numbers ----
export const round = (n: number, d = 2) => {
  const f = 10 ** d;
  return Math.round((n + Number.EPSILON) * f) / f;
};
/** Forgiving number parser: "12,5" -> 12.5, junk -> 0. Always use it on user input. */
export const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Money formatting. Digits are always Latin (en-US) with a space as thousands separator. When the symbol is
 * included the whole amount is wrapped in a left-to-right isolate (LRI U+2066 ... PDI U+2069) so that, inside an
 * Arabic (RTL) sentence, "1 200,00 DA" is never reordered. Do NOT strip those characters.
 */
export function formatNumber(n: number, s: Pick<Settings, "currency">, withSymbol = true) {
  const dec = s.currency.decimals;
  const body = new Intl.NumberFormat("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(round(n, dec)).replace(/,/g, " ");
  if (!withSymbol) return body;
  const txt = s.currency.position === "before" ? `${s.currency.symbol} ${body}` : `${body} ${s.currency.symbol}`;
  return `⁦${txt}⁩`;
}

// ---- dates (always local-time ISO yyyy-mm-dd strings; never toISOString(), it shifts the day by timezone) ----
export const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayIso = () => toIso(new Date());
export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toIso(d);
};
export function addPeriod(iso: string, every: "week" | "month" | "quarter" | "year") {
  const d = new Date(iso + "T00:00:00");
  if (every === "week") d.setDate(d.getDate() + 7);
  else if (every === "month") d.setMonth(d.getMonth() + 1);
  else if (every === "quarter") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return toIso(d);
}

// ---- document totals (same rules as BLR Fatourati; see references/data-model.md) ----
export const lineNet = (l: Line) => round(num(l.qty) * num(l.price) * (1 - num(l.discountPct) / 100), 4);

export interface Totals { subtotal: number; discountAmount: number; tax: number; total: number; taxByRate: Record<string, number> }

/**
 * Order of operations: line net (qty*price - line discount) -> subtotal -> document discount (amount or percent,
 * spread proportionally over the lines so each tax rate stays correct) -> tax per line on the discounted net ->
 * + shipping. With pricesIncludeTax the tax is EXTRACTED from the price instead of added.
 * Everything is rounded to 2 decimals only at the end (never round per line, totals would drift).
 */
export function computeTotals(lines: Line[], discount = 0, discountType: "amount" | "percent" = "amount", shipping = 0, pricesIncludeTax = false): Totals {
  const nets = lines.map((l) => {
    const gross = lineNet(l);
    return pricesIncludeTax ? gross / (1 + num(l.taxRate) / 100) : gross;
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
  const total = subtotal - discountAmount + tax + num(shipping);
  return {
    subtotal: round(subtotal), discountAmount: round(discountAmount), tax: round(tax), total: round(total),
    taxByRate: Object.fromEntries(Object.entries(taxByRate).map(([k, v]) => [k, round(v)])),
  };
}

/** paid / partial / unpaid / overdue from the amounts (tolerance 0.005 for rounding). */
export function paymentStatus(total: number, dueDate: string | undefined, paid: number, credits: number, today: string): "paid" | "partial" | "unpaid" | "overdue" {
  const due = round(total - paid - credits);
  if (total > 0 && due <= 0.005) return "paid";
  if (dueDate && dueDate < today && due > 0.005) return "overdue";
  return paid + credits > 0.005 ? "partial" : "unpaid";
}
