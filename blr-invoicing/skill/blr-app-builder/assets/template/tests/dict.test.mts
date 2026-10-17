// "checkdict": the dictionary must stay a clean [ar, en, fr] triple and cover every t("key") used in src/.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DICT } from "../src/lib/dict.ts";

const SRC = path.join(import.meta.dirname, "..", "src");
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(d, e.name)] : []));
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

test("every entry has three non-empty strings with the same {placeholders}", () => {
  for (const [k, v] of Object.entries(DICT)) {
    assert.ok(Array.isArray(v) && v.length === 3, `${k}: must be [ar, en, fr]`);
    v.forEach((s, i) => assert.ok(typeof s === "string" && s.trim() !== "", `${k}[${i}] is empty`));
    assert.equal(placeholders(v[0]), placeholders(v[1]), `${k}: ar/en placeholders differ`);
    assert.equal(placeholders(v[1]), placeholders(v[2]), `${k}: en/fr placeholders differ`);
  }
});

test("Arabic entries contain Arabic letters (catches an English string pasted in the ar slot)", () => {
  const allowed = new Set(["email"]); // add keys whose Arabic text is legitimately Latin
  for (const [k, v] of Object.entries(DICT)) if (!allowed.has(k) && !/[؀-ۿ]/.test(v[0])) assert.fail(`${k}: Arabic text has no Arabic letters: ${v[0]}`);
});

test("every literal t(\"key\") used in src/ exists in the dictionary", () => {
  const missing = new Set<string>();
  for (const f of walk(SRC)) {
    if (f.endsWith(path.join("lib", "dict.ts"))) continue;
    const code = fs.readFileSync(f, "utf8");
    for (const m of code.matchAll(/\bt\(\s*"([A-Za-z0-9_-]+)"\s*[,)]/g)) if (!DICT[m[1]]) missing.add(`${m[1]}  (${path.relative(SRC, f)})`);
  }
  assert.deepEqual([...missing], [], "add these keys to src/lib/dict.ts");
});

// keys built at runtime (t("role_" + role)) cannot be found by the scan above: list the families here
test("dynamic key families are complete", () => {
  for (const r of ["admin", "manager", "cashier", "accountant"]) for (const p of ["role_", "roledesc_"]) assert.ok(DICT[p + r], `${p}${r}`);
  for (const k of ["err_forbidden", "err_generic", "err_weak-password", "err_username-taken", "err_bad-username", "err_last-admin", "err_cannot-delete-self", "err_invalid"]) assert.ok(DICT[k], k);
});
