# Licensing (bader-license/, Ed25519, one device)

**Flow**: customer enters a code once (online) -> `license.js` sends code + device fingerprint (`device-id.js`) + `product` -> the dashboard binds code to the device and returns a token `base64url(payload).base64url(sig)` signed with its PRIVATE key. The app stores it (`userData/license.dat`, tamper-guarded) and verifies locally on every launch with the embedded PUBLIC key: `v==2`, `pid == config.product_id`, `domain == this device`, `exp` (trial), `remote != revoked`, optional offline limit. Every `check_interval_hours` (12) it asks the server if the license was revoked/moved. `max_offline_days: 0` = lifetime offline.

**Integration** (already done in template main.js): `guardApp({ipcMain, BrowserWindow, createWindow})` after `registerIpc`; unpackaged apps run in dev mode (valid, `dev:true`, no window). Preload exposes read-only `window.baderLicense.status()/recheck()`. Packaged app re-checks every 30 min and relaunches when invalid. Feature gating by plan: `getLicense().hasEdition("pro")` **in main**, never only in the page.

**What you may edit**: `license-config.js` (server_url, public_key, product_id, app_name, lang, purchase_url, intervals) and the `title` line of guard.js (template uses `config.app_name`). **Never edit** `device-id.js` / `license.js`: changing the fingerprint invalidates every issued license.

**Per-program rules**
- Each program = its own `product_id` created in dashboard > Products (bind type "device"). Re-using `blr-invoicing` would make BLR codes activate the new program (and vice versa). `tests/license.test.cjs` and `new_app.py` refuse BLR/placeholder ids.
- `server_url` and `public_key` must be the dashboard that generated the codes (shared by all of the owner's programs: defaults in the template are the BaderProgLicense ones; confirm in dashboard > Settings > signing key and > Technical info). Wrong values => "invalid code" for valid codes.
- `npm run license:doctor` checks key format, server reachability (sends a fake code, consumes nothing) and product id. Server may be unreachable in a sandbox: that is a warning, not a code bug.
- Customer moved PC: dashboard "move to new device", then re-activate. Stale license file after config change: delete `%APPDATA%/<slug>/license.dat`.

**Testing** (`tests/license.test.cjs`): generate an ed25519 pair in the test, stub `electron` via `Module._load`, build `new BaderLicense({...cfg, public_key: rawPub, dev_mode:false})`, set `lic._deviceId`, then `_evaluateToken(sign(payload), data)` for: valid lifetime, wrong product, wrong device, forged/tampered, trial expiry, revoked, offline cutoff. End-to-end with the real dashboard needs a real code and a packaged build (cannot be done in CI): test on Windows after each release.

**Mobile (Android)**: same protocol re-implemented with injected dependencies in BLR `src/lib/mobile/license.ts` (tweetnacl verify, Capacitor Device id, Preferences storage); separate product id (`...-mobile`). See mobile-android.md.
