# Add a module / page / entity

Fast path: `scripts/add_module.py` (see `--help`). It needs an app made from the template (markers present). Run `git diff` after it and read the generated page: it is a starting point, not a black box.

```bash
python3 scripts/add_module.py --app ~/dev/my-vault --kind clients --type Client \
  --ar "العملاء" --en Clients --fr Clients  --ar1 عميل --en1 Client --fr1 Client --icon Users \
  --field "name|text|الاسم|Name|Nom" \
  --field "phone|tel|الهاتف|Phone|Téléphone" \
  --field "portalPassword|password|كلمة مرور البوابة|Portal password|Mot de passe du portail" \
  --field "since|date|عميل منذ|Client since|Client depuis" \
  --field "balance|number|الرصيد|Balance|Solde" \
  --field "status|select(active=نشط/Active/Actif,paused=متوقف/Paused/En pause)|الحالة|Status|Statut" \
  --field "notes|textarea|ملاحظات|Notes|Notes"
npm run typecheck && npm test && npm run build
```
- `--kind` camelCase plural (store slice, nav key, messages namespace; route = kebab-case: `bankCards` -> `/bank-cards/`). Reserved: accounts, myInfo, activityLog, generatedPasswords, settings, security, dashboard, ai, generator, licenseInfo, license, theme, aiApiKey.
- `--type` PascalCase singular. First `--field` is the title (type `text`, required, used for sorting, activity log, delete confirmation).
- Field types: `text textarea tel email url password number date select(...)`. `password` = secret (masked input, copy button with clipboard auto-clear, `MASK` on printouts unless the user agrees). Number fields accept a decimal comma. Table shows the first 4 non-textarea, non-password fields plus a copy button per secret.
- Messages are added to ar/en/fr (`nav.<kind>` + namespace `<kind>`: title, subtitle, add, edit, empty, confirmDelete, nameRequired, `f_<field>`, `o_<field>_<option>`). **Review the Arabic wording** (labels you passed are used verbatim; the generic sentences are neutral).
- What changes: `src/types/index.ts`, `src/store/useStore.ts` (at `// @module-*` markers), new page, `Sidebar.tsx` (`// @nav`), dashboard card (`// @module-dashboard-*`), `src/lib/reports.ts` (`print<Type>`), `messages/*.json`. Backup export/import/clear are wired automatically.
- If a marker is missing the script stops without half-editing: restore the marker (copy it from the template) or do the step by hand with the manual list below.

## Manual recipe (what the script does; use for custom logic)
1. **Type** in `src/types/index.ts`: `id`, fields, `isFavorite`, `createdAt`, `updatedAt`. Secrets are plain strings (they live encrypted in the vault).
2. **Store** (`useStore.ts`): state array, `add/update/delete/toggleFavorite` actions with `logActivity`, and the lines in `exportAllData`, `importAllData` (with `Array.isArray`), `clearAllData`. Use `generateId()`.
3. **Page** `src/app/[locale]/<route>/page.tsx`: `"use client"`, wrap in `<AppLayout>`, copy `accounts/page.tsx` (hand-written reference: filters, strength meter, reveal/copy) or the generated one. Needs: search, empty state with the primary action, add/edit dialog (`role="dialog"`), delete confirmation naming the item (`role="alertdialog"`), Enter/Escape handling for dialogs you add, `dir="auto"` on user text and `dir="ltr"` on phones/emails/ids/numbers.
4. **Navigation**: entry in `Sidebar.tsx` `menu` (key must exist in `messages/*.json` `nav`), dashboard card if useful.
5. **Messages**: every user-visible string in ar, en, fr; same keys and `{placeholders}`; dynamic keys (`t(`o_${f}_${v}`)`) are invisible to the static i18n test: list their families in `tests/i18n.test.mts` if you add new families.
6. **Print**: copy `printAccounts` in `reports.ts` (columns, `MASK` for secrets, `askSecrets`, `secretsNote`); add `print.col.*` keys if you use `reportCol`.
7. **AI / audit**: do NOT include the module in the AI summary unless you add a `case` in `aiTools.buildSummary` that lists only non-secret fields, with a unit test.
8. **Tests**: pure rules (totals, expiry, scoring) in `tests/<name>.test.mts` (import with relative `.ts` paths, no `@/` alias: node cannot resolve it) and add the file to the `test` script in `package.json`. Store-level behaviour is covered by the e2e (`--extra`).
9. **e2e**: add steps with `scripts/e2e_browser.cjs --extra steps.cjs` (see `scripts/extra_example.cjs`).

## Business rules that touch several records
Compute everything first, then ONE `set()` (the store is synchronous, so a single `set` is atomic as far as the UI and persistence are concerned). Examples to follow from the real app: subscription status derived from `endDate`, card/document expiry radar, monthly spend per currency. If a rule needs a counter (invoice numbers) keep it in the store (`counters: {...}`) and increment inside the same `set`.

## Pages that exist in the real app but not in the template
See `recipes.md` for ready `add_module.py` commands (cards, documents, contacts, subscriptions) and for the bigger pages (analytics with recharts, my-info CV, setup-profile wizard) which are copied by reading the real files.
