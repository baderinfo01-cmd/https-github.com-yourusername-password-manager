// Amount in words — Arabic, English and French (invoice "المبلغ بالكلمات").
export type WLang = "ar" | "en" | "fr";

const CUR: Record<string, { ar: [string, string]; en: [string, string]; fr: [string, string] }> = {
  DZD: { ar: ["دينار جزائري", "سنتيم"], en: ["Algerian dinar", "centime"], fr: ["dinar algérien", "centime"] },
  MAD: { ar: ["درهم مغربي", "سنتيم"], en: ["Moroccan dirham", "centime"], fr: ["dirham marocain", "centime"] },
  TND: { ar: ["دينار تونسي", "مليم"], en: ["Tunisian dinar", "millime"], fr: ["dinar tunisien", "millime"] },
  EUR: { ar: ["يورو", "سنت"], en: ["euro", "cent"], fr: ["euro", "centime"] },
  USD: { ar: ["دولار أمريكي", "سنت"], en: ["US dollar", "cent"], fr: ["dollar américain", "cent"] },
  SAR: { ar: ["ريال سعودي", "هللة"], en: ["Saudi riyal", "halala"], fr: ["riyal saoudien", "halala"] },
  AED: { ar: ["درهم إماراتي", "فلس"], en: ["UAE dirham", "fils"], fr: ["dirham des EAU", "fils"] },
};

// ---------- English ----------
const EN_U = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_T = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function en(n: number): string {
  if (n < 20) return EN_U[n];
  if (n < 100) return EN_T[Math.floor(n / 10)] + (n % 10 ? "-" + EN_U[n % 10] : "");
  if (n < 1000) return EN_U[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + en(n % 100) : "");
  for (const [v, name] of [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"]] as const) {
    if (n >= v) return en(Math.floor(n / v)) + " " + name + (n % v ? " " + en(n % v) : "");
  }
  return String(n);
}

// ---------- French ----------
const FR_U = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const FR_T = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];
function fr(n: number): string {
  if (n < 20) return FR_U[n];
  if (n < 70) { const t = Math.floor(n / 10), u = n % 10; return FR_T[t] + (u === 1 ? " et un" : u ? "-" + FR_U[u] : ""); }
  if (n < 80) { const u = n - 60; return "soixante" + (u === 11 ? " et onze" : "-" + FR_U[u]); }
  if (n < 100) { const u = n - 80; return "quatre-vingt" + (u ? "-" + FR_U[u] : "s"); }
  if (n < 1000) {
    const h = Math.floor(n / 100), r = n % 100;
    return (h === 1 ? "cent" : FR_U[h] + " cent" + (r ? "" : "s")) + (r ? " " + fr(r) : "");
  }
  if (n < 1e6) {
    const k = Math.floor(n / 1000), r = n % 1000;
    return (k === 1 ? "mille" : fr(k) + " mille") + (r ? " " + fr(r) : "");
  }
  for (const [v, name] of [[1e9, "milliard"], [1e6, "million"]] as const) {
    if (n >= v) { const q = Math.floor(n / v); return fr(q) + " " + name + (q > 1 ? "s" : "") + (n % v ? " " + fr(n % v) : ""); }
  }
  return String(n);
}

// ---------- Arabic ----------
const AR_U = ["صفر", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const AR_T = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const AR_H = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
function ar999(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100), r = n % 100;
  if (h) parts.push(AR_H[h]);
  if (r) {
    if (r < 20) parts.push(AR_U[r]);
    else { const u = r % 10; parts.push((u ? AR_U[u] + " و" : "") + AR_T[Math.floor(r / 10)]); }
  }
  return parts.join(" و");
}
function ar(n: number): string {
  if (n === 0) return AR_U[0];
  const scales: [number, string, string, string][] = [[1e9, "مليار", "ملياران", "مليارات"], [1e6, "مليون", "مليونان", "ملايين"], [1e3, "ألف", "ألفان", "آلاف"]];
  const out: string[] = [];
  let rest = n;
  for (const [v, one, two, many] of scales) {
    const q = Math.floor(rest / v);
    if (!q) continue;
    rest %= v;
    if (q === 1) out.push(one);
    else if (q === 2) out.push(two);
    else if (q <= 10) out.push(ar999(q) + " " + many);
    else out.push(ar999(q) + " " + one);
  }
  if (rest) out.push(ar999(rest));
  return out.join(" و");
}

export function numberToWords(n: number, lang: WLang): string {
  const v = Math.floor(Math.abs(n));
  return lang === "ar" ? ar(v) : lang === "fr" ? fr(v) : en(v);
}

/** "فقط ... لا غير" / "Only ..." / "Arrêté à la somme de ..." */
export function amountInWords(amount: number, lang: WLang, currencyCode: string, decimals = 2): string {
  const total = Math.round(Math.abs(amount) * 10 ** decimals) / 10 ** decimals;
  const whole = Math.floor(total);
  const sub = Math.round((total - whole) * 10 ** decimals);
  const c = CUR[currencyCode]?.[lang] || [currencyCode, ""];
  const plural = (name: string) =>
    lang === "fr" ? name.split(" ").map((w) => (/[sx]$/.test(w) ? w : w + "s")).join(" ")
    : lang === "en" ? name.replace(/(dinar|euro|dollar|riyal|dirham)$/, "$1s").replace(/(dinar|dirham|riyal|dollar) (?=[a-z])/, "$1 ")
    : name;
  const main = `${numberToWords(whole, lang)} ${whole > 1 && lang !== "ar" ? plural(c[0]) : c[0]}`;
  const frac = sub > 0 && c[1] ? ` ${lang === "ar" ? "و" : lang === "fr" ? "et" : "and"} ${numberToWords(sub, lang)} ${c[1]}${lang !== "ar" && sub > 1 ? "s" : ""}` : "";
  const text = main + frac;
  if (lang === "ar") return `فقط ${text} لا غير`;
  if (lang === "fr") return `Arrêtée à la somme de : ${text}`;
  return `Only ${text}`;
}
