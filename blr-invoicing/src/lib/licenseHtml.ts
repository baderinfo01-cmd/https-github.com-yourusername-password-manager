import QRCode from "qrcode";
import { BRAND } from "./brand";
import { tr } from "./i18n";
import type { LicenseStatus } from "./license";
import type { Lang } from "@/store/ui";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type L3 = [string, string, string];
const W: Record<string, L3> = {
  title: ["شهادة ترخيص", "License certificate", "Certificat de licence"],
  sub: ["LICENSE CERTIFICATE", "LICENSE CERTIFICATE", "LICENSE CERTIFICATE"],
  attest: ["تشهد شركة Baderinfo بأن برنامج «BLR Fatourati» للفوترة وتسيير الأعمال مرخَّص رسميًا لـ", "Baderinfo certifies that the invoicing & business-management software “BLR Fatourati” is officially licensed to", "Baderinfo certifie que le logiciel de facturation « BLR Fatourati » est officiellement concédé à"],
  number: ["رقم الترخيص", "Licence number", "N° de licence"], product: ["المنتج", "Product", "Produit"], type: ["نوع الترخيص", "Licence type", "Type de licence"],
  start: ["تاريخ البدء", "Start date", "Date de début"], end: ["تاريخ الانتهاء", "End date", "Date de fin"], device: ["الجهاز المرخَّص", "Authorized device", "Appareil autorisé"],
  max: ["عدد الأجهزة", "Max devices", "Appareils max"], status: ["الحالة", "Status", "Statut"], lifetime: ["مدى الحياة", "Lifetime", "À vie"],
  active: ["مفعّل", "Active", "Actif"], inactive: ["غير مفعّل", "Not activated", "Non activée"], dev: ["نسخة تطوير", "Development build", "Version de développement"],
  feats: ["الخصائص المرخَّصة", "Licensed features", "Fonctionnalités sous licence"], issuer: ["ختم الجهة المانحة", "Issuer seal", "Cachet de l'émetteur"],
  sig: ["توقيع المطوّر", "Developer signature", "Signature du développeur"], issued: ["تاريخ الإصدار", "Issued", "Émise le"],
  foot: ["خدمات أونلاين · برمجة وتصميم", "Online services · Programming & design", "Services en ligne · Développement & design"],
  legal: ["هذه الشهادة ترخيص شخصي غير قابل للتحويل مرتبط بالجهاز المذكور، ويمنع النسخ أو التوزيع أو التعديل.", "This certificate is a personal, non-transferable licence bound to the device above. Copying, distribution or modification is prohibited.", "Cette licence est personnelle, non transférable et liée à l'appareil indiqué. Toute copie, diffusion ou modification est interdite."],
};
const FEATS: L3[] = [
  ["الفوترة", "Invoicing", "Facturation"], ["عروض الأسعار", "Quotes", "Devis"], ["المنتجات والخدمات", "Products & services", "Produits & services"], ["الزبائن والموردون", "Customers & suppliers", "Clients & fournisseurs"],
  ["المخزون", "Inventory", "Stock"], ["المدفوعات", "Payments", "Paiements"], ["التقارير", "Reports", "Rapports"], ["المصاريف", "Expenses", "Dépenses"],
  ["الباركود", "Barcode", "Code-barres"], ["المستخدمون والصلاحيات", "Users & roles", "Utilisateurs & rôles"], ["نسخ احتياطي مشفّر", "Encrypted backup", "Sauvegarde chiffrée"], ["الذكاء الاصطناعي", "AI assistant", "Assistant IA"],
];

/** Printable license certificate (A4), laid out like the Baderinfo "BLR Crèche" licence model. */
export async function buildLicenseHtml(s: LicenseStatus, lang: Lang, version: string, origin: string, product = "BLR Fatourati", features: L3[] = FEATS): Promise<string> {
  const i = lang === "ar" ? 0 : lang === "en" ? 1 : 2;
  const w = (k: string) => W[k][i];
  const rtl = lang === "ar";
  const ok = s.valid && !s.dev;
  const ink = s.dev ? "#b45309" : ok ? "#1e40af" : "#b91c1c";
  const fmt = (n: number) => (n ? new Date(n * 1000).toLocaleDateString(rtl ? "ar-DZ-u-nu-latn" : lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—");
  const plan = (s.plan || s.edition || "").toUpperCase();
  const stampTitle = s.dev ? tr(lang, "stamp_dev") : ok ? tr(lang, "stamp_signed") : tr(lang, "stamp_title_bad");
  const status = s.dev ? w("dev") : ok ? w("active") : w("inactive");
  const today = new Date().toISOString().slice(0, 10);
  const qr = await QRCode.toDataURL(["BLR-LICENSE", s.license_id, s.customer, s.domain].join("|"), { margin: 0, width: 220, color: { dark: "#0f2a5c", light: "#ffffff" } });
  const cells: [string, string, boolean?][] = [
    [w("product"), `${product} · ${version}`], [w("type"), s.expires ? plan || "—" : /LIFETIME/.test(plan) || !plan ? w("lifetime") : `${w("lifetime")} (${plan})`],
    [w("start"), fmt(s.activated)], [w("end"), s.expires ? fmt(s.expires) : w("lifetime")],
    [w("device"), s.domain || "—", true], [w("max"), "1"], [w("status"), status],
  ];
  return `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${esc(w("title"))}</title><style>
  *{box-sizing:border-box}html,body{margin:0}body{font-family:"El Messiri","Segoe UI",Tahoma,"Noto Sans Arabic",Arial,sans-serif;color:#0f172a;direction:${rtl ? "rtl" : "ltr"};-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;height:297mm;margin:0 auto;padding:7mm;position:relative;background:#fff;overflow:hidden}
  .f1{position:absolute;inset:5mm;border:1px solid #1e3a8a;border-radius:3px}.f2{position:absolute;inset:7mm;border:2px solid #c9a24a;border-radius:2px}
  .cn{position:absolute;width:15mm;height:15mm;border:3px solid #1e3a8a}.cn.tl{top:3.5mm;left:3.5mm;border-right:0;border-bottom:0}.cn.tr{top:3.5mm;right:3.5mm;border-left:0;border-bottom:0}.cn.bl{bottom:3.5mm;left:3.5mm;border-right:0;border-top:0}.cn.br{bottom:3.5mm;right:3.5mm;border-left:0;border-top:0}
  .wm{position:absolute;left:50%;top:50%;width:120mm;height:120mm;transform:translate(-50%,-45%);opacity:.05;background:url(${origin}/brand/icon-192.png) center/contain no-repeat}
  .in{position:relative;padding:11mm 16mm 0;height:100%}
  .head{display:flex;align-items:center;justify-content:space-between;direction:ltr}.head .bi{height:21mm}.head .pr{display:flex;align-items:center;gap:8px}.head .pr img{width:15mm;height:15mm;border-radius:4mm}.head .pr b{display:block;font-size:21px;color:#0f2a5c;line-height:1}.head .pr small{font-size:8.5px;letter-spacing:1.4px;color:#64748b;font-weight:700;white-space:nowrap}
  h1{margin:9mm 0 0;text-align:center;font-size:34px;color:#0f2a5c;line-height:1.1}.sub{text-align:center;color:#a07d2c;letter-spacing:6px;font-weight:700;font-size:15px;margin:2mm 0 6mm;font-family:Georgia,serif}
  .att{text-align:center;font-size:12.5px;color:#334155;line-height:1.8}.cust{text-align:center;font-size:30px;font-weight:800;color:#1d4ed8;margin:3mm 0 3mm;word-break:break-word}
  .dots{border-top:2px dotted #c9a24a;margin:0 8mm 5mm}.no{display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:6mm}.no span{font-size:13px;color:#475569}.no b{border:1.5px solid #1d4ed8;border-radius:9px;padding:4px 22px;font:800 19px Consolas,"Courier New",monospace;color:#1d4ed8;letter-spacing:1px;direction:ltr;background:#f5f8ff}
  .grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #dbe3ef;border-radius:10px;overflow:hidden;background:#fffffff2}.grid .c{padding:7px 12px;border-bottom:1px solid #e5ebf4;min-height:15mm}.grid .c:nth-child(odd){border-inline-end:1px solid #e5ebf4}
  .grid small{display:block;font-size:10px;color:#64748b}.grid b{display:block;font-size:14px;margin-top:2px;color:#0f172a;word-break:break-all}.grid .c.wide{grid-column:1/-1}.grid .c.wide b{font:700 13px Consolas,monospace;direction:ltr;text-align:${rtl ? "right" : "left"}}
  .ft{margin:6mm 0 2mm;font-weight:800;font-size:14px;color:#0f2a5c}.chips{display:flex;flex-wrap:wrap;gap:6px}.chips span{border:1px solid #b6c6e6;background:#eef3fc;border-radius:12px;padding:3px 11px;font-size:11.5px;color:#1e3a8a}
  .sg{position:absolute;left:16mm;right:16mm;bottom:33mm;display:flex;align-items:flex-end;justify-content:space-between;direction:ltr}.sg>div{width:52mm;text-align:center;font-size:10px;color:#475569}
  .sg .seal{width:30mm;height:30mm;display:block;margin:0 auto 1mm}.sg .qr{width:30mm;height:30mm;display:block;margin:0 auto 1mm}.sg .line{border-top:1.5px solid #1e3a8a;margin-top:2mm;padding-top:1.5mm}
  .st{transform:rotate(-4deg);width:44mm;margin:0 auto;padding:2px;border:1.2px solid ${ink}66;border-radius:8px;background:#fff}.st .b{border:2px solid ${ink};border-radius:6px;background:${ink}10;color:${ink};padding:4px 4px 5px;text-align:center}
  .st small{display:block;font-size:6.5px;letter-spacing:2px;font-weight:800;opacity:.8}.st b{display:block;font-size:13px;line-height:1.2;white-space:nowrap}.st em{display:block;font-style:normal;font-size:9px;font-weight:800;letter-spacing:1.5px}.st i{display:block;font:800 8px Consolas,monospace;font-style:normal;direction:ltr}
  .sn{font:italic 700 15px "Brush Script MT","Segoe Script",cursive;color:#0f2a5c;margin-top:1mm}
  .bot{position:absolute;left:16mm;right:16mm;bottom:11mm;text-align:center}.ct{border-top:1px solid #dbe3ef;padding-top:2.5mm;font-size:10.5px;color:#334155;direction:ltr}.ct b{color:#0f2a5c}.lg{margin-top:2.5mm;font-size:9.5px;color:#64748b;line-height:1.6}
  @page{size:A4;margin:0}</style></head><body><div class="page"><div class="f1"></div><div class="f2"></div><i class="cn tl"></i><i class="cn tr"></i><i class="cn bl"></i><i class="cn br"></i><div class="wm"></div><div class="in">
  <div class="head"><img class="bi" src="${origin}/brand/baderinfo-logo.png" alt="Baderinfo"><div class="pr"><img src="${origin}/brand/app-icon.png" alt=""><div><b>BLR Fatourati</b><small>INVOICING MANAGEMENT</small></div></div></div>
  <h1>${esc(w("title"))}</h1><div class="sub">LICENSE CERTIFICATE</div>
  <div class="att">${esc(w("attest"))}</div><div class="cust">${esc(s.customer || "—")}</div><div class="dots"></div>
  <div class="no"><span>${esc(w("number"))}</span><b>${esc(s.license_id || "—")}</b></div>
  <div class="grid">${cells.map(([k, v, wide]) => `<div class="c${wide ? " wide" : ""}"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("")}</div>
  <div class="ft">${esc(w("feats"))}</div><div class="chips">${features.map((f) => `<span>${esc(f[i])}</span>`).join("")}</div>
  <div class="sg"><div><img class="seal" src="${origin}/brand/seal.png" alt=""><div class="line">${esc(w("issuer"))}</div></div>
  <div><img class="qr" src="${qr}" alt=""><div>${today}</div></div>
  <div><div class="st"><div class="b"><small>BADERINFO</small><b>${esc(stampTitle)}</b><em>${esc(plan)}</em><i>${esc(s.license_id || "—")}</i></div></div><div class="sn">Bader Eddine Hamidane</div><div class="line">${esc(w("sig"))}</div></div></div>
  <div class="bot"><div class="ct">${esc(BRAND.phone)} · ${esc(BRAND.email)} · ${esc(BRAND.website.replace(/^https?:\/\//, ""))} · ${esc(w("foot"))} · <b>Baderinfo</b></div><div class="lg">${esc(w("legal"))}</div></div>
  </div></div></body></html>`;
}
