# Data model & business rules (BLR Fatourati) - reuse for invoicing-like programs

Kinds (SQLite `records.kind`): `settings`(id "main"), `clients`, `suppliers`, `items` (products AND services, `type`), `categories`, `docs`, `payments`, `expenses`, `moves` (stock movements), `recurring`, `tasks`, `audit`, `users` (private). Counters: `invoice:2026`, `receipt:2026`...

## Documents (`docs`)
Types: invoice, quote, proforma, delivery, credit (credit note), purchase, order (purchase order). Status: draft, sent, accepted, rejected, void, issued. A doc has `lines[{id,itemId?,desc,qty,unit,price,discountPct,taxRate}]`, `discount`+`discountType`, `shipping`, `stamp`, `extraTaxes`, stored totals (`subtotal, discountAmount, tax, extraTax, total`), `refId/refNumber` (source doc), `stockApplied` (itemId -> signed qty already applied).
- Number = `PREFIX-YYYY-00001` from `db.next(type:year)` (yearly reset configurable in `settings.numbering[type]`). Never compute numbers in the page.
- Totals: `computeTotals` (lib/calc.ts): line net = qty*price*(1-disc%); document discount spread proportionally; tax per line on the discounted net; optional "prices include tax" (extract); extra document taxes on net after discount; + shipping + stamp. Round only at the end (2 dp). Totals are recomputed and stored in `saveDoc` - the page never trusts its own totals.
- Algerian stamp duty (`stampDuty`): cash payments only, 1% <=300k, 1.5% <=3M, 2% above, min 5, max 2500, optional in settings.
- Convert (`convert`): copy lines with fresh ids, new number, `refId`; invoice gets `dueDate = today + dueDays`, status sent; quote/proforma source becomes accepted.

## Stock effect accounting (`saveDoc`)
`stockSign`: invoice/delivery -1, credit/purchase +1, others 0. A doc counts only if its type affects stock, status not draft/void, and it is not a delivery generated from an invoice (`refId`). Desired effect = per tracked item qty*sign; services expand to their `materials` (qty*line qty) except on purchases. Saved delta = desired - `doc.stockApplied` (previous effect), written as item stock update + one `moves` row per changed item, all in ONE batch together with the doc. `removeDoc` reverses `stockApplied`, deletes its payments and moves. A purchase also refreshes the item's `cost` from the line price. This "reverse previous, apply new" rule is what makes edits idempotent; keep it for any inventory-like module.

## Payments
`payments{kind in|out, docId, amount, date, method, number RCPT-YYYY-00001}`. `balances(docs,payments)` -> paid per doc + credit notes per source invoice. `paymentStatus`: paid (due<=0.005), overdue (dueDate<today and due>0), partial, unpaid. Void/draft are shown as such, not as unpaid. Party balance = opening balance + invoices - payments - credits (see `lib/party.ts`); credit limit warns on new invoices.

## Recurring
`recurring{partyId,lines,every week|month|quarter|year,nextDate,endDate,active,dueDays}`. `runRecurring()` runs after login/load: while `nextDate <= today` (guard 24) create a sent invoice dated `nextDate`, advance with `addPeriod`, store `lastNumber`. Idempotent because `nextDate` is saved after each invoice.

## Roles (`store/ui.ts` PERMS)
admin `*`; manager sales/purchases/clients/products/payments/expenses/reports/stock/pos/ai/delete; cashier sales/clients/products:read/payments/pos; accountant reports/payments/expenses + read-only elsewhere. `x` implies `x:read`. Users admin screen: cannot remove/disable the last admin, cannot delete yourself, password reset by admin, recovery key flow for the admin.

## Auth & security (db.js)
scrypt (N=16384) per-user salt; constant-time compare; dummy hash for unknown users (timing); 5 failures -> exponential lock (max 15 min) in memory; 20-char recovery key (alphabet without 0/O/1/I), shown once, only its scrypt hash stored, renewable with the password; backups AES-256-GCM with scrypt key (magic `XBAK1`), plain `XBAK0` when no password, restore requires admin and takes a `before-restore` auto backup first.

## Reports/analytics
Pure functions over arrays (`lib/analytics.ts`, `aiSummary.ts`): sales/profit/VAT/cash-flow by period, aging of debts, top clients/products, dead stock (90 days). Keep them pure so node tests can cover them. Optional AI assistant: key stored with `safeStorage` in main (`electron/ai.js`), only a numeric summary is sent.
