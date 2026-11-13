import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool, accountsTable, walletLedgerTable } from "@workspace/db";
import { listMemberTransactions } from "../src/lib/member-transactions";
import { DomainError } from "../src/lib/administration";

after(async () => { await pool.end(); });

test("historiques : types séparés, ensemble complet paginé et isolation entre membres", async () => {
  const accounts: string[] = [];
  try {
    for (let i = 0; i < 3; i++) {
      const [account] = await db.insert(accountsTable).values({
        country: "BJ", phone: `test${randomUUID().replaceAll("-", "").slice(0, 12)}`,
        nickname: "History-test", passwordHash: "test-only-invalid",
      }).returning();
      accounts.push(account.id);
    }
    const timestamp = new Date("2026-01-01T00:00:00Z");
    const entries = [
      ...Array.from({ length: 205 }, () => ({ type: "admin_credit", amount: 1 })),
      { type: "recharge", amount: 1000 }, { type: "withdrawal", amount: -500 },
      { type: "forum_bonus", amount: 250 }, { type: "admin_debit", amount: -10 },
    ];
    const stored = await db.insert(walletLedgerTable).values(entries.map(entry => ({
      ...entry, accountId: accounts[0], requestId: randomUUID(), createdAt: timestamp,
    }))).returning();
    const [other] = await db.insert(walletLedgerTable).values({
      accountId: accounts[1], requestId: randomUUID(), type: "recharge", amount: 100,
    }).returning();
    const recharges = await listMemberTransactions(accounts[0], "recharges");
    assert.deepEqual(recharges.transactions.map(row => row.type), ["recharge"]);
    assert.equal(recharges.transactions[0].amount, 1000);
    const withdrawals = await listMemberTransactions(accounts[0], "withdrawals");
    assert.deepEqual(withdrawals.transactions.map(row => row.type), ["withdrawal"]);
    assert.equal(withdrawals.transactions[0].amount, -500);
    assert.equal(withdrawals.transactions[0].status, "succeeded");
    const seen: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await listMemberTransactions(accounts[0], "all", cursor);
      assert.ok(page.transactions.length <= 50);
      seen.push(...page.transactions.map(row => row.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    assert.equal(seen.length, 209, "Les opérations au-delà des 200 premières restent accessibles");
    assert.equal(new Set(seen).size, seen.length, "Aucun doublon, même avec des dates identiques");
    assert.deepEqual(new Set(seen), new Set(stored.map(row => row.id)));
    assert.ok(!seen.includes(other.id));
    await assert.rejects(listMemberTransactions(accounts[0], "all", other.id),
      error => error instanceof DomainError && error.status === 400);
    assert.deepEqual(await listMemberTransactions(accounts[2], "all"), { transactions: [], nextCursor: null });
  } finally {
    for (const id of accounts) await db.delete(accountsTable).where(eq(accountsTable.id, id));
  }
});
