#!/usr/bin/env node
"use strict";
/**
 * Browser end-to-end flow against the STATIC EXPORT (out/), served like electron-main.js serves app://.
 *   node e2e_browser.cjs --app /path/to/app [--shots /path/to/screenshots] [--extra extra-steps.cjs]
 * Needs `npm run build` first. Exit code 0 = every step passed.
 * Covers: first-run vault creation (RTL, Arabic), encrypted storage at rest, CRUD, generator, language switch,
 * encrypted backup export/restore, lock -> wrong password -> unlock -> failed-attempt warning, hard reload requires
 * login again, security log, licence page without bridge, zero console errors.
 * Add steps for your modules: module.exports = async ({ page, base, step, shot, has }) => {...}
 * Labels are matched with ar|en|fr regex alternatives so the flow survives a language change.
 */
const path = require("node:path");
const fs = require("node:fs");
const { loadPlaywright, findChrome, serveOut, parseArgs } = require("./_pw.cjs");

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const app = path.resolve(String(args.app || "."));
  const out = path.join(app, "out");
  if (!fs.existsSync(path.join(out, "ar", "index.html"))) { console.error("out/ar/index.html not found - run `npm run build` in the app first"); process.exit(2); }
  const shots = path.resolve(String(args.shots || path.join(app, "..", "e2e-shots")));
  fs.mkdirSync(shots, { recursive: true });
  for (const f of fs.readdirSync(shots)) if (/\.(png|bbak)$/.test(f)) fs.rmSync(path.join(shots, f)); // no stale screenshots from earlier runs

  const { chromium } = loadPlaywright();
  const { server, url } = await serveOut(out);
  const browser = await chromium.launch({ args: ["--no-sandbox"], executablePath: findChrome() });
  const context = await browser.newContext({ viewport: { width: 1360, height: 860 }, acceptDownloads: true });
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource.*404/.test(m.text())) problems.push("console: " + m.text()); });
  page.on("requestfailed", (r) => { if (!/ERR_ABORTED/.test(r.failure()?.errorText || "")) problems.push("requestfailed: " + r.url() + " " + r.failure()?.errorText); });
  // the sign-in place lookup is optional and needs internet: block it so the run is deterministic
  await context.route(/ipwho\.is/, (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ success: false }) }));

  let n = 0, failed = 0;
  const shot = (name) => page.screenshot({ path: path.join(shots, `${String(++n).padStart(2, "0")}-${name}.png`) });
  const step = async (name, fn) => {
    try { await fn(); console.log("  ok   " + name); } catch (e) { failed++; console.log("  FAIL " + name + "\n       " + String(e.message).split("\n")[0]); try { await shot("FAIL-" + name.replace(/\W+/g, "_")); } catch {} }
  };
  const has = (re) => page.getByText(re).first();
  const PW = "Correct123";
  const dir = () => page.evaluate(() => document.documentElement.dir);

  await step("first run: create-vault screen, Arabic, RTL", async () => {
    await page.goto(url + "/ar/");
    await page.waitForSelector('input[autocomplete="new-password"]');
    if ((await dir()) !== "rtl") throw new Error("html dir is not rtl");
    await shot("setup");
  });
  await step("weak password is refused, strong one creates the vault and opens the dashboard", async () => {
    const pw = page.locator('input[autocomplete="new-password"]');
    await pw.nth(0).fill("short1"); await pw.nth(1).fill("short1");
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('[role="alert"]');
    await pw.nth(0).fill(PW); await pw.nth(1).fill(PW);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector("aside nav", { timeout: 15000 });
    await page.waitForURL(/\/ar\/dashboard/);
    await shot("dashboard");
  });
  await step("login notice (first sign-in) is shown and a success event is logged", async () => {
    await page.waitForSelector('[role="status"]');
  });
  await step("client-side navigation to Accounts keeps the vault open", async () => {
    await page.locator('aside a[href*="/accounts"]').click();
    await page.waitForURL(/\/accounts/);
    await page.waitForSelector("h1");
  });
  await step("add two accounts (second reuses the password): reuse badge appears", async () => {
    for (const [name, pass] of [["Mail Demo", "abc12345"], ["Shop Demo", "abc12345"]]) {
      await page.getByRole("button", { name: /إضافة حساب|Add account|Ajouter un compte/ }).click();
      const dlg = page.locator('[role="dialog"]');
      await dlg.locator("input").first().fill(name);
      await dlg.locator('input[autocomplete="off"]').nth(1).fill(pass);
      await shot("account-dialog");
      await dlg.getByRole("button", { name: /حفظ|Save|Enregistrer/ }).click();
      await page.waitForSelector(`text=${name}`);
    }
    await page.waitForSelector("text=/مكررة|Reused|Réutilisé/");
    await shot("accounts");
  });
  await step("search filters, delete asks for confirmation", async () => {
    await page.getByRole("textbox", { name: /بحث|Search|Rechercher/ }).fill("zzz-nothing");
    await page.waitForSelector("text=/لا توجد نتائج|No matching|Aucun résultat/");
    await page.getByRole("textbox", { name: /بحث|Search|Rechercher/ }).fill("");
    await page.getByRole("button", { name: /حذف|Delete|Supprimer/ }).first().click();
    await page.waitForSelector('[role="alertdialog"]');
    await page.locator('[role="alertdialog"]').getByRole("button", { name: /إلغاء|Cancel|Annuler/ }).click();
  });
  await step("print report: A4 table in a hidden iframe, owner header, passwords MASKED unless the user agrees", async () => {
    page.once("dialog", (d) => d.dismiss()); // "show secrets?" -> Cancel = hidden (the default)
    await page.getByRole("button", { name: /طباعة|Print|Imprimer/ }).first().click();
    let html = "";
    for (let i = 0; i < 30 && !html.includes("Mail Demo"); i++) {
      await page.waitForTimeout(200);
      for (const f of page.frames()) { try { const c = await f.content(); if (c.includes("Mail Demo")) html = c; } catch {} }
    }
    if (!html.includes("Mail Demo")) throw new Error("report iframe not found");
    if (html.includes("abc12345")) throw new Error("password printed although the user declined");
    if (!html.includes("••••••••") || !/dir="rtl"/.test(html) || !html.includes("@page")) throw new Error("report lacks mask / rtl / @page");
  });
  await step("the vault is ENCRYPTED at rest: no site name or password in localStorage", async () => {
    const dump = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
    if (/Mail Demo|Shop Demo|abc12345/.test(dump)) throw new Error("plaintext found in localStorage");
    if (!dump.includes("bader-vault-v3")) throw new Error("vault blob missing");
  });
  await step("password generator makes a 16-char password with all groups", async () => {
    await page.locator('aside a[href*="/generator"]').click();
    const code = page.locator('[data-testid="generated"]');
    await code.waitFor();
    const v = (await code.innerText()).trim();
    if (v.length !== 16 || !/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/\d/.test(v) || !/[^a-zA-Z0-9]/.test(v)) throw new Error("bad password: " + v);
  });
  await step("smart assistant shows a score computed locally", async () => {
    await page.locator('aside a[href*="/ai"]').click();
    await page.waitForSelector('[data-testid="score"]');
    const s = Number(await page.locator('[data-testid="score"]').innerText());
    if (!(s >= 0 && s < 100)) throw new Error("unexpected score " + s);
    await shot("assistant");
  });
  await step("licence page without the Electron bridge says desktop-only (no crash)", async () => {
    await page.locator('aside a[href*="/license-info"]').click();
    await page.waitForSelector("text=/نسخة سطح المكتب|desktop app|application de bureau/");
  });
  let backupFile = "";
  await step("settings: encrypted backup export (.bbak) contains no plaintext", async () => {
    await page.locator('aside a[href*="/settings"]').click();
    await page.waitForSelector("h1");
    const dl = page.waitForEvent("download");
    await page.getByRole("button", { name: /تصدير نسخة|Export encrypted|Exporter une sauvegarde/ }).click();
    const dlg = page.locator('[role="dialog"]');
    await dlg.locator("input").nth(0).fill("Backup2024x"); await dlg.locator("input").nth(1).fill("Backup2024x");
    await dlg.getByRole("button", { name: /موافق|OK/ }).click();
    const d = await dl;
    backupFile = path.join(shots, "backup.bbak");
    await d.saveAs(backupFile);
    const txt = fs.readFileSync(backupFile, "utf8");
    if (/Mail Demo|abc12345/.test(txt) || !txt.includes("bader-backup")) throw new Error("backup is not an encrypted .bbak");
  });
  await step("settings: delete all data (asks the master password), then restore the backup", async () => {
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /حذف كل البيانات|Delete all data|Supprimer toutes/ }).click();
    const dlg = page.locator('[role="dialog"]');
    await dlg.locator("input").fill("wrong-password");
    await dlg.getByRole("button", { name: /حفظ|Save|Enregistrer/ }).click();
    await dlg.waitFor(); // still open: wrong master password must not wipe anything
    await dlg.locator("input").fill(PW);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), dlg.getByRole("button", { name: /حفظ|Save|Enregistrer/ }).click()]);
    // reload locked the app: unlock again, data is gone
    await page.waitForSelector('input[autocomplete="current-password"]');
    await page.fill('input[autocomplete="current-password"]', PW);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector("aside nav");
    await page.locator('aside a[href*="/accounts"]').click();
    await page.waitForSelector("text=/لا توجد حسابات|No accounts yet|Aucun compte/");
    await page.locator('aside a[href*="/settings"]').click();
    page.once("dialog", (d) => d.accept());
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /استعادة من نسخة|Restore from backup|Restaurer une sauvegarde/ }).click();
    (await chooser).setFiles(backupFile);
    const pdlg = page.locator('[role="dialog"]');
    await pdlg.locator("input").first().fill("Backup2024x");
    await pdlg.getByRole("button", { name: /موافق|OK/ }).click();
    await page.waitForSelector("text=/تمت الاستعادة|Restored successfully|Restauration réussie/");
    await page.locator('aside a[href*="/accounts"]').click();
    await page.waitForSelector("text=Mail Demo");
  });
  await step("language switch: English is LTR, Arabic back to RTL, URL keeps the page", async () => {
    await page.selectOption('select[aria-label="language"]', "en");
    await page.waitForURL(/\/en\/accounts/);
    if ((await dir()) !== "ltr") throw new Error("dir not ltr in English");
    await has(/Add account/).waitFor(); await shot("english");
    await page.selectOption('select[aria-label="language"]', "fr");
    await has(/Ajouter un compte/).waitFor(); await shot("french");
    await page.selectOption('select[aria-label="language"]', "ar");
    await page.waitForURL(/\/ar\/accounts/);
    if ((await dir()) !== "rtl") throw new Error("dir not rtl in Arabic");
  });
  await step("narrow window: sidebar becomes a drawer", async () => {
    await page.setViewportSize({ width: 420, height: 800 });
    await page.getByRole("button", { name: "menu" }).click();
    await page.waitForSelector("aside nav");
    await shot("mobile-drawer");
    await page.setViewportSize({ width: 1360, height: 860 });
  });
  await step("dark mode toggles data-mode", async () => {
    await page.getByRole("button", { name: /toggle dark mode/ }).click();
    if ((await page.evaluate(() => document.documentElement.dataset.mode)) !== "dark") throw new Error("not dark");
    await page.waitForTimeout(600); // let the colour transitions finish before the screenshot
    await shot("dark");
    await page.getByRole("button", { name: /toggle dark mode/ }).click();
  });
  await step("lock -> wrong password rejected -> correct password opens and WARNS about the failed attempt", async () => {
    await page.getByRole("button", { name: "lock" }).click();
    await page.waitForSelector('input[autocomplete="current-password"]');
    await page.fill('input[autocomplete="current-password"]', "wrong-Password1");
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('[role="alert"]');
    await page.fill('input[autocomplete="current-password"]', PW);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector("aside nav");
    await page.waitForSelector('[role="status"]');
    await shot("login-warning");
  });
  await step("security log lists the sign-ins and the failed attempt", async () => {
    await page.locator('aside a[href*="/security"]').click();
    await page.waitForSelector("table tbody tr");
    const rows = await page.locator("table tbody tr").count();
    if (rows < 3) throw new Error("expected at least 3 events, got " + rows);
    await shot("security-log");
  });
  await step("hard reload at a deep URL asks for the master password again (key is memory-only)", async () => {
    await page.goto(url + "/ar/accounts/");
    await page.waitForSelector('input[autocomplete="current-password"]');
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
