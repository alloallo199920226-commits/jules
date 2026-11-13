import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../src/components/vip/VipCrown.tsx', import.meta.url),
  'utf8',
);

test('les cinq couronnes VIP ont des silhouettes propres', () => {
  const silhouettes = [...source.matchAll(/silhouette:\s*'([^']+)'/g)]
    .map(match => match[1]);
  assert.equal(silhouettes.length, 5);
  assert.equal(new Set(silhouettes).size, 5);
});

test('le filtre des couronnes ne masque pas le dessin avec des coordonnées relatives', () => {
  const filters = [...source.matchAll(/<filter\b[^>]*>/g)].map(match => match[0]);
  assert.ok(filters.length > 0);
  for (const filter of filters) {
    assert.match(filter, /filterUnits="userSpaceOnUse"/);
  }
});
