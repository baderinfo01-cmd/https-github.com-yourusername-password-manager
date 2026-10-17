# Printing, PDF, preview, fonts

**Pipeline**: page builds a complete HTML string (`buildXHtml(data,{lang,settings,paper})`) -> `openPreview({title,fileName,papers,build})` -> `PrintPreviewHost` calls `build(paper)`, runs `withFont()`, shows it in `<iframe sandbox="allow-same-origin" srcDoc>` scaled to the container -> Print = `bridge.print.html(html,{paper,deviceName,copies,dialog})`, PDF = `bridge.print.pdf(html,name,{paper})`.

**Main side** (`withPrintWindow`): hidden `BrowserWindow` with `sandbox:true, javascript:false` loads `data:text/html;charset=utf-8,<encoded>`; `webContents.print({silent:!dialog, printBackground:true, pageSize, copies, deviceName})` or `printToPDF({printBackground:true,pageSize,margins:{marginType:"none"}})`; window destroyed in `finally`. Sizes: print() takes microns (`{width:80000,height:297000}` thermal 80 mm), printToPDF takes inches (`{width:3.15,height:11.7}`); A4 = `"A4"`. Margins come from the document's own `@page` CSS.

**Document HTML rules**
- Self-contained: inline CSS, images as data: URLs (logo/stamp/QR from `qrcode.toDataURL`), no scripts, no external files (the print window has no access to the app origin).
- `<html lang dir>` per language; `esc()` every user string; amounts via `formatNumber` + class `n` (`direction:ltr; unicode-bidi:plaintext; tabular-nums`); `-webkit-print-color-adjust:exact`.
- Layout variants by `paper`: A4 (`@page{size:A4;margin:14mm}`) vs thermal (`80mm auto`, small fonts, one column).
- Amount in words (`lib/words.ts`, ar/fr/en, handles dinars/centimes) when the program prints invoices.
- QR payload for invoices: company|NIF|number|date|total.

**Fonts**: El Messiri woff2 subsets live in `public/fonts/` and are declared with `@font-face` + `unicode-range` in globals.css (offline-safe; BLR itself uses `next/font/google`, which needs internet at build time). For print windows the fonts are base64-embedded by `withFont()` right after `<meta charset>` (so the document needs `<meta charset="utf-8">`). Without it printed Arabic falls back to Tahoma/Segoe.

**Preview iframe**: `sandbox="allow-same-origin"` (no `allow-scripts`) is required so the host can read `contentDocument.scrollHeight` to size the page; scripts stay blocked. Using `sandbox=""` makes height measurement fail (blank/short preview).

**Test**: e2e_browser checks iframe sandbox + embedded font; e2e_electron writes a real PDF through `bridge.print.pdf` with `dialog.showSaveDialog` stubbed. Physical printers cannot be tested in CI: check `printers()` and test on a real Windows machine (A4 + 80 mm).
