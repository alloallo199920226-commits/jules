import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleSupportPresence, isSupportPresenceOnline } from '../src/pages/member/support-presence';

const value = {
  serverNow: '2026-11-13T10:00:00.000Z',
  presence: {
    online: true,
    firstSeenAt: '2026-11-13T08:00:00.000Z',
    lastSeenAt: '2026-11-13T09:59:58.000Z',
    onlineUntil: '2026-11-13T10:00:30.000Z',
  },
};

test('la présence affichée expire avec une horloge monotone sans réponse suivante', () => {
  const sample = sampleSupportPresence(value, 1000);
  assert.equal(isSupportPresenceOnline(sample, 30_999), true);
  assert.equal(isSupportPresenceOnline(sample, 31_000), false);
  assert.equal(isSupportPresenceOnline(sample, 31_001), false);
});

test('une date client différente ne modifie pas la durée du bail serveur', () => {
  const sample = sampleSupportPresence(value, 7_000_000);
  assert.equal(sample.expiresAtPerformanceTime, 7_030_000);
  assert.equal(sample.value.presence.firstSeenAt, value.presence.firstSeenAt);
});

test('aucun état inconnu, expiré ou invalide ne crée de statut vert', () => {
  assert.equal(isSupportPresenceOnline(null, 0), false);
  for (const presence of [
    { ...value.presence, online: false },
    { ...value.presence, onlineUntil: null },
    { ...value.presence, onlineUntil: 'not-a-date' },
    { ...value.presence, onlineUntil: value.serverNow },
  ]) {
    assert.equal(isSupportPresenceOnline(sampleSupportPresence({ ...value, presence }, 0), 0), false);
  }
});
