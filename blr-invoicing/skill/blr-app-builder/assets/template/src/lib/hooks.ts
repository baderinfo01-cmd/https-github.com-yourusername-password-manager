"use client";
import { formatNumber } from "./calc";
import { useData } from "@/store/data";

/** money(1234.5) -> "⁦1 234.50 DA⁩" using the company currency settings (LRI/PDI isolated). */
export function useMoney() {
  const s = useData((x) => x.settings);
  return (n: number, symbol = true) => formatNumber(n, s, symbol);
}

/** Rows -> CSV text (";" separated, quoted when needed). Save with api().file.saveText (adds a UTF-8 BOM for Excel). */
export function toCsv(rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(";")).join("\r\n");
}
