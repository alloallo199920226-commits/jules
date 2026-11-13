import { pgTable, uuid, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { accountsTable } from "./accounts";

export const internalCodesTable = pgTable("iamgold_internal_codes", {
  id: varchar("id", { length: 48 }).primaryKey(),
  identityHash: varchar("identity_hash", { length: 64 }).notNull(),
  codeHash: varchar("code_hash", { length: 64 }).notNull(),
  purpose: varchar("purpose", { length: 20 }).notNull(),
  accountId: uuid("account_id").references(() => accountsTable.id, { onDelete: "cascade" }),
  sessionHash: varchar("session_hash", { length: 64 }),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
}, (table) => [index("iamgold_codes_identity").on(table.identityHash, table.purpose)]);

export const insertInternalCodeSchema = createInsertSchema(internalCodesTable);
export type InsertInternalCode = z.infer<typeof insertInternalCodeSchema>;
export type InternalCode = typeof internalCodesTable.$inferSelect;
