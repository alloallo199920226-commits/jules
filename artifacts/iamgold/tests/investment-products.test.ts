import test from 'node:test';
import assert from 'node:assert/strict';
import { formatInvestmentAmount, getInvestmentTotals, investmentProducts, MAX_PREVIEW_SHARES } from '../src/pages/member/investment-products';

test('selected product terms and totals use the existing platform reference', () => {
  const first = investmentProducts[0];
  assert.deepEqual(getInvestmentTotals(first, 1), { amountToPay: 2000, dailyRevenue: 400, totalRevenue: 40000 });
  assert.deepEqual(getInvestmentTotals(first, 3), { amountToPay: 6000, dailyRevenue: 1200, totalRevenue: 120000 });
  assert.equal(first.durationDays, 100);
  assert.equal(first.maximumShares, null);
  assert.equal(getInvestmentTotals(first, MAX_PREVIEW_SHARES).amountToPay, 2_000_000_000);
});
test('unknown product terms remain unknown instead of borrowing another offer', () => {
  assert.deepEqual(getInvestmentTotals(investmentProducts[1], 2), { amountToPay: null, dailyRevenue: null, totalRevenue: null });
  assert.equal(formatInvestmentAmount(null), '—');
  assert.match(formatInvestmentAmount(2000), /FCFA$/);
});
test('quantities must be positive safe integers within the configured bounds', () => {
  for (const quantity of [0, -1, 1.5, NaN, Infinity, MAX_PREVIEW_SHARES + 1]) {
    assert.throws(() => getInvestmentTotals(investmentProducts[0], quantity), RangeError);
  }
  assert.throws(() => getInvestmentTotals({ ...investmentProducts[0], maximumShares: 2 }, 3), RangeError);
  assert.throws(() => getInvestmentTotals({ ...investmentProducts[0], unitPrice: Number.MAX_SAFE_INTEGER }, 2), RangeError);
});
