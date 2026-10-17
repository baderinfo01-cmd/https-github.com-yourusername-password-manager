# QA checklist (run before declaring a program done)

## Automated (all of this was run on the template and on a generated app + module)
`bash scripts/verify_app.sh <app> --e2e` does, in order: Node version, `npm ci`, `new_app.py --check`, `npm run typecheck`, `npm test`, `npm run build`, `npm run license:doctor` (warning only; needs internet), browser e2e, Electron e2e (xvfb).
1. **typecheck** clean (`tsc --noEmit`). Do not silence errors with `any` on store/crypto code.
2. **npm test** (node:test, strip-types): `vault.test.mts` (wrong password never unlocks, encrypted round trip, throttling, change password, weak passwords + legacy migration, encrypted backups, sign-in log), `audit.test.mts` (strength levels, duplicates, score, **AI payload contains no password**), `i18n.test.mts` (key parity ar/en/fr, no empty values, same placeholders, Arabic is Arabic, static `t()` keys exist), `license.test.cjs` (product binding, device binding, forged token, trial expiry, revoked, offline policy, own product id).
3. **npm run build**: static export for ar/en/fr in `out/`.
4. **Browser e2e** `scripts/e2e_browser.cjs` (Playwright against `out/`, served like `app://`): create vault in Arabic RTL (weak password refused), dashboard + login notice, client navigation keeps the vault open, add/search/delete accounts, reuse badge, **no plaintext in localStorage**, generator (16 chars, all groups), local AI score, licence page without bridge, print report with secrets masked, encrypted `.bbak` export without plaintext, delete-all asks the master password (wrong one refused) then restore from the backup, language switch ar/en/fr with dir flip and URL kept, mobile drawer, dark mode, lock -> wrong password -> unlock -> failed-attempt warning, security log rows, hard reload requires login, zero console/page errors. `--extra steps.cjs` adds module steps (`scripts/extra_example.cjs`).
5. **Electron e2e** `scripts/e2e_electron.cjs` (`_electron.launch`, real main/preload): window security flags, bridges (`baderLicense`, `baderAI`, `baderApp`), dev licence valid, `app://` origin + CSP + `.txt` MIME + no traversal, will-navigate handler, create vault + add account, main->UI lock event, **relaunch on the same profile: login screen, wrong password refused, data still there**, sign-in log persisted.
6. Look at the screenshots (`--shots <dir>`): RTL alignment, truncated Arabic, French overflow, dark mode contrast, drawer. Read the PNGs, do not just trust "passed".

## Manual on Windows (cannot be automated here)
- Installer builds and runs; SmartScreen text; shortcut names; uninstall keeps data.
- Activation window appears in the packaged app, a **real code** activates (internet once), restart offline works, the same code on a second PC is refused, another product's code is refused, a cancelled code stops after the next online check.
- Printing to a real printer / "Save as PDF" from the hidden-iframe report; Arabic font rendering in the print dialog.
- Screen lock / sleep / minimize locks the UI; `setContentProtection` (capture shows black).
- Antivirus/Defender behaviour of the unsigned exe.

## Reporting
State what ran and passed, what was **not** verifiable (Windows installer, real activation against the dashboard, printers, WordPress runtime, GitHub Actions run), and what the owner must do next. Never claim "tested" for the licence flow against the live dashboard unless it was.

## Regression guards for the "sibling program" rule
`git status` of Bader Account Management and BLR must show none of your changes; `new_app.py --check <app>` says OK; no `node_modules/ out/ .next/ dist/` inside any repo or zip.

## Tips
Wait on selectors, not timeouts. Match Arabic labels with ar|en|fr regex alternatives. `requestfailed ERR_ABORTED` from Next prefetch is harmless. Playwright from a global install is found by `_pw.cjs`; Chromium from `CHROME_PATH` or the puppeteer cache is used when Playwright's own browsers are not installed.
