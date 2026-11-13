/**
 * Explicitly invoked development-only browser fixture. No HTTP route or startup hook.
 * Only synthetic credentials and an ephemeral session enter the mode-0600 runtime
 * file. Project secrets are consumed by the existing authentication functions,
 * never printed or copied into source.
 */
import { randomBytes } from 'node:crypto';
import { writeFile, access } from 'node:fs/promises';
import type { Response } from 'express';
import { db, pool, accountsTable, adminSessionsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../src/lib/passwords';
import { loginAdmin } from '../../src/lib/administration';
import { sha256 } from '../../src/lib/account-session';
import { getConsoleEntryPath } from '../../src/lib/console-entry';

const destination = '/tmp/iamgold-support-verification.json';

async function createFixture() {
  if (process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production') {
    throw new Error('Development-only fixture');
  }
  const domain = process.env.REPLIT_DEV_DOMAIN;
  const entry = getConsoleEntryPath();
  if (!domain || !entry || !process.env.ADMIN_CONSOLE_PASSWORD) {
    throw new Error('Development authentication is not configured');
  }
  try {
    await access(destination);
    throw new Error('An existing fixture must be cleaned before creating another');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const suffix = randomBytes(5).toString('hex');
  const password = `Test-${randomBytes(16).toString('hex')}`;
  let memberId: string | undefined;
  let adminToken: string | undefined;
  try {
    const [member] = await db.insert(accountsTable).values({
      country: 'BJ',
      phone: `0199${randomBytes(4).readUInt32BE(0).toString().padStart(10, '0').slice(-6)}`,
      nickname: `Support-${suffix}`,
      passwordHash: await hashPassword(password),
      transactionPasswordHash: await hashPassword(randomBytes(16).toString('hex')),
    }).returning();
    memberId = member.id;
    const response = {
      cookie(_name: string, token: string) { adminToken = token; },
    } as unknown as Response;
    await loginAdmin(process.env.ADMIN_CONSOLE_PASSWORD, response);
    if (!adminToken) throw new Error('Admin session was not created');
    await writeFile(destination, JSON.stringify({
      origin: `https://${domain}`,
      member: { id: member.id, country: member.country, phone: member.phone, password, nickname: member.nickname },
      admin: {
        url: `https://${domain}${entry}`,
        cookie: { name: 'iamgold_admin', value: adminToken, domain, path: '/api', httpOnly: true, secure: true, sameSite: 'None' },
        sessionHash: sha256(adminToken),
      },
    }), { mode: 0o600, flag: 'wx' });
    console.log('Fresh development browser fixture prepared in a restricted runtime file.');
  } catch (error) {
    if (adminToken) await db.delete(adminSessionsTable).where(eq(adminSessionsTable.tokenHash, sha256(adminToken)));
    if (memberId) await db.delete(accountsTable).where(eq(accountsTable.id, memberId));
    throw error;
  } finally {
    await pool.end();
  }
}

createFixture().catch(() => {
  console.error('Browser fixture preparation failed; no credential values were logged.');
  process.exitCode = 1;
});
