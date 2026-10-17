# Hard-won pitfalls (each cost real debugging time in BLR Fatourati)

## Electron / protocol / security
1. **`app://` + MIME**: Next's static export fetches RSC payloads `*.txt` (`__next._tree.txt`...). Serve `.txt` as `text/x-component` or client navigation silently breaks; also serve `/x/` -> `x/index.html` (trailingSlash) and fall back to `index.html`. `registerSchemesAsPrivileged` must run BEFORE `app.whenReady`. Resolve paths and reject anything outside `out/` (403).
2. **CSP** is set per response in the protocol handler: `default-src 'self'; script-src 'self' 'unsafe-inline'` (Next inlines bootstrap scripts), `img-src 'self' data: blob:` (logos, QR), `font-src 'self' data:`, `connect-src 'self'`. Adding any external host (analytics, CDN fonts) is blocked: bundle it.
3. **contextIsolation bridge**: expose only functions; never `ipcRenderer`; every handler returns `{ok,data}|{ok:false,error}` (the `handle()` wrapper) so rejected promises never leak stack traces. Add channels in three places (main, preload, `Bridge` type + web stand-in) or the page works in the browser and fails in Electron (or vice versa).
4. **Session stays in the main process** (`Store.session`); the page's `authState` is only a mirror, re-derived by `boot()` on load. Restoring a backup resets the session.
5. **Sandboxed iframes need `allow-same-origin`** to measure height; never add `allow-scripts`. Print windows are `javascript:false` + `sandbox:true` and cannot load app fonts -> embed them (`withFont`).
6. `will-navigate`/`setWindowOpenHandler`: deny, open http(s) externally only; block F12/Ctrl+Shift+I in packaged mode; single-instance lock.
7. `node:sqlite` needs Node >= 22.13 (tests, CI) - older 22.x needs `--experimental-sqlite`. `DatabaseSync` is synchronous: keep queries small, use `batch`.
8. Passwords: scrypt + per-user salt, `timingSafeEqual`, dummy hash for unknown users, throttling; recovery key shown once (hash only). Never log secrets or put them in audit details.
9. Linux/root e2e: Electron needs `--no-sandbox`, `xvfb-run`; set `APP_USER_DATA` or you pollute a real profile and trip the single-instance lock.

## UI / i18n / money
10. **Dictionary triples** `[ar,en,fr]`, placeholders identical in all three; `t(key)` falls back to English then the key. Dynamic keys (`t("role_"+x)`, `t("err_"+code)`) are invisible to static checks: list their families in `dict.test.mts`.
11. **RTL/bidi**: money via `formatNumber` (LRI/PDI isolates), `.num` class, logical CSS classes; mixed Latin names in `dir="auto"`. Tests assert the isolate characters.
12. `Intl.NumberFormat("en-US")` + replace `,` with a space: locale-dependent output differs between Electron/Node/ICU builds; do not use `toLocaleString()` for money. Dates: local ISO strings via `toIso`, never `toISOString().slice(0,10)` (UTC shift).
13. Numeric inputs are strings while typing ("12,5"): always `num()` before saving; keep `inputMode="decimal"`.
14. Static export: no `next/image` optimisation, no API routes, no dynamic route params without `generateStaticParams` -> use query strings; `useSearchParams` needs `<Suspense>` or the build fails.
15. `next/font/google` downloads fonts at build time (breaks offline/proxied builds): use the bundled woff2 + `@font-face` (template).
16. Known BLR leftovers not to copy: the recovery-key text file writes literal `\r\n` (template fixes it with real escapes); BLR `useUi` stores colour themes (not in template).

## Business logic
17. Stock: persist `stockApplied` per document and apply only the delta on every save; credit notes and purchases add, invoices/deliveries subtract; services consume `materials`; deleting a doc reverses it. Doing "subtract on save" twice double-counts.
18. Totals: round once at the end (2 dp) and recompute on save; tolerance 0.005 for "paid"; stamp duty only for cash.
19. Numbering must come from the main-process counter inside the same logical save; never derive it from `docs.length`.
20. Recurring runs on load and must advance `nextDate` after each created doc (idempotent), with a guard on iterations.

## Packaging / CI / license
21. electron-builder `files` list: forgetting `bader-license/**/*` or `out/**/*` yields a launching-but-blank or unlicensed app. `build/icon.png` and `package-lock.json` must not be git-ignored. `npmRebuild:false`.
22. **NSIS "output file is locked"** on OneDrive/Desktop/antivirus: build in `C:\dev\<app>`; exclude from Defender; delete `dist/` first.
23. CI: `npm ci` needs the lock; `gh release delete --cleanup-tag || true` before create makes re-runs idempotent; `permissions: contents: write`; one tag per program in a shared repo. The workflow only triggers from the repo-root `.github/workflows/`.
24. **License**: wrong `product_id`/`public_key`/`server_url` all show "invalid code" - run `license:doctor`; stale `license.dat` after changing config; never edit device-id.js/license.js; max_offline_days 0 for lifetime-offline; a revoked license only stops when the device next reaches the server.
25. Windows installer name with Arabic characters can break NSIS/artifact paths: keep `productName` ASCII, show the Arabic name inside the app (`BRAND`, window title).
26. Data lives in `%APPDATA%/<package name>`: renaming `name` in package.json later orphans customer data. Decide the slug once.
