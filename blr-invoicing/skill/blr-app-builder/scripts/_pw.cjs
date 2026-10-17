"use strict";
// Locates the Playwright package wherever it is installed (project, global, or PLAYWRIGHT_PATH) and
// provides a tiny static file server for the exported site (out/).
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { execSync } = require("node:child_process");

function loadPlaywright() {
  const tries = [() => require("playwright"), () => require(process.env.PLAYWRIGHT_PATH || "playwright-core"),
    () => require(path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "playwright")),
    () => require("/opt/node-tools/node_modules/playwright")];
  for (const t of tries) { try { return t(); } catch {} }
  throw new Error("Playwright not found. Install it (npm i -g playwright && npx playwright install chromium) or set PLAYWRIGHT_PATH.");
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/x-component", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon" };
// Mirrors electron/main.js: file -> dir/index.html -> /x/ -> x/index.html -> SPA fallback
function serveOut(outDir, port = 0) {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let f = path.join(outDir, path.normalize(rel));
    if (!f.startsWith(outDir)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    if (!fs.existsSync(f)) f = path.join(outDir, rel.replace(/^\/+/, ""), "index.html");
    if (!fs.existsSync(f)) f = path.join(outDir, "index.html");
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
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
module.exports = { loadPlaywright, serveOut, parseArgs };
