import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { accountsTable } from "./accounts";

export const sessionsTable = pgTable("iamgold_sessions", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  accountId: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("iamgold_sessions_account").on(table.accountId)]);

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
