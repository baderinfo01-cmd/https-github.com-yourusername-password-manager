import { printHtml } from "@/lib/print";
import { getOwner } from "@/lib/owner";
import { branding } from "@/config/branding";

export interface ReportColumn {
  key: string;
  label: string;
  /** css width, e.g. "14%" */
  width?: string;
  /** monospace / left-to-right cell (numbers, e-mails, urls) */
  ltr?: boolean;
}

export interface ReportLabels {
  owner: string;
  username: string;
  date: string;
  total: string;
  confidential: string;
  footer: string;
  empty: string;
  page: string;
}

export interface ReportOptions {
  title: string;
  locale: string;
  columns: ReportColumn[];
  rows: Record<string, string | number | undefined | null>[];
  labels: ReportLabels;
  summary?: { label: string; value: string }[];
  landscape?: boolean;
  /** shown in a banner under the header, e.g. "passwords are hidden" */
  note?: string;
}

export const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function formatDate(iso: string | undefined, locale: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const l = locale === "ar" ? "ar-DZ-u-nu-latn" : locale === "fr" ? "fr-FR" : "en-GB";
  return d.toLocaleDateString(l, { year: "numeric", month: "2-digit", day: "2-digit" });
}

export const MASK = "••••••••";

export function maskCard(num: string | undefined) {
  const d = (num || "").replace(/\s+/g, "");
  return d.length > 4 ? `•••• •••• •••• ${d.slice(-4)}` : d ? MASK : "";
}

export function printReport(o: ReportOptions) {
  const rtl = o.locale === "ar";
  const owner = getOwner();
  const now = formatDate(new Date().toISOString(), o.locale);
  const L = o.labels;

  const head = o.columns
    .map((c) => `<th style="${c.width ? `width:${c.width}` : ""}">${esc(c.label)}</th>`)
    .join("");
  const body = o.rows.length
    ? o.rows
        .map(
          (r, i) =>
            `<tr><td class="num">${i + 1}</td>${o.columns
              .map((c) => {
                const v = esc(r[c.key]);
                return `<td${c.ltr ? ' class="ltr"' : ""}>${v || '<span class="dash">—</span>'}</td>`;
              })
              .join("")}</tr>`
        )
        .join("")
    : `<tr><td colspan="${o.columns.length + 1}" class="emptyrow">${esc(L.empty)}</td></tr>`;

  const summary = [{ label: L.total, value: String(o.rows.length) }, ...(o.summary || [])]
    .map((s) => `<div class="chip"><span>${esc(s.label)}</span><b>${esc(s.value)}</b></div>`)
    .join("");

  const logoUrl = typeof location !== "undefined" ? new URL("/brand/app-icon.png", location.origin).href : "";

  const html = `<!DOCTYPE html>
<html lang="${esc(o.locale)}" dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="UTF-8">
<title>${esc(o.title)}</title>
<style>
  @page { size: A4 ${o.landscape ? "landscape" : "portrait"}; margin: 12mm 10mm 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Segoe UI", Tahoma, "Noto Naskh Arabic", Arial, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.5; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .top { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-bottom: 10px; border-bottom: 3px solid #0ea5e9; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .logo { width: 38px; height: 38px; border-radius: 10px; }
  .brand b { font-size: 15px; display: block; }
  .brand small { color: #64748b; font-size: 10px; }
  .meta { text-align: ${rtl ? "left" : "right"}; font-size: 10.5px; color: #475569; }
  h1 { margin: 14px 0 8px; font-size: 20px; color: #0f172a; }
  .info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 0 10px; }
  .info div { background: #f1f5f9; border-radius: 8px; padding: 7px 10px; }
  .info span { display: block; color: #64748b; font-size: 9.5px; }
  .info b { font-size: 12px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .chip { border: 1px solid #bae6fd; background: #f0f9ff; border-radius: 99px; padding: 3px 12px; font-size: 10.5px; }
  .chip b { margin-${rtl ? "right" : "left"}: 6px; color: #0369a1; }
  .note { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; font-size: 10.5px; }
  table { width: 100%; border-collapse: collapse; table-layout: auto; }
  thead { display: table-header-group; }
  th { background: #0ea5e9; color: #fff; font-weight: 700; padding: 7px 6px; font-size: 10.5px; text-align: ${rtl ? "right" : "left"}; border: 1px solid #0284c7; }
  td { font-size: 10.5px; padding: 6px; border: 1px solid #e2e8f0; vertical-align: top; word-break: break-word; }
  tr { page-break-inside: avoid; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  td.num { width: 26px; text-align: center; color: #64748b; font-weight: 700; }
  td.ltr { direction: ltr; text-align: ${rtl ? "right" : "left"}; font-family: Consolas, "Courier New", monospace; font-size: 10.5px; unicode-bidi: plaintext; }
  .dash { color: #cbd5e1; }
  .emptyrow { text-align: center; padding: 26px; color: #64748b; }
  .foot { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4px; background: #fff; }
  .conf { color: #b91c1c; font-weight: 700; }
</style>
</head>
<body>
  <div class="top">
    <div class="brand"><img class="logo" src="${esc(logoUrl)}" alt=""><div><b>${esc(branding.appName)}</b><small>${esc(branding.website.replace(/^https?:\/\//, ""))}</small></div></div>
    <div class="meta"><div>${esc(L.date)}: <b>${esc(now)}</b></div><div class="conf">${esc(L.confidential)}</div></div>
  </div>
  <h1>${esc(o.title)}</h1>
  <div class="info">
    <div><span>${esc(L.owner)}</span><b>${esc(owner.name) || "—"}</b></div>
    <div><span>${esc(L.username)}</span><b style="direction:ltr;unicode-bidi:plaintext">${esc(owner.username) || "—"}</b></div>
    <div><span>${esc(L.date)}</span><b>${esc(now)}</b></div>
  </div>
  <div class="chips">${summary}</div>
  ${o.note ? `<div class="note">${esc(o.note)}</div>` : ""}
  <table>
    <thead><tr><th style="width:26px">#</th>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  <div class="foot"><span>${esc(L.footer)}</span><span>© ${new Date().getFullYear()} ${esc(branding.developer.company)}</span></div>
</body>
</html>`;

  printHtml(html);
}
