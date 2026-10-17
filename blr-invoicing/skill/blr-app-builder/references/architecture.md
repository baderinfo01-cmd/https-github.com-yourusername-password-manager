# Architecture (BLR Fatourati pattern, as implemented in assets/template)

```
Next.js 16 static export (out/)  --loaded by-->  Electron BrowserWindow  (app://<slug>/ private protocol)
   React 19 + Tailwind 4 + zustand                 contextIsolation:true, nodeIntegration:false, sandbox:true
        |  window.bridge.*  (electron/preload.js, contextBridge)
        v  ipcRenderer.invoke("app:...")  ->  ipcMain.handle wrapper  =>  { ok:true,data } | { ok:false,error }
   Electron main process:  electron/main.js (windows, protocol, IPC, print/PDF, dialogs)
                           electron/db.js   (Store: node:sqlite, users, session, scrypt, backups)
                           bader-license/   (Ed25519 per-device license; guardApp opens activation window)
```

## Files (template)
| Path | Role |
|---|---|
| electron/main.js | `registerSchemesAsPrivileged` (before ready), `protocol.handle("app")` static server with MIME map + CSP header, single-instance lock, IPC registration, print/PDF windows, license guard, 30-min license re-check when packaged |
| electron/db.js | One table `records(kind,id,data JSON,updated_at)` + `counters`. `list/get/save/remove/batch/next/audit`, users (`ROLES`), login throttling, recovery key, AES-256-GCM backups, daily auto-backup (last 14) |
| electron/preload.js | The ONLY surface the page sees: `window.bridge` (db/auth/backup/file/print/app) and read-only `window.baderLicense` |
| src/lib/api.ts | `api()` returns `window.bridge` or a localStorage stand-in (browser dev, Playwright). `call(promise)` unwraps `{ok,data}` and throws `Error(code)` |
| src/store/ui.ts | lang/theme (localStorage), auth state machine (loading/setup/login/in), toast, `PERMS` + `can()` |
| src/store/data.ts | In-memory mirror of records + business actions (saveX, batch transactions, counters) |
| src/lib/dict.ts, i18n.ts | `[ar,en,fr]` triples, `useT()`, `tr()` |
| src/lib/calc.ts | `round/num/formatNumber/computeTotals/paymentStatus/dates` (pure, tested with node) |
| src/components/Shell.tsx | Splash -> AuthScreen (setup/login/recover) -> Frame (sidebar NAV by permission, header, auto-lock) |
| src/components/PrintPreview.tsx + src/store/preview.ts | `openPreview({title,fileName,papers,build})` modal with sandboxed iframe, printer/copies/PDF |
| src/lib/fontEmbed.ts, reportHtml.ts | print HTML builders; `withFont()` embeds El Messiri |

## Rules that make it work
1. The page never touches Node/SQLite/filesystem; every capability = one IPC channel + one preload method + one `Bridge` type entry + one web stand-in entry.
2. IPC handlers never throw to the renderer: wrapper returns `{ok:false,error:"code"}`; pages map `err_<code>` dictionary keys.
3. The signed-in session lives in `Store.session` (main). `save/remove/batch/next/audit` require it; `users` kind is private; `settings` write is admin-only. Roles are otherwise enforced in the UI (`can()`): for sensitive kinds add them to `WRITE_ADMIN_ONLY` or add checks in db.js.
4. Documents are JSON; schema evolves by merging defaults on load (`{...DEFAULT_SETTINGS, ...saved}`) and by never deleting fields. Kind names: `/^[a-z_]{2,32}$/`.
5. Multi-record changes -> `api().db.batch(ops)` (BEGIN IMMEDIATE ... COMMIT, max 5000 ops). Gap-free numbers -> `api().db.next("prefix:year")` (atomic counter in main).
6. Static export constraints: no server code, `images.unoptimized`, `trailingSlash:true` (links end with `/`), dynamic data through query strings (`/documents/view/?id=...`), `useSearchParams()` inside `<Suspense>`.
7. Dev: `npm run dev` = browser with stand-in bridge. `npm run electron:dev` = Electron against `next dev` (license in dev mode, DevTools open). `APP_USE_BUILD=1 electron .` = real build from `out/`.
