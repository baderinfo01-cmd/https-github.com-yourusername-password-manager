"use client";
import { useUi, type Lang } from "@/store/ui";
import { DICT } from "./dict";

const IDX: Record<Lang, number> = { ar: 0, en: 1, fr: 2 };

export function tr(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const e = DICT[key];
  let s = e ? e[IDX[lang]] || e[1] : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
export function useT() {
  const lang = useUi((s) => s.lang);
  return (key: string, vars?: Record<string, string | number>) => tr(lang, key, vars);
}
export const LOCALE: Record<Lang, string> = { ar: "ar-DZ-u-nu-latn", en: "en-GB", fr: "fr-FR" };
export function fmtDate(iso: string | undefined, lang: Lang) {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return d.toLocaleDateString(LOCALE[lang], { year: "numeric", month: "2-digit", day: "2-digit" });
}
