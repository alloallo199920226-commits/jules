import { pgTable, text, timestamp, uuid, varchar, bigint, boolean, primaryKey } from "drizzle-orm/pg-core";
import { accountsTable } from "./accounts";

export const forumUploadsTable = pgTable("iamgold_forum_uploads", {
  path: varchar("path", { length: 100 }).primaryKey(),
  accountId: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
  contentType: varchar("content_type", { length: 40 }).notNull(),
  uploadedByAdmin: boolean("uploaded_by_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const forumPostsTable = pgTable("iamgold_forum_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imagePath: varchar("image_path", { length: 100 }).notNull().unique().references(() => forumUploadsTable.path),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  reviewNote: text("review_note"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  bonus: bigint("bonus", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const forumLikesTable = pgTable("iamgold_forum_likes", {
  postId: uuid("post_id").notNull().references(() => forumPostsTable.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
}, t => [primaryKey({ columns: [t.postId, t.accountId] })]);
export const forumViewsTable = pgTable("iamgold_forum_views", {
  postId: uuid("post_id").notNull().references(() => forumPostsTable.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
}, t => [primaryKey({ columns: [t.postId, t.accountId] })]);
export const forumCommentsTable = pgTable("iamgold_forum_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").notNull().references(() => forumPostsTable.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
