import { pgTable, uuid, varchar, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";

export const accountsTable = pgTable("iamgold_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  country: varchar("country", { length: 2 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  nickname: varchar("nickname", { length: 60 }).notNull(),
  email: varchar("email", { length: 254 }),
  avatarPath: varchar("avatar_path", { length: 100 }),
  passwordHash: text("password_hash").notNull(),
  transactionPasswordHash: text("transaction_password_hash"),
  invitation: varchar("invitation", { length: 60 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("iamgold_account_phone_unique").on(table.country, table.phone)]);

export const insertAccountSchema = createInsertSchema(accountsTable).omit({ id: true, createdAt: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accountsTable.$inferSelect;
