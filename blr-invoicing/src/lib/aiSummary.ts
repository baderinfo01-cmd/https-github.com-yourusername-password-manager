import { inRange, summarize, lastMonths } from "./analytics";
import { balances, round, todayIso } from "./calc";
import type { Doc, Expense, Item, Party, Payment } from "./types";

/** Privacy-safe digest of the business that is sent to the assistant (no passwords, no contact details). */
export function buildSummary(d: { docs: Doc[]; expenses: Expense[]; payments: Payment[]; items: Item[]; clients: Party[]; suppliers: Party[]; currency: string }) {
  const today = todayIso();
  const { paidBy, creditBy } = balances(d.docs, d.payments);
  const live = d.docs.filter((x) => x.status !== "draft" && x.status !== "void");
  const open = live.filter((x) => x.type === "invoice").map((x) => ({ n: x.number, client: x.partyName, due: x.dueDate, total: x.total, remaining: round(x.total - (paidBy.get(x.id) || 0) - (creditBy.get(x.id) || 0)) })).filter((x) => x.remaining > 0.005);
  const owedToSuppliers = live.filter((x) => x.type === "purchase").map((x) => ({ n: x.number, supplier: x.partyName, remaining: round(x.total - (paidBy.get(x.id) || 0)) })).filter((x) => x.remaining > 0.005);
  const months = lastMonths(12).map((m) => ({ month: m, ...summarize(d.docs, d.expenses, d.payments, d.items, m + "-01", m + "-31") }));
  const byClient = new Map<string, number>();
  const byProduct = new Map<string, { qty: number; revenue: number }>();
  for (const x of live) {
    if (x.type !== "invoice" || !inRange(x.date, today.slice(0, 4) + "-01-01", today)) continue;
    byClient.set(x.partyName || "walk-in", (byClient.get(x.partyName || "walk-in") || 0) + x.total);
    for (const l of x.lines) { const r = byProduct.get(l.desc) || { qty: 0, revenue: 0 }; r.qty += l.qty; r.revenue += l.qty * l.price * (1 - l.discountPct / 100); byProduct.set(l.desc, r); }
  }
  const expByCat = new Map<string, number>();
  for (const e of d.expenses) if (inRange(e.date, today.slice(0, 4) + "-01-01", today)) expByCat.set(e.category, (expByCat.get(e.category) || 0) + e.amount);
  return {
    today, currency: d.currency, counts: { clients: d.clients.length, suppliers: d.suppliers.length, products: d.items.length, invoices: live.filter((x) => x.type === "invoice").length },
    thisYear: summarize(d.docs, d.expenses, d.payments, d.items, today.slice(0, 4) + "-01-01", today),
    monthly: months,
    unpaidInvoices: open.sort((a, b) => b.remaining - a.remaining).slice(0, 40),
    overdueCount: open.filter((x) => x.due && x.due < today).length,
    owedToSuppliers: owedToSuppliers.slice(0, 20),
    topClientsThisYear: [...byClient.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, total]) => ({ name, total: round(total) })),
    topProductsThisYear: [...byProduct.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 20).map(([name, r]) => ({ name, qty: round(r.qty, 2), revenue: round(r.revenue) })),
    lowStock: d.items.filter((i) => i.trackStock && i.stock <= i.minStock).slice(0, 30).map((i) => ({ name: i.name, stock: i.stock, min: i.minStock })),
    expensesByCategoryThisYear: [...expByCat.entries()].map(([category, amount]) => ({ category, amount: round(amount) })),
  };
}
