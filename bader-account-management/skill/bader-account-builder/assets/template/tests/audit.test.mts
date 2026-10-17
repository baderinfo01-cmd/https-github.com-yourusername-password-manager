import test from "node:test";
import assert from "node:assert/strict";
import { checkPasswordStrength, findDuplicates } from "../src/lib/passwordStrength.ts";
import { auditAccounts, buildAiSummary } from "../src/lib/securityAudit.ts";
import { buildSummary } from "../src/lib/aiTools.ts";

const old = new Date(Date.now() - 400 * 86_400_000).toISOString();
const fresh = new Date().toISOString();
const accounts = [
  { id: "1", siteName: "Mail", password: "abc123", updatedAt: fresh },
  { id: "2", siteName: "Shop", password: "abc123", updatedAt: fresh },
  { id: "3", siteName: "Bank", password: "Xk9#mQ2$vLp7!zRt", updatedAt: old },
];

test("strength returns a level KEY (translated in the UI), weak for short passwords", () => {
  assert.equal(checkPasswordStrength("abc").level, "weak");
  assert.equal(checkPasswordStrength("Xk9#mQ2$vLp7!zRt").level, "veryStrong");
});

test("duplicates are counted per password", () => {
  assert.equal(findDuplicates(accounts).get("abc123"), 2);
});

test("audit flags weak, reused and old accounts and scores them", () => {
  const a = auditAccounts(accounts);
  assert.equal(a.weak, 2);
  assert.equal(a.reused, 2);
  assert.equal(a.old, 1);
  assert.ok(a.score < 100 && a.score >= 0);
  assert.equal(auditAccounts([]).score, 100);
});

test("PRIVACY: the AI summary never contains passwords or notes", () => {
  const audit = auditAccounts(accounts);
  const text = JSON.stringify([buildAiSummary(audit, { other: 3 }), buildSummary("security", audit, { other: 3 }), buildSummary("organize", audit, { other: 3 })]);
  assert.ok(!text.includes("abc123"), "password leaked into the AI payload");
  assert.ok(!text.includes("Xk9#"), "password leaked into the AI payload");
  assert.ok(text.includes("Mail"), "site names are allowed");
});
