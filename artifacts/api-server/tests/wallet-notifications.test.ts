import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { eq } from "drizzle-orm";
import { db, pool, accountsTable } from "@workspace/db";
import { credit, wallet } from "../src/lib/administration";
import { subscribeWalletChanges } from "../src/lib/wallet-notifications";

after(async () => { await pool.end(); });

test("les crédits et débits administratifs notifient seulement le membre concerné après validation", async () => {
  const ids: string[] = [];
  const cleanup: Array<() => void> = [];
  let changes = 0;
  let otherChanges = 0;
  const untilChanges = async (expected: number) => {
    const deadline = Date.now() + 3000;
    while (changes < expected && Date.now() < deadline) await delay(20);
    assert.equal(changes, expected);
  };
  try {
    for (let i = 0; i < 2; i++) {
      const [account] = await db.insert(accountsTable).values({
        country: "BJ", phone: `test${randomUUID().replaceAll("-", "").slice(0, 12)}`,
        nickname: "Wallet-notification-test", passwordHash: "test-only-not-a-valid-password-hash",
      }).returning();
      ids.push(account.id);
    }
    cleanup.push(await subscribeWalletChanges(ids[0], {
      changed: () => { changes++; }, disconnected: () => {},
    }));
    cleanup.push(await subscribeWalletChanges(ids[1], {
      changed: () => { otherChanges++; }, disconnected: () => {},
    }));
    const input = { accountId: ids[0], amount: 2000, type: "admin_credit", requestId: randomUUID() };
    await db.transaction(async tx => {
      await credit(tx, input);
      await delay(80);
      assert.equal(changes, 0, "Aucune notification avant commit");
    });
    await untilChanges(1);
    assert.deepEqual(await wallet(ids[0]), { balance: 2000, credits: 2000 });
    await db.transaction(tx => credit(tx, input));
    await delay(80);
    assert.equal(changes, 1, "Pas de doublon lors d’une nouvelle tentative");
    await db.transaction(tx => credit(tx, {
      accountId: ids[0], amount: -500, type: "admin_debit", requestId: randomUUID(),
    }));
    await untilChanges(2);
    assert.deepEqual(await wallet(ids[0]), { balance: 1500, credits: 2000 });
    const rollback = new Error("ROLLBACK_TEST");
    await assert.rejects(db.transaction(async tx => {
      await credit(tx, { accountId: ids[0], amount: -100, type: "admin_debit", requestId: randomUUID() });
      throw rollback;
    }), error => error === rollback);
    await delay(100);
    assert.equal(changes, 2, "Pas de notification pour une opération annulée");
    assert.equal(otherChanges, 0, "Aucune notification destinée à un autre membre");
    assert.deepEqual(await wallet(ids[0]), { balance: 1500, credits: 2000 });
  } finally {
    for (const unsubscribe of cleanup) unsubscribe();
    for (const id of ids) await db.delete(accountsTable).where(eq(accountsTable.id, id));
  }
});
