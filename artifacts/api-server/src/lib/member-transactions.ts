import { and, desc, eq, sql } from "drizzle-orm";
import { db, walletLedgerTable } from "@workspace/db";
import { fail } from "./administration";

interface TransactionFilters {
  search?: string;
  period?: "all" | "7d" | "30d" | "90d";
  status?: "all" | "succeeded" | "pending" | "failed";
}

export async function listMemberTransactions(accountId: string, kind: "all" | "recharges" | "withdrawals", cursor?: string, filters: TransactionFilters = {}) {
  if (cursor) {
    const [pivot] = await db.select({ id: walletLedgerTable.id }).from(walletLedgerTable)
      .where(and(eq(walletLedgerTable.accountId, accountId), eq(walletLedgerTable.id, cursor)));
    if (!pivot) fail(400, "Curseur invalide.");
  }
  const search = filters.search?.trim();
  const days = filters.period === "7d" ? 7 : filters.period === "30d" ? 30 : filters.period === "90d" ? 90 : null;
  const matching = and(
    eq(walletLedgerTable.accountId, accountId),
    kind === "recharges" ? eq(walletLedgerTable.type, "recharge") :
      kind === "withdrawals" ? eq(walletLedgerTable.type, "withdrawal") : undefined,
    // Literal substring matching, not user-controlled LIKE wildcards.
    search ? sql`(strpos(lower(${walletLedgerTable.id}::text), lower(${search})) > 0
      or strpos(lower(${walletLedgerTable.type}), lower(${search})) > 0)` : undefined,
    days ? sql`${walletLedgerTable.createdAt} >= now() - (${days} * interval '1 day')` : undefined,
    // Only booked movements exist in this ledger. Do not fabricate payment requests.
    filters.status && filters.status !== "all" && filters.status !== "succeeded" ? sql`false` : undefined,
  );
  const [totals] = await db.select({
    total: sql<number>`count(*)::integer`,
    totalAmount: sql<number>`coalesce(sum(abs(${walletLedgerTable.amount}::bigint)), 0)::float8`,
  }).from(walletLedgerTable).where(matching);
  const rows = await db.select({
    id: walletLedgerTable.id, type: walletLedgerTable.type,
    amount: walletLedgerTable.amount, createdAt: walletLedgerTable.createdAt,
  }).from(walletLedgerTable).where(and(
    matching,
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
    summary: { total: totals.total, succeeded: totals.total, pending: 0, failed: 0, totalAmount: totals.totalAmount },
  };
}
