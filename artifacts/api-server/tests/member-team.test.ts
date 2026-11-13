import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { db, accountsTable, sessionsTable } from '@workspace/db';
import { setSessionCookie, sha256 } from '../src/lib/account-session';
import type { Response } from 'express';

test('team API is private, scoped to three generations, paginated, and truthful about activation', async () => {
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}/api/member/team`;
  const ids = Array.from({ length: 65 }, () => randomUUID());
  const rows = ids.map((id, index) => ({
    id,
    country: 'BJ',
    phone: `T${id.replaceAll('-', '').slice(0, 18)}`,
    nickname: `Team-E2E-${index}`,
    passwordHash: 'fixture-not-a-password-hash',
    transactionPasswordHash: index === 2 ? null : 'fixture-not-a-transaction-hash',
    invitation: index < 3 ? null : ids[0],
  }));
  // Two unrelated roots, an incomplete account, and a four-generation chain.
  rows[3].invitation = ids[1];
  rows[5].invitation = ids[4];
  rows[6].invitation = ids[5];
  rows[7].invitation = ids[6];
  rows[0].invitation = ids[6]; // Cycle back to the requesting root must never include it.
  const cookies: string[] = [];
  try {
    await db.insert(accountsTable).values(rows);
    for (const accountId of ids.slice(0, 3)) {
      const token = randomBytes(32).toString('hex');
      await db.insert(sessionsTable).values({
        tokenHash: sha256(token), accountId, expiresAt: new Date(Date.now() + 60_000),
      });
      let cookieName = '';
      setSessionCookie({ cookie: (name: string) => { cookieName = name; } } as unknown as Response, token);
      cookies.push(`${cookieName}=${token}`);
    }
    const request = (query = '', cookie = cookies[0]) => fetch(`${base}${query}`, {
      headers: cookie ? { Cookie: cookie } : {},
    });
    assert.equal((await request('', '')).status, 401);
    assert.equal((await request('', cookies[2])).status, 403);
    const firstResponse = await request();
    assert.equal(firstResponse.status, 200);
    const first = await firstResponse.json();
    assert.deepEqual(first.levels.map((item: { total: number }) => item.total), [58, 1, 1]);
    assert.ok(first.levels.every((item: { activated: unknown }) => item.activated === null));
    assert.equal(first.members.length, 50);
    assert.equal(first.hasMore, true);
    assert.ok(first.members.every((item: { activated: unknown }) => item.activated === null));
    assert.ok(!JSON.stringify(first).includes('password'));
    assert.ok(!JSON.stringify(first).includes('"phone"'));
    const second = await (await request('?page=2')).json();
    assert.equal(second.members.length, 8);
    assert.equal(second.hasMore, false);
    const allIds = [...first.members, ...second.members].map((item: { id: string }) => item.id);
    assert.equal(new Set(allIds).size, 58);
    for (const excluded of ids.slice(0, 4).concat(ids.slice(5, 8))) assert.ok(!allIds.includes(excluded));
    const level2 = await (await request('?level=2')).json();
    assert.deepEqual(level2.members.map((item: { id: string }) => item.id), [ids[5]]);
    const level3 = await (await request('?level=3')).json();
    assert.deepEqual(level3.members.map((item: { id: string }) => item.id), [ids[6]]);
    const unrelated = await (await request('', cookies[1])).json();
    assert.deepEqual(unrelated.levels.map((item: { total: number }) => item.total), [1, 0, 0]);
    assert.equal(unrelated.members[0].id, ids[3]);
    const cannotSelectAnotherOwner = await (await request(`?accountId=${ids[1]}`)).json();
    assert.equal(cannotSelectAnotherOwner.levels[0].total, 58);
    for (const invalid of ['?level=0', '?level=4', '?level=1.5', '?page=-1', '?page=0', '?level=1&level=2']) {
      assert.equal((await request(invalid)).status, 400, invalid);
    }
    const beyond = await (await request('?page=999')).json();
    assert.deepEqual(beyond.members, []);
    assert.equal(beyond.hasMore, false);
  } finally {
    await db.delete(sessionsTable).where(inArray(sessionsTable.accountId, ids));
    await db.delete(accountsTable).where(inArray(accountsTable.id, ids));
    await db.$client.end();
  }
});
