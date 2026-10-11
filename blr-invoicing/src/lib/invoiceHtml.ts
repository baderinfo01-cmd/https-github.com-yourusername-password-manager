import QRCode from "qrcode";
import { computeTotals, formatNumber, num } from "./calc";
import { tr } from "./i18n";
import { amountInWords } from "./words";
import type { Doc, Party, Settings } from "./types";
import type { Lang } from "@/store/ui";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const TYPE_KEY: Record<string, string> = { invoice: "t_invoice", quote: "t_quote", proforma: "t_proforma", delivery: "t_delivery", credit: "t_credit", purchase: "t_purchase", order: "t_order" };

interface Opts { lang: Lang; settings: Settings; party?: Party; paid?: number; paper?: "a4" | "thermal"; credits?: number }

export async function qrDataUrl(text: string) {
  try { return await QRCode.toDataURL(text, { margin: 0, width: 160, errorCorrectionLevel: "M" }); } catch { return ""; }
}

export async function buildDocHtml(doc: Doc, o: Opts): Promise<string> {
  const { lang, settings: s, party } = o;
  const t = (k: string, v?: Record<string, string | number>) => tr(lang, k, v);
  const rtl = lang === "ar";
  const money = (n: number) => formatNumber(n, s);
  const co = s.company;
  const accent = /^#[0-9a-f]{6}$/i.test(s.accent) ? s.accent : "#2563eb";
  const paid = o.paid || 0;
  const credits = o.credits || 0;
  const due = Math.max(0, doc.total - paid - credits);
  const totals = computeTotals(doc.lines, doc.discount, doc.discountType, doc.shipping, doc.stamp, s.pricesIncludeTax, doc.extraTaxes || []);
  const title = t(TYPE_KEY[doc.type]);
  const hasBalance = doc.type === "invoice" || doc.type === "purchase";
  const qr = s.showQr
    ? await qrDataUrl([co.name, co.taxId ? `NIF:${co.taxId}` : "", `${doc.number}`, `${doc.date}`, `${doc.total.toFixed(2)} ${s.currency.code}`].filter(Boolean).join("|"))
    : "";
  const thermal = o.paper === "thermal";
  const hasLineTax = doc.lines.some((l) => num(l.taxRate) > 0);

  const rows = doc.lines.map((l, i) => {
    const net = num(l.qty) * num(l.price) * (1 - num(l.discountPct) / 100);
    return `<tr><td class="c">${i + 1}</td><td>${esc(l.desc)}</td><td class="n">${num(l.qty)}${l.unit ? ` <span class="u">${esc(l.unit)}</span>` : ""}</td><td class="n">${money(num(l.price))}</td>${
      doc.lines.some((x) => x.discountPct) ? `<td class="n">${l.discountPct ? num(l.discountPct) + "%" : ""}</td>` : ""
    }${hasLineTax ? `<td class="n">${num(l.taxRate)}%</td>` : ""}<td class="n b">${money(net)}</td></tr>`;
  }).join("");
  const head = `<th class="c">#</th><th>${t("description")}</th><th class="n">${t("qty")}</th><th class="n">${t("unit_price")}</th>${
    doc.lines.some((x) => x.discountPct) ? `<th class="n">${t("discount")}</th>` : ""
  }${hasLineTax ? `<th class="n">${t("tax")}</th>` : ""}<th class="n">${t("amount")}</th>`;

  const taxRows = Object.entries(totals.taxByRate).filter(([, v]) => v > 0).map(([r, v]) => `<tr><td>${t("tax")} ${r}%</td><td class="n">${money(v)}</td></tr>`).join("");
  const partyBlock = party || doc.partyName
    ? `<div class="box"><div class="lbl">${t(doc.type === "purchase" || doc.type === "order" ? "supplier" : "client")}</div><div class="strong">${esc(doc.partyName)}</div>${
        party ? [party.company, party.address, party.city, party.phone, party.email, party.taxId && `NIF: ${party.taxId}`, party.rc && `RC: ${party.rc}`, party.ai && `AI: ${party.ai}`, party.nis && `NIS: ${party.nis}`].filter(Boolean).map((x) => `<div>${esc(x)}</div>`).join("") : ""
      }</div>`
    : "";
  const coLines = [co.legalName, co.address, co.phone, co.email, co.website, co.taxId && `NIF: ${co.taxId}`, co.rc && `RC: ${co.rc}`, co.ai && `AI: ${co.ai}`, co.nis && `NIS: ${co.nis}`].filter(Boolean) as string[];
  // empty company details are simply not printed (no blank box)
  const coBlock = co.name || coLines.length
    ? `<div class="box">${co.name ? `<div class="strong big">${esc(co.name)}</div>` : ""}${coLines.map((x) => `<div>${esc(x)}</div>`).join("")}</div>`
    : "";
  const boxes = [coBlock, partyBlock].filter(Boolean).length;
  const notesBlock = [
    doc.notes ? `<div><div class="lbl">${t("notes")}</div>${esc(doc.notes)}</div>` : "",
    doc.terms ? `<div><div class="lbl">${t("terms")}</div>${esc(doc.terms)}</div>` : "",
    co.bank ? `<div><div class="lbl">${t("bank_details")}</div>${esc(co.bank)}</div>` : "",
  ].filter(Boolean);

  const css = `
  *{box-sizing:border-box}html,body{margin:0;padding:0}
  body{font-family:"El Messiri","Segoe UI",Tahoma,"Noto Sans Arabic",Arial,sans-serif;color:#0f172a;font-size:${thermal ? 10 : 12}px;line-height:1.5;direction:${rtl ? "rtl" : "ltr"}}
  .page{width:${thermal ? "72mm" : "210mm"};min-height:${thermal ? "auto" : "297mm"};margin:0 auto;padding:${thermal ? "4mm" : "14mm 14mm 12mm"};position:relative;display:flex;flex-direction:column}
  .tail{margin-top:auto;padding-top:14px}
  .grid.one{grid-template-columns:${thermal ? "1fr" : "1fr 1fr"}}
  .top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:${thermal ? 6 : 18}px}
  .logo{max-height:${thermal ? 40 : 64}px;max-width:${thermal ? 120 : 180}px;object-fit:contain;display:block;margin-bottom:6px}
  .title{font-size:${thermal ? 15 : 26}px;font-weight:800;color:${accent};letter-spacing:.5px}
  .meta{margin-top:4px;font-size:${thermal ? 10 : 12}px}.meta b{display:inline-block;min-width:70px;color:#64748b;font-weight:600}
  .grid{display:grid;grid-template-columns:${thermal ? "1fr" : "1fr 1fr"};gap:${thermal ? 6 : 14}px;margin-bottom:${thermal ? 6 : 16}px}
  .box{border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#f8fafc}
  .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#64748b;margin-bottom:3px}.strong{font-weight:700}.big{font-size:14px}
  table{width:100%;border-collapse:collapse}
  .items th{background:${accent};color:#fff;font-weight:600;padding:7px 8px;text-align:${rtl ? "right" : "left"};font-size:${thermal ? 9 : 11}px}
  .items td{padding:7px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}
  .items tbody tr:nth-child(even){background:#f8fafc}
  .n{text-align:${rtl ? "left" : "right"};white-space:nowrap;direction:ltr;unicode-bidi:plaintext}.c{text-align:center;width:28px}.b{font-weight:700}.u{color:#64748b;font-size:10px}
  .bottom{display:flex;justify-content:flex-end;margin-top:14px;align-items:flex-start}
  .totals{min-width:${thermal ? "100%" : "260px"};border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
  .totals td{padding:6px 12px;border-bottom:1px solid #eef2f7}.totals tr:last-child td{border-bottom:0}
  .grand td{background:${accent};color:#fff;font-weight:800;font-size:${thermal ? 12 : 14}px}
  .due td{background:#fef3c7;font-weight:700}
  .subj{font-size:13px;font-weight:600;color:#334155;margin-top:2px}
  .words{margin-top:14px;padding:8px 12px;border:1px dashed #cbd5e1;border-radius:8px;background:#f8fafc;font-size:${thermal ? 10 : 12}px}
  .notes{display:grid;grid-template-columns:${thermal ? "1fr" : "repeat(auto-fit,minmax(150px,1fr))"};gap:10px 18px;font-size:11px;color:#334155;white-space:pre-wrap;border-top:1px solid #e2e8f0;padding-top:10px}
  .stamp{position:absolute;top:46mm;${rtl ? "left" : "right"}:20mm;transform:rotate(-14deg);border:3px solid;border-radius:8px;padding:2px 14px;font-size:26px;font-weight:800;letter-spacing:2px;opacity:.55}
  .paid{color:#059669;border-color:#059669}.void{color:#dc2626;border-color:#dc2626}
  .foot{margin-top:18px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;border-top:1px solid #e2e8f0;padding-top:10px;font-size:10px;color:#64748b}
  .sig{height:60px;text-align:center;min-width:140px;border-top:1px solid #94a3b8;padding-top:4px;margin-top:40px}
  ${s.template === "classic" ? `.items th{background:#fff;color:#0f172a;border-top:2px solid #0f172a;border-bottom:2px solid #0f172a}.grand td{background:#fff;color:#0f172a;border-top:2px solid #0f172a}.title{color:#0f172a}.box{background:#fff}` : ""}
  ${s.template === "minimal" ? `.items th{background:#fff;color:${accent};border-bottom:2px solid ${accent}}.items tbody tr:nth-child(even){background:#fff}.box{border:0;background:#fff;padding:0}.grand td{background:#fff;color:${accent};border-top:2px solid ${accent}}` : ""}
  @page{size:${thermal ? "80mm auto" : "A4"};margin:0}
  @media print{.page{margin:0}}`;

  return `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${esc(doc.number)}</title><style>${css}</style></head><body><div class="page">
  ${doc.status === "void" ? `<div class="stamp void">${t("pay_void")}</div>` : hasBalance && doc.total > 0 && due <= 0.005 && doc.status !== "draft" ? `<div class="stamp paid">${t("pay_paid")}</div>` : ""}
  <div class="top"><div>${co.logo ? `<img class="logo" src="${esc(co.logo)}" alt="">` : ""}${thermal ? "" : ""}<div class="title">${esc(title)}</div>${doc.subject ? `<div class="subj">${esc(doc.subject)}</div>` : ""}
    <div class="meta"><div><b>${t("number")}</b> ${esc(doc.number)}</div><div><b>${t("date")}</b> ${esc(doc.date)}</div>${doc.dueDate && hasBalance ? `<div><b>${t("due_date")}</b> ${esc(doc.dueDate)}</div>` : ""}${doc.validUntil ? `<div><b>${t("valid_until")}</b> ${esc(doc.validUntil)}</div>` : ""}${doc.poRef ? `<div><b>${t("po_ref")}</b> ${esc(doc.poRef)}</div>` : ""}${doc.refNumber ? `<div><b>${t("reference")}</b> ${esc(doc.refNumber)}</div>` : ""}</div></div>
    ${qr && !thermal ? `<img src="${qr}" alt="" width="84" height="84">` : ""}</div>
  ${boxes ? `<div class="grid${boxes === 1 ? " one" : ""}">${coBlock}${partyBlock}</div>` : ""}
  <table class="items"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
  <div class="bottom"><table class="totals"><tbody>
    <tr><td>${t("subtotal")}</td><td class="n">${money(doc.subtotal)}</td></tr>
    ${doc.discountAmount ? `<tr><td>${t("discount")}</td><td class="n">- ${money(doc.discountAmount)}</td></tr>` : ""}
    ${taxRows || (doc.tax ? `<tr><td>${t("tax")}</td><td class="n">${money(doc.tax)}</td></tr>` : "")}
    ${(doc.extraTaxes || []).map((x) => `<tr><td>${esc(x.name)} ${x.rate}%</td><td class="n">${money(((doc.subtotal - doc.discountAmount) * x.rate) / 100)}</td></tr>`).join("")}
    ${doc.shipping ? `<tr><td>${t("shipping")}</td><td class="n">${money(doc.shipping)}</td></tr>` : ""}
    ${doc.stamp ? `<tr><td>${t("stamp_duty")}</td><td class="n">${money(doc.stamp)}</td></tr>` : ""}
    <tr class="grand"><td>${t("total")}</td><td class="n">${money(doc.total)}</td></tr>
    ${hasBalance && paid ? `<tr><td>${t("paid")}</td><td class="n">${money(paid)}</td></tr>` : ""}
    ${hasBalance && credits ? `<tr><td>${t("credits_applied")}</td><td class="n">${money(credits)}</td></tr>` : ""}
    ${hasBalance && (paid || credits) ? `<tr class="due"><td>${t("balance_due")}</td><td class="n">${money(due)}</td></tr>` : ""}
  </tbody></table></div>
  <div class="words"><b>${t("amount_in_words")}:</b> ${esc(amountInWords(doc.total, lang, s.currency.code, s.currency.decimals))}</div>
  <div class="tail">${notesBlock.length ? `<div class="notes">${notesBlock.join("")}</div>` : ""}
  <div class="foot"><div>${esc(s.footer)}${thermal && qr ? `<div style="margin-top:6px"><img src="${qr}" width="70" height="70" alt=""></div>` : ""}</div>${thermal ? "" : `<div class="sig">${co.stamp ? `<img src="${esc(co.stamp)}" style="max-height:78px;max-width:120px;position:absolute;margin:-70px 0 0 -60px;opacity:.9" alt="">` : ""}${co.signature ? `<img src="${esc(co.signature)}" style="max-height:56px;display:block;margin:-52px auto 0" alt="">` : ""}${t("signature")} &amp; ${t("stamp")}</div>`}</div>
  </div></div></body></html>`;
}
