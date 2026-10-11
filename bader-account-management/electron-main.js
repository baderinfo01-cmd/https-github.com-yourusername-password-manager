const { app, ipcMain, BrowserWindow, powerMonitor, protocol, shell } = require("electron");
const os = require("os");
const path = require("path");
const fs = require("fs");

const { guardApp } = require("./bader-license/guard");
const { registerAi } = require("./electron-ai");

const isDev = !app.isPackaged;
// BADER_USE_BUILD=1 lets you test the built site (out/) without packaging
const useBuild = app.isPackaged || process.env.BADER_USE_BUILD === "1";

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    // Next.js static-export navigation payloads: without this type Next falls back to a full page reload
    ".txt": "text/x-component",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf"
  };

  return types[ext] || "application/octet-stream";
}

// The built site is served through a private "app://" scheme instead of a localhost web server.
// 1) the origin is the SAME on every launch, so the encrypted vault in localStorage persists
//    (a random localhost port would give a new, empty storage each time);
// 2) no network port is opened, so nothing else on the machine can reach the app's files.
const APP_ORIGIN = "app://bader";
const OUT_DIR = path.resolve(__dirname, "out");

const CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

function registerAppProtocol() {
  protocol.handle("app", (request) => {
    try {
      const url = new URL(request.url);
      let rel = decodeURIComponent(url.pathname);
      let filePath = path.resolve(OUT_DIR, "." + path.posix.normalize("/" + rel));

      // never serve anything outside the build folder
      if (filePath !== OUT_DIR && !filePath.startsWith(OUT_DIR + path.sep)) {
        return new Response("Forbidden", { status: 403 });
      }
      if (rel === "/" || rel === "") filePath = path.join(OUT_DIR, "ar", "index.html");
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
      if (!fs.existsSync(filePath)) {
        const asHtml = path.join(OUT_DIR, rel.replace(/^\/+/, ""), "index.html");
        filePath = fs.existsSync(asHtml) ? asHtml : path.join(OUT_DIR, "ar", "index.html");
      }
      return new Response(fs.readFileSync(filePath), {
        status: 200,
        headers: {
          "Content-Type": getMimeType(filePath),
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": CSP
        }
      });
    } catch (error) {
      return new Response("Internal server error", { status: 500 });
    }
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Bader Account Management",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "electron-preload.js")
    }
  });

  // block pop-ups and navigation away from the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    // external web links open in the system browser; everything else is refused
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(APP_ORIGIN + "/") && !/^http:\/\/localhost:3000\//.test(url)) event.preventDefault();
  });

  // hide the window contents from screenshots / screen sharing in the packaged app
  if (!isDev) win.setContentProtection(true);

  const lockUi = () => {
    if (!win.isDestroyed()) win.webContents.send("bader-app:lock");
  };
  win.on("minimize", lockUi);
  powerMonitor.on("lock-screen", lockUi);
  powerMonitor.on("suspend", lockUi);

  if (!useBuild) {
    await win.loadURL("http://localhost:3000/ar");
    win.webContents.openDevTools();
  } else {
    // no developer tools in the shipped app
    win.webContents.on("devtools-opened", () => win.webContents.closeDevTools());
    win.webContents.on("before-input-event", (event, input) => {
      const k = (input.key || "").toLowerCase();
      if (k === "f12" || (input.control && input.shift && ["i", "j", "c"].includes(k))) {
        event.preventDefault();
      }
    });
    await win.loadURL(`${APP_ORIGIN}/ar/`);
  }
}

// ---- sign-in information (device + optional approximate place by IP) ----
let geoCache = { at: 0, data: {} };
async function lookupGeo() {
  if (Date.now() - geoCache.at < 10 * 60 * 1000) return geoCache.data;
  try {
    const r = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(5000) });
    const j = await r.json();
    if (j && j.success !== false && j.ip) {
      geoCache = { at: Date.now(), data: { ip: j.ip, city: j.city, region: j.region, country: j.country } };
    }
  } catch (e) {
    /* offline: the event is logged without a place */
  }
  return geoCache.data;
}

ipcMain.handle("bader-app:session", async (_e, opts) => {
  const info = {
    device: os.hostname(),
    os: `${process.platform === "win32" ? "Windows" : process.platform === "darwin" ? "macOS" : "Linux"} ${os.release()} (${os.arch()})`,
    app: app.getVersion(),
    source: "desktop"
  };
  if (opts && opts.geo) Object.assign(info, await lookupGeo());
  return info;
});

app.whenReady().then(async () => {
  registerAppProtocol();
  registerAi(ipcMain);
  const license = await guardApp({
    ipcMain,
    BrowserWindow,
    createWindow
  });

  // While the app runs, re-verify the license regularly. If it is revoked,
  // expired or cannot be verified any more, restart into the activation window.
  if (app.isPackaged && license) {
    setInterval(async () => {
      try {
        const s = await license.status();
        if (!s.valid) {
          app.relaunch();
          app.exit(0);
        }
      } catch (e) {
        /* keep running; the next tick will retry */
      }
    }, 30 * 60 * 1000);
  }
});

// a single running copy only
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
