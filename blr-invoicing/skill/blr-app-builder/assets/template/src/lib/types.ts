export type Role = "admin" | "manager" | "cashier" | "accountant";
export interface User { id: string; name: string; username: string; role: Role; active?: boolean; hasRecovery?: boolean }

/** Every stored record has id + createdAt/updatedAt (set by electron/db.js). Add your own interfaces here. */
export interface Item {
  id: string; name: string; category?: string; price: number; qty: number; taxRate: number; notes?: string; active?: boolean;
  createdAt?: number; updatedAt?: number;
}

/** A line of a document (invoice, quote...). See lib/calc.ts computeTotals. */
export interface Line { id: string; desc: string; qty: number; price: number; discountPct: number; taxRate: number }

export interface Settings {
  id: "main"; // singleton record: kind "settings", id "main"
  company: { name: string; address?: string; phone?: string; email?: string };
  currency: { code: string; symbol: string; position: "before" | "after"; decimals: number };
  defaultTax: number;
  autoLockMin: number;
}
