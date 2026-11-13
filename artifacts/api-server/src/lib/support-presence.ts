import { and, eq, gt, inArray, isNull, lt, sql } from 'drizzle-orm';
import { db, supportMessagesTable, supportPresenceTable, supportPresenceLeasesTable } from '@workspace/db';
import { fail } from './administration';

export const SUPPORT_PRESENCE_LEASE_MS = 30_000;

export function presenceSnapshot(
  profile: { firstSeenAt: Date; lastSeenAt: Date } | undefined,
  deadline: Date | null,
  now = new Date(),
) {
  const online = !!deadline && deadline.getTime() > now.getTime();
  return {
    presence: {
      online,
      firstSeenAt: profile?.firstSeenAt.toISOString() ?? null,
      lastSeenAt: profile?.lastSeenAt.toISOString() ?? null,
      onlineUntil: online ? deadline!.toISOString() : null,
    },
    serverNow: now.toISOString(),
  };
}

export async function readSupportPresence(actor: string) {
  const now = new Date();
  const [profile] = await db.select().from(supportPresenceTable)
    .where(eq(supportPresenceTable.actor, actor));
  const [lease] = await db.select({
    deadline: sql<Date | null>`max(${supportPresenceLeasesTable.expiresAt})`,
  }).from(supportPresenceLeasesTable).where(and(
    eq(supportPresenceLeasesTable.actor, actor),
    gt(supportPresenceLeasesTable.expiresAt, now),
  ));
  // PostgreSQL aggregates may be decoded as strings rather than timestamp columns.
  return presenceSnapshot(profile, lease?.deadline ? new Date(lease.deadline) : null, now);
}

/** Reads never acknowledge messages. Only a visible, explicit client activity does. */
export async function recordSupportActivity(
  accountId: string,
  admin: boolean,
  activity: { clientId: string; active: boolean; messageIds: string[] },
) {
  if (!activity.active && activity.messageIds.length) {
    fail(400, 'Une discussion inactive ne peut pas confirmer la lecture.');
  }
  const actor = admin ? 'admin' : accountId;
  const now = new Date();
  await db.transaction(async tx => {
    if (!activity.active) {
      await tx.update(supportPresenceLeasesTable).set({ expiresAt: now }).where(and(
        eq(supportPresenceLeasesTable.clientId, activity.clientId),
        eq(supportPresenceLeasesTable.actor, actor),
      ));
      return;
    }
    await tx.insert(supportPresenceTable).values({
      actor, accountId: admin ? null : accountId, firstSeenAt: now, lastSeenAt: now,
    }).onConflictDoUpdate({
      target: supportPresenceTable.actor,
      set: { lastSeenAt: sql`greatest(${supportPresenceTable.lastSeenAt}, ${now})` },
    });
    const leases = await tx.insert(supportPresenceLeasesTable).values({
      clientId: activity.clientId, actor,
      expiresAt: new Date(now.getTime() + SUPPORT_PRESENCE_LEASE_MS),
    }).onConflictDoUpdate({
      target: supportPresenceLeasesTable.clientId,
      set: { expiresAt: new Date(now.getTime() + SUPPORT_PRESENCE_LEASE_MS) },
      setWhere: eq(supportPresenceLeasesTable.actor, actor),
    }).returning({ actor: supportPresenceLeasesTable.actor });
    if (!leases.length) fail(409, 'Cette activité appartient à une autre session.');
    if (activity.messageIds.length) {
      await tx.update(supportMessagesTable).set({ seenAt: now }).where(and(
        eq(supportMessagesTable.accountId, accountId),
        eq(supportMessagesTable.sender, admin ? 'member' : 'admin'),
        inArray(supportMessagesTable.id, [...new Set(activity.messageIds)]),
        isNull(supportMessagesTable.seenAt),
      ));
    }
    await tx.delete(supportPresenceLeasesTable).where(and(
      eq(supportPresenceLeasesTable.actor, actor),
      lt(supportPresenceLeasesTable.expiresAt, new Date(now.getTime() - 600_000)),
    ));
  });
  return readSupportPresence(admin ? accountId : 'admin');
}
