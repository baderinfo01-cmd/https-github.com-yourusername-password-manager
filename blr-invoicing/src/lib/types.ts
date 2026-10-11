export type Role = "admin" | "manager" | "cashier" | "accountant";
export interface User { id: string; name: string; username: string; role: Role; active?: boolean; hasRecovery?: boolean }

export interface Party {
  id: string; name: string; company?: string; phone?: string; email?: string; address?: string; city?: string;
  taxId?: string; rc?: string; ai?: string; nis?: string; notes?: string; openingBalance?: number;
  creditLimit?: number; createdAt?: number;
}
export interface Item {
  id: string; name: string; sku?: string; barcode?: string; category?: string; unit?: string; type: "product" | "service";
  cost: number; price: number; taxRate: number; trackStock: boolean; stock: number; minStock: number; notes?: string; image?: string;
}
export type DocType = "invoice" | "quote" | "proforma" | "delivery" | "credit" | "purchase" | "order";
export type DocStatus = "draft" | "sent" | "accepted" | "rejected" | "void" | "issued";
export interface Line { id: string; itemId?: string; desc: string; qty: number; unit?: string; price: number; discountPct: number; taxRate: number }
export interface Doc {
  id: string; type: DocType; number: string; date: string; dueDate?: string; partyId?: string; partyName: string;
  lines: Line[]; discount: number; discountType: "amount" | "percent"; shipping: number; stamp: number; paymentMethod?: string;
  notes?: string; terms?: string; status: DocStatus; refId?: string; refNumber?: string;
  subject?: string; poRef?: string; validUntil?: string; extraTaxes?: { id: string; name: string; rate: number }[]; extraTax?: number;
  subtotal: number; discountAmount: number; tax: number; total: number; stockApplied?: Record<string, number>;
  createdBy?: string; createdAt?: number; updatedAt?: number;
}
export interface Payment { id: string; number?: string; docId?: string; partyId?: string; kind: "in" | "out"; amount: number; date: string; method: string; ref?: string; note?: string }
export interface Task { id: string; title: string; due?: string; done: boolean; priority: "low" | "normal" | "high"; note?: string; doneAt?: number }
export interface Expense { id: string; date: string; category: string; description: string; amount: number; tax: number; supplierId?: string; method: string; ref?: string; attachment?: string }
export interface StockMove { id: string; itemId: string; qty: number; reason: string; docId?: string; date: string; note?: string }
export interface Recurring {
  id: string; name: string; partyId: string; lines: Line[]; every: "week" | "month" | "quarter" | "year"; nextDate: string; endDate?: string;
  active: boolean; discount: number; discountType: "amount" | "percent"; notes?: string; terms?: string; dueDays: number; lastNumber?: string;
}
export interface TaxRate { id: string; name: string; rate: number }
export interface Settings {
  id: "main";
  company: { name: string; legalName?: string; address?: string; phone?: string; email?: string; website?: string; taxId?: string; rc?: string; ai?: string; nis?: string; bank?: string; logo?: string; signature?: string; stamp?: string };
  currency: { code: string; symbol: string; position: "before" | "after"; decimals: number };
  taxes: TaxRate[]; defaultTax: number; pricesIncludeTax: boolean;
  stampDuty: boolean; // Algerian droit de timbre on cash payments
  numbering: Record<DocType, { prefix: string; pad: number; yearly: boolean }>;
  dueDays: number; footer: string; terms: string;
  template: "classic" | "modern" | "minimal"; accent: string; showQr: boolean;
  lowStockAlert: boolean; autoLockMin: number; printOnSave: boolean;
}
