#!/usr/bin/env node
"use strict";
/**
 * Real Electron end-to-end test (main process + preload bridge + SQLite + app:// protocol + PDF printing).
 *   xvfb-run -a node e2e_electron.cjs --app /path/to/app [--shots dir] [--electron /path/to/electron-binary]
 * Needs `npm run build` (out/) and `npm install` (electron). Linux/CI runs as root => --no-sandbox is added.
 * It launches the app TWICE on the same temp data folder to prove the data really persists in SQLite.
 * Uses APP_USE_BUILD=1 (serve out/ through app://) and APP_USER_DATA (isolated data folder): both are read by electron/main.js.
 * The unpackaged app runs the license in dev mode (valid, dev:true) so no activation window appears.
 */
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { loadPlaywright, parseArgs } = require("./_pw.cjs");

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const app = path.resolve(String(args.app || "."));
  if (!fs.existsSync(path.join(app, "out", "index.html"))) { console.error("out/ not found - run `npm run build` first"); process.exit(2); }
  let exe = args.electron || process.env.ELECTRON_PATH;
  if (!exe) { try { exe = require(path.join(app, "node_modules", "electron")); } catch {} }
  if (!exe || !fs.existsSync(String(exe))) { console.error("electron binary not found: npm install in the app (without ELECTRON_SKIP_BINARY_DOWNLOAD) or pass --electron <path>"); process.exit(2); }
  const shots = path.resolve(String(args.shots || path.join(app, "..", "e2e-shots-electron")));
  fs.mkdirSync(shots, { recursive: true });
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "app-e2e-"));
  const { _electron } = loadPlaywright();

  const launch = () => _electron.launch({ executablePath: String(exe), args: [app, "--no-sandbox", "--disable-gpu"], env: { ...process.env, APP_USE_BUILD: "1", APP_USER_DATA: data } });
  let n = 0, failed = 0;
  const step = async (name, fn) => { try { await fn(); console.log("  ok   " + name); } catch (e) { failed++; console.log("  FAIL " + name + "\n       " + String(e.message).split("\n")[0]); } };
  const eq = (a, b, msg) => { if (a !== b) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

  // ---------- run 1 ----------
  let electronApp = await launch();
  let page = await electronApp.firstWindow();
  const shot = (name) => page.screenshot({ path: path.join(shots, `${String(++n).padStart(2, "0")}-${name}.png`) });
  const problems = [];
  page.on("pageerror", (e) => problems.push(e.message));
  await page.waitForSelector("form", { timeout: 30000 });

  await step("window security: contextIsolation on, nodeIntegration off, sandbox on, no require/process in the page", async () => {
    const wp = await electronApp.evaluate(({ BrowserWindow }) => { const p = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(); return { c: p.contextIsolation, n: p.nodeIntegration, s: p.sandbox }; });
    eq(wp.c, true, "contextIsolation"); eq(wp.n, false, "nodeIntegration"); eq(wp.s, true, "sandbox");
    eq(await page.evaluate(() => typeof require + "/" + typeof process), "undefined/undefined", "page globals");
  });
  await step("bridge + license bridge are exposed; dev (unpackaged) license state is valid", async () => {
    eq(await page.evaluate(() => typeof window.bridge?.db?.list), "function", "window.bridge.db.list");
    const st = await page.evaluate(() => window.baderLicense.status());
    eq(st.valid, true, "license.valid"); eq(st.dev, true, "license.dev");
  });
  await step("app:// protocol: CSP header present and RSC .txt payloads served as text/x-component", async () => {
    const r = await page.evaluate(async () => { const a = await fetch("/"); const b = await fetch("/items/__next._tree.txt"); return { csp: a.headers.get("content-security-policy"), ct: b.headers.get("content-type"), origin: location.origin }; });
    if (!/default-src 'self'/.test(r.csp || "")) throw new Error("no CSP on app:// responses");
    eq(r.ct, "text/x-component", ".txt content-type");
    if (!r.origin.startsWith("app://")) throw new Error("origin is " + r.origin);
  });
  await step("not signed in: db calls are refused with the {ok:false,error} shape", async () => {
    const r = await page.evaluate(() => window.bridge.db.save("items", { name: "x" }));
    eq(r.ok, false, "ok"); eq(r.error, "not-signed-in", "error");
  });
  await step("create admin (scrypt in main), recovery key dialog, dashboard", async () => {
    await page.fill('input[autocomplete="username"]', "admin");
    const pw = page.locator('input[autocomplete="new-password"]');
    await pw.nth(0).fill("secret123"); await pw.nth(1).fill("secret123");
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector("text=/[A-Z2-9]{4}(-[A-Z2-9]{4}){4}/");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: /متابعة|Continue|Continuer/ }).click();
    await page.waitForSelector("aside nav");
    await shot("dashboard");
  });
  await step("users kind is private; items CRUD through the real SQLite", async () => {
    eq((await page.evaluate(() => window.bridge.db.list("users"))).error, "forbidden", "users list");
    await page.locator('aside a[href="/items/"]').click();
    await page.getByRole("button", { name: /إضافة صنف|Add item|Ajouter un article/ }).click();
    await page.locator('[role="dialog"] input').first().fill("Electron Item");
    await page.locator('[role="dialog"]').getByRole("button", { name: /حفظ|Save|Enregistrer/ }).click();
    await page.waitForSelector("td:has-text('Electron Item')");
    const l = await page.evaluate(() => window.bridge.db.list("items"));
    eq(l.ok && l.data.length, 1, "items in db");
    await shot("items");
  });
  await step("print: printers list works; PDF export writes a real PDF (Arabic text, hidden script-less window)", async () => {
    const pdfPath = path.join(data, "out.pdf");
    await electronApp.evaluate(({ dialog }, p) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: p }); }, pdfPath);
    eq((await page.evaluate(() => window.bridge.print.printers())).ok, true, "printers ok");
    const html = '<!doctype html><html dir="rtl"><head><meta charset="utf-8"></head><body><h1>فاتورة تجريبية</h1><p>1 500.50 DA</p></body></html>';
    const r = await page.evaluate((h) => window.bridge.print.pdf(h, "t.pdf", { paper: "a4" }), html);
    eq(r.ok && r.data.saved, true, "pdf saved");
    const buf = fs.readFileSync(pdfPath);
    if (buf.subarray(0, 4).toString() !== "%PDF" || buf.length < 1000) throw new Error("not a valid PDF: " + buf.length + " bytes");
  });
  await step("encrypted backup export + wrong-password restore refused", async () => {
    const bak = path.join(data, "b.dbbak");
    await electronApp.evaluate(({ dialog }, p) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: p }); dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [p] }); }, bak);
    eq((await page.evaluate(() => window.bridge.backup.export("pw-12345"))).data.saved, true, "export");
    const r = await page.evaluate(() => window.bridge.backup.restore("wrong"));
    eq(r.ok, false, "restore with wrong password must fail"); eq(r.error, "wrong-password", "error");
  });
  await step("renderer cannot navigate away (will-navigate guard)", async () => {
    await page.evaluate(() => { location.href = "https://example.com/"; });
    await page.waitForTimeout(600);
    if (!page.url().startsWith("app://")) throw new Error("navigated to " + page.url());
  });
  await electronApp.close();

  // ---------- run 2: same data folder ----------
  electronApp = await launch();
  page = await electronApp.firstWindow();
  page.on("pageerror", (e) => problems.push(e.message));
  await step("relaunch: data persisted, login required, item still there", async () => {
    await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 30000 });
    await page.fill('input[autocomplete="username"]', "admin");
    await page.fill('input[autocomplete="current-password"]', "secret123");
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector("aside nav");
    await page.locator('aside a[href="/items/"]').click();
    await page.waitForSelector("td:has-text('Electron Item')");
    await shot("after-relaunch");
  });
  await step("no uncaught page errors", async () => { if (problems.length) throw new Error(problems.slice(0, 3).join(" | ")); });
  await electronApp.close();
  fs.rmSync(data, { recursive: true, force: true });
  console.log(failed ? `\n${failed} step(s) FAILED` : `\nALL STEPS PASSED - screenshots in ${shots}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
