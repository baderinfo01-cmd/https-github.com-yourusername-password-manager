import { code128Svg } from "./barcode";
import { formatNumber } from "./calc";
import type { Item, Settings } from "./types";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A4 sheet of product labels (3 x 8): name, price and a Code 128 barcode. */
export function buildLabelsHtml(items: { item: Item; copies: number }[], s: Settings, rtl: boolean): string {
  const cells: string[] = [];
  for (const { item, copies } of items) {
    const code = (item.barcode || item.sku || item.id.slice(0, 8)).slice(0, 24);
    for (let i = 0; i < copies; i++) {
      cells.push(`<div class="l"><div class="sh">${esc(s.company.name || "")}</div><div class="nm">${esc(item.name)}</div><div class="bc">${code128Svg(code, 34)}</div><div class="cd">${esc(code)}</div><div class="pr">${esc(formatNumber(item.price, s))}</div></div>`);
    }
  }
  return `<!doctype html><html dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>labels</title><style>
  *{box-sizing:border-box}html,body{margin:0}body{font-family:"El Messiri","Segoe UI",Tahoma,Arial,sans-serif;color:#000}
  .sheet{width:210mm;padding:8mm 6mm;display:grid;grid-template-columns:repeat(3,63mm);grid-auto-rows:34mm;gap:0 2mm;justify-content:center}
  .l{border:1px dashed #cbd5e1;padding:2mm 3mm;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;page-break-inside:avoid}
  .sh{font-size:7px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nm{font-size:10px;font-weight:700;line-height:1.15;max-height:2.4em;overflow:hidden}
  .bc{height:10mm}.bc svg{display:block}.cd{font-size:8px;text-align:center;letter-spacing:1px;direction:ltr}.pr{font-size:12px;font-weight:800;text-align:end;direction:ltr}
  @page{size:A4;margin:0}@media print{.l{border-color:transparent}}</style></head><body><div class="sheet">${cells.join("")}</div></body></html>`;
}
