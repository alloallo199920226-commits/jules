import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { FinancialHistoryCard, formatHistoryAmount, formatHistoryDate } from '../src/pages/member/FinancialHistoryCard';

test('successful withdrawal reproduces the status and all four aligned data fields', () => {
  const html = renderToStaticMarkup(<FinancialHistoryCard kind="withdrawals" record={{
    status: 'succeeded', amount: '1000.00', receivedAmount: 950, taxAmount: 50,
    initiatedAt: '2025-11-29 11:22:14',
  }}/>);
  for (const expected of [
    'financial-history-card--succeeded', 'Statut du retrait', 'Réussi',
    'Montant de retrait', 'FCFA1000.00', 'Montant reçu', 'FCFA950.00',
    'Montant de la taxe', 'FCFA50.00', '2025-11-29 11:22:14',
  ]) assert.ok(html.includes(expected), expected);
  assert.equal((html.match(/<dt /g) ?? []).length, 4);
  assert.equal((html.match(/<dd /g) ?? []).length, 4);
});

test('pending deposits use deposit labels, without changing amounts or claiming success', () => {
  const html = renderToStaticMarkup(<FinancialHistoryCard kind="balance" record={{
    status: 'pending', amount: 12000, receivedAmount: null, taxAmount: null,
    initiatedAt: '2025-11-28 14:09:15',
  }}/>);
  for (const expected of ['financial-history-card--pending', 'En traitement', 'Statut du dépôt', 'Montant du dépôt', 'Montant crédité', 'FCFA12000.00', '2025-11-28 14:09:15']) {
    assert.ok(html.includes(expected), expected);
  }
  assert.ok(!html.includes('Réussi'));
  assert.ok(!html.includes('FCFA11400.00')); // Do not infer a net amount or screenshot's tax rate.
});

test('missing values and unknown statuses never become zero or a successful operation', () => {
  const html = renderToStaticMarkup(<FinancialHistoryCard kind="withdrawals" record={{}}/>);
  assert.ok(html.includes('Statut inconnu'));
  assert.ok(html.includes('financial-history-card--unknown'));
  assert.ok(!html.includes('Réussi'));
  assert.ok(!html.includes('FCFA0.00'));
  for (const value of [null, undefined, '', ' ', 'invalid', '0x10', NaN, Infinity]) assert.equal(formatHistoryAmount(value), '—');
  assert.equal(formatHistoryAmount(0), 'FCFA0.00');
  assert.equal(formatHistoryAmount(' 1000.50 '), 'FCFA1000.50');
  assert.equal(formatHistoryDate('not-a-date'), '—');
  assert.equal(formatHistoryDate('2025-02-30 11:22:14'), '—');
  assert.equal(formatHistoryDate(new Date(2025, 10, 29, 11, 22, 14)), '2025-11-29 11:22:14');
  assert.equal(formatHistoryDate(new Date(NaN)), '—');
});
