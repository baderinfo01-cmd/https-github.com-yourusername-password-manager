#!/usr/bin/env node
"use strict";
/**
 * Real Electron end-to-end test: main process + preload bridges + app:// protocol + licence guard (dev mode)
 * + encrypted vault persistence across two launches.
 *   xvfb-run -a node e2e_electron.cjs --app /path/to/app [--shots dir] [--electron /path/to/electron-binary]
 * Needs `npm run build` (out/) and `npm install` (electron binary). Root/containers: --no-sandbox is added.
 * Uses BADER_USE_BUILD=1 (serve out/ through app://, read by electron-main.js) and --user-data-dir (isolated profile).
 * The unpackaged app runs the licence in dev mode (valid, dev:true), so no activation window appears.
 * NOT covered (needs Windows): the packaged .exe, the real activation window + server, SmartScreen, printers.
 */
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { loadPlaywright, parseArgs } = require("./_pw.cjs");

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const app = path.resolve(String(args.app || "."));
  if (!fs.existsSync(path.join(app, "out", "ar", "index.html"))) { console.error("out/ not found - run `npm run build` first"); process.exit(2); }
  let exe = args.electron || process.env.ELECTRON_PATH;
  if (!exe) { try { exe = require(path.join(app, "node_modules", "electron")); } catch {} }
  if (!exe || !fs.existsSync(String(exe))) { console.error("electron binary not found: npm install in the app (or `node node_modules/electron/install.js`) or pass --electron <path>"); process.exit(2); }
  const shots = path.resolve(String(args.shots || path.join(app, "..", "e2e-shots-electron")));
  fs.mkdirSync(shots, { recursive: true });
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "app-e2e-"));
  const { _electron } = loadPlaywright();
  const PW = "Correct123";

  const launch = () => _electron.launch({ executablePath: String(exe), args: [app, "--no-sandbox", "--disable-gpu", `--user-data-dir=${data}`], env: { ...process.env, BADER_USE_BUILD: "1" } });
  let n = 0, failed = 0;
  const step = async (name, fn) => { try { await fn(); console.log("  ok   " + name); } catch (e) { failed++; console.log("  FAIL " + name + "\n       " + String(e.message).split("\n")[0]); } };
  const eq = (a, b, msg) => { if (a !== b) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

  // ---------- run 1: first launch ----------
  let electronApp = await launch();
  let page = await electronApp.firstWindow();
  const shot = (name) => page.screenshot({ path: path.join(shots, `${String(++n).padStart(2, "0")}-${name}.png`) });
  const problems = [];
  page.on("pageerror", (e) => problems.push(e.message));
  await page.waitForSelector('input[autocomplete="new-password"]', { timeout: 30000 });

  await step("window security: contextIsolation on, nodeIntegration off, sandbox on, no require/process in the page", async () => {
    const wp = await electronApp.evaluate(({ BrowserWindow }) => { const p = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(); return { c: p.contextIsolation, n: p.nodeIntegration, s: p.sandbox }; });
    eq(wp.c, true, "contextIsolation"); eq(wp.n, false, "nodeIntegration"); eq(wp.s, true, "sandbox");
    eq(await page.evaluate(() => typeof require + "/" + typeof process), "undefined/undefined", "page globals");
  });
  await step("bridges are exposed (baderLicense, baderAI, baderApp); dev (unpackaged) licence state is valid", async () => {
    eq(await page.evaluate(() => [typeof window.baderLicense?.status, typeof window.baderAI?.ask, typeof window.baderApp?.session].join()), "function,function,function", "bridges");
    const st = await page.evaluate(() => window.baderLicense.status());
    eq(st.valid, true, "license.valid"); eq(st.dev, true, "license.dev");
    const s = await page.evaluate(() => window.baderApp.session({ geo: false }));
    if (!s.device || !s.os || s.source !== "desktop") throw new Error("session info incomplete: " + JSON.stringify(s));
  });
  await step("app:// protocol: stable origin, CSP header, RSC .txt served as text/x-component, no path traversal", async () => {
    const r = await page.evaluate(async () => {
      const a = await fetch("/ar/"); const b = await fetch("/ar/accounts/__next._tree.txt");
      const c = await (await fetch("/%2e%2e/package.json")).text();
      return { csp: a.headers.get("content-security-policy"), ct: b.headers.get("content-type"), origin: location.origin, leaked: /"main"\s*:\s*"electron-main\.js"/.test(c) };
    });
    if (!/default-src 'self'/.test(r.csp || "")) throw new Error("no CSP on app:// responses");
    eq(r.ct, "text/x-component", ".txt content-type");
    if (!/^app:\/\/[a-z0-9-]+$/.test(r.origin)) throw new Error("origin is " + r.origin);
    eq(r.leaked, false, "package.json must not be served");
  });
  await step("external navigation and pop-ups are blocked (will-navigate handler + window.open)", async () => {
    // a real location.href change leaves Playwright waiting for the cancelled navigation, so ask the main process instead
    const origin = await page.evaluate(() => location.origin);
    const r = await electronApp.evaluate(({ BrowserWindow }, origin) => {
      const wc = BrowserWindow.getAllWindows()[0].webContents;
      const probe = (url) => { const ev = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }; wc.emit("will-navigate", ev, url); return ev.defaultPrevented; };
      return { external: probe("https://example.com/"), internal: probe(origin + "/ar/dashboard/") };
    }, origin);
    eq(r.external, true, "external URL must be blocked"); eq(r.internal, false, "app:// URL must be allowed");
    await page.evaluate(() => { window.open("about:blank"); });
    await page.waitForTimeout(500);
    eq(electronApp.windows().length, 1, "window count");
  });
  await step("create the vault, add an account (encrypted at rest)", async () => {
    const pw = page.locator('input[autocomplete="new-password"]');
    await pw.nth(0).fill(PW); await pw.nth(1).fill(PW);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector("aside nav", { timeout: 20000 });
    await page.locator('aside a[href*="/accounts"]').click();
    await page.getByRole("button", { name: /إضافة حساب|Add account|Ajouter un compte/ }).click();
    const dlg = page.locator('[role="dialog"]');
    await dlg.locator("input").first().fill("Persist Demo");
    await dlg.locator('input[autocomplete="off"]').nth(1).fill("zq81-secret-xyz");
    await dlg.getByRole("button", { name: /حفظ|Save|Enregistrer/ }).click();
    await page.waitForSelector("text=Persist Demo");
    const dump = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
    if (/Persist Demo|zq81-secret/.test(dump)) throw new Error("plaintext in localStorage");
    await shot("accounts");
  });
  await step("the main process can ask the UI to lock (screen lock / minimize / sleep wiring)", async () => {
    await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send("bader-app:lock"));
    await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
  });
  await step("no page errors in run 1", async () => { if (problems.length) throw new Error(problems.slice(0, 3).join(" | ")); });
  await electronApp.close();

  // ---------- run 2: same profile, the data must still be there ----------
  electronApp = await launch();
  page = await electronApp.firstWindow();
  await step("relaunch: login screen (not first-run), wrong password refused, correct one shows the saved account", async () => {
    await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 30000 });
    await page.fill('input[autocomplete="current-password"]', "wrong-Password1");
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('[role="alert"]');
    await page.fill('input[autocomplete="current-password"]', PW);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector("aside nav", { timeout: 20000 });
    await page.locator('aside a[href*="/accounts"]').click();
    await page.waitForSelector("text=Persist Demo");
    await shot("after-relaunch");
  });
  await step("security log kept the failed attempt across launches", async () => {
    await page.locator('aside a[href*="/security"]').click();
    await page.waitForSelector("text=/فشل|Failed|Échec/");
  });
  await electronApp.close();
  fs.rmSync(data, { recursive: true, force: true });

  console.log(failed ? `\n${failed} step(s) FAILED - screenshots in ${shots}` : `\nALL STEPS PASSED - screenshots in ${shots}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
