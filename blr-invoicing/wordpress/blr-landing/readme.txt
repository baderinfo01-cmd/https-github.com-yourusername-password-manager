=== BLR Fatourati Landing ===
Contributors: baderinfo
Tags: landing page, invoicing, software, pricing, multilingual
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later

Eight-language sales page for BLR Fatourati, an invoicing and business-management desktop program for Windows. Add the shortcode [blr_landing] to any page.

== Description ==
Add [blr_landing] to a page. Edit price, trial length and contact details under Settings > BLR Fatourati Landing.
Optional: [blr_landing lang="en"] forces a language.

BLR Fatourati works fully offline after one activation, with a lifetime license bound to one device and one program. A free 2-day trial is available with a trial code.

= Features shown on the page =
* Documents: invoices, quotes, proforma, delivery notes, credit notes, purchase invoices and orders, recurring invoices, conversions, discounts, several VAT rates, Algerian stamp duty, amount in words
* Printing: preview, A4 / 80 mm thermal / PDF, QR code, 3 templates, receipts, vouchers, statements, WhatsApp/email sharing
* Clients and suppliers, products and stock, point of sale, payments and expenses, reports and dashboard
* Tools: calendar, tasks, quick search, shortcuts
* Security: roles, audit log, lockout, auto-lock, recovery key, daily backups, AES-256 encrypted backup
* Optional AI assistant (Claude, your own key), light/dark mode, 8 colour themes
* Comparison strip, 3-step "how it works", pricing, 11-question FAQ, contact, final call to action, screenshot gallery with lightbox

= Languages =
Arabic (RTL), English, Francais, Espanol, Deutsch, Turkce, Portugues, Italiano. A compact dropdown switches language without reloading; the visitor's choice is remembered, and the browser language is used when the default language is "auto" (falls back to the site language).
Texts live in includes/lang/*.json (one file per language).

== Installation ==
1. Plugins > Add New > Upload Plugin, choose blr-landing.zip, install and activate.
2. Create a page and put the shortcode [blr_landing] in it. For a full-width look use your theme's full-width/blank template and tick "Full width" in the settings.
3. Settings > BLR Fatourati Landing: set price, currency, trial days, buy/trial/download links and contact details. Badge text and address for es/de/tr/pt/it go in the "other languages" boxes, one line per language, like: es=Oferta de lanzamiento

== Screenshots gallery ==
Add these files (1360x850 JPG) to wp-content/plugins/blr-landing/assets/shots/ : dashboard.jpg, invoice.jpg, pos.jpg, reports.jpg, calendar.jpg, license.jpg.
Missing images are hidden automatically, and the whole "See it in action" section is hidden if none exist. (No images ship with the plugin; the folder assets/shots/ is a placeholder for them.)

== Changelog ==
= 1.1.0 =
* Added Espanol, Deutsch, Turkce, Portugues, Italiano; language dropdown; full feature list; comparison strip; 3-step section; FAQ; screenshot gallery; new design.
= 1.0.0 =
* First release.
