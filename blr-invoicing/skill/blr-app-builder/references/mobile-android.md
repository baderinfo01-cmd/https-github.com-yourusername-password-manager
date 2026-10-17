# Android companion (Capacitor) - the BLR approach

The same static export (`out/`) runs inside a Capacitor WebView; the Electron-only bridge is replaced by a phone implementation with the SAME interface, so pages need no platform checks. Reference implementation (read-only, in the main app): `blr-invoicing/src/lib/mobile/*`, `capacitor.config.json`, `android/`, `tests/mobile-license.test.mts`.

| File | What it does |
|---|---|
| `mobile/native.ts` | `isNative()` (Capacitor platform or `localStorage blr-force-native=1` for browser preview/tests); `installNative()` sets `window.blr`/`window.baderLicense` (rename to `window.bridge` in a template-based app), hardware back button, `native` CSS class; imports Capacitor plugins lazily |
| `mobile/bridge.ts` | Same `Bridge` interface backed by IndexedDB (records in memory, write-through), WebCrypto PBKDF2 (150k) instead of scrypt, AES-GCM backups, recovery key, sessions in memory, files via Filesystem/Share, print = HTML -> PDF -> share |
| `mobile/pdf.ts` | `htmlToPdfBase64`: hidden sandboxed iframe -> html2canvas -> jsPDF pages (no printer driver on phones) |
| `mobile/license.ts` + `config.ts` | Licence client with injected deps (storage, post, deviceId, sha256, verify (tweetnacl), clock) so it is unit-tested in Node; own `product_id` (`<slug>-mobile`) |

**Setup**: `npm i @capacitor/core @capacitor/android @capacitor/app @capacitor/device @capacitor/filesystem @capacitor/preferences @capacitor/share @capacitor/status-bar @capacitor/splash-screen tweetnacl html2canvas jspdf` + `-D @capacitor/cli @capacitor/assets`; `capacitor.config.json` `{appId, appName, webDir:"out", android:{allowMixedContent:false}, plugins:{CapacitorHttp:{enabled:true}}}`; `npx cap add android`; `npm run build && npx cap sync android`; open in Android Studio or `cd android && ./gradlew assembleDebug` (needs JDK 17+ and Android SDK; not available in the Linux sandbox by default). Call `installNative()` early in Shell before `boot()`.
**Rules**: keep ONE data/interface contract (`api.ts` Bridge type) for desktop, mobile and the web stand-in; responsive layout (sidebar becomes drawer below `lg`); touch targets >= 40 px; `CapacitorHttp` avoids CORS for the license server; no Node APIs, no `electron` imports in shared code; backups are not interchangeable between desktop (scrypt) and mobile (PBKDF2) unless you align the format; each platform has its own license product id.
