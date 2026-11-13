import test from 'node:test';
import assert from 'node:assert/strict';
import { presenceSnapshot, SUPPORT_PRESENCE_LEASE_MS } from '../src/lib/support-presence';
import { UpdateSupportPresenceBody } from '@workspace/api-zod';

const now = new Date('2026-11-13T10:00:00.000Z');
const profile = {
  firstSeenAt: new Date('2026-11-13T08:00:00.000Z'),
  lastSeenAt: new Date('2026-11-13T09:59:55.000Z'),
};

test('une absence de présence enregistrée reste inconnue, pas une fausse connexion', () => {
  assert.deepEqual(presenceSnapshot(undefined, null, now), {
    presence: { online: false, firstSeenAt: null, lastSeenAt: null, onlineUntil: null },
    serverNow: now.toISOString(),
  });
});

test('une activité récente est en ligne jusqu’à l’échéance serveur', () => {
  const deadline = new Date(now.getTime() + SUPPORT_PRESENCE_LEASE_MS);
  const result = presenceSnapshot(profile, deadline, now);
  assert.equal(result.presence.online, true);
  assert.equal(result.presence.onlineUntil, deadline.toISOString());
  assert.equal(result.presence.firstSeenAt, profile.firstSeenAt.toISOString());
});

test('la présence expire exactement à l’échéance sans effacer les heures réelles', () => {
  for (const deadline of [now, new Date(now.getTime() - 1)]) {
    const result = presenceSnapshot(profile, deadline, now);
    assert.equal(result.presence.online, false);
    assert.equal(result.presence.onlineUntil, null);
    assert.equal(result.presence.lastSeenAt, profile.lastSeenAt.toISOString());
  }
});

test('les confirmations imposent une identité de session et des identifiants limités', () => {
  const input = { clientId: 'a55019b0-bcba-4c14-a011-3b16cd1d2a00', active: true, messageIds: [] };
  assert.equal(UpdateSupportPresenceBody.safeParse(input).success, true);
  assert.equal(UpdateSupportPresenceBody.safeParse({ ...input, clientId: 'admin' }).success, false);
  assert.equal(UpdateSupportPresenceBody.safeParse({ ...input, messageIds: ['not-a-message-id'] }).success, false);
  assert.equal(UpdateSupportPresenceBody.safeParse({ ...input, messageIds: Array(101).fill(input.clientId) }).success, false);
});
