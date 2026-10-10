const { app, ipcMain, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

const { guardApp } = require("./bader-license/guard");
const { registerAi } = require("./electron-ai");

let staticServer = null;

const isDev = !app.isPackaged;

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
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

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const outDir = path.resolve(__dirname, "out");

    if (!fs.existsSync(outDir)) {
      reject(
        new Error(
          "The out directory was not found. Run npm run build before starting Electron."
        )
      );
      return;
    }

    staticServer = http.createServer((req, res) => {
      try {
        const requestUrl = decodeURIComponent(req.url.split("?")[0]);

        let filePath = path.resolve(outDir, "." + path.posix.normalize("/" + requestUrl));

        // never serve anything outside the build folder
        if (filePath !== outDir && !filePath.startsWith(outDir + path.sep)) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }

        if (requestUrl === "/" || requestUrl === "") {
          filePath = path.join(outDir, "ar", "index.html");
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, "index.html");
        }

        if (!fs.existsSync(filePath)) {
          const cleanUrl = requestUrl.replace(/^\/+/, "");
          const possibleIndex = path.join(outDir, cleanUrl, "index.html");

          if (fs.existsSync(possibleIndex)) {
            filePath = possibleIndex;
          } else {
            filePath = path.join(outDir, "ar", "index.html");
          }
        }

        const content = fs.readFileSync(filePath);
        res.writeHead(200, {
          "Content-Type": getMimeType(filePath),
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy":
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'"
        });
        res.end(content);
      } catch (error) {
        res.writeHead(500);
        res.end("Internal server error");
      }
    });

    staticServer.listen(0, "127.0.0.1", () => {
      const address = staticServer.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });

    staticServer.on("error", reject);
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
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+/.test(url)) event.preventDefault();
  });

  if (isDev) {
    await win.loadURL("http://localhost:3000/ar");
    win.webContents.openDevTools();
  } else {
    const serverUrl = await startStaticServer();
    await win.loadURL(`${serverUrl}/ar/`);
  }
}

app.whenReady().then(() => {
  registerAi(ipcMain);
  guardApp({
    ipcMain,
    BrowserWindow,
    createWindow
  });
});

app.on("window-all-closed", () => {
  if (staticServer) {
    staticServer.close();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (staticServer) {
    staticServer.close();
  }
});