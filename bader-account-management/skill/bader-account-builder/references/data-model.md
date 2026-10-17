# Data model and store conventions

## Collections in the real app (`src/types/index.ts`, `src/store/useStore.ts`)
| Collection | Key fields (secrets in **bold**) | Notes |
|---|---|---|
| `accounts` | siteName, siteUrl?, category, emails[] (email + **password**), phones[], username, **password**, recoveryEmail, notes, isFavorite, createdAt, updatedAt | weak/reused/old detection feeds the security score |
| `subscriptions` | name, siteUrl, category, username, **password**, email, phone, customerName, startDate, endDate, price, currency, status `active|expired|frozen`, notes | expiry radar + monthly spend per currency |
| `cards` | type/customType, **cardNumber**, holderName, issuerBank, expiryDate, issueDate, **pinCode**, **cvv**, phone, nationalId, email, urls, accountUsername, **accountPassword**, iban, swiftCode, branch, notes | numbers masked in reports (`maskCard`) |
| `documents` | type/customTypeName, first/last name (+ Latin), **documentNumber**, nationalIdNumber, address, birth data, gender, issue/expiry date, issuePlace, **pinCode**, bloodType, avatar, notes | expiry radar (90 days) |
| `contacts` | firstName, lastName, category, phone1, phone2, email, city, state, notes | |
| `myInfo` | profile: names, username, bio, emails/phones/addresses/**secrets**, work experience, education, hobbies, achievements, certifications, skills, languages | `username` + full name are printed in every report header (`getOwner()`) |
| `*Categories` | value, label, color, icon, labels{ar,en,fr} | user-editable lists (cards, documents, contacts) |
| `activityLog` | type add/edit/delete/view/print/export, itemType, itemName, createdAt | last 100, dashboard "recent activity" |
| `generatedPasswords` | last 50 generated passwords (history) | it is a SECRET store too (encrypted with the vault) |
| `analytics` | last 100 samples | page `analytics` (recharts) |
| settings | theme, language, fontSize, autoLockMinutes, notificationsEnabled, backupFrequency, exportFormat, loginAlerts, sessionTimeout, aiApiKey, ... | **several settings in the real app are decorative** (stored but not enforced: biometric, twoFactor, backupFrequency, ...). In new programs every setting must do something or not exist. |

Every record: `id = generateId()` (time + random, non-secret), ISO `createdAt`, `updatedAt` (not all collections in the real app have `updatedAt`; the template and generated modules always do), `isFavorite`.

## Template model (what you get)
`accounts` (reference module), `myInfo` (first/last name + username, used in reports), `activityLog`, `generatedPasswords`, settings (`theme`, `autoLockMinutes`, `notificationsEnabled`, `aiApiKey`). Generated modules (`add_module.py`) add a typed collection each.

## Store rules
1. **One persisted store**: `persist(..., { name: "bader-storage-v2", storage: createJSONStorage(() => encryptedStorage), skipHydration: true })`. The persist `name` is the legacy key and is ignored by the adapter (the adapter writes the single vault blob); keep it for the legacy migration.
2. Actions are synchronous `set(...)` calls; persistence is automatic and async. Never write to `localStorage` yourself.
3. **Every collection must appear in `exportAllData`, `importAllData` and `clearAllData`.** Forgetting one means backups silently lose data and "delete all" leaves it behind. `add_module.py` inserts all three at the `// @module-export|import|clear` markers.
4. `importAllData` must be defensive: parse JSON, check types (`Array.isArray`), refuse another program's backup (`data.app !== branding.slug`), return `false` instead of throwing, never trust shapes blindly (the real app trusts them: a corrupted file can crash pages).
5. Activity log: write `logActivity(type, itemType, name)` inside each add/update/delete action. Never put secrets in `itemName`.
6. Updates: `{...old, ...updates, updatedAt: now}`; deletes filter by id; favourites toggle `isFavorite`.
7. Derived data (scores, radar, totals) is computed in `useMemo` from the store; do not persist derived values.
8. Selectors: `useStore((s) => s.accounts)` per slice; avoid `useStore()` without a selector in hot pages (the template does it only in Settings).
9. Dates are ISO strings (`YYYY-MM-DD` for date fields); display with `formatDate(iso, locale)` (`ar-DZ-u-nu-latn` -> Latin digits). Money: number + currency code; display with `Intl.NumberFormat` using a Latin-digit locale; keep the number in an element with `className="num"` (LTR) so Arabic text does not reorder it. Parse user input with `Number(String(v).replace(",", "."))`.
10. Large attachments (images, avatars) are not supported by design (localStorage is ~5-10 MB). If a new program needs files, design main-process storage (encrypted files in `userData`) as a separate, reviewed feature.

## Security audit (`securityAudit.ts`)
`auditAccounts(list)` -> `{score, total, weak, reused, old, issues[]}`: weak = `checkPasswordStrength(...).score <= 2`, reused = same password on > 1 record, old = `updatedAt` older than 180 days. `score = max(0, round(100 - (weak*3 + reused*2 + old) / (total*6) * 100))` (100 when empty). `buildAiSummary` returns site names + counts only.
`passwordStrength` score 0-7 (length >= 8/12/16, lower, upper, digit, symbol) -> level `weak (<=2) | medium (<=4) | strong (5) | veryStrong`.

## Expiry radar (real app, `aiTools.buildRadar`)
Subscriptions active with `endDate` in <= 30 days (or expired), cards/documents with `expiryDate` in <= 90 days (or expired), `monthlySpend` per currency. Only names, types, dates, prices leave the device. Recreate it for any module with dates; add the case + test.
