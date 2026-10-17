# Branding and licensing of a new program

## Identity checklist (decide ONCE, before the first release)
| Item | Where | Rule |
|---|---|---|
| Display name | `package.json` `build.productName`, `shortcutName`, `branding.ts` `appName`, `license-config.js` `app_name`, `messages/*.json` `common.appName` | ASCII for the installer (`Pocket Vault-Setup-1.0.0.exe`); Arabic display name only inside the app (`--name-ar`) |
| Slug | `package.json` `name`, `electron-main.js` `APP_ORIGIN = app://<slug>`, `branding.slug`, backup tag | `[a-z][a-z0-9-]{2,40}`. **Never change after release**: `%APPDATA%/<slug>` (licence file, Electron profile) and the `app://` origin (the encrypted vault) are keyed by it; renaming orphans every customer's data |
| appId | `package.json` `build.appId` | `com.baderinfo.<slug without dashes>` |
| Licence `product_id` | `bader-license/license-config.js` | **its OWN id**, created in the licence dashboard; default = slug. Never `bader-account-management`, `blr-invoicing`, `bader-prog`, `bader-desktop-tool` (`new_app.py` and `license-doctor` refuse them) |
| Accent colour | `--c-primary` triple in `globals.css`, `branding.accent` (hex, used for the swatch, print CSS, `themeColor`), landing `primaryColor` | `new_app.py --accent "#2563eb"` replaces all; the other 4 colour themes stay |
| Icon | `build/icon.png` (>= 256 px, 512 best, **tracked by git**), `build/icon-256.png`, `public/brand/{app-icon,icon-192,logo-light}.png`, `src/app/favicon.ico`, `landing/assets/logo.png`, plugin `assets/logo.png` | `new_app.py --icon logo.png` (needs Pillow). `public/brand/seal.png` is the Baderinfo publisher seal used on the licence page: keep it |
| Developer / support contact | `branding.developer`, `license-config.js` `purchase_url`, landing `site-config.js`, plugin defaults | `new_app.py --author --email --phone --whatsapp` (defaults = Bader Eddine Hamidane, baderinfo12@gmail.com, 0550896115 / 213550896115) |
| Version | `package.json` `version` (installer name + release tag) and `branding.version` | bump both each release |

`new_app.py --check <dir>` verifies all of this statically (placeholders, reserved product ids, `.gitignore`, app:// host == package name, message parity, phone placeholders; `--release` also fails on unfinished landing copy).

## Licence system (Baderinfo "BaderProgLicense" dashboard)
Flow: customer installs -> activation window (`activation.html`, language from `license-config.lang`) -> pastes the code -> main sends `{code, device fingerprint, product}` to `server_url` -> server binds the code to that device and returns a token signed with Ed25519 -> stored in `userData/license.dat` -> every launch the token is verified **locally** (signature with `public_key`, `pid == product_id`, `domain == this device`, expiry) -> every `check_interval_hours` (12) the server is asked about revocation/extension/transfer when online.
- Statuses seen by the UI/tests: `bad_signature`, `wrong_product`, `wrong_device`, `expired`, `revoked`, `offline`, `trial_used`, `rate_limited`, `unreachable`.
- **`max_offline_days: 0`** = never stops for lack of internet (lifetime offline after one online activation). The library default is 14 days: with it a customer without internet would be locked out (a unit test documents this). A revoked licence only stops the next time the device reaches the server (honest limitation).
- **Dev mode**: unpackaged (`npm run electron:dev`, `BADER_USE_BUILD=1 electron .`) runs without a licence (`dev:true`); the packaged app always asks.
- Trial: dashboard plan "trial" = 2 days from activation, one trial per device (server side). The expiry uses the PC clock offline (rolling the clock back extends it; acceptable for trials).
- Transfer to a new PC: in the dashboard open the code -> "move to new device", the customer re-enters the same code online once.
- The licence page (`license-info`) shows real data from `window.baderLicense.status()`; outside Electron it says "desktop only". There is no fake/offline "enter any code" page (the original app had one: removed).

## What you may edit
- **Only `bader-license/license-config.js`** (`product_id`, `app_name`, `server_url`, `public_key`, `lang`, `purchase_url`, `check_interval_hours`, `max_offline_days`). `guard.js` is wiring (the BLR variant also passes the app name/icon to the activation window); `device-id.js` and `license.js` **must never be edited**: changing the fingerprint or verification invalidates every customer licence.
- `server_url` and `public_key` belong to the dashboard installation (they are public values, not secrets; the private key stays on the server). All Baderinfo programs share the same dashboard, so keep the existing values unless the owner moved the dashboard. If activation says "invalid code" while the code is valid, the cause is always a mismatch between these three: `server_url`, `public_key`, `product_id` (+ the product must exist with bind type **device / ".exe"**, and the code must have been generated for THIS product).
- `npm run license:doctor` checks key format, server reachability (sends a fake code, consumes nothing) and the product id. It needs internet and cannot prove the dashboard knows your product; only a real activation proves that.

## Dashboard steps for a new program (give these to the owner in Arabic; `docs/LICENSE-AR.md` in the generated app has the long version)
1. Dashboard -> Products -> Add product: id = the `product_id`, bind type **برنامج (.exe) / device**, edition e.g. `lifetime`.
2. Settings -> signing key: the public key must equal `license-config.js` `public_key` (already true for the shared dashboard).
3. New licence -> product -> plan lifetime (or trial = 2 days) -> copy the code -> send it alone to the customer.
4. Test on a clean Windows PC with the installer: activation window appears, real code activates, restart offline works, same code on a 2nd PC is refused, a code of another product is refused.

## Tests that guard it
`tests/license.test.cjs` (ed25519 stand-in server key): valid lifetime offline, wrong product, wrong device, forged/tampered token, 2-day trial expiry, revoked, and "14 days offline would stop" (why `max_offline_days` is 0), plus "this program's product_id is not another program's". Real activation against the live dashboard and a packaged `.exe` cannot be tested in CI/sandbox: say so in reports.
