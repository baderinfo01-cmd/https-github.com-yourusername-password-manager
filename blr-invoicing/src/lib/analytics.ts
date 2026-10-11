import { num, round } from "./calc";
import type { Doc, Expense, Item, Payment } from "./types";

export const inRange = (d: string, from?: string, to?: string) => (!from || d >= from) && (!to || d <= to);
const live = (d: Doc) => d.status !== "draft" && d.status !== "void";

/** net sales (before tax) of an invoice/credit, signed: credit notes subtract */
export const netOf = (d: Doc) => (d.type === "credit" ? -1 : 1) * (d.subtotal - d.discountAmount);
export const taxOf = (d: Doc) => (d.type === "credit" ? -1 : 1) * d.tax;

export function cogs(d: Doc, items: Item[]) {
  const sign = d.type === "credit" ? -1 : 1;
  let c = 0;
  for (const l of d.lines) {
    const it = items.find((i) => i.id === l.itemId);
    if (it && it.type === "product") c += num(l.qty) * it.cost;
  }
  return sign * c;
}

export interface Summary {
  sales: number; salesGross: number; taxCollected: number; purchases: number; taxDeductible: number; expenses: number; cost: number;
  grossProfit: number; netProfit: number; collected: number; paidOut: number; invoices: number;
}
export function summarize(docs: Doc[], expenses: Expense[], payments: Payment[], items: Item[], from?: string, to?: string): Summary {
  let sales = 0, salesGross = 0, taxCollected = 0, purchases = 0, taxDeductible = 0, cost = 0, invoices = 0;
  for (const d of docs) {
    if (!live(d) || !inRange(d.date, from, to)) continue;
    if (d.type === "invoice" || d.type === "credit") {
      sales += netOf(d);
      salesGross += (d.type === "credit" ? -1 : 1) * d.total;
      taxCollected += taxOf(d);
      cost += cogs(d, items);
      if (d.type === "invoice") invoices++;
    } else if (d.type === "purchase") {
      purchases += d.subtotal - d.discountAmount;
      taxDeductible += d.tax;
    }
  }
  const exp = expenses.filter((e) => inRange(e.date, from, to));
  const expenseTotal = exp.reduce((a, e) => a + e.amount, 0);
  for (const e of exp) taxDeductible += e.tax || 0;
  const collected = payments.filter((p) => p.kind === "in" && inRange(p.date, from, to)).reduce((a, p) => a + p.amount, 0);
  const paidOut = payments.filter((p) => p.kind === "out" && inRange(p.date, from, to)).reduce((a, p) => a + p.amount, 0);
  const grossProfit = sales - cost;
  return {
    sales: round(sales), salesGross: round(salesGross), taxCollected: round(taxCollected), purchases: round(purchases),
    taxDeductible: round(taxDeductible), expenses: round(expenseTotal), cost: round(cost), grossProfit: round(grossProfit),
    netProfit: round(grossProfit - expenseTotal), collected: round(collected), paidOut: round(paidOut), invoices,
  };
}

export const monthKey = (iso: string) => iso.slice(0, 7);
export function lastMonths(n: number, today = new Date()) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
