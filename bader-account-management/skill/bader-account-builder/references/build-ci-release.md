# Build, CI and release (Windows installer)

## package.json build block (electron-builder 26) - keep these decisions
```json
"main": "electron-main.js",
"scripts": { "dist": "npm run build && electron-builder --win --x64", "dist:dir": "npm run build && electron-builder --dir" },
"build": {
  "appId": "com.baderinfo.<slug>", "productName": "<ASCII name>", "npmRebuild": false, "buildDependenciesFromSource": false,
  "directories": { "output": "dist", "buildResources": "build" },
  "files": ["electron-main.js", "electron-ai.js", "electron-preload.js", "bader-license/**/*", "out/**/*", "package.json"],
  "win": { "target": [{ "target": "nsis", "arch": ["x64"] }], "icon": "build/icon.png", "artifactName": "${productName}-Setup-${version}.${ext}" },
  "nsis": { "oneClick": false, "allowToChangeInstallationDirectory": true, "createDesktopShortcut": true, "createStartMenuShortcut": true, "shortcutName": "<name>" },
  "asar": true, "publish": null }
```
- **Everything in `devDependencies`** and an explicit `files` list: the app is a static export, so no `node_modules` must be packed. This took the real installer content from 349 MB to ~14 MB of app code (the installer is ~80-110 MB because of Electron itself). If you add a new Electron-side file/folder (`electron-foo.js`, `resources/`), **add it to `files`** or the packaged app starts blank/unlicensed/missing IPC while dev works.
- `build/icon.png` (>= 256 px, 512 recommended) must be **tracked by git**. The real app's `.gitignore` has `/build`, so `git ls-files build` is empty there: a CI checkout would not have the icon. The template `.gitignore` does not ignore it and `new_app.py --check` flags it. `package-lock.json` must be tracked too (`npm ci`).
- `npmRebuild:false`: there are no native modules. Electron ^44 bundles Node 22 (WebCrypto etc.). Tests need Node >= 22.6 (strip-types; 22.13+ recommended), CI uses Node 22.
- Static export output `out/` is what Electron serves; `next build` must succeed first (`dist` runs it). `The out directory was not found` = run `npm run build`.
- Version: bump `package.json` `version` for every release (installer name, release tag) and `branding.version`.

## Local Windows build
Node 22+ LTS, `npm install`, `npm run typecheck && npm test`, `npm run dist` -> `dist\<name>-Setup-<ver>.exe` (+ `dist\win-unpacked\`). Build in a short path outside OneDrive/Desktop (`C:\dev\<app>`): NSIS fails with "output file is locked" when OneDrive/Defender scan `dist\*.exe` (exclude the folder from Defender, delete `dist`, rebuild). Quick check without packaging: `npm run build`, then `$env:BADER_USE_BUILD=1; npx electron .` (serves `out/` through `app://`, licence in dev mode). A Linux sandbox can run the Electron e2e but cannot build the NSIS installer without Wine: rely on CI/Windows and say so.

## Signing and SmartScreen
Unsigned installers show "Windows protected your PC" (More info -> Run anyway) and may be flagged by antivirus. For production sign with a code-signing certificate (`CSC_LINK`, `CSC_KEY_PASSWORD` env before `npm run dist`; Azure Trusted Signing is a cheaper option). Release notes say the build is unsigned. Never commit certificates or passwords (use GitHub secrets).

## CI (GitHub Actions)
`assets/template/.github/workflows/build-windows.yml`: `windows-latest`, Node 22 with npm cache, `npm ci`, `npm run typecheck`, `npm test`, `npm run dist`, upload artifact, then publish a release: `gh release delete "$TAG" --cleanup-tag || true` (re-runs overwrite), `git archive` source zip, `gh release create "<slug>-v<version>" dist/*.exe <source zip> --target $GITHUB_SHA --notes "...unsigned..."`. Trigger: `workflow_dispatch` + tag push `<slug>-v*`. `permissions: contents: write`.
- **Honest status**: the real Bader Account Management repo currently has NO workflow for this app (`.github/workflows/` only holds `build-blr-windows.yml` and `build-blr-android.yml`; an `android-apk.yml` was deleted in `844ee26`). The template workflow is derived from the BLR one and is syntax-checked (YAML) but has **not been run on GitHub** by this skill. After the first push, watch the run (`gh run list/view`) and fix path issues.
- **Monorepo variant** (app in a sub-folder, like BLR and Account Management in this repo): the workflow file must live in the repo-root `.github/workflows/`; add `defaults.run.working-directory: <folder>`, `cache-dependency-path: <folder>/package-lock.json`, artifact path `<folder>/dist/*.exe`, `git archive ... HEAD:<folder>`, and restrict triggers (`paths: ['.github/workflows/<file>', '<folder>/**']` + a branch filter) so other programs' pushes do not rebuild it. One tag namespace per program (`<slug>-v<ver>`) so releases do not collide.
- Pin actions to major versions; do not give the workflow secrets it does not need; the licence public key and server URL are not secrets.

## Data location and upgrades
User data (encrypted vault in the Electron profile's localStorage, `license.dat`) lives under `%APPDATA%/<package name>`. Installing a newer version over the old keeps it; uninstalling does not delete it (deliberate). Therefore: never rename `name`, never change the `app://` host, never change vault/key names or PBKDF2 parameters without a migration (`vaultCrypto` blob has `v` and `iter`).

## Release checklist
1. `npm run typecheck`, `npm test`, `npm run build`, `bash scripts/verify_app.sh . --e2e`.
2. Licence: product exists in the dashboard, `npm run license:doctor` clean, a real code activates on a clean Windows PC (manual).
3. Bump version(s), update docs/landing price if needed, commit `package-lock.json`.
4. Tag `<slug>-v<version>` (or run the workflow manually), download the installer from the Release, smoke test on Windows: install -> activation window -> activate -> create password -> add data -> close -> reopen (login, data present) -> wrong password refused -> backup/restore -> offline start.
5. `new_app.py --check . --release` (landing/WordPress copy FINAL), build the plugin zip, publish the sales page.
