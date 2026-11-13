/** Explicit development integration check. Never logs fixture credentials. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { and, eq, inArray } from 'drizzle-orm';
import {
  db, pool, accountsTable, adminSessionsTable, supportMessagesTable,
  supportPresenceTable, supportPresenceLeasesTable, rateLimitsTable,
} from '@workspace/db';
import { sha256 } from '../../src/lib/account-session';

const fixtureFile = '/tmp/iamgold-support-verification.json';
async function main() {
  assert.notEqual(process.env.REPLIT_DEPLOYMENT, '1');
  assert.notEqual(process.env.NODE_ENV, 'production');
  const fixture = JSON.parse(await readFile(fixtureFile, 'utf8'));
  const adminCookie = `${fixture.admin.cookie.name}=${fixture.admin.cookie.value}`;
  const accountId: string = fixture.member.id;
  const adminClients = [randomUUID(), randomUUID()];
  const memberClient = randomUUID();
  const [previousAdmin] = await db.select().from(supportPresenceTable).where(eq(supportPresenceTable.actor, 'admin'));
  let lastAdminWrite: Date | undefined;
  let passed = 0;
  async function call(path: string, cookie = '', body?: unknown, expected = 200) {
    const response = await fetch(`http://127.0.0.1:80/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, expected, `Public API ${path.replace(accountId, '<fixture>')}: HTTP ${response.status}, expected ${expected}`);
    const sessionCookie = response.headers.getSetCookie()
      .map(header => header.split(';')[0])
      .findLast(value => /^iamgold_session=[a-f0-9]{64}$/.test(value)) ?? '';
    return { data: await response.json(), cookie: sessionCookie };
  }
  const check = (condition: unknown, label: string) => { assert.ok(condition, label); passed++; console.log(`PASS ${label}`); };
  try {
    const login = await call('/auth/login', '', {
      country: fixture.member.country, phone: fixture.member.phone, password: fixture.member.password,
    });
    const memberCookie = login.cookie;
    assert.ok(memberCookie);
    const endpoint = `/admin/support/conversations/${accountId}`;
    const activity = (clientId: string, active = true, messageIds: string[] = []) => ({ clientId, active, messageIds });
    const ownMessage = { body: 'Synthetic support delivery verification', clientId: randomUUID() };
    const { data: sent } = await call('/support/messages', memberCookie, ownMessage, 201);
    const { data: repeated } = await call('/support/messages', memberCookie, ownMessage, 201);
    check(sent.id === repeated.id, 'Un même envoi réessayé ne crée pas de doublon');
    await call(`${endpoint}/messages`, adminCookie);
    let [stored] = await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.id, sent.id));
    check(stored.seenAt === null, 'Charger les messages ne confirme pas leur lecture');
    const list = await call('/admin/support/conversations', adminCookie);
    check(list.data.conversations.some((row: { id: string; unread: number }) => row.id === accountId && row.unread > 0),
      'La conversation arrive dans la liste avec un message non lu');
    await call('/support/presence', memberCookie, activity(memberClient, true, [sent.id]));
    [stored] = await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.id, sent.id));
    check(stored.seenAt === null, 'Un membre ne peut pas confirmer lui-même la lecture de son envoi');
    await call(`${endpoint}/presence`, adminCookie, activity(adminClients[0], true, [sent.id]));
    [stored] = await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.id, sent.id));
    const firstRead = stored.seenAt?.getTime();
    check(Boolean(firstRead), 'La confirmation explicite de l’administration horodate la lecture');
    await call(`${endpoint}/presence`, adminCookie, activity(adminClients[0], true, [sent.id]));
    [stored] = await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.id, sent.id));
    check(stored.seenAt?.getTime() === firstRead, 'La première heure de lecture reste inchangée');
    const firstPresence = (await call('/support/presence', memberCookie)).data;
    check(firstPresence.presence.online && firstPresence.presence.firstSeenAt && firstPresence.presence.lastSeenAt,
      'Le service client expose une présence réelle avec ses heures serveur');
    await call(`${endpoint}/presence`, adminCookie, activity(adminClients[1]));
    await call(`${endpoint}/presence`, adminCookie, activity(adminClients[0], false));
    check((await call('/support/presence', memberCookie)).data.presence.online,
      'Fermer une session ne coupe pas la présence d’une autre session active');
    const refreshed = (await call('/support/presence', memberCookie)).data;
    check(refreshed.presence.firstSeenAt === firstPresence.presence.firstSeenAt,
      'La première présence n’est pas remplacée par les battements suivants');
    await call('/support/presence', memberCookie, activity(adminClients[1]), 409);
    check(true, 'Un membre ne peut pas réutiliser le bail d’un administrateur');
    const { data: reply } = await call(`${endpoint}/messages`, adminCookie,
      { body: 'Synthetic administration reply', clientId: randomUUID() }, 201);
    await call('/support/messages', memberCookie);
    let [replyRow] = await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.id, reply.id));
    check(replyRow.seenAt === null, 'La réception d’une réponse ne la marque pas automatiquement lue');
    await call('/support/presence', memberCookie, activity(memberClient, false, [reply.id]), 400);
    await call('/support/presence', memberCookie, activity(memberClient, true, [reply.id]));
    [replyRow] = await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.id, reply.id));
    check(Boolean(replyRow.seenAt), 'L’ouverture explicitement confirmée par le membre horodate la réponse');
    await call('/support/presence', memberCookie, activity(memberClient, false));
    check(!(await call(`${endpoint}/presence`, adminCookie)).data.presence.online,
      'La fermeture de la discussion du membre retire sa présence');
    // Only this fixture's remaining lease is expired; other operators are untouched.
    await db.update(supportPresenceLeasesTable).set({ expiresAt: new Date(Date.now() - 1) })
      .where(eq(supportPresenceLeasesTable.clientId, adminClients[1]));
    const [adminProfile] = await db.select().from(supportPresenceTable).where(eq(supportPresenceTable.actor, 'admin'));
    lastAdminWrite = adminProfile.lastSeenAt;
    console.log(`${passed} server integration checks passed.`);
  } finally {
    // Capture our final timestamp before removing synthetic activity. Restore global
    // history only when no other lease/activity could have contributed.
    const [current] = await db.select().from(supportPresenceTable).where(eq(supportPresenceTable.actor, 'admin'));
    await db.delete(supportPresenceLeasesTable).where(inArray(supportPresenceLeasesTable.clientId, adminClients));
    const others = await db.select().from(supportPresenceLeasesTable).where(eq(supportPresenceLeasesTable.actor, 'admin'));
    if (!others.length && lastAdminWrite && current?.lastSeenAt.getTime() === lastAdminWrite.getTime()) {
      if (previousAdmin) {
        await db.update(supportPresenceTable).set({ lastSeenAt: previousAdmin.lastSeenAt })
          .where(and(eq(supportPresenceTable.actor, 'admin'), eq(supportPresenceTable.lastSeenAt, lastAdminWrite)));
      } else {
        await db.delete(supportPresenceTable)
          .where(and(eq(supportPresenceTable.actor, 'admin'), eq(supportPresenceTable.lastSeenAt, lastAdminWrite)));
      }
    }
    await db.delete(adminSessionsTable).where(eq(adminSessionsTable.tokenHash, fixture.admin.sessionHash));
    await db.delete(accountsTable).where(eq(accountsTable.id, accountId));
    await db.delete(rateLimitsTable).where(inArray(rateLimitsTable.key,
      [`chat:${accountId}`, `presence:${accountId}`, `login-phone:${fixture.member.country}:${fixture.member.phone}`].map(sha256)));
    await unlink(fixtureFile);
    await pool.end();
    console.log('Synthetic account, messages, private session and runtime fixture removed.');
  }
}
main().catch((error: unknown) => {
  console.error('Server verification failed; credential details were withheld.');
  if (error instanceof assert.AssertionError) console.error(error.message);
  else console.error(error instanceof Error ? error.name : 'Unknown verification error');
  process.exitCode = 1;
});
