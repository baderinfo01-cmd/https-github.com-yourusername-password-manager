import { computeTotals, formatNumber, num } from "./calc";
import { tr } from "./i18n";
import type { Item, Settings } from "./types";
import type { Lang } from "@/store/ui";

/** HTML-escape EVERYTHING that comes from user data before putting it in a print document. */
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Print documents are plain, self-contained HTML strings (no scripts, no external files):
 *  - rendered inside a sandboxed iframe for the preview and inside a hidden script-less window for print/PDF
 *  - <html dir="rtl"> for Arabic, the page size comes from @page (A4 or 80mm thermal)
 *  - amounts go through formatNumber (LRI/PDI isolates) and get class "n" (direction:ltr, tabular numbers)
 *  - the caller wraps the result with withFont() so El Messiri is embedded
 */
export function buildItemsReport(items: Item[], o: { lang: Lang; settings: Settings; paper?: "a4" | "thermal" }): string {
  const { lang, settings: s } = o;
  const t = (k: string, v?: Record<string, string | number>) => tr(lang, k, v);
  const money = (n: number) => formatNumber(n, s);
  const thermal = o.paper === "thermal";
  const lines = items.map((i) => ({ id: i.id, desc: i.name, qty: i.qty, price: i.price, discountPct: 0, taxRate: i.taxRate }));
  const totals = computeTotals(lines);
  const rows = items.map((i, n) => `<tr><td class="c">${n + 1}</td><td>${esc(i.name)}</td><td class="n">${num(i.qty)}</td><td class="n">${money(num(i.price))}</td><td class="n b">${money(num(i.qty) * num(i.price))}</td></tr>`).join("");
  return `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${esc(t("report_title"))}</title>
<style>
@page{size:${thermal ? "80mm auto" : "A4"};margin:${thermal ? "4mm" : "14mm"}}
*{box-sizing:border-box}
body{margin:0;font-family:"El Messiri","Segoe UI",Tahoma,Arial,sans-serif;font-size:${thermal ? 11 : 13}px;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1{font-size:${thermal ? 15 : 22}px;margin:0 0 4px;color:#0a9f63}
.muted{color:#64748b}
table{width:100%;border-collapse:collapse;margin-top:14px}
th{background:#f1f5f9;text-align:start;padding:7px 8px;font-weight:600;border-bottom:2px solid #0a9f63}
td{padding:6px 8px;border-bottom:1px solid #e2e8f0}
.n{text-align:end;direction:ltr;unicode-bidi:plaintext;font-variant-numeric:tabular-nums;white-space:nowrap}
.c{text-align:center;width:30px}.b{font-weight:700}
.tot{margin-top:14px;margin-inline-start:auto;width:${thermal ? "100%" : "260px"}}
.tot div{display:flex;justify-content:space-between;padding:4px 0}
.tot .g{border-top:2px solid #0f172a;font-weight:700;font-size:1.1em}
</style></head><body>
<h1>${esc(s.company.name || "")}</h1><div class="muted">${esc(t("report_title"))} · ${new Date().toLocaleDateString(lang === "ar" ? "ar-DZ-u-nu-latn" : lang)}</div>
<table><thead><tr><th class="c">#</th><th>${t("name")}</th><th class="n">${t("qty")}</th><th class="n">${t("price")}</th><th class="n">${t("amount")}</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot"><div><span>${t("subtotal")}</span><span class="n">${money(totals.subtotal)}</span></div><div><span>${t("tax")}</span><span class="n">${money(totals.tax)}</span></div><div class="g"><span>${t("total")}</span><span class="n">${money(totals.total)}</span></div></div>
</body></html>`;
}
