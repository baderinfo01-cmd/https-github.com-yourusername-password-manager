# Architecture of Bader Account Management (and of the template)

Desktop-only Windows program for Bader Eddine Hamidane / Baderinfo. **Electron 44 + Next.js 16.3 (static export, Turbopack) + React 19 + next-intl 4 + zustand 5 + Tailwind 4.** Arabic-first (default `ar`, RTL), plus `en` and `fr`. No server, no database: everything lives in an encrypted blob in the renderer's `localStorage` under a private `app://` origin.

> The phone app, Android/Capacitor project, PWA and the PC<->phone sync server/engine existed in commits `94b299b`..`250b889` and were **removed in `844ee26`** ("desktop-only release"). They are NOT part of the program. Do not describe or build them unless the owner explicitly asks for a new phone project; the template contains no trace of them.

## Layers (template file -> real file in `bader-account-management/`)
| Layer | Template | Real app | Role |
|---|---|---|---|
| Main process | `electron-main.js` | same | `app://` protocol, CSP, window hardening, sign-in info IPC, licence guard + 30-min re-check, auto-lock triggers |
| Preload | `electron-preload.js` | same | exposes ONLY `baderAI`, `baderLicense`, `baderApp` via contextBridge |
| AI (main) | `electron-ai.js` | same | Anthropic call + HIBP range lookup run in main (renderer has no network: CSP `connect-src 'self'`) |
| Licence client | `bader-license/*` | same | per-device Ed25519 licence; only `license-config.js` is edited |
| Vault crypto | `src/lib/vaultCrypto.ts` | same (verbatim) | PBKDF2 -> AES-GCM, throttling, sign-in log, `.bbak` backups, zustand storage adapter |
| Store | `src/store/useStore.ts` | same, 871 lines | ONE zustand store, persisted through `encryptedStorage`, `skipHydration` |
| Session | `src/lib/session.ts` | same | `useRequireUnlock()` route guard + idle auto-lock, `lockApp()` |
| Security info | `src/lib/security.ts` | same | device/OS/IP/place for the sign-in log (Electron IPC, web fallback), geo toggle |
| Audit / AI payloads | `securityAudit.ts`, `aiTools.ts`, `passwordStrength.ts` | same (template: level keys instead of Arabic labels) | local score; the ONLY data allowed to leave the device |
| Printing | `print.ts`, `printReport.ts`, `reports.ts` | same + `printElement` | hidden-iframe printing, A4 table reports, secrets masked by default |
| Backups | `src/lib/backup.ts` | same (template takes translated labels) | password dialog, `.bbak` export/import |
| Branding | `src/config/branding.ts` | same | name, version, developer contact, asset paths |
| i18n | `src/i18n/{routing,request}.ts`, `middleware.ts`, `messages/*.json` | same (real: 1888 lines each) | locale routing `localePrefix: "always"` |
| Pages | `src/app/[locale]/{page,dashboard,accounts,generator,ai,security,settings,license-info}` | + `my-account`, `my-info`, `cards`, `documents`, `contacts`, `subscriptions`, `analytics`, `developer`, `contact`, `setup-profile` | each page wraps itself in `<AppLayout>` |
| Landing / WordPress | `assets/landing`, `assets/wordpress` | `landing/`, `wordpress/bader-landing` | sales pages in ar/en/fr with editable price + contacts |
| CI | `.github/workflows/build-windows.yml` | **none exists for this app** (only the BLR workflows are in the repo; the exe was built manually per `docs/BUILD-EXE-AR.md`) | derived from `build-blr-windows.yml` |

## Boot sequence (what really happens)
1. Electron `app.whenReady` -> `registerAppProtocol()` + `registerAi(ipcMain)` -> `guardApp()` (licence): valid licence (or unpackaged dev mode) -> `createWindow()`; otherwise the activation window (`bader-license/activation.html`) and the app window only opens after a successful activation.
2. Packaged (or `BADER_USE_BUILD=1`): `win.loadURL("app://<host>/ar/")`; dev: `http://localhost:3000/ar` + DevTools. `/` and unknown paths fall back to `out/ar/index.html`.
3. `[locale]/page.tsx` reads `getVaultState()`: `needs-setup` (create master password, min 8 chars with letters+digits, confirm) -> `locked` (enter password). Success -> sets `sessionStorage["bader-login-pending"]`, `await useStore.persist.rehydrate()` (decrypts the blob into the store), `router.push("/<locale>/dashboard/")` (client navigation: the key lives in a module variable and a full reload would lose it).
4. `AppLayout` -> `useRequireUnlock()`: if `isUnlocked()` is false (hard reload, deep link, auto-lock) -> back to the login page. It also locks after `autoLockMinutes` of inactivity and when main sends `bader-app:lock` (minimize, Windows lock-screen, suspend).
5. `LoginNotice` shows once per login: logs a success event (`appendLoginEvent`), shows previous login, warns about failed attempts since the last success + a system notification.
6. Lock = `lockVault()` (drop the key) + `window.location.replace("/<locale>/")` (reload wipes decrypted data from memory).

## Electron main process rules (keep all)
- Private scheme `app://<host>`, `registerSchemesAsPrivileged` BEFORE ready, `standard+secure+supportFetchAPI`. Same origin every launch = same localStorage = the vault persists (a random localhost port gave an empty storage each run: that was a real bug).
- Path-traversal safe resolution (`OUT_DIR` prefix check -> 403), `.txt` served as `text/x-component` (Next RSC payloads; otherwise client navigation silently becomes full reloads and the in-memory key is lost), directory -> `index.html`, SPA fallback to `ar/index.html`.
- CSP per response: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'`. External hosts are blocked by design: bundle fonts/icons; do network from the main process (see `electron-ai.js`).
- `BrowserWindow`: `contextIsolation:true, nodeIntegration:false, sandbox:true`; `setWindowOpenHandler` denies everything but opens `http(s)` links in the system browser; `will-navigate` only allows `app://<host>/` (+ `localhost:3000` in dev); packaged: DevTools closed + F12/Ctrl+Shift+I/J/C blocked, `setContentProtection(true)` (screen capture shows black; this also blackens screenshots of the packaged app), single-instance lock.
- Every 30 minutes `license.status()`; invalid -> `app.relaunch(); app.exit(0)` (back to the activation window).
- IPC channels: `bader-app:session` (device/os/app version + optional IP place via `https://ipwho.is/` with a 10-min cache), `bader-app:lock` (main -> renderer), `bader-license:*`, `bader-ai:ask`, `bader-ai:breach-range`. A new channel must be added in THREE places: handler (main), `contextBridge` (preload), a `declare global { interface Window ... }` typing + a guard for "bridge missing" (browser dev) in the renderer.

## Renderer conventions
- Static export only: no API routes, no server components that read data, `useSearchParams` inside `<Suspense>`, dynamic routes only with `generateStaticParams` (prefer query strings).
- `trailingSlash: true` -> `out/ar/accounts/index.html`. Links: `/${locale}/accounts/`.
- Pages are client components; data comes from `useStore` selectors. Never read `localStorage` for user data directly (it is ciphertext); only tiny non-secret UI flags are plain (`bader-mode`, `bader-geo`, `bader-login-pending` in sessionStorage).
- Language switch = `router.push` with the first path segment replaced (client navigation). `<html lang dir>` is set in `[locale]/layout.tsx` (`dir = ar ? rtl : ltr`).
- Theme: colour theme `data-theme` (stored in the store, applied in `AppLayout`), dark mode `data-mode` on `<html>` (stored in localStorage by `ModeToggle`, applied by `ThemeInit`).

## Template deltas vs the real app (deliberate)
Template fixes things the real code gets wrong (see pitfalls.md): Tailwind tokens that actually generate utilities (`@theme inline`), dark mode through variables instead of `!important` overrides, no `next/font/google`, login page uses `useLocale()`, translated backup dialog, `passwordStrength` returns level keys, imports validate the backup's `app` tag, no decorative settings, no `crypto-js`/`recharts`/`xlsx` dependencies (dead or page-specific), `i18n` + audit unit tests, Electron + browser e2e scripts. It keeps the real behaviour of vaultCrypto, security log, licence, protocol handler, window hardening.
Real pages NOT in the template (recreate with `add_module.py`, see recipes.md): cards, documents, contacts, subscriptions (+ expiry radar), my-account/my-info (profile CV pages), analytics (recharts), developer/contact pages, setup-profile first-run wizard.

## Read-only study list in the real app (do not edit it to build another product)
`electron-main.js`, `electron-preload.js`, `electron-ai.js`, `src/lib/vaultCrypto.ts`, `src/lib/session.ts`, `src/store/useStore.ts`, `src/components/ui/LoginNotice.tsx`, `src/app/[locale]/{page,security,license-info,ai,settings}/page.tsx`, `src/lib/reports.ts`, `tests/*`, `docs/*-AR.md`, `landing/*`, `wordpress/bader-landing/*`.
