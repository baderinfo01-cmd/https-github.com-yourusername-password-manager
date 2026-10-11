// Code 128 (subset B) barcode as inline SVG — for product labels.
const P = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112",
];
export const CODE128_PATTERNS = P;

export function code128Values(text: string): number[] {
  const chars = Array.from(text).map((c) => c.charCodeAt(0)).map((c) => (c >= 32 && c <= 126 ? c - 32 : 0));
  const vals = [104, ...chars];
  const sum = vals.reduce((a, v, i) => a + (i === 0 ? v : v * i), 0);
  return [...vals, sum % 103, 106];
}

/** SVG string, width scales with the text length. */
export function code128Svg(text: string, height = 40, module = 1.6): string {
  const vals = code128Values(text);
  let x = 10 * module; // quiet zone
  let bars = "";
  for (const v of vals) {
    const pat = P[v];
    let draw = true;
    for (const ch of pat) {
      const w = Number(ch) * module;
      if (draw) bars += `<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${height}"/>`;
      x += w;
      draw = !draw;
    }
  }
  const total = x + 10 * module;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total.toFixed(2)} ${height}" width="100%" height="${height}" preserveAspectRatio="none" fill="#000">${bars}</svg>`;
}
