import { BRAND } from "./brand";
import { LOCALE, tr } from "./i18n";
import type { LicenseStatus } from "./license";
import type { Lang } from "@/store/ui";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Printable license certificate (A4) with the rectangular "genuine license" stamp and the Baderinfo seal. */
export function buildLicenseHtml(s: LicenseStatus, lang: Lang, version: string, origin: string): string {
  const t = (k: string) => tr(lang, k);
  const rtl = lang === "ar";
  const ok = s.valid && !s.dev;
  const ink = s.dev ? "#b45309" : ok ? "#0f7a3d" : "#b91c1c";
  const fmt = (n: number) => (n ? new Date(n * 1000).toLocaleDateString(LOCALE[lang]) : "—");
  const rows: [string, string][] = [
    [t("lic_owner"), s.customer || "—"], [t("lic_plan"), s.plan || s.edition || "—"], [t("lic_number"), s.license_id || "—"],
    [t("lic_device"), s.domain ? `${s.domain.slice(0, 16)}…${s.domain.slice(-8)}` : "—"], [t("lic_activated"), fmt(s.activated)],
    [t("lic_expires"), s.expires ? fmt(s.expires) : t("lic_lifetime")],
  ];
  const stampTitle = s.dev ? t("stamp_dev") : ok ? t("stamp_title_ok") : t("stamp_title_bad");
  return `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${esc(t("license_certificate"))}</title><style>
  *{box-sizing:border-box}html,body{margin:0}body{font-family:"El Messiri","Segoe UI",Tahoma,"Noto Sans Arabic",Arial,sans-serif;color:#0f172a;direction:${rtl ? "rtl" : "ltr"}}
  .page{width:210mm;min-height:297mm;margin:0 auto;padding:16mm;position:relative}
  .frame{border:3px double #0a9f63;border-radius:14px;padding:14mm 12mm;min-height:262mm;position:relative;overflow:hidden}
  .wm{position:absolute;inset:auto auto 20mm ${rtl ? "auto" : "10mm"};${rtl ? "left:10mm;" : ""}width:120mm;opacity:.07}
  .head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #0a9f63;padding-bottom:12px;margin-bottom:18px}
  .head img{width:64px;height:64px;border-radius:16px}.head h1{margin:0;font-size:26px;color:#067a4c}.head small{color:#64748b}
  h2{font-size:15px;color:#64748b;font-weight:600;margin:0 0 6px}
  table{width:100%;border-collapse:collapse;margin:8px 0 22px}td{padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px}td:first-child{color:#64748b;width:34%}td:last-child{font-weight:700}
  .row{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:20px}
  .stamp{width:170px;height:62px;border:2.5px solid ${ink};border-radius:8px;outline:1px solid ${ink};outline-offset:-5px;color:${ink};display:flex;align-items:center;gap:7px;padding:0 9px;transform:rotate(-4deg);background:${ink}0f}
  .stamp .ic{width:30px;height:30px;border:2px solid ${ink};border-radius:50%;display:grid;place-items:center;font-size:16px;font-weight:900}
  .stamp b{display:block;font-size:13px;line-height:1.1}.stamp i{display:block;font-style:normal;font-size:6px;letter-spacing:1px;font-weight:700;margin-top:2px}.stamp s{display:block;text-decoration:none;font-size:5px;opacity:.85;margin-top:3px;letter-spacing:.4px}
  .seal{width:78px}.note{margin-top:26px;font-size:11px;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:10px;line-height:1.7}
  .dev{margin-top:14px;font-size:12px}@page{size:A4;margin:0}</style></head><body><div class="page"><div class="frame">
  <img class="wm" src="${origin}/brand/seal.png" alt="">
  <div class="head"><img src="${origin}/brand/app-icon.png" alt=""><div><h1>BLR Fatourati</h1><small>${esc(t("license_certificate"))} · v${esc(version)}</small></div></div>
  <h2>${esc(t("lic_owner"))}</h2><table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
  <div class="row"><div class="stamp"><div class="ic">✔</div><div><b>${esc(stampTitle)}</b><i>${s.dev ? "DEVELOPMENT BUILD" : ok ? "GENUINE LICENSE" : "NOT ACTIVATED"}</i><s>BLR FATOURATI · ID: ${esc(s.license_id || "—")}</s></div></div>
  <img class="seal" src="${origin}/brand/seal.png" alt=""></div>
  <div class="note">${esc(t("lic_signed_note"))}<br>${esc(t("developer"))}: ${esc(BRAND.developer)} — Baderinfo · ${esc(BRAND.email)} · ${esc(BRAND.phone)} · ${esc(BRAND.website)}</div>
  </div></div></body></html>`;
}
