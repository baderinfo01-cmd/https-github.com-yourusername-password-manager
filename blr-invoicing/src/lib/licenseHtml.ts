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
  const ink = s.dev ? "#b45309" : ok ? "#1e40af" : "#b91c1c";
  const fmt = (n: number) => (n ? new Date(n * 1000).toLocaleDateString("en-GB") : "—");
  const rows: [string, string][] = [
    [t("lic_owner"), s.customer || "—"], [t("lic_plan"), s.plan || s.edition || "—"], [t("lic_number"), s.license_id || "—"],
    [t("lic_device"), s.domain ? `${s.domain.slice(0, 16)}…${s.domain.slice(-8)}` : "—"], [t("lic_activated"), fmt(s.activated)],
    [t("lic_expires"), s.expires ? fmt(s.expires) : t("lic_lifetime")],
  ];
  const stampTitle = s.dev ? t("stamp_dev") : ok ? t("stamp_signed") : t("stamp_title_bad");
  return `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${esc(t("license_certificate"))}</title><style>
  *{box-sizing:border-box}html,body{margin:0}body{font-family:"El Messiri","Segoe UI",Tahoma,"Noto Sans Arabic",Arial,sans-serif;color:#0f172a;direction:${rtl ? "rtl" : "ltr"}}
  .page{width:210mm;min-height:297mm;margin:0 auto;padding:16mm;position:relative}
  .frame{border:3px double #0a9f63;border-radius:14px;padding:14mm 12mm;min-height:262mm;position:relative;overflow:hidden}
  .head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #0a9f63;padding-bottom:12px;margin-bottom:18px}
  .head img{width:64px;height:64px;border-radius:16px}.head h1{margin:0;font-size:26px;color:#067a4c}.head small{color:#64748b}
  h2{font-size:15px;color:#64748b;font-weight:600;margin:0 0 6px}
  table{width:100%;border-collapse:collapse;margin:8px 0 22px}td{padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px}td:first-child{color:#64748b;width:34%}td:last-child{font-weight:700}
  .row{display:flex;justify-content:center;margin-top:18px}.sealwrap{display:flex;flex-direction:column;align-items:center;gap:12px}
  .seal{width:190px;height:190px}
  .st{transform:rotate(-3deg);width:150px;padding:4px;border:1.5px solid ${ink}55;border-radius:14px;background:#fff;box-shadow:0 0 0 3px ${ink}12}
  .st .in{border:2.5px solid ${ink};border-radius:10px;background:${ink}10;color:${ink};text-align:center;padding:8px 8px 9px}
  .st small{display:block;font-size:8px;letter-spacing:2.2px;font-weight:800;opacity:.8}.st hr{border:0;height:1.5px;background:${ink};opacity:.35;margin:5px 0 6px}
  .st b{display:block;font-size:18px;line-height:1.2;white-space:nowrap}.st em{display:block;font-style:normal;font-size:11.5px;font-weight:800;letter-spacing:2px;margin-top:6px}
  .st span{display:block;font-family:Consolas,monospace;font-size:12px;font-weight:800;letter-spacing:.5px;direction:ltr;white-space:nowrap}
  .note{margin-top:26px;font-size:11px;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:10px;line-height:1.7}@page{size:A4;margin:0}</style></head><body><div class="page"><div class="frame">
  <div class="head"><img src="${origin}/brand/app-icon.png" alt=""><div><h1>BLR Fatourati</h1><small>${esc(t("license_certificate"))} · v${esc(version)}</small></div></div>
  <h2>${esc(t("lic_owner"))}</h2><table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
  <div class="row"><div class="sealwrap"><img class="seal" src="${origin}/brand/seal.png" alt=""><div class="st"><div class="in"><small>BADERINFO</small><hr><b>${esc(stampTitle)}</b><em>${esc((s.plan || s.edition || "").toUpperCase())}</em><hr><span>${esc(s.license_id || "—")}</span></div></div></div></div>
  <div class="note">${esc(t("lic_signed_note"))}<br>${esc(t("developer"))}: ${esc(BRAND.developer)} — Baderinfo · ${esc(BRAND.email)} · ${esc(BRAND.phone)} · ${esc(BRAND.website)}</div>
  </div></div></body></html>`;
}
