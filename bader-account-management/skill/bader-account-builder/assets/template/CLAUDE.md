@AGENTS.md

# Template App — project notes for Claude

Desktop-only Windows program (Electron + Next.js static export + next-intl ar/en/fr, Arabic-first RTL), made from the
`bader-account-builder` skill (owner: Bader Eddine Hamidane / Baderinfo). Phone/sync is NOT part of this program.

## Architecture (read before changing anything)
- `electron-main.js` serves the exported site (`out/`) through the private `app://template-app` scheme (stable origin = the
  encrypted vault in localStorage survives restarts; no port is opened), sets CSP, blocks pop-ups/navigation, locks the UI on
  minimize/screen-lock/sleep, re-checks the licence every 30 min. `electron-preload.js` exposes ONLY `baderLicense`, `baderAI`, `baderApp`.
- `bader-license/` = per-device Ed25519 licence client. Edit ONLY `license-config.js` (product_id, server_url, public_key, app_name).
  NEVER touch `license.js` / `device-id.js`. This program's `product_id` is its own; never reuse another program's.
- Data: ONE zustand store (`src/store/useStore.ts`) persisted ENCRYPTED through `src/lib/vaultCrypto.ts`
  (PBKDF2-SHA256 600k -> AES-256-GCM, key only in memory, no password recovery, throttled unlock, sign-in log in the blob).
  `skipHydration` + `useStore.persist.rehydrate()` after unlock. Every new collection must be added to export/import/clear
  (the `// @module-*` markers; `scripts/add_module.py` of the skill does it).
- Pages: `src/app/[locale]/<route>/page.tsx`, each wrapped in `<AppLayout>` (route guard + idle auto-lock). Static export only: no API
  routes, no server code, `useSearchParams` needs Suspense.
- i18n: `messages/{ar,en,fr}.json` (same keys everywhere; `tests/i18n.test.mts` enforces it). Arabic is the default and RTL.
- Secrets (passwords, PINs, card numbers) never go to the AI (`aiTools.buildSummary`), logs or printouts unless the user agrees.

## Commands
`npm install` · `npm run typecheck` · `npm test` · `npm run build` (-> out/) · `npm run electron:dev` · `npm run dist` (Windows installer, needs Windows or CI) · `npm run license:doctor`

## Rules
- Colours via tokens (`bg-card text-fg text-muted border-border bg-primary`), logical CSS (`ps/pe/ms/me/start/end`), Latin digits, `dir="ltr"` for emails/ids/numbers, `dir="auto"` for user text.
- No `next/font/google` (offline builds), no external scripts/CDNs (CSP is `self`), no decorative controls that do nothing.
- Do not commit `node_modules/ out/ .next/ dist/`; keep `build/icon.png` and `package-lock.json` tracked.
- Bump `package.json` version for every release; never rename `name`/slug or the `app://` host after release (orphans customer data).
