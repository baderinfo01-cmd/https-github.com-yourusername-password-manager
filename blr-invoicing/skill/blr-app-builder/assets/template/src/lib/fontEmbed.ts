// Documents rendered for print / PDF live in a separate, script-less window (data: URL) that cannot reach the
// app's fonts. So the El Messiri @font-face rules are embedded INTO the HTML as base64 before printing.
let cache: Promise<string> | null = null;

const FILES: [string, string][] = [
  ["/fonts/ElMessiri-arabic.woff2", "U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFC,U+200C-200E"],
  ["/fonts/ElMessiri-latin.woff2", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212"],
  ["/fonts/ElMessiri-latin-ext.woff2", "U+0100-02AF,U+1E00-1EFF,U+2020,U+20A0-20AB"],
];

async function toDataUrl(url: string): Promise<string> {
  const buf = await (await fetch(url)).arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return "data:font/woff2;base64," + btoa(bin);
}

function fontCss(): Promise<string> {
  return (cache ||= Promise.all(FILES.map(async ([u, range]) => `@font-face{font-family:"El Messiri";font-style:normal;font-weight:400 700;src:url(${await toDataUrl(u)}) format("woff2");unicode-range:${range}}`))
    .then((r) => r.join(""))
    .catch(() => ""));
}

/** Inserts the font rules right after the document's <meta charset>. Always run print HTML through this. */
export async function withFont(html: string): Promise<string> {
  const css = await fontCss();
  if (!css) return html;
  const tag = `<style>${css}</style>`;
  return /<meta charset=["']?utf-8["']?>/i.test(html) ? html.replace(/(<meta charset=["']?utf-8["']?>)/i, `$1${tag}`) : html.replace(/<head>/i, `<head>${tag}`);
}
