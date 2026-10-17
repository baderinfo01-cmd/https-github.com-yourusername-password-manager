"use strict";
// Helpers for the e2e scripts: find Playwright + a Chromium binary, serve out/ exactly like electron-main.js does.
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { execSync } = require("node:child_process");

function loadPlaywright() {
  const tries = [
    () => require("playwright"),
    () => require(process.env.PLAYWRIGHT_PATH || "playwright-core"),
    () => require(path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "playwright")),
    () => require("/opt/node-tools/node_modules/playwright"),
  ];
  for (const t of tries) { try { return t(); } catch {} }
  throw new Error("Playwright not found. Install it (npm i -g playwright && npx playwright install chromium) or set PLAYWRIGHT_PATH.");
}

/** CHROME_PATH, a puppeteer-cached Chrome, or undefined (= Playwright's own Chromium). */
function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const base = path.join(process.env.HOME || "/root", ".cache", "puppeteer", "chrome");
  try {
    for (const v of fs.readdirSync(base).sort().reverse()) {
      const p = path.join(base, v, "chrome-linux64", "chrome");
      if (fs.existsSync(p)) return p;
    }
  } catch {}
  return undefined;
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/x-component", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon" };

// Mirrors electron-main.js registerAppProtocol: "/" -> ar/index.html, dir -> index.html, /x -> x/index.html, SPA fallback.
function serveOut(outDir, port = 0) {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let f = path.resolve(outDir, "." + path.posix.normalize("/" + rel));
    if (f !== outDir && !f.startsWith(outDir + path.sep)) { res.writeHead(403); return res.end(); }
    if (rel === "/" || rel === "") f = path.join(outDir, "ar", "index.html");
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    if (!fs.existsSync(f)) { const h = path.join(outDir, rel.replace(/^\/+/, ""), "index.html"); f = fs.existsSync(h) ? h : path.join(outDir, "ar", "index.html"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
    res.end(fs.readFileSync(f));
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { const k = argv[i].slice(2); o[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true; } else o._.push(argv[i]);
  }
  return o;
}
module.exports = { loadPlaywright, findChrome, serveOut, parseArgs };
