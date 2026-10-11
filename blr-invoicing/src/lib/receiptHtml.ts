import { formatNumber } from "./calc";
import { tr } from "./i18n";
import { amountInWords } from "./words";
import type { Doc, Party, Payment, Settings } from "./types";
import type { Lang } from "@/store/ui";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Payment receipt (إيصال دفع) — A4 half-page or 80mm thermal. */
export function buildReceiptHtml(p: Payment, o: { lang: Lang; settings: Settings; party?: Party; doc?: Doc; balanceAfter?: number; paper?: "a4" | "thermal" }): string {
  const { lang, settings: s, party, doc } = o;
  const t = (k: string) => tr(lang, k);
  const rtl = lang === "ar";
  const co = s.company;
  const accent = /^#[0-9a-f]{6}$/i.test(s.accent) ? s.accent : "#0284c7";
  const thermal = o.paper === "thermal";
  const money = (n: number) => formatNumber(n, s);
  const title = p.kind === "in" ? t("receipt_in") : t("receipt_out");
  const rows: [string, string][] = [
    [t("number"), p.number || "—"], [t("date"), p.date],
    [p.kind === "in" ? t("received_from") : t("paid_to"), party?.name || doc?.partyName || "—"],
    [t("method"), t("m_" + p.method)],
  ];
  if (p.ref) rows.push([t("reference"), p.ref]);
  if (doc) rows.push([t("document"), `${t("t_" + doc.type)} ${doc.number}`]);
  if (o.balanceAfter !== undefined && doc) rows.push([t("balance_due"), money(o.balanceAfter)]);
  return `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${esc(p.number)}</title><style>
  *{box-sizing:border-box}html,body{margin:0}body{font-family:"Segoe UI",Tahoma,"Noto Sans Arabic",Arial,sans-serif;color:#0f172a;font-size:${thermal ? 10 : 13}px;line-height:1.6;direction:${rtl ? "rtl" : "ltr"}}
  .page{width:${thermal ? "72mm" : "210mm"};min-height:${thermal ? "auto" : "148mm"};margin:0 auto;padding:${thermal ? "4mm" : "14mm"}}
  .head{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:3px solid ${accent};padding-bottom:10px;margin-bottom:14px}
  .logo{max-height:${thermal ? 36 : 60}px;max-width:150px;object-fit:contain}.co{font-weight:800;font-size:${thermal ? 12 : 16}px}.sm{color:#64748b;font-size:${thermal ? 9 : 11}px}
  h1{margin:0;font-size:${thermal ? 15 : 24}px;color:${accent}}
  table{width:100%;border-collapse:collapse}td{padding:7px 10px;border-bottom:1px solid #e2e8f0}td:first-child{color:#64748b;width:35%}
  .amount{margin:16px 0;padding:14px 16px;background:${accent};color:#fff;border-radius:10px;display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:${thermal ? 14 : 22}px}
  .words{padding:8px 12px;border:1px dashed #cbd5e1;border-radius:8px;background:#f8fafc}
  .sign{display:flex;justify-content:space-between;margin-top:${thermal ? 20 : 36}px;font-size:11px;color:#64748b}.sign div{border-top:1px solid #94a3b8;padding-top:4px;min-width:130px;text-align:center}
  @page{size:${thermal ? "80mm auto" : "A4"};margin:0}</style></head><body><div class="page">
  <div class="head"><div>${co.logo ? `<img class="logo" src="${esc(co.logo)}" alt="">` : ""}<div class="co">${esc(co.name || "")}</div><div class="sm">${[co.address, co.phone, co.taxId && "NIF " + co.taxId].filter(Boolean).map(esc).join(" · ")}</div></div><h1>${esc(title)}</h1></div>
  <table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join("")}</table>
  <div class="amount"><span>${t("amount")}</span><span style="direction:ltr">${money(p.amount)}</span></div>
  <div class="words"><b>${t("amount_in_words")}:</b> ${esc(amountInWords(p.amount, lang, s.currency.code, s.currency.decimals))}</div>
  ${p.note ? `<p class="sm">${esc(p.note)}</p>` : ""}
  <div class="sign"><div>${t("signature")}</div><div>${t("stamp")}</div></div></div></body></html>`;
}
