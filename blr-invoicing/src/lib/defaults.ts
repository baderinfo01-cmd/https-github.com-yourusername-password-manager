import type { DocType, Settings } from "./types";

export const DOC_TYPES: DocType[] = ["invoice", "quote", "proforma", "delivery", "credit", "purchase", "order"];
export const SALES_TYPES: DocType[] = ["invoice", "quote", "proforma", "delivery", "credit"];
export const PURCHASE_TYPES: DocType[] = ["purchase", "order"];

export const DEFAULT_SETTINGS: Settings = {
  id: "main",
  company: { name: "" },
  currency: { code: "DZD", symbol: "DA", position: "after", decimals: 2 },
  taxes: [
    { id: "t0", name: "0%", rate: 0 },
    { id: "t9", name: "TVA 9%", rate: 9 },
    { id: "t19", name: "TVA 19%", rate: 19 },
  ],
  defaultTax: 19,
  pricesIncludeTax: false,
  stampDuty: false,
  numbering: {
    invoice: { prefix: "FA", pad: 5, yearly: true },
    quote: { prefix: "DV", pad: 5, yearly: true },
    proforma: { prefix: "PF", pad: 5, yearly: true },
    delivery: { prefix: "BL", pad: 5, yearly: true },
    credit: { prefix: "AV", pad: 5, yearly: true },
    purchase: { prefix: "AC", pad: 5, yearly: true },
    order: { prefix: "BC", pad: 5, yearly: true },
  },
  dueDays: 30,
  footer: "",
  terms: "",
  template: "modern",
  accent: "#0284c7",
  showQr: true,
  lowStockAlert: true,
  autoLockMin: 0,
  printOnSave: false,
};

export const PAYMENT_METHODS = ["cash", "bank", "cheque", "card", "transfer", "other"] as const;
export const UNITS = ["pcs", "kg", "g", "l", "m", "m2", "box", "hour", "day", "service"] as const;
export const EXPENSE_CATEGORIES = ["rent", "salaries", "utilities", "transport", "supplies", "marketing", "taxes", "maintenance", "other"] as const;
