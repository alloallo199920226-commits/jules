import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool, accountsTable } from "@workspace/db";
import { newSession } from "../../src/lib/account-session";
import { credit } from "../../src/lib/administration";

if (process.env.NODE_ENV === "production") throw new Error("Development verification only");
const base = "http://localhost:80/api";
let accountId: string | undefined;
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15000);
try {
  const anonymous = await fetch(`${base}/member/wallet/events`);
  assert.equal(anonymous.status, 401);
  const [account] = await db.insert(accountsTable).values({
    country: "BJ", phone: `test${randomUUID().replaceAll("-", "").slice(0, 12)}`,
    nickname: "Wallet-stream-test", passwordHash: "test-only-invalid",
    transactionPasswordHash: "test-only-invalid",
  }).returning();
  accountId = account.id;
  const token = await db.transaction(tx => newSession(tx, account.id));
  const headers = { Cookie: `iamgold_session=${token}` };
  const response = await fetch(`${base}/member/wallet/events`, { headers, signal: controller.signal });
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("content-type")?.includes("text/event-stream"));
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  const nextChange = async () => {
    while (true) {
      const delimiter = buffered.indexOf("\n\n");
      if (delimiter >= 0) {
        const frame = buffered.slice(0, delimiter);
        buffered = buffered.slice(delimiter + 2);
        if (frame.includes("event: wallet-changed")) return;
        continue;
      }
      const chunk = await reader.read();
      assert.equal(chunk.done, false, "Le flux doit rester ouvert");
      buffered += decoder.decode(chunk.value, { stream: true });
    }
  };
  const readWallet = async () => {
    const res = await fetch(`${base}/member/wallet`, { headers });
    assert.equal(res.status, 200);
    return res.json();
  };
  await nextChange();
  for (const [amount, type, expected] of [[4000, "admin_credit", 4000], [-1250, "admin_debit", 2750]] as const) {
    await db.transaction(tx => credit(tx, { accountId: account.id, amount, type, requestId: randomUUID() }));
    await nextChange();
    const value = await readWallet();
    assert.equal(value.balance, expected);
    assert.equal(value.credits, 4000);
  }
  const getHistory = async (kind: string) => {
    const res = await fetch(`${base}/member/transactions?kind=${kind}`, { headers });
    assert.equal(res.status, 200);
    return res.json();
  };
  assert.equal((await getHistory("recharges")).transactions.length, 0);
  assert.equal((await getHistory("withdrawals")).transactions.length, 0);
  const all = await getHistory("all");
  assert.equal(all.transactions.length, 2);
  assert.deepEqual(new Set(all.transactions.map((row: { type: string }) => row.type)), new Set(["admin_credit", "admin_debit"]));
  const invalid = await fetch(`${base}/member/transactions?kind=invalid`, { headers });
  assert.equal(invalid.status, 400);
  const privateHistory = await fetch(`${base}/member/transactions`);
  assert.equal(privateHistory.status, 401);
  await reader.cancel();
  console.info("PASS: flux privé, ajustements du solde, trois historiques séparés et contrôle d’accès.");
} finally {
  clearTimeout(timeout);
  controller.abort();
  if (accountId) await db.delete(accountsTable).where(eq(accountsTable.id, accountId));
  await pool.end();
}
