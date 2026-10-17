# QA checklist (run before declaring a program done)

1. `npm run typecheck` clean. 2. `npm test` (db, calc, license, dictionary + yours). 3. `npm run build` (static export, no errors).
4. `bash scripts/verify_app.sh <app> --e2e` - or individually:
   - **Browser flow** `node scripts/e2e_browser.cjs --app <app> --shots <dir>`: serves `out/` like main.js does, drives Chromium: first-run admin setup (RTL), recovery key once, CRUD, LRI/PDI money, search, print preview iframe + embedded font, language switch (dir flips), lock/login, wrong password, deep-link reload, zero console/page errors. Add `--extra steps.cjs` (`module.exports = async ({page, base, step, shot, has}) => {...}`) for your modules. Playwright + chromium must exist (`npm i -g playwright && npx playwright install chromium`, or `PLAYWRIGHT_PATH`).
   - **Electron flow** `xvfb-run -a node scripts/e2e_electron.cjs --app <app> [--electron <bin>]`: real main process via `_electron.launch` with `APP_USE_BUILD=1` + isolated `APP_USER_DATA`: window security flags, bridge present, license dev state, CSP + `.txt` MIME on `app://`, `{ok:false}` shapes, scrypt admin, CRUD in SQLite, real PDF file, encrypted backup + wrong-password refusal, navigation guard, relaunch persistence. Root/containers need `--no-sandbox` (script adds it).
5. **Look at the screenshots** (Read the PNGs): RTL alignment, numbers, truncated Arabic, dark mode (toggle), narrow width (<1000 px sidebar drawer), print preview in A4 and thermal.
6. Manual on Windows (cannot be automated here): installer runs, activation window, real code activation, printer output A4/80 mm, backup/restore, offline start, upgrade over an older version keeps data.
7. Regression guard for the sibling-product rule: `git status` in the original BLR folder shows nothing from your work; `new_app.py --check <app>` says OK.
8. Clean up: no `node_modules/out/.next/dist` inside any repo or zip.

Timing/stability tips: wait on selectors not timeouts; assert Arabic labels with regex alternatives `/عربي|English|Français/`; use `locator('aside a[href="/x/"]')` for navigation; Playwright `requestfailed` ERR_ABORTED from Next prefetch is harmless.
