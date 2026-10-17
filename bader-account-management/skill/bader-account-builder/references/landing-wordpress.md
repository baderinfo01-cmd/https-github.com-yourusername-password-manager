# Landing page and WordPress plugin (sales pages in ar / en / fr)

`new_app.py` generates both next to the app unless `--no-landing`:
- `landing/` - static HTML/CSS/JS, no build step, no external requests (CSP `default-src 'self'`), upload the folder anywhere or open `index.html`.
- `wordpress/<slug>-landing/` + `wordpress/<slug>-landing.zip` - a WordPress plugin with the shortcode `[<slug_snake>_landing]` and an admin screen (Settings -> `<Name> Landing`) to edit price, trial days, buy/download links, contacts, colour, default language and optional title/description per language.

## What is generic (reuse as is) and what is copy (rewrite per program)
| Generic engine | Per-program copy |
|---|---|
| `landing/app.js`, `index.html` (sections: hero, trust chips, features, security, AI, pricing, FAQ, contact form via `mailto:`), `site-config.js` (price, links, contacts, brand colour, default language), language switch `?lang=en` + localStorage, RTL/LTR flip, JSON-LD price data in the plugin, config sanitising and escaping in PHP | `landing/i18n.js` (all texts for ar/en/fr), `wordpress/.../includes/strings.php` (same texts), feature list, FAQ, price and trial length, screenshots (none are shipped) |

The copy shipped in the template is the **Bader Account Management sales copy (encrypted vault of accounts/cards/documents/subscriptions)**. It is marked `COPY-STATUS: DRAFT` at the top of `i18n.js` and `strings.php`. Rewrite for the new program: hero title/text, features (one card per module), security points (keep only claims that are true for the new program), AI section (drop it if the program has no assistant), pricing bullets, FAQ. Then change the marker to `COPY-STATUS: FINAL`. `new_app.py --check <dir> --release` fails while DRAFT remains.

## Content rules (honesty)
- No invented reviews, customer counts, awards or sales numbers; no claim the program does not implement (e.g. "unbreakable", "works on phone"); the phone/sync features are not part of Bader Account Management any more.
- Keep the honest FAQ items: no password recovery, internet needed only for activation/licence re-check/AI/breach check, one licence = one device, unsigned installer warning if applicable.
- Price/currency/trial are configuration, not copy: change them in `site-config.js` or the WordPress settings screen. Buy link: payment page or `https://wa.me/<digits>` when no payment page exists.
- Arabic first in tone; French uses natural commercial French; English short. Keep the three languages equivalent in meaning.
- Contacts that are empty are hidden automatically. Defaults come from `new_app.py` arguments.

## WordPress plugin generation details
`build_wordpress()` copies `assets/wordpress/bader-landing` and renames global identifiers so two programs' plugins can be active on the same site: functions/constants `bal_*`/`BAL_*` -> `<slug_snake>_*`, shortcode `bader_landing` -> `<slug_snake>_landing`, slug/text-domain/files `bader-landing` -> `<slug>-landing`, title `Bader Landing` -> `<Name> Landing`, then `php -l` (if php exists) and a zip with the folder `<slug>-landing/` at its root. CSS classes keep the `bal-` prefix on purpose (styles are scoped to the shortcode output).
Security properties to keep when editing: all settings sanitised on save (URLs via `esc_url_raw` with protocol allow-list, numbers, colours), escaped on output, `javascript:` links rejected, no external assets, settings screen limited to `manage_options`. Upload to WordPress: Plugins -> Add New -> Upload -> activate -> new page with the shortcode (`lang="en"` forces a language) -> optional full-width template. Clear page caches after changing settings.

## What was and was not verified
Verified: static scan, `php -l` of the generated plugin, zip structure, token replacement. **Not verified**: rendering inside a real WordPress, the Elementor/theme interaction, SEO tools, payment links, the mailto form on the owner's mail client. Test on a staging site first (`docs/WORDPRESS-AR.md` says the same).
Also update the generated Arabic guides (`docs/WORDPRESS-AR.md`, `landing/README-AR.md`) if the program has different sections.
