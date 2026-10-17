# Template App

Desktop business application: **Next.js (static export) + Electron + built-in `node:sqlite`**, Arabic-first (RTL) with
English/French, roles, encrypted backups, print preview/PDF, per-device Ed25519 license (`bader-license/`).

Generated from the `blr-app-builder` skill. Read `CLAUDE.md` before changing anything.

```
npm install
npm run typecheck && npm test          # types + db/calc/license/dictionary tests
npm run dev                            # UI in a browser (localStorage stand-in, no license)
npm run build && npx electron .        # (set APP_USE_BUILD=1) run the real app from out/
npm run dist                           # Windows installer (build on Windows / CI)
npm run license:doctor                 # checks bader-license/license-config.js against the license dashboard
```

Data: `%APPDATA%\template-app\data\app.sqlite` (backups next to it). Windows installer output: `dist\`.
