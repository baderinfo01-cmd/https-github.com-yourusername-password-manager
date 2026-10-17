# Add a module / page / entity

Fast path: `scripts/add_module.py` (store + page + type + dictionary + NAV + permission). Manual recipe below is what it does, and what you must add for real business logic.

1. **Kind**: pick `kind` (`/^[a-z_]{2,32}$/`, not `users`). Nothing to create in SQLite.
2. **Type** in `src/lib/types.ts` (`id`, timestamps come from db.js).
3. **Store**: either a small own store (`src/store/<kind>.ts`: load on mount, `save`, `remove`, `onReset` registration) or extend `data.ts` (state array + `load()` entry + `reset()` + saveX/removeX). Use data.ts when other modules need the data (cross-entity reports, search, stock effects).
4. **Permissions**: add names to `PERMS` in `store/ui.ts` (`"x"` grants `"x:read"`); gate the page with `can(role,"x:read")` -> `<Empty text={t("no_permission")}/>`, gate buttons with `can(role,"x")`, gate the sidebar entry via `perm`. Sensitive kinds also in `WRITE_ADMIN_ONLY` (db.js) if the cashier must never write them even with devtools.
5. **Dictionary**: every label/message as `[ar,en,fr]`; `npm test` (dict.test.mts) fails on missing keys, empty languages, placeholder mismatch.
6. **Page** `src/app/<route>/page.tsx` (copy `items/page.tsx`): `NewParam` (`?new=1` opens the add dialog from a quick-create menu), search, table, modal form with `num()` on numeric inputs, `Confirm` before delete, `notify(t("saved"))`, export (`toCsv` + `api().file.saveText`, BOM added by main), print (`openPreview`).
7. **Navigation**: entry in `NAV` (Shell.tsx) with trailing-slash href. Detail pages use query strings: `/x/view/?id=...` and read `useSearchParams()` inside Suspense.
8. **Multi-record rules** in the store with `api().db.batch([...])`: compute everything first, write once, then `set()` state from the batch result (results are in op order).
9. **Audit**: `get().log("action", detail)` for sensitive actions (visible on an audit page for admins).
10. **Tests**: pure rules -> `tests/calc.test.mts`-style; db-level rules -> `tests/db.test.cjs`; add the new test file to the `test` script in package.json. Add e2e steps via `--extra`.
11. **Docs/README** line + `npm run typecheck && npm test && npm run build`.

Reference implementations in BLR Fatourati (read-only): `src/components/PartiesPage.tsx` (clients/suppliers, import/export), `CatalogPage.tsx` (products/services with categories, bulk actions), `src/app/documents/*` (list/edit/view of documents), `src/app/payments`, `expenses`, `recurring`, `stock`, `reports`, `calendar`, `tasks`.
