#!/usr/bin/env node
"use strict";
/**
 * Browser end-to-end flow against the STATIC EXPORT (out/), using the localStorage stand-in bridge.
 *   node e2e_browser.cjs --app /path/to/app [--shots /path/to/screenshots] [--extra extra-steps.cjs]
 * Requires `npm run build` first. Exit code 0 = every step passed. Screenshots go to --shots (default <app>/../e2e-shots).
 * The default flow matches the template (setup admin -> recovery key -> items CRUD -> print preview -> language/RTL
 * -> reload requires login). Add your own module steps with --extra: module.exports = async ({ page, base, step, shot, t }) => {...}
 * Arabic labels are matched through a/b/c regex alternatives so the flow keeps working if you switch language.
 */
const path = require("node:path");
const fs = require("node:fs");
const { loadPlaywright, serveOut, parseArgs } = require("./_pw.cjs");

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const app = path.resolve(String(args.app || "."));
  const out = path.join(app, "out");
  if (!fs.existsSync(path.join(out, "index.html"))) { console.error("out/ not found - run `npm run build` in the app first"); process.exit(2); }
  const shots = path.resolve(String(args.shots || path.join(app, "..", "e2e-shots")));
  fs.mkdirSync(shots, { recursive: true });

  const { chromium } = loadPlaywright();
  const { server, url } = await serveOut(out);
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await (await browser.newContext({ viewport: { width: 1360, height: 860 } })).newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource.*404/.test(m.text())) problems.push("console: " + m.text()); });
  page.on("requestfailed", (r) => { if (!/ERR_ABORTED/.test(r.failure()?.errorText || "")) problems.push("requestfailed: " + r.url() + " " + r.failure()?.errorText); }); // ERR_ABORTED = Next prefetch cancelled by a navigation, harmless

  let n = 0, failed = 0;
  const shot = (name) => page.screenshot({ path: path.join(shots, `${String(++n).padStart(2, "0")}-${name}.png`) });
  const step = async (name, fn) => {
    try { await fn(); console.log("  ok   " + name); } catch (e) { failed++; console.log("  FAIL " + name + "\n       " + String(e.message).split("\n")[0]); try { await shot("FAIL-" + name.replace(/\W+/g, "_")); } catch {} }
  };
  const has = (re) => page.getByText(re).first();

  await step("first run shows the create-administrator screen (RTL, Arabic)", async () => {
    await page.goto(url + "/");
    await page.waitForSelector("form");
    if ((await page.evaluate(() => document.documentElement.dir)) !== "rtl") throw new Error("html dir is not rtl");
    await shot("setup");
  });
  await step("create admin -> recovery key shown once -> continue -> dashboard", async () => {
    await page.fill('input[autocomplete="username"]', "admin");
    const pw = page.locator('input[autocomplete="new-password"]');
    await pw.nth(0).fill("secret123"); await pw.nth(1).fill("secret123");
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector("text=/[A-Z2-9]{4}(-[A-Z2-9]{4}){4}/", { timeout: 8000 });
    await shot("recovery-key");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: /متابعة|Continue|Continuer/ }).click();
    await page.waitForSelector("aside nav", { timeout: 8000 });
    await shot("dashboard");
  });
  await step("client-side navigation to Items (RSC payload fetch)", async () => {
    await page.locator('aside a[href="/items/"]').click();
    await page.waitForURL(/\/items\/?$/);
    await page.waitForSelector("h1");
  });
  await step("add an item via the modal, it appears in the table", async () => {
    await page.getByRole("button", { name: /إضافة صنف|Add item|Ajouter un article/ }).click();
    await page.locator('[role="dialog"] input').first().fill("Widget 1");
    const dlg = page.locator('[role="dialog"]');
    await dlg.locator('input[inputmode="decimal"]').nth(0).fill("1500,50"); // decimal comma accepted
    await dlg.locator('input[inputmode="decimal"]').nth(1).fill("3");
    await shot("item-modal");
    await dlg.getByRole("button", { name: /حفظ|Save|Enregistrer/ }).click();
    await page.waitForSelector("td:has-text('Widget 1')");
    await shot("items");
  });
  await step("amount is rendered inside an LRI/PDI isolate", async () => {
    const txt = await page.locator("tbody tr").first().innerText();
    if (!txt.includes("⁦") || !txt.includes("⁩") || !/1 500\.50/.test(txt)) throw new Error("amount not isolated/formatted: " + JSON.stringify(txt));
  });
  await step("search filters the table", async () => {
    await page.getByRole("textbox", { name: /بحث|Search|Rechercher/ }).fill("zzz-nothing");
    await page.waitForSelector("text=/لا توجد بيانات|No data|Aucune donnée/");
    await page.getByRole("textbox", { name: /بحث|Search|Rechercher/ }).fill("");
  });
  await step("print preview opens, iframe is sandboxed and contains the item + embedded font", async () => {
    await page.getByRole("button", { name: /طباعة|Print|Imprimer/ }).first().click();
    const frame = page.locator('iframe[title="preview"]');
    await frame.waitFor();
    if ((await frame.getAttribute("sandbox")) !== "allow-same-origin") throw new Error("preview iframe must be sandbox=allow-same-origin (needed to measure height, scripts stay blocked)");
    await page.waitForFunction(() => { const f = document.querySelector('iframe[title="preview"]'); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.innerText.includes("Widget 1"); }, null, { timeout: 8000 });
    const hasFont = await page.evaluate(() => (document.querySelector('iframe[title="preview"]').getAttribute("srcdoc") || "").includes("@font-face"));
    if (!hasFont) throw new Error("El Messiri @font-face not embedded in the print document (withFont)");
    await shot("print-preview");
    await page.keyboard.press("Escape");
  });
  await step("switch to English: dir becomes ltr, labels change; back to Arabic", async () => {
    await page.selectOption('select[aria-label="language"]', "en");
    if ((await page.evaluate(() => document.documentElement.dir)) !== "ltr") throw new Error("dir not ltr in English");
    await has(/Add item/).waitFor(); await shot("english");
    await page.selectOption('select[aria-label="language"]', "ar");
    if ((await page.evaluate(() => document.documentElement.dir)) !== "rtl") throw new Error("dir not rtl in Arabic");
  });
  await step("settings and users pages render for the admin", async () => {
    for (const p of ["/settings/", "/users/", "/license/"]) { await page.locator(`aside a[href="${p}"]`).click(); await page.waitForURL(new RegExp(p.replace(/\//g, "\\/") + "?$")); await page.waitForSelector("h1"); }
    await shot("license");
  });
  await step("lock -> login screen -> wrong password rejected -> correct password enters", async () => {
    await page.locator('button[aria-label="lock"]').click();
    await page.waitForSelector('input[autocomplete="current-password"]');
    await page.fill('input[autocomplete="username"]', "admin");
    await page.fill('input[autocomplete="current-password"]', "wrong-password");
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('[role="alert"]');
    await page.fill('input[autocomplete="current-password"]', "secret123");
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector("aside nav");
  });
  await step("hard reload at a deep URL still works and asks for login again (session is not persisted)", async () => {
    await page.goto(url + "/items/");
    await page.waitForSelector("form");
  });

  if (args.extra) {
    const extra = require(path.resolve(String(args.extra)));
    await step("extra steps", async () => extra({ page, base: url, step, shot, has }));
  }
  await step("no console errors / page errors / failed requests", async () => { if (problems.length) throw new Error(problems.slice(0, 5).join(" | ")); });

  await browser.close(); server.close();
  console.log(failed ? `\n${failed} step(s) FAILED - screenshots in ${shots}` : `\nALL STEPS PASSED - screenshots in ${shots}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
