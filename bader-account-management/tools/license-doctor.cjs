#!/usr/bin/env node
/**
 * License doctor — checks that the program is wired to YOUR license dashboard.
 *   node tools/license-doctor.cjs
 * It never activates anything: it only sends a deliberately fake code, so no real code is consumed.
 */
"use strict";
const https = require("node:https");
const http = require("node:http");
const path = require("node:path");

const cfg = { ...require(path.join(__dirname, "..", "bader-license", "license-config.js")) };
// optional: node tools/license-doctor.cjs https://your-site/folder/api.php  (try an address before editing the config)
if (process.argv[2]) cfg.server_url = process.argv[2];
const ok = (m) => console.log("  ✅ " + m);
const bad = (m) => { console.log("  ❌ " + m); problems++; };
const info = (m) => console.log("     " + m);
let problems = 0;

function request(method, url, body) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch { return resolve({ error: "العنوان غير صحيح" }); }
    const lib = u.protocol === "http:" ? http : https;
    const req = lib.request(u, { method, timeout: 15000, headers: body ? { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) } : {} }, (res) => {
      let raw = ""; res.setEncoding("utf8"); res.on("data", (c) => (raw += c));
      res.on("end", () => resolve({ status: res.statusCode, raw }));
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (e) => resolve({ error: e.message }));
    req.end(body);
  });
}

(async () => {
  console.log("\nفحص ربط البرنامج بلوحة التراخيص\n");
  console.log("الإعدادات الحالية (bader-license/license-config.js):");
  info("server_url : " + cfg.server_url);
  info("product_id : " + cfg.product_id);
  info("public_key : " + (cfg.public_key || "").slice(0, 12) + "…");
  info("max_offline_days : " + cfg.max_offline_days + (cfg.max_offline_days === 0 ? "  (يعمل مدى الحياة دون إنترنت)" : ""));

  console.log("\n1) المفتاح العام");
  const raw = Buffer.from(String(cfg.public_key || ""), "base64");
  if (raw.length === 32) ok("صيغة المفتاح العام صحيحة (32 بايت).");
  else bad("المفتاح العام غير صحيح. انسخه كاملاً من لوحتك: الإعدادات ← مفتاح التوقيع ← نسخ المفتاح العام.");

  console.log("\n2) عنوان التفعيل");
  if (!/^https?:\/\/.+\/api\.php$/i.test(String(cfg.server_url || ""))) {
    bad("server_url يجب أن ينتهي بـ api.php. مثال: https://موقعك.com/المجلد/api.php (تجده في لوحتك ← «معلومات تقنية»).");
  }
  const probe = await request("POST", cfg.server_url, new URLSearchParams({
    action: "activate", code: "ZZ-FAKE-FAKE-FAKE", domain: "doctor-probe", product: String(cfg.product_id || ""), instance: "", version: "doctor",
  }).toString());
  if (probe.error) {
    bad("تعذّر الوصول للخادم: " + probe.error + ". تأكد من العنوان ومن اتصال الإنترنت.");
  } else {
    let json = null;
    try { json = JSON.parse(probe.raw); } catch { /* not JSON */ }
    if (json && json.code === "invalid_code") {
      ok("الخادم يعمل ويردّ بالبروتوكول الصحيح (رفض الكود الوهمي كما يجب).");
      info("⚠ هذا يثبت أن العنوان خادم تراخيص، لكن لا يثبت أنه نفس الخادم الذي ولّد كودك. تأكد أنه عنوان لوحتك التي ولّدت منها الكود.");
    } else if (json && json.code === "rate_limited") {
      ok("الخادم يعمل (طلبات كثيرة مؤقتاً، أعد المحاولة بعد دقائق).");
    } else if (json && json.code === "server_error") {
      bad("الخادم يعمل لكنه أرجع خطأ: " + (json.detail || "server_error") + ". افتح admin.php وأكمل «الإعداد الأول» وأنشئ مفتاح التوقيع.");
    } else {
      bad("العنوان لا يردّ كخادم تراخيص (HTTP " + probe.status + "). تحقق أن api.php موجود في نفس مجلد admin.php.");
      info("بداية الرد: " + probe.raw.slice(0, 80).replace(/\s+/g, " "));
    }
  }

  console.log("\n3) معرّف المنتج");
  if (cfg.product_id === "bader-account-management") ok("product_id = bader-account-management");
  else info("product_id = " + cfg.product_id);
  info("يجب أن يوجد منتج بنفس المعرّف في لوحتك (صفحة «المنتجات»)، وأن تُولَّد الأكواد لهذا المنتج.");
  info("إن ولّدت الكود لمنتج آخر (مثل bader-prog) سيظهر للزبون: «هذا الكود خاص ببرنامج آخر».");

  console.log(problems ? `\nوُجدت ${problems} مشكلة. أصلحها ثم أعد التشغيل.\n` : "\nالإعدادات تبدو سليمة. جرّب التفعيل بكود جديد.\n");
  process.exit(problems ? 1 : 0);
})();
