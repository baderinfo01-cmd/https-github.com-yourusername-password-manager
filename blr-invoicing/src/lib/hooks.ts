"use client";
import { useMemo } from "react";
import { balances, formatNumber, paymentStatus, todayIso } from "./calc";
import { useT } from "./i18n";
import type { Doc, DocType } from "./types";
import { useData } from "@/store/data";

export function useMoney() {
  const s = useData((x) => x.settings);
  return (n: number, symbol = true) => formatNumber(n, s, symbol);
}

export const TYPE_KEY: Record<DocType, string> = {
  invoice: "t_invoice", quote: "t_quote", proforma: "t_proforma", delivery: "t_delivery", credit: "t_credit", purchase: "t_purchase", order: "t_order",
};
export const TYPE_LIST_KEY: Record<DocType, string> = {
  invoice: "invoices", quote: "quotes", proforma: "proformas", delivery: "deliveries", credit: "credits", purchase: "purchases", order: "orders",
};

/** Every document with its paid amount, credits applied, amount due and payment status. */
export function useDocRows() {
  const docs = useData((s) => s.docs);
  const payments = useData((s) => s.payments);
  return useMemo(() => {
    const { paidBy, creditBy } = balances(docs, payments);
    const today = todayIso();
    return docs.map((d) => {
      const paid = paidBy.get(d.id) || 0;
      const credits = creditBy.get(d.id) || 0;
      const due = d.total - paid - credits;
      const pay = d.type === "invoice" || d.type === "purchase" ? (d.status === "void" ? ("void" as const) : d.status === "draft" ? ("draft" as const) : paymentStatus(d, paid, credits, today)) : null;
      return { doc: d, paid, credits, due: Math.max(0, Math.round(due * 100) / 100), pay };
    });
  }, [docs, payments]);
}
export type DocRow = ReturnType<typeof useDocRows>[number];

export function usePayLabel() {
  const t = useT();
  return (p: string | null) => (p ? t("pay_" + p) : "");
}
export const PAY_TONE: Record<string, "ok" | "warn" | "bad" | "info" | "muted"> = { paid: "ok", partial: "warn", unpaid: "info", overdue: "bad", void: "muted", draft: "muted" };

export function partyOf(d: Doc) {
  return d.partyName || "—";
}

export function downloadCsv(rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(";")).join("\r\n");
}
