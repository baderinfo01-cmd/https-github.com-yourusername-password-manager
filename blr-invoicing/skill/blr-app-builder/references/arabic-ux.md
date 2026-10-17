# Arabic-first UX guidelines

- Default language `ar`, `<html dir="rtl">`; switching language toggles `lang`/`dir` (store/ui.ts `apply`). Persist choice in localStorage (try/catch).
- Use logical CSS only: `ps-/pe-/ms-/me-/start-/end-/text-start/text-end`, never `pl/pr/left/right` for layout (sidebar uses `start-3` and `ltr:/rtl:` variants). Icons that imply direction (arrows, chevrons) must flip: `rtl:rotate-180`.
- Numbers: Latin digits everywhere (`ar-DZ-u-nu-latn`, `formatNumber`), tabular, `.num` class (`direction:ltr; unicode-bidi:plaintext`). Money always LRI/PDI isolated (`\u2066...\u2069`): otherwise "1 200 DA" renders as "DA 1 200" inside Arabic text. Phone numbers, emails, IDs, codes: `dir="ltr"` inline.
- Mixed text: wrap Latin product names in `<bdi>` or `dir="auto"` when inserting into Arabic sentences; table cells with user text use `dir="auto"`.
- Writing: short, polite imperative ("احفظ", "أضف"), consistent terms (فاتورة، عرض سعر، سند تسليم، إشعار دائن، مورّد، عميل)، tashkeel only where ambiguity. Keep the ar/en/fr meaning identical; French uses Algerian business terms (TVA, NIF, RC, NIS, AI, Arrêtée à la somme de).
- Font: El Messiri (400-700), 15 px base; line-height generous for Arabic; avoid italics/letter-spacing on Arabic text (breaks joining).
- Forms: label above field, required marked `*`, errors as plain sentences from `err_*` keys, never raw error codes; confirm destructive actions with the item name; toast for success; Enter submits; autofocus the first field; `inputMode="decimal"` + `num()` accepts "12,5".
- Calendar/dates: Gregorian with Latin digits, `fmtDate`; week starts Saturday in many Arab locales (BLR calendar page shows how it is handled).
- Show first-run guidance (company wizard) and empty states with a primary action. Dark mode and colour themes through CSS variables; contrast AA.
- Test every screen in ar (RTL), fr (longest strings) and en before release; screenshot all three for the main pages.
