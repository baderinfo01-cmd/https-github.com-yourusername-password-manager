"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, RefreshCw, Wand2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { checkPasswordStrength } from "@/lib/passwordStrength";
import { copyToClipboard } from "@/lib/utils";

const SETS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*()-_=+[]{}?",
};

/** Cryptographically random index (rejection sampling, no modulo bias). Never use Math.random() for passwords. */
function randomIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

export function generatePassword(length: number, opts: Record<keyof typeof SETS, boolean>): string {
  const groups = (Object.keys(SETS) as (keyof typeof SETS)[]).filter((k) => opts[k]).map((k) => SETS[k]);
  if (!groups.length) return "";
  const pool = groups.join("");
  // guarantee at least one character of every selected group, then fill and shuffle
  const chars = groups.map((g) => g[randomIndex(g.length)]);
  while (chars.length < length) chars.push(pool[randomIndex(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, length).join("");
}

export default function GeneratorPage() {
  const t = useTranslations("generator");
  const tc = useTranslations("common");
  const ts = useTranslations("strength");
  const history = useStore((s) => s.generatedPasswords);
  const addHistory = useStore((s) => s.addGeneratedPassword);
  const clearHistory = useStore((s) => s.clearGeneratedPasswords);
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [pw, setPw] = useState("");
  const [copied, setCopied] = useState(false);

  const make = useCallback(() => setPw(generatePassword(length, opts)), [length, opts]);
  useEffect(() => make(), [make]);

  const st = checkPasswordStrength(pw);
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" />{t("title")}</h1>
        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 break-all text-xl num p-3 rounded-xl bg-accent" dir="ltr" data-testid="generated">{pw}</code>
            <button onClick={make} className="p-3 rounded-xl hover:bg-accent" aria-label={t("regenerate")}><RefreshCw className="w-5 h-5" /></button>
            <button
              onClick={async () => { if (await copyToClipboard(pw)) { addHistory(pw); setCopied(true); setTimeout(() => setCopied(false), 1500); } }}
              className="p-3 rounded-xl text-white bg-primary" aria-label={tc("copy")}
            ><Copy className="w-5 h-5" /></button>
          </div>
          <div className="text-sm text-muted">{ts(st.level)} {copied && <span className="text-green-600">· {tc("copied")}</span>}</div>
          <label className="block text-sm">{t("length")}: <b className="num">{length}</b>
            <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full accent-[rgb(var(--c-primary))]" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(SETS) as (keyof typeof SETS)[]).map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} /> {t(k)}
              </label>
            ))}
          </div>
        </div>
        {history.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold">{t("history")}</h2>
              <button onClick={clearHistory} className="text-sm text-red-600">{t("clearHistory")}</button>
            </div>
            <ul className="space-y-1 text-sm num" dir="ltr">{history.slice(0, 8).map((h) => <li key={h.id} className="truncate">{h.password}</li>)}</ul>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
