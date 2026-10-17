# i18n workflow (ar / en / fr) and Arabic-first UX

## Mechanics
- `next-intl` 4, locales `["ar","en","fr"]`, `defaultLocale: "ar"`, `localePrefix: "always"` (`src/i18n/routing.ts`). Messages: `messages/{ar,en,fr}.json` loaded by `src/i18n/request.ts`; `[locale]/layout.tsx` provides `NextIntlClientProvider` and sets `<html lang dir>` (`rtl` only for `ar`).
- In pages: `const t = useTranslations("accounts")` -> `t("title")`, `t("subtitle", { count })`. Common words in `common.*`, menu in `nav.*`.
- Static export: pages are prerendered for the three locales (`generateStaticParams`). `middleware.ts` (renamed "Proxy" in Next 16) only matters in `next dev` (redirect `/` -> `/ar`); in the packaged app the protocol handler serves `/` as `ar/index.html`.
- Language switcher (`Header`): replace the first path segment and `router.push`: a full reload would lose the in-memory vault key. The login page has its own three-button switcher and uses `useLocale()` to decide where to go after unlock (the real app kept a hard-coded `"ar"` state there: after switching language and unlocking it still opened `/ar/...`).

## Adding or changing text (do it in all three languages in the same change)
1. Add the key to `ar.json`, `en.json`, `fr.json` in the same position, same nesting, same `{placeholders}`.
2. Use the key in the page. Never hard-code visible strings (the real app still has some Arabic literals in Settings/Sidebar/print: do not copy them).
3. Run `npm test`: `tests/i18n.test.mts` fails on missing/extra keys, empty values, placeholder mismatches, pasted English in `ar.json`, and static `t("ns.key")` references that do not exist.
4. Dynamic keys (`t(`categories.${v}`)`, `t(`o_${k}_${v}`)`, `t(`err_${code}`)`) are not seen by the static check: make sure every possible value has a key (add a loop test for new families).
5. `add_module.py` and `new_app.py` edit the JSON files with `json.load/dump(ensure_ascii=False, indent=2)`: keep that formatting when editing by hand so diffs stay small.
6. Look at the three languages in screenshots (`e2e_browser.cjs` saves ar/en/fr, mobile drawer, dark): French strings are the longest, Arabic the most layout-sensitive.

## Arabic-first UX conventions (what the owner expects)
- Arabic default, RTL. Use **logical CSS**: `ps-/pe-/ms-/me-/start-/end-/text-start/text-end/border-s/border-e`, never `left/right/pl/pr` for layout (the real Header still has `right-3`/`pr-10` search icon: a RTL bug). Directional icons flip with `rtl:rotate-180` (chevrons, send arrows). Sidebar is at the inline-start: `fixed start-0`, drawer `ltr:-translate-x-full rtl:translate-x-full`.
- **Numbers and Latin tokens inside Arabic text** must not reorder: Latin digits everywhere (`ar-DZ-u-nu-latn`), class `num` (`direction:ltr; unicode-bidi:plaintext`) on numbers/dates/prices; `dir="ltr"` on emails, URLs, usernames, passwords, phone numbers, IDs, codes; `dir="auto"` (or `<bdi>`) on user-entered names/titles and on any Arabic sentence that embeds a Latin name.
- **Fonts**: El Messiri (400-700) bundled in `public/fonts` and declared with `@font-face` (unicode-range split arabic/latin). Never `next/font/google` (needs internet at build; breaks offline/CI behind proxies) and never a CDN (CSP). 15 px base. No letter-spacing/italics on Arabic (breaks joining).
- **Wording**: short polite imperatives ("احفظ"، "أضف"، "احذف"), consistent terms: خزنة (vault), كلمة المرور الرئيسية (master password), حساب، بطاقة، وثيقة، اشتراك، جهة اتصال، نسخة احتياطية، قفل البرنامج، سجل الأمان، ترخيص، تفعيل. Errors are sentences, never codes (`auth.tooManyAttempts` with `{seconds}`). Honest warnings are part of the UX: "لا يوجد استرجاع لكلمة المرور" at creation; "كلمات المرور مخفية في هذه الطباعة" on reports.
- **Dialogs and flows**: label above field, `*` for required, Enter submits, Escape cancels where relevant, first field autofocused, destructive actions confirm with the item name, success feedback visible (toast/inline), empty state with a primary action ("أضف أول حساب"), password fields never auto-filled by the browser (`autoComplete="off"/"new-password"/"current-password"` as appropriate).
- **Dark mode and themes** through CSS variables (`--c-*`); components use semantic utilities (`bg-card text-fg text-muted border-border bg-primary`) so both modes work. Do not use `bg-white`/`text-gray-*` in new code (the real app needs a pile of `!important` dark overrides for them).
- **Dates**: Gregorian, Latin digits, `formatDate(iso, locale)`; Algerian owner, so French wording uses Algerian business terms where relevant (TVA, NIF, RC...). Currencies as ISO codes (DZD, USD, EUR) next to the number.
- **Sizes**: desktop windows min 1100x700 in the real app; the layout still collapses to a drawer below `md` (768 px) so narrow windows and tests work.
- **Accessibility basics**: `aria-label` on icon buttons, `role="dialog"/"alertdialog"` + `aria-modal`, `role="alert"` for errors, `role="status"` for non-blocking notices, visible focus ring (global CSS), `prefers-reduced-motion` respected.
- **Owner-facing replies**: the owner writes Arabic; answer in Arabic (technical identifiers stay Latin), keep docs for customers in Arabic first (`docs/*-AR.md`), code comments in English.
