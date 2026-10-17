import test from "node:test";
import assert from "node:assert/strict";
import { computeTotals, paymentStatus, addPeriod, addDays, formatNumber, num, round } from "../src/lib/calc.ts";

const L = (qty: number, price: number, discountPct = 0, taxRate = 19) => ({ id: "x", desc: "x", qty, price, discountPct, taxRate });

test("totals with line discount, global discount and tax", () => {
  const t = computeTotals([L(2, 1000, 10), L(1, 500, 0, 9)], 100, "amount", 0);
  // net lines: 1800 + 500 = 2300 ; discount 100 -> ratio 2200/2300
  assert.equal(t.subtotal, 2300);
  assert.equal(t.discountAmount, 100);
  assert.equal(t.tax, 370.17); // (1800*.19 + 500*.09) * 2200/2300
  assert.equal(t.total, 2570.17);
});
test("prices including tax extract the tax", () => {
  const t = computeTotals([L(1, 119)], 0, "amount", 0, true);
  assert.equal(t.subtotal, 100);
  assert.equal(t.tax, 19);
  assert.equal(t.total, 119);
});
test("percent discount, shipping and stamp are added", () => {
  const t = computeTotals([L(1, 1000, 0, 0)], 10, "percent", 50);
  assert.equal(t.total, 900 + 50);
});
test("payment status", () => {
    assert.equal(paymentStatus(1000, "2026-01-01", 1000, 0, "2026-02-01"), "paid");
  assert.equal(paymentStatus(1000, "2026-01-01", 400, 0, "2026-02-01"), "overdue");
  assert.equal(paymentStatus(1000, "2026-01-01", 400, 0, "2025-12-01"), "partial");
  assert.equal(paymentStatus(1000, "2026-01-01", 0, 1000, "2025-12-01"), "paid");
});
test("period stepping", () => {
  assert.equal(addPeriod("2026-01-31", "week"), "2026-02-07");
  assert.equal(addPeriod("2026-01-15", "quarter"), "2026-04-15");
});


test("num() accepts decimal commas and junk", () => {
  assert.equal(num("12,5"), 12.5);
  assert.equal(num("abc"), 0);
  assert.equal(num(undefined), 0);
  assert.equal(round(1.005, 2), 1.01);
});
test("dates are local ISO strings and addDays crosses month ends", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});
test("money is wrapped in a left-to-right isolate (LRI/PDI) so Arabic text cannot reorder it", () => {
  const settings = { currency: { code: "DZD", symbol: "DA", position: "after" as const, decimals: 2 } };
  const m = formatNumber(1234567.5, settings);
  assert.equal(m, "\u20661 234 567.50 DA\u2069");
  assert.equal(formatNumber(1234.5, settings, false), "1 234.50");
});
