import test from 'node:test';
import assert from 'node:assert/strict';
import { getConsoleEntryPath, matchesConsoleEntry, normalizeConsoleEntry } from '../src/lib/console-entry';

test('adresse privée uniquement issue du secret ; absence et configuration invalide ferment l’accès',async()=>{
  delete process.env.ADMIN_PATH;
  assert.equal(getConsoleEntryPath(),null);
  assert.equal(await matchesConsoleEntry('synthetic-console-entry'),false);
  process.env.ADMIN_PATH='https://example.invalid/not-a-path';
  assert.equal(getConsoleEntryPath(),null);
  assert.equal(await matchesConsoleEntry('synthetic-console-entry'),false);
  assert.equal(normalizeConsoleEntry('/admin'),null);
});

test('le secret accepte un chemin avec ou sans barre initiale, sans exposer sa valeur',async()=>{
  process.env.ADMIN_PATH='/synthetic-console-entry';
  assert.equal(getConsoleEntryPath(),'/synthetic-console-entry');
  assert.equal(await matchesConsoleEntry('synthetic-console-entry'),true);
  assert.equal(await matchesConsoleEntry('synthetic-console-entry-longer'),false);
  assert.equal(await matchesConsoleEntry('synthetic-console'),false);
  process.env.ADMIN_PATH='different-synthetic-entry';
  assert.equal(await matchesConsoleEntry('synthetic-console-entry'),false);
  assert.equal(await matchesConsoleEntry('different-synthetic-entry'),true);
  delete process.env.ADMIN_PATH;
});
