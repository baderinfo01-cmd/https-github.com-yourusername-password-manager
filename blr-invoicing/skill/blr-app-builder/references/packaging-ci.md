# Packaging, CI, release

**package.json build block** (electron-builder 26): `files: ["electron/**/*","bader-license/**/*","build/icon.png","out/**/*","package.json"]` (anything not listed is not in the installer: add new runtime folders here!), `asar:true`, `npmRebuild:false`, `win.target nsis x64`, `win.icon build/icon.png`, `artifactName ${productName}-Setup-${version}.${ext}`, `publish:null`. Scripts: `dist = next build && electron-builder --win --x64`; `dist:dir` for an unpacked test build. `"main": "electron/main.js"`.
- No native modules: `node:sqlite` is built into Electron's Node; keep `npmRebuild:false`. The template pins Electron ^44 whose bundled Node provides `node:sqlite` (do not downgrade Electron below the version that ships it); tests run on the CI Node (>= 22.13 unflagged).
- `build/icon.png` must be >= 256 px PNG and **tracked by git**. A `.gitignore` entry such as `build` or `*.png` breaks CI ("icon not found") - template .gitignore warns, `new_app.py --check` detects.
- Version: bump `package.json` `version` for each release (installer name + tag use it). Data survives upgrade (`%APPDATA%/<slug>`), the installer never touches it (uninstall keeps data on purpose).
- Unsigned build => SmartScreen "More info > Run anyway". Signing: `CSC_LINK`/`CSC_KEY_PASSWORD` env before `npm run dist`.

**Local Windows build**: short path outside OneDrive (`C:\dev\app`), else NSIS fails with "output file is locked" (OneDrive/Defender lock `dist\*.exe`): add a Defender exclusion, delete `dist`, rebuild. `The out directory was not found` = run `npm run build` first. Cannot build the .exe on Linux in the sandbox: rely on CI.

**GitHub Actions** (`assets/template/.github/workflows/build-windows.yml`): windows-latest, Node 22, `npm ci` (needs committed `package-lock.json`), `npm test`, `npm run dist`, upload artifact, then publish a release with `gh release create <slug>-v<version>` containing the installer and a `git archive` source zip (`gh release delete --cleanup-tag || true` first so re-runs overwrite). `permissions: contents: write`.
- Monorepo variant (BLR lives in a subfolder of a bigger repo): set `defaults.run.working-directory: <folder>`, `cache-dependency-path: <folder>/package-lock.json`, artifact `path: <folder>/dist/*.exe`, `paths: ['.github/workflows/<file>.yml','<folder>/**']`, `git archive ... HEAD:<folder>`. The workflow file must live in the repo-root `.github/workflows/` (the one in the template only works when the app is the repo root). Restrict `push.branches` to the working branch to avoid building every push.
- Release notes mention SmartScreen. Tag per program so several apps in one repo do not collide.
- After pushing, check the run with `gh run list/view` or the GitHub MCP tools; download the installer from the release.

**Android / Capacitor approach** -> mobile-android.md. **Landing page / WordPress plugin** for marketing exist in BLR (`landing/`, `wordpress/`); copy only if the product needs one.
