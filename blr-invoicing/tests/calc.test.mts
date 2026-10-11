import test from "node:test";
import assert from "node:assert/strict";
import { computeTotals, stampDuty, paymentStatus, addPeriod } from "../src/lib/calc.ts";

const L = (qty: number, price: number, discountPct = 0, taxRate = 19) => ({ id: "x", desc: "x", qty, price, discountPct, taxRate });

test("totals with line discount, global discount and tax", () => {
  const t = computeTotals([L(2, 1000, 10), L(1, 500, 0, 9)], 100, "amount", 0, 0);
  // net lines: 1800 + 500 = 2300 ; discount 100 -> ratio 2200/2300
  assert.equal(t.subtotal, 2300);
  assert.equal(t.discountAmount, 100);
  assert.equal(t.tax, 370.17); // (1800*.19 + 500*.09) * 2200/2300
  assert.equal(t.total, 2570.17);
});
test("prices including tax extract the tax", () => {
  const t = computeTotals([L(1, 119)], 0, "amount", 0, 0, true);
  assert.equal(t.subtotal, 100);
  assert.equal(t.tax, 19);
  assert.equal(t.total, 119);
});
test("percent discount, shipping and stamp are added", () => {
  const t = computeTotals([L(1, 1000, 0, 0)], 10, "percent", 50, 20);
  assert.equal(t.total, 900 + 50 + 20);
});
test("algerian stamp duty brackets", () => {
  assert.equal(stampDuty(100), 5);
  assert.equal(stampDuty(100000), 1000);
  assert.equal(stampDuty(1000000), 2500);
});
test("payment status", () => {
  const d: any = { total: 1000, dueDate: "2026-01-01" };
  assert.equal(paymentStatus(d, 1000, 0, "2026-02-01"), "paid");
  assert.equal(paymentStatus(d, 400, 0, "2026-02-01"), "overdue");
  assert.equal(paymentStatus(d, 400, 0, "2025-12-01"), "partial");
  assert.equal(paymentStatus(d, 0, 1000, "2025-12-01"), "paid");
});
test("period stepping", () => {
  assert.equal(addPeriod("2026-01-31", "week"), "2026-02-07");
  assert.equal(addPeriod("2026-01-15", "quarter"), "2026-04-15");
});
