# Bootstrap a NEW program (step by step)

Work OUTSIDE `bader-account-management/` and outside this skill folder (e.g. `~/dev/<slug>`). The skill is read-only input.

## 0. Ask / decide (short, in Arabic if the owner writes Arabic)
Program name (ASCII for the installer) + Arabic display name, slug, licence product id (usually = slug), accent colour, logo (square PNG), modules and their fields (which fields are secrets), whether an AI assistant is wanted, price/currency/trial for the landing page, whether a sales page and WordPress plugin are needed. Defaults: ar-first, three languages, dark mode, encrypted vault, lifetime licence, landing + plugin.

## 1. Scaffold
```bash
python3 scripts/new_app.py --dest ~/dev/my-vault --name "My Vault" --name-ar "خزنتي" --accent "#2563eb" --icon logo.png [--product-id my-vault] [--git]
cd ~/dev/my-vault && npm install            # Node >= 22.13 (22.6+ for the tests)
```
Replaces name/slug/product id/appId/author/contacts/accent in the app, docs, workflow, landing and plugin; builds the icon set (Pillow); renames and zips the WordPress plugin; prints `check: OK` or the problems. `--check <dir>` re-runs the scan any time (`--release` also fails on draft copy).

## 2. Modules
The reference `accounts` module feeds the dashboard counters, the security score and the AI page; removing it is NOT automated (store, dashboard, AI page, reports and messages all touch it). Prefer keeping it, or repurpose it by editing its labels/fields. Add modules with `add_module.py` (add-module.md, recipes.md). Add business rules in the store with unit tests.

## 3. Brand and wording
`src/config/branding.ts`, `messages/*.json` (review every Arabic string), `public/brand/*`, `build/icon.png`, `docs/*-AR.md`, README. Keep the honest warnings (no recovery, limits of encryption).

## 4. Licence
Create the product in the Baderinfo licence dashboard (branding-licensing.md), keep `server_url`/`public_key` unless the dashboard moved, `npm run license:doctor`. Edit only `license-config.js`.

## 5. Verify
`bash scripts/verify_app.sh ~/dev/my-vault --e2e` (EXTRA=your-steps.cjs to add module steps). Read the screenshots in ar, en, fr, dark, narrow.

## 6. Landing + WordPress
Rewrite the draft copy (landing-wordpress.md), set price/links/contacts, `new_app.py --check . --release`, regenerate the plugin zip if you changed the plugin, test on a staging WordPress.

## 7. Ship
Commit (only when asked) with `package-lock.json` and `build/icon.png`; tag `<slug>-v<version>` -> workflow builds the installer (build-ci-release.md). Smoke-test the installer on Windows with a real activation code.

## 8. Final report to the owner
Created paths; which checks passed (with counts); what could not be verified (Windows installer, real activation, GitHub run, WordPress runtime, printers); next manual steps (licence product, signing, screenshots for the sales page). No `node_modules/out/.next/dist` left in repos or zips.

Never commit or push unless asked. Never run `pkill -f`. Keep CI workflow names and tags unique per program.
