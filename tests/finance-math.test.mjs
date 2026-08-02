import assert from "node:assert/strict";
import test from "node:test";

import { calculateAnnualizedIrr, calculateFiveYearFreeThreeTotalInterest } from "../app/finance-math.ts";

test("annualizes a one-year borrower cash flow", () => {
  const irr = calculateAnnualizedIrr([
    100_000,
    ...Array.from({ length: 11 }, () => 0),
    -110_000,
  ]);

  assert.ok(irr !== null);
  assert.ok(Math.abs(irr - 10) < 0.001);
});

test("includes an upfront loan-related fee in all-in financing cost", () => {
  const monthlyPayments = Array.from({ length: 12 }, () => -8_833.3);
  const withoutFee = calculateAnnualizedIrr([100_000, ...monthlyPayments]);
  const withFee = calculateAnnualizedIrr([99_000, ...monthlyPayments]);

  assert.ok(withoutFee !== null && withFee !== null);
  assert.ok(withFee > withoutFee);
  assert.ok(Math.abs(withFee - 13.58) < 0.05);
});

test("returns no IRR when there is no borrowing cash inflow", () => {
  assert.equal(calculateAnnualizedIrr([0, -1_000, -1_000]), null);
});

test("charges the last two years of the five-year free-three plan on original principal", () => {
  assert.equal(calculateFiveYearFreeThreeTotalInterest(100_000), 6_000);
  assert.equal(calculateFiveYearFreeThreeTotalInterest(200_000), 12_000);
});
