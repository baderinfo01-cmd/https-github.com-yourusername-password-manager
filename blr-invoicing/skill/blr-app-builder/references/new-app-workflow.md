# Bootstrap a NEW program (step by step)

Work OUTSIDE `blr-invoicing/` (e.g. `~/dev/<slug>`). The skill folder is read-only input.

1. **Decide** name (ASCII for the installer, e.g. "My Shop"), slug (`my-shop`), license product id (default = slug), appId (`com.baderinfo.myshop`), accent colour, modules, default currency/tax, roles needed.
2. **Scaffold**
   `python3 scripts/new_app.py --dest ~/dev/my-shop --name "My Shop" [--accent "#2563eb"] [--icon logo.png] [--git]`
   Replaces: package.json name/productName/appId/shortcutName, `APP_NAME` + `APP_ORIGIN` in main.js, `PREFIX`/web-db keys, backup `APP_TAG` (so another program's backup is refused), license `product_id`/`app_name`, brand.ts, README/CLAUDE.md, workflow names. Prints `check: OK` when no placeholders or BLR references remain (`new_app.py --check DIR` re-runs it any time).
3. **Brand**: `src/lib/brand.ts`; icons `build/icon.png` (512 px PNG, REQUIRED by electron-builder), `build/icon-256.png`, `public/brand/icon-192.png`, `public/brand/app-icon.png`; colours `--accent/--accent-2` in `src/app/globals.css`; `metadata.title` in layout.tsx.
4. **License**: create the product in the Baderinfo license dashboard (bind type "device"), set `bader-license/license-config.js` `product_id` (+ `server_url`, `public_key` if the dashboard differs), run `npm run license:doctor`. See licensing.md.
5. **Domain**: edit `types.ts`, `defaults.ts` (currency, taxes, numbering prefixes), `dict.ts` (Arabic first). Remove the demo `items` module or keep it as a catalog.
6. **Modules**: `python3 scripts/add_module.py --app ~/dev/my-shop --kind clients --type Client --ar العملاء --en Clients --fr Clients --ar1 عميل --en1 Client --fr1 Client --perm clients --icon BookUser`; then add business rules in `src/store/data.ts` (add-module.md, data-model.md).
7. **Verify** (Node >= 22.13): `bash scripts/verify_app.sh ~/dev/my-shop --e2e` (install, typecheck, node tests, build, license doctor, Playwright browser flow, Electron flow under xvfb). Extend the e2e with `--extra steps.cjs` for your modules.
8. **Ship**: commit `package-lock.json`, push; the workflow builds the NSIS installer and publishes a release (packaging-ci.md). Smoke-test the installer on Windows: activation window appears, activate with a real code, create admin, restart, backup/restore.

Never leave `node_modules/`, `out/`, `.next/`, `dist/` in git or in a zip (they are in .gitignore).
