import { and, desc, eq, sql } from "drizzle-orm";
import { db, walletLedgerTable } from "@workspace/db";
import { fail } from "./administration";

export async function listMemberTransactions(accountId: string, kind: "all" | "recharges" | "withdrawals", cursor?: string) {
  if (cursor) {
    const [pivot] = await db.select({ id: walletLedgerTable.id }).from(walletLedgerTable)
      .where(and(eq(walletLedgerTable.accountId, accountId), eq(walletLedgerTable.id, cursor)));
    if (!pivot) fail(400, "Curseur invalide.");
  }
  const rows = await db.select({
    id: walletLedgerTable.id, type: walletLedgerTable.type,
    amount: walletLedgerTable.amount, createdAt: walletLedgerTable.createdAt,
  }).from(walletLedgerTable).where(and(
    eq(walletLedgerTable.accountId, accountId),
    kind === "recharges" ? eq(walletLedgerTable.type, "recharge") :
      kind === "withdrawals" ? eq(walletLedgerTable.type, "withdrawal") : undefined,
    // Use the stored timestamp, not a JavaScript-rounded timestamp, for stable pagination.
    cursor ? sql`(${walletLedgerTable.createdAt}, ${walletLedgerTable.id}) <
      (select created_at, id from iamgold_wallet_ledger where id=${cursor}::uuid and account_id=${accountId}::uuid)` : undefined,
  )).orderBy(desc(walletLedgerTable.createdAt), desc(walletLedgerTable.id)).limit(51);
  const page = rows.slice(0, 50);
  return {
    // Ledger entries are confirmed financial movements. Pending/failed requests
    // must come from an actual payment service, never be inferred from the amount.
    transactions: page.map(row => ({ ...row, status: "succeeded" as const, createdAt: row.createdAt.toISOString() })),
    nextCursor: rows.length > 50 ? page[page.length - 1].id : null,
  };
}
