# Pitfalls and lessons (from AGENTS.md, git history, and reading the real code)

Source tags: [git] a commit message in the history, [code] observed in the real app's code, [verified] reproduced while building this skill, [doc] the owner's docs.

## Security / crypto
1. **The original bug: any password of 4+ characters opened the app, and the "master password" was stored in plain localStorage** [git f32c0f5]. Fixed by the PBKDF2 + AES-GCM vault. Keep the test "a wrong password never unlocks"; never reintroduce a password check that is not a decryption.
2. All user data was plaintext in `localStorage` ("bader-storage-v2") [git]. Everything now goes through `encryptedStorage`; never write user data to `localStorage`/files unencrypted (including "temporary" exports: backups are `.bbak` only).
3. Auto-lock was a decorative setting [git]. A setting that is not enforced must not exist; the real Settings page still has such toggles (autoUpdate and sound toggles are local component state, `biometricEnabled`/`twoFactorEnabled` exist in the store with no feature behind them, `backupFrequency` is selectable but nothing schedules backups, the "import" button has no handler, "save settings" only flashes a message) [code]. In new programs every control must do something, and e2e should touch it.
4. Pages could be opened by typing their URL [git]: every page uses `<AppLayout>`/`useRequireUnlock`. A new page without `AppLayout` is unprotected: the template's pages and generated modules always wrap themselves.
5. Dangerous actions (delete all, restore defaults, change password) must re-ask the master password (`PasswordDialog`) [git].
6. Electron path traversal in the old local server [git]: the `app://` handler resolves paths and refuses anything outside `out/`. The e2e fetches `/%2e%2e/package.json`.
7. Printing secrets: reports hide passwords/PINs by default and ask (`askSecrets`) [git 83f6ee4]. Card numbers print as `•••• •••• •••• 1234` unless the user agrees to show secrets (`maskCard`).
8. Sending data to AI: only the allow-listed summary; unit test asserts no password text appears [verified]. Never extend the payload "just for better answers".
9. `setContentProtection(true)` in packaged builds hides the window from screen capture; it also makes your own screenshots/recordings of the installed app black [code]. Use the browser/Electron-dev e2e screenshots for documentation.
10. Clipboard: copied secrets are cleared after 20 s only if the clipboard still holds them; `navigator.clipboard.readText` can fail when the window is not focused (ignored on purpose).
11. Geo lookup of sign-ins sends the user's IP to ipwho.is: it is a disclosed, user-controllable setting (default on in the real app). New programs should explain it in the Settings text (the template does) and in the privacy statement.

## Electron / protocol / packaging
12. **Random localhost port = different origin each launch = empty localStorage each time** (the vault "disappeared") [git 0999a50]. Use the private `app://<slug>` scheme; never go back to `http://localhost:<random>`.
13. **`.txt` must be served as `text/x-component`** or Next's static-export client navigation silently falls back to full page loads, which drops the in-memory vault key and kicks the user to the login page on every click [git 0999a50]. Dev servers and test servers must mimic this (`scripts/_pw.cjs serveOut`).
14. `registerSchemesAsPrivileged` must run before `app.ready`; CSP forbids external hosts (fonts, CDNs, analytics) [code].
15. **Installer ballooned to 349 MB** because dependencies were packed into asar; fixed with devDependencies + explicit `files` list (14 MB of app code) [git]. When you add runtime files, add them to `files`.
16. **`build/icon.png` is git-ignored in the real app** (`/build` in `.gitignore`; `git ls-files build` is empty) [verified]: a CI checkout cannot find the icon. Template `.gitignore` fixes it; `package-lock.json` must stay tracked (`npm ci`).
17. Window printing: `window.open` pop-ups are blocked in Electron, so reports print through a hidden iframe (`printHtml`) [git 74970a0]. External http(s) links are opened by `setWindowOpenHandler` in the system browser, everything else denied.
18. `will-navigate` + Playwright: a real `location.href = "https://..."` leaves Playwright waiting for the cancelled navigation; test the handler by emitting the event in the main process (see `e2e_electron.cjs`) [verified].
19. **Do not import optional native/Capacitor plugin packages in code that ships to the desktop build**: the web/desktop build failed when `@capacitor/local-notifications` was not installed [git 04336e2]. Same rule for any optional dependency: reach it through `window.<global>` at runtime or do not import it.
20. Single instance (`requestSingleInstanceLock`), no DevTools in packaged mode, `devtools-opened` closed, `will-navigate` limited to the app origin.
21. Next 16 specifics [AGENTS.md][verified]: "This is NOT the Next.js you know": read `node_modules/next/dist/docs/` before using unfamiliar APIs; Turbopack is the default bundler (`next build` panics if `node_modules` is a symlink outside the filesystem root: use a real directory or hardlinked copy in scratch builds); `middleware.ts` shows up as "Proxy (Middleware)" in the build output and only helps `next dev` (the exported site is served by Electron/any static server); `next build` rewrites `tsconfig.json` (adds `.next/dev/types/**/*.ts` to `include`: the template already has it); `next dev` rewrites the AGENTS.md block (commit it with your work or discard it); `next-env.d.ts` and `*.tsbuildinfo` are generated (git-ignored).
22. **A skill folder inside an app's tree can break that app's TypeScript**: `tsconfig.json` with `include: ["**/*.ts", "**/*.tsx"]` and `exclude: ["node_modules"]` (the real app's) picked up `skill/**/template/src/**/*.tsx` and `npm run typecheck`/`next build` of bader-account-management failed (`@/` aliases, other types) [verified with `tsc`]. That is why the template's TypeScript sources are stored as `*.ts.tpl`/`*.tsx.tpl` (not matched by the glob; `new_app.py` renames them back) and why `.mts` tests are not affected. Never store plain `.ts/.tsx` template files inside an app repo; the template's own tsconfig lists explicit include paths.
23. Leftover LAN IP in `next.config.ts` (`allowedDevOrigins: ["192.168.1.61"]`) from the phone-testing phase [code]: dropped from the template.
24. Electron e2e on Linux/root needs `--no-sandbox` and `xvfb-run`; use `--user-data-dir=<tmp>` or you pollute a real profile and trip the single-instance lock. The first `npm install` may need `node node_modules/electron/install.js` if the binary download was blocked.
25. `node --experimental-strip-types` tests cannot resolve the `@/` alias or extension-less relative imports: library files that tests import use relative `.ts` imports (`securityAudit.ts` -> `./passwordStrength.ts`); `tsconfig` has `allowImportingTsExtensions`.

## Licence
26. "Invalid code" for a valid code = the app talks to a different dashboard/key/product than the one that generated it: `server_url`, `public_key`, `product_id` [git 257d75f, 7b35a16, a1f289c]. Use `npm run license:doctor` first; a stale `license.dat` in `%APPDATA%/<slug>/` from an older config also blocks (delete it, re-activate).
27. `max_offline_days` must be 0 for lifetime-offline programs; the library default of 14 days locks out customers without internet [git 83f6ee4].
28. A fake in-app licence page that accepted any `BADER-...` text existed [git]; licence state must come only from the main process via `baderLicense.status()`.
29. Each program needs its own product (bind type device). Reusing another program's id makes its codes work in both programs and breaks "one licence = one program".
30. Never edit `device-id.js` / `license.js`.

## UI / i18n
31. `--color-primary: 14 165 233` as a bare triple under Tailwind v4 generates NO utility: `.text-primary`, `.bg-primary`, `.border-border` do not exist in the real app's built CSS [verified in out/]. Template maps tokens with `@theme inline` so the utilities work and dark mode swaps variables. Do not copy `text-primary`-style classes from real pages assuming they work there.
32. Dark mode in the real app is a list of `html[data-mode="dark"] .bg-white { ... !important }` overrides; any component using other colours stays light (e.g. backup dialog, `bg-white` modals). New code uses semantic tokens.
33. `next/font/google` (El Messiri in the real layout) downloads at build time: fails behind restricted/offline CI. Template bundles the woff2 via `@font-face`.
34. Login page hard-coded `locale` state `"ar"`: switching language then unlocking opened `/ar/...` [code]. Use `useLocale()`.
35. `passwordStrength` returned Arabic labels and `backup.ts` English labels [code]: hard-coded strings escape the i18n system; template returns level keys / takes labels.
36. Hard-coded product name in print header ("Bader Account Management") [code]: use `branding.appName`.
37. RTL: physical classes (`right-3`, `pr-10`, `border-l`, `left-1/2`) break layouts in RTL/LTR switches; use logical ones. Latin names inside Arabic sentences and numbers must be isolated (`dir`, `.num`).
38. Message files must stay in sync: 1888 lines x3 in the real app with no automated parity test [code]; the template test fails on drift. Real `messages` still contain keys for features that never existed or were removed (e.g. `cloudSync`, used nowhere in `src`) [code]: delete keys with the feature.

## Data
39. `importAllData` trusted the file shape and had no origin check [code]; the template validates arrays and the `app` tag. Backups of one program must not restore into another (different collections, different meaning).
40. Every new collection must be added to export, import and clear; forgetting it makes backups lossy [code review]. `add_module.py` does it.
41. localStorage is small (~5-10 MB): no embedded images/files.
42. `generatedPasswords` history and `aiApiKey` are secrets: encrypted with the vault, excluded from the AI summary; `aiApiKey` excluded from backups.

## Process
43. Edit only the new program. Never "fix" Bader Account Management or BLR while building another product; report findings instead.
44. The phone app/sync is gone (`844ee26`); do not resurrect it by copying from history unless the owner opens a separate phone project.
45. Claims in docs/READMEs/landing must match what is implemented and verified; say plainly what could not be tested (Windows installer, real activation, WordPress runtime).
