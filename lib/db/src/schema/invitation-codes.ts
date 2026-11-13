import { pgTable, uuid, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { accountsTable } from "./accounts";

export const invitationCodesTable = pgTable("iamgold_invitation_codes", {
  accountId: uuid("account_id").primaryKey().references(() => accountsTable.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 6 }).notNull(),
}, (table) => [uniqueIndex("iamgold_invitation_code_unique").on(table.code)]);
