import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const LANGS = ["ar", "en", "fr"] as const;
const load = (l: string) => JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), "utf8"));

function flatten(o: any, prefix = "", out: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = String(v);
  }
  return out;
}
const msgs = Object.fromEntries(LANGS.map((l) => [l, flatten(load(l))]));
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

test("ar / en / fr have exactly the same keys", () => {
  const base = Object.keys(msgs.en).sort();
  for (const l of ["ar", "fr"] as const) {
    const keys = Object.keys(msgs[l]).sort();
    assert.deepEqual(keys.filter((k) => !base.includes(k)), [], `${l}: keys missing in en`);
    assert.deepEqual(base.filter((k) => !keys.includes(k)), [], `${l}: keys missing`);
  }
});

test("no empty translations and identical {placeholders} in every language", () => {
  for (const [k, en] of Object.entries(msgs.en)) {
    for (const l of LANGS) {
      assert.ok(msgs[l][k] && msgs[l][k].trim(), `${l}.${k} is empty`);
      assert.equal(placeholders(msgs[l][k]), placeholders(en), `${l}.${k} has different {placeholders}`);
    }
  }
});

test("Arabic is really Arabic (guards against pasted English in ar.json)", () => {
  // product names and technical tokens may stay Latin; ordinary sentences must contain Arabic letters
  const short = /^[\w\s.\-–—/:()·•…"'+@#%&*{}!?,;|=<>\\]*$/;
  const bad = Object.entries(msgs.ar).filter(([k, v]) => !/[؀-ۿ]/.test(v) && !short.test(v));
  assert.deepEqual(bad.map(([k]) => k), []);
});

test("every static t('key') used in src exists (namespaces resolved per file where possible)", () => {
  // light check: collect useTranslations("ns") + t("key") pairs when a file uses ONE namespace for variable t
  const files: string[] = [];
  const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && files.push(p); });
  walk(new URL("../src", import.meta.url).pathname);
  const missing: string[] = [];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    // const t = useTranslations("ns")  /  const tc = useTranslations("common")
    for (const m of src.matchAll(/const\s+(\w+)\s*=\s*useTranslations\(\s*"([\w.]+)"\s*\)/g)) {
      const [, v, ns] = m;
      for (const u of src.matchAll(new RegExp(`\\b${v}\\(\\s*"([\\w.]+)"`, "g"))) {
        const key = `${ns}.${u[1]}`;
        if (!(key in msgs.en)) missing.push(`${f.split("/src/")[1]}: ${key}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});
