import { pgTable, varchar, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { accountsTable } from './accounts';

/** Server timestamps only. A profile's first presence is never rewritten. */
export const supportPresenceTable = pgTable('iamgold_support_presence', {
  actor: varchar('actor', { length: 40 }).primaryKey(),
  accountId: uuid('account_id').references(() => accountsTable.id, { onDelete: 'cascade' }),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
});

/** Separate tabs/devices have independent short leases; one closing cannot hide another. */
export const supportPresenceLeasesTable = pgTable('iamgold_support_presence_leases', {
  clientId: uuid('client_id').primaryKey(),
  actor: varchar('actor', { length: 40 }).notNull()
    .references(() => supportPresenceTable.actor, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, table => [index('iamgold_support_presence_actor_expiry_idx').on(table.actor, table.expiresAt)]);

export const insertSupportPresenceSchema = createInsertSchema(supportPresenceTable);
export const insertSupportPresenceLeaseSchema = createInsertSchema(supportPresenceLeasesTable);
export type SupportPresenceProfile = typeof supportPresenceTable.$inferSelect;
