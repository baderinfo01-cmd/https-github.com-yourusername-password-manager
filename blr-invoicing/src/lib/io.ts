"use client";
import * as XLSX from "xlsx";
import { blr, call } from "./api";

/** Save rows as an .xlsx file chosen by the user. */
export async function exportXlsx(fileName: string, sheet: string, rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = rows[0]?.map((_, i) => ({ wch: Math.min(40, Math.max(10, ...rows.map((r) => String(r[i] ?? "").length + 2))) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 30));
  const b64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  return call<{ saved: boolean }>(blr().file.saveBytes(fileName.endsWith(".xlsx") ? fileName : fileName + ".xlsx", b64));
}

/** Pick a .csv/.xlsx file and return its rows as objects keyed by (lower-cased) header. */
export async function pickTable(): Promise<Record<string, string>[] | null> {
  const f = await call<{ name: string; base64: string } | null>(blr().file.openText(["csv", "xlsx", "xls"]));
  if (!f) return null;
  const wb = XLSX.read(f.base64, { type: "base64", codepage: 65001 });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return raw.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim().toLowerCase(), String(v).trim()])));
}

const ALIASES: Record<string, string[]> = {
  name: ["name", "nom", "اسم", "الاسم", "client", "designation", "désignation", "produit", "product", "الصنف", "المنتج"],
  company: ["company", "société", "societe", "الشركة"],
  phone: ["phone", "tel", "téléphone", "telephone", "mobile", "الهاتف", "هاتف"],
  email: ["email", "e-mail", "mail", "البريد"],
  address: ["address", "adresse", "العنوان"],
  city: ["city", "ville", "المدينة"],
  taxId: ["nif", "taxid", "tax id", "الرقم الجبائي"],
  rc: ["rc", "registre", "السجل التجاري"],
  sku: ["sku", "ref", "référence", "reference", "code", "الرمز", "المرجع"],
  barcode: ["barcode", "code-barres", "codebarre", "الباركود"],
  category: ["category", "catégorie", "categorie", "الفئة", "التصنيف"],
  unit: ["unit", "unité", "unite", "الوحدة"],
  cost: ["cost", "coût", "cout", "prix d'achat", "purchase price", "سعر الشراء", "التكلفة"],
  price: ["price", "prix", "prix de vente", "sale price", "سعر البيع", "السعر"],
  stock: ["stock", "qty", "quantity", "quantité", "quantite", "الكمية", "المخزون"],
  minStock: ["min", "min stock", "stock min", "الحد الأدنى"],
  taxRate: ["tva", "tax", "taxe", "vat", "الضريبة"],
};
/** read a field by any of its known header names */
export function pick(row: Record<string, string>, field: string): string {
  for (const a of ALIASES[field] || [field]) if (row[a.toLowerCase()] !== undefined && row[a.toLowerCase()] !== "") return row[a.toLowerCase()];
  return "";
}
