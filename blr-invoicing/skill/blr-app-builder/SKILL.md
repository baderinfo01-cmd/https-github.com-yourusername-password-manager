---
name: blr-app-builder
description: Build new Windows desktop business programs (invoicing, accounting, POS, inventory, CRM, booking, any "برنامج مكتبي / تطبيق إدارة") quickly and consistently from the proven BLR Fatourati architecture - Next.js static export + Electron + built-in node:sqlite, Arabic-first RTL with ar/en/fr dictionary, roles and scrypt login with recovery key, encrypted backups, print preview/PDF, per-device Ed25519 licensing (bader-license / BaderProgLicense), NSIS installer built by GitHub Actions, optional Android via Capacitor. Use when the user asks to create, clone, scaffold or "make a program like BLR Fatourati", add a module/page/entity/report to such an app, wire licensing or product_id, fix Electron/app:// protocol/print/RTL/NSIS/CI problems in it, or package/release it. Do NOT use to edit BLR Fatourati itself unless explicitly asked.
---

# BLR App Builder

Creates sibling programs of **BLR Fatourati** (`blr-invoicing/`, owner Bader Eddine Hamidane / Baderinfo) from a verified, generic template. The template already passes `npm install && typecheck && test && build`, a Playwright browser flow and an Electron e2e flow.

## 1. When to use / not use
Use: new desktop business app; "same as BLR but for X"; add module/entity/page/report; licensing/product id; print/PDF/Arabic/RTL; installer/CI/release; Android companion.
Do not use: web SaaS/server apps, mobile-only apps (see references/mobile-android.md), or modifying BLR Fatourati when the task is about a different product.

## 2. SAFETY - do not break the existing app (read first)
- **Never edit `blr-invoicing/` to build another product.** Scaffold into a NEW folder outside it (`~/dev/<slug>` or a new repo). `scripts/new_app.py` refuses destinations inside BLR.
- This skill folder is read-only input. Copy from `assets/`, never run `npm install`/`build` inside `skill/` (no `node_modules`/`out` in the repo or the zip).
- Read BLR code for reference only (`src/store/data.ts`, `src/components/*`, `src/lib/mobile/*`). If a BLR bug is found, report it; fix it only when the user asks, in a separate change.
- License client: edit only `bader-license/license-config.js` (+ `app_name` title in guard.js). **Never touch `device-id.js` / `license.js`.** Every program has its OWN `product_id` (never `blr-invoicing`).
- Do not commit/push unless asked; never `pkill -f`; keep CI workflow names/tags per program unique.
- After finishing, `git status` of the BLR folder must show none of your changes.

## 3. Quick start (new program)
```bash
S=<this skill>/scripts
python3 $S/new_app.py --dest ~/dev/my-shop --name "My Shop" --accent "#2563eb" [--icon logo.png] [--git]
cd ~/dev/my-shop && npm install          # Node >= 22.13
python3 $S/add_module.py --app . --kind clients --type Client --ar العملاء --en Clients --fr Clients \
        --ar1 عميل --en1 Client --fr1 Client --perm clients --icon BookUser
bash $S/verify_app.sh . --e2e            # install, typecheck, node tests, build, license doctor, browser + Electron e2e
```
Full procedure: references/new-app-workflow.md. Placeholders replaced by new_app.py: `Template App`, `template-app`, `template-product`, `com.example.templateapp`, `Template Author`, `template@example.com`, accent `#0a9f63/#067a4c`. `python3 $S/new_app.py --check <dir>` detects leftovers, BLR references, bad `.gitignore`, wrong product id.

## 4. What the template contains (`assets/template/`)
`electron/{main,db,preload}.js` (protocol, CSP, IPC `{ok,data}`, SQLite store, users/roles/recovery, backups, print/PDF) - `bader-license/*` (guard, license, device-id, activation window, config) - `tools/license-doctor.cjs` - `src/app/*` (dashboard, **items** reference CRUD page, settings with backup/password, users, license) - `src/components/*` (Shell with auth/nav/auto-lock, ui kit, PrintPreview, RecoveryKeyDialog) - `src/lib/*` (calc, dict, i18n, api + web stand-in, reportHtml, fontEmbed) - `src/store/*` (ui/perms, data, preview) - `tests/*` (db, calc, license, dictionary) - `build/icon.png`, fonts, CI workflow, `.gitignore`, `CLAUDE.md` for the new project.
Architecture details: references/architecture.md.

## 5. Add a module (store action + db kind + permissions + dict + nav + tests)
Fast: `add_module.py` (above). Manual/extra logic: references/add-module.md. Checklist:
1. `kind` string (`[a-z_]{2,32}`) - no schema work. 2. Type in `types.ts`. 3. Store actions (`api().db.save/remove/batch/next`).
4. Permission in `PERMS` (`x` implies `x:read`) + `can()` gates on page, buttons, NAV. 5. Dictionary `[ar,en,fr]` keys. 6. Page copied from `items/page.tsx`.
7. NAV entry (trailing slash href). 8. Tests (pure rules in node test files; add to the `test` script). 9. e2e step via `--extra`.
Multi-record rules go in ONE `batch` (see data-model.md: stock delta via `stockApplied`, payments, numbering counters).

## 6. Data model & business rules (summary; details in references/data-model.md)
Documents (invoice/quote/proforma/delivery/credit/purchase/order) with lines, totals recomputed on save (`computeTotals`: line discount -> document discount spread -> tax per line -> shipping/stamp, round once), numbering `PREFIX-YYYY-00001` from main-process counters, stock effect = desired - previously applied (`stockApplied`), payments with RCPT numbers and `paymentStatus` (paid/partial/unpaid/overdue), recurring invoices generated on load with `nextDate` advanced per document, Algerian stamp duty (cash only), roles admin/manager/cashier/accountant, audit log, last-admin protection.

## 7. Licensing (references/licensing.md)
Dashboard product (bind type "device") -> `product_id` in `license-config.js` -> `npm run license:doctor` -> package -> activate with a real code on Windows. Dev (unpackaged) mode is always valid. Tests: ed25519 stand-in server key, `_evaluateToken` cases (wrong product/device, forged, trial, revoked, offline). Real dashboard + packaged activation cannot be tested in CI/sandbox: say so in the report.

## 8. Printing, PDF, preview, fonts (references/printing-fonts.md)
HTML string builders -> `openPreview` -> sandboxed iframe (`allow-same-origin`) -> `bridge.print.html/pdf` in a hidden script-less window; embed El Messiri with `withFont()`; money via `formatNumber` (LRI/PDI) with `.n` class; A4 and 80 mm thermal via `@page` + `pageSize` (microns for print, inches for PDF).

## 9. Packaging, CI, release, Android (references/packaging-ci.md, mobile-android.md)
`npm run dist` = `next build` + `electron-builder --win --x64` (NSIS). `files` list must include `electron`, `bader-license`, `build/icon.png`, `out`, `package.json`. CI: windows-latest, Node 22, `npm ci`, `npm test`, `npm run dist`, upload artifact, `gh release create <slug>-v<version>` (+ source zip). Monorepo variant needs `working-directory` and a repo-root workflow file. Linux sandbox cannot build the .exe: rely on CI and check the run. Android: Capacitor wraps the same `out/`; reference code is `blr-invoicing/src/lib/mobile/*` (bridge on IndexedDB, PDF via html2canvas+jsPDF, injected-deps license client with its own `-mobile` product id).

## 10. QA checklist (references/qa-checklist.md)
`npm run typecheck` -> `npm test` -> `npm run build` -> `scripts/e2e_browser.cjs` (Playwright vs `out/`) -> `xvfb-run -a scripts/e2e_electron.cjs` (`_electron.launch`, real SQLite/PDF/backup/persistence) -> open the screenshots (ar RTL, en, fr, dark, narrow) -> manual Windows items (installer, real license, printers). Report what could not be verified.

## 11. Pitfalls (references/pitfalls.md has all 26)
app:// protocol must serve `.txt` as `text/x-component`, trailing-slash dirs and a SPA fallback; CSP allows only self (+data:/blob: images); renderer gets `window.bridge` only (contextIsolation) and every IPC returns `{ok,data}`; session stays in main; preview iframe needs `sandbox="allow-same-origin"`; embed fonts in print HTML; money in LRI/PDI isolates, Latin digits, `num()` for inputs; dictionary triples + dict test (dynamic keys listed); stock "reverse previous, apply new"; scrypt + recovery key shown once; `node:sqlite` needs Node >= 22.13; electron-builder `files` list; `build/icon.png`/lockfile not git-ignored; NSIS locked output on OneDrive (build in `C:\dev`); release step deletes the old tag first; wrong license product_id/public key => "invalid code".

## 12. Arabic-first UX (references/arabic-ux.md)
Arabic default + RTL, logical CSS (`ps/pe/start/end`), flipped directional icons, Latin digits, LTR isolates for money/phones/codes, `dir="auto"` for mixed names, consistent business vocabulary, three-language screenshots before release, empty states with a primary action, confirm destructive actions, errors as sentences from `err_*` keys.

## 13. Finishing
Run verify, summarize: what was created (paths), which checks passed, what was not verifiable (real dashboard activation, Windows installer, printers, Android build). Do not leave `node_modules/out/.next/dist` in repos; provide commit/push only on request.
