"use strict";

const { app, ipcMain, BrowserWindow, protocol, shell, dialog, safeStorage } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const { guardApp } = require("../bader-license/guard");
const { registerAi } = require("./ai");
const { Store } = require("./db");

const isDev = !app.isPackaged;
const useBuild = app.isPackaged || process.env.BLR_USE_BUILD === "1";
const APP_ORIGIN = "app://blr";
const OUT_DIR = path.resolve(__dirname, "..", "out");

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".txt": "text/x-component", ".webp": "image/webp", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
};
const CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'";

protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

// Serves the static site through a private scheme: same origin on every launch (settings persist),
// and no network port is opened on the computer.
function registerAppProtocol() {
  protocol.handle("app", (request) => {
    try {
      const rel = decodeURIComponent(new URL(request.url).pathname);
      let filePath = path.resolve(OUT_DIR, "." + path.posix.normalize("/" + rel));
      if (filePath !== OUT_DIR && !filePath.startsWith(OUT_DIR + path.sep)) return new Response("Forbidden", { status: 403 });
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, "index.html");
      if (!fs.existsSync(filePath)) {
        const asHtml = path.join(OUT_DIR, rel.replace(/^\/+/, ""), "index.html");
        filePath = fs.existsSync(asHtml) ? asHtml : path.join(OUT_DIR, "index.html");
      }
      return new Response(fs.readFileSync(filePath), {
        headers: {
          "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": CSP,
        },
      });
    } catch {
      return new Response("Internal server error", { status: 500 });
    }
  });
}

let mainWin = null;
async function createWindow() {
  mainWin = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1000, minHeight: 640,
    title: "BLR Fatourati",
    backgroundColor: "#0b1220",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, "preload.js") },
  });
  mainWin.setMenuBarVisibility(false);
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWin.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(APP_ORIGIN + "/") && !/^http:\/\/localhost:3000\//.test(url)) e.preventDefault();
  });
  if (!useBuild) {
    await mainWin.loadURL("http://localhost:3000/");
    mainWin.webContents.openDevTools();
  } else {
    mainWin.webContents.on("devtools-opened", () => mainWin.webContents.closeDevTools());
    mainWin.webContents.on("before-input-event", (event, input) => {
      const k = (input.key || "").toLowerCase();
      if (k === "f12" || (input.control && input.shift && ["i", "j", "c"].includes(k))) event.preventDefault();
    });
    await mainWin.loadURL(`${APP_ORIGIN}/`);
  }
}

// ---- IPC: wraps every call as { ok, data } | { ok:false, error } ----
function handle(store, channel, fn) {
  ipcMain.handle(channel, async (_e, ...args) => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : "error" };
    }
  });
}

function registerIpc(store) {
  handle(store, "blr:db:list", (k) => store.list(k));
  handle(store, "blr:db:get", (k, id) => store.get(k, id));
  handle(store, "blr:db:save", (k, d) => store.save(k, d));
  handle(store, "blr:db:remove", (k, id) => store.remove(k, id));
  handle(store, "blr:db:batch", (ops) => store.batch(ops));
  handle(store, "blr:db:next", (n) => store.next(n));
  handle(store, "blr:db:audit", (a, d) => store.audit(a, d));

  handle(store, "blr:auth:has-users", () => store.hasUsers());
  handle(store, "blr:auth:setup", (p) => store.createFirstAdmin(p || {}));
  handle(store, "blr:auth:login", (u, p) => store.login(u, p));
  handle(store, "blr:auth:logout", () => store.logout());
  handle(store, "blr:auth:current", () => store.currentUser());
  handle(store, "blr:auth:users", () => store.listUsers());
  handle(store, "blr:auth:save-user", (u) => store.saveUser(u || {}));
  handle(store, "blr:auth:delete-user", (id) => store.deleteUser(id));
  handle(store, "blr:auth:change-password", (o, n) => store.changeOwnPassword(o, n));
  handle(store, "blr:auth:recover", (u, k, n) => store.resetWithRecovery(u, k, n));
  handle(store, "blr:auth:new-recovery", (pw) => store.newRecoveryKey(pw));

  const day = () => new Date().toISOString().slice(0, 10);
  handle(store, "blr:backup:export", async (password) => {
    const buf = store.exportBackup(password || "");
    const r = await dialog.showSaveDialog(mainWin, { defaultPath: `BLR-backup-${day()}.blrbak`, filters: [{ name: "BLR backup", extensions: ["blrbak"] }] });
    if (r.canceled || !r.filePath) return { saved: false };
    fs.writeFileSync(r.filePath, buf);
    return { saved: true, path: r.filePath };
  });
  handle(store, "blr:backup:restore", async (password) => {
    const r = await dialog.showOpenDialog(mainWin, { properties: ["openFile"], filters: [{ name: "BLR backup", extensions: ["blrbak"] }] });
    if (r.canceled || !r.filePaths[0]) return { restored: false };
    store.restoreBackup(fs.readFileSync(r.filePaths[0]), password || "");
    return { restored: true };
  });
  handle(store, "blr:backup:open-folder", () => shell.openPath(path.join(store.dir, "backups")));

  handle(store, "blr:file:save-text", async (name, text) => {
    const r = await dialog.showSaveDialog(mainWin, { defaultPath: String(name).replace(/[\\/:*?"<>|]/g, "_") });
    if (r.canceled || !r.filePath) return { saved: false };
    fs.writeFileSync(r.filePath, "﻿" + String(text), "utf8");
    return { saved: true, path: r.filePath };
  });
  handle(store, "blr:file:save-bytes", async (name, b64) => {
    const r = await dialog.showSaveDialog(mainWin, { defaultPath: String(name).replace(/[\\/:*?"<>|]/g, "_") });
    if (r.canceled || !r.filePath) return { saved: false };
    fs.writeFileSync(r.filePath, Buffer.from(String(b64), "base64"));
    return { saved: true, path: r.filePath };
  });
  handle(store, "blr:file:open-text", async (exts) => {
    const r = await dialog.showOpenDialog(mainWin, { properties: ["openFile"], filters: [{ name: "Files", extensions: Array.isArray(exts) ? exts : ["csv"] }] });
    if (r.canceled || !r.filePaths[0]) return null;
    const buf = fs.readFileSync(r.filePaths[0]);
    if (buf.length > 20 * 1024 * 1024) throw new Error("too-large");
    return { name: path.basename(r.filePaths[0]), base64: buf.toString("base64") };
  });

  // Printing / PDF: the document HTML is rendered in an invisible, script-less window.
  const withPrintWindow = async (html, fn) => {
    const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true, javascript: false, contextIsolation: true } });
    try {
      await w.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(String(html)));
      return await fn(w);
    } finally {
      w.destroy();
    }
  };
  const thermal = (o) => !!o && o.paper === "thermal";
  const printSize = (o) => (thermal(o) ? { width: 80000, height: 297000 } : "A4"); // print(): microns
  const pdfSize = (o) => (thermal(o) ? { width: 3.15, height: 11.7 } : "A4"); // printToPDF(): inches
  handle(store, "blr:print:printers", async () => {
    const list = await mainWin.webContents.getPrintersAsync();
    return list.map((p) => ({ name: p.name, displayName: p.displayName || p.name, isDefault: !!p.isDefault }));
  });
  // opts: { paper, deviceName, copies, dialog } — dialog:true shows the Windows print dialog, otherwise prints straight to the chosen printer
  handle(store, "blr:print:html", (html, opts) =>
    withPrintWindow(html, (w) => new Promise((resolve) => {
      const o = opts || {};
      const copies = Math.min(99, Math.max(1, parseInt(o.copies, 10) || 1));
      w.webContents.print(
        { silent: !o.dialog, printBackground: true, pageSize: printSize(o), copies, ...(o.deviceName ? { deviceName: String(o.deviceName) } : {}) },
        (ok, why) => resolve({ printed: ok, reason: why })
      );
    }))
  );
  handle(store, "blr:print:pdf", (html, name, opts) =>
    withPrintWindow(html, async (w) => {
      const pdf = await w.webContents.printToPDF({ printBackground: true, pageSize: pdfSize(opts), margins: { marginType: "none" } });
      const r = await dialog.showSaveDialog(mainWin, { defaultPath: String(name || "document.pdf").replace(/[\\/:*?"<>|]/g, "_"), filters: [{ name: "PDF", extensions: ["pdf"] }] });
      if (r.canceled || !r.filePath) return { saved: false };
      fs.writeFileSync(r.filePath, pdf);
      return { saved: true, path: r.filePath };
    })
  );

  handle(store, "blr:app:info", () => ({ version: app.getVersion(), platform: process.platform, dataDir: store.dir }));
  handle(store, "blr:app:open-external", (url) => {
    if (/^(https?:\/\/|mailto:|tel:)/i.test(String(url))) shell.openExternal(String(url));
    return true;
  });
}

if (!app.requestSingleInstanceLock()) app.quit();

app.whenReady().then(async () => {
  registerAppProtocol();
  const store = new Store(path.join(app.getPath("userData"), "data"));
  store.autoBackup();
  registerIpc(store);
  registerAi({ ipcMain, safeStorage, dataDir: store.dir });

  const license = await guardApp({ ipcMain, BrowserWindow, createWindow });
  if (app.isPackaged && license) {
    setInterval(async () => {
      try {
        const s = await license.status();
        if (!s.valid) { app.relaunch(); app.exit(0); }
      } catch {}
    }, 30 * 60 * 1000);
  }
  app.on("before-quit", () => store.close());
});

app.on("second-instance", () => {
  if (mainWin) { if (mainWin.isMinimized()) mainWin.restore(); mainWin.focus(); }
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
