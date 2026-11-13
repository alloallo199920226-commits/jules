import { pgTable, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";

export const rateLimitsTable = pgTable("iamgold_rate_limits", {
  key: varchar("key", { length: 64 }).primaryKey(),
  attempts: integer("attempts").notNull(),
  resetsAt: timestamp("resets_at", { withTimezone: true }).notNull(),
});

export const insertRateLimitSchema = createInsertSchema(rateLimitsTable);
export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;
export type RateLimit = typeof rateLimitsTable.$inferSelect;
