import { pgTable, uuid, text, varchar, timestamp, jsonb, serial, integer, bigint, boolean, primaryKey, index } from "drizzle-orm/pg-core";
import { accountsTable } from "./accounts";
import { forumPostsTable, forumUploadsTable } from "./community";

export const adminSessionsTable = pgTable("iamgold_admin_sessions", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  credentialVersion: varchar("credential_version", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const accountFlagsTable = pgTable("iamgold_account_flags", {
  accountId: uuid("account_id").primaryKey().references(() => accountsTable.id, { onDelete: "cascade" }),
  isBanned: boolean("is_banned").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  withdrawalsDisabled: boolean("withdrawals_disabled").notNull().default(false),
});
export const adminResourcesTable = pgTable("iamgold_admin_resources", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 32 }).notNull(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("iamgold_admin_resource_kind_idx").on(t.kind)]);
export const adminAuditTable = pgTable("iamgold_admin_audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  event: varchar("event", { length: 80 }).notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const walletLedgerTable = pgTable("iamgold_wallet_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
  requestId: varchar("request_id", { length: 160 }).notNull().unique(),
  type: varchar("type", { length: 32 }).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  postId: uuid("post_id").references(() => forumPostsTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("iamgold_ledger_account_idx").on(t.accountId)]);
export const vipGrantsTable = pgTable("iamgold_vip_grants", {
  id: serial("id").primaryKey(),
  accountId: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => adminResourcesTable.id),
  requestId: varchar("request_id", { length: 160 }).notNull().unique(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const supportMessagesTable = pgTable("iamgold_support_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
  sender: varchar("sender", { length: 10 }).notNull(),
  body: text("body").notNull(),
  imagePath: varchar("image_path", { length: 100 }).references(() => forumUploadsTable.path),
  clientId: uuid("client_id").notNull().unique(),
  seenAt: timestamp("seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("iamgold_support_account_idx").on(t.accountId, t.createdAt)]);
export const supportLikesTable = pgTable("iamgold_support_likes", {
  messageId: uuid("message_id").notNull().references(() => supportMessagesTable.id, { onDelete: "cascade" }),
  actor: varchar("actor", { length: 40 }).notNull(),
}, t => [primaryKey({ columns: [t.messageId, t.actor] })]);
