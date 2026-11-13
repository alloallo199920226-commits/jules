import test from 'node:test';
import assert from 'node:assert/strict';
import { VIP_LEVELS, formatVipInvestment } from '../src/config/vip-levels';

test('le catalogue VIP contient exactement les cinq paliers officiels', () => {
  assert.deepEqual(VIP_LEVELS.map(item => item.level), [0, 1, 2, 3, 4]);
  assert.deepEqual(VIP_LEVELS.map(item => item.investmentRequired), [
    0, 2_000, 20_000, 1_000_000, 4_000_000,
  ]);
});

test('les montants VIP restent du texte lisible avec des séparateurs français', () => {
  assert.deepEqual(VIP_LEVELS.map(item => formatVipInvestment(item.investmentRequired)), [
    '0', '2 000', '20 000', '1 000 000', '4 000 000',
  ]);
});
