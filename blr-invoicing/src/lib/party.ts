import { round } from "./calc";
import type { Doc, Party, Payment } from "./types";

/** What the party owes (clients) / what we owe them (suppliers). */
export function partyBalance(kind: "clients" | "suppliers", p: Party, docs: Doc[], payments: Payment[]) {
  let bal = p.openingBalance || 0;
  for (const d of docs) {
    if (d.partyId !== p.id || d.status === "draft" || d.status === "void") continue;
    if (kind === "clients") bal += d.type === "invoice" ? d.total : d.type === "credit" ? -d.total : 0;
    else bal += d.type === "purchase" ? d.total : 0;
  }
  for (const pay of payments) if (pay.partyId === p.id && pay.kind === (kind === "clients" ? "in" : "out")) bal -= pay.amount;
  return round(bal);
}
