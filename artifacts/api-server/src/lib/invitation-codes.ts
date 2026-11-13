import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, accountsTable, invitationCodesTable } from "@workspace/db";
import type { DbTransaction } from "./account-session";

type Connection = typeof db | DbTransaction;

// The database enforces both one code per account and global code uniqueness.
export async function ensureInvitationCode(accountId: string, connection: Connection = db) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const [existing] = await connection.select().from(invitationCodesTable)
      .where(eq(invitationCodesTable.accountId, accountId));
    if (existing) return existing.code;
    const code = randomBytes(3).toString("hex").toUpperCase();
    const [created] = await connection.insert(invitationCodesTable).values({ accountId, code })
      .onConflictDoNothing().returning();
    if (created) return created.code;
  }
  throw new Error("Impossible de générer un code d’invitation unique.");
}

export async function resolveInvitation(value: string | undefined, connection: Connection = db) {
  const input = value?.trim();
  if (!input) return null;
  const [shortCode] = await connection.select().from(invitationCodesTable)
    .where(eq(invitationCodesTable.code, input.toUpperCase()));
  if (shortCode) return shortCode.accountId;
  // Existing UUID invitation links remain valid; team trees still store UUIDs.
  if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input)) {
    const [account] = await connection.select({ id: accountsTable.id }).from(accountsTable)
      .where(eq(accountsTable.id, input));
    if (account) return account.id;
  }
  // Preserve the existing registration policy for unknown invitation strings.
  return input;
}
