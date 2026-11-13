import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, pool, accountsTable, invitationCodesTable } from "@workspace/db";
import { ensureInvitationCode, resolveInvitation } from "../src/lib/invitation-codes";

test("short codes are stable, unique, case-insensitive and preserve legacy referrals", async () => {
  const rollback = new Error("ROLLBACK_TEST_FIXTURES");
  try {
    await assert.rejects(db.transaction(async (tx) => {
      const owner = randomUUID(), invited = randomUUID();
      await tx.insert(accountsTable).values([owner, invited].map(id => ({
        id, country: "BJ", phone: `T${id.slice(0, 18)}`,
        nickname: "Invitation test", passwordHash: "test-only",
      })));
      const code = await ensureInvitationCode(owner, tx);
      assert.match(code, /^[A-F0-9]{6}$/);
      assert.equal(await ensureInvitationCode(owner, tx), code);
      assert.notEqual(await ensureInvitationCode(invited, tx), code);
      assert.equal(await resolveInvitation(` ${code.toLowerCase()} `, tx), owner);
      assert.equal(await resolveInvitation(owner, tx), owner);
      assert.equal(await resolveInvitation(undefined, tx), null);
      assert.equal(await resolveInvitation("UNKNOWN", tx), "UNKNOWN");
      // A short code is resolved before storage, preserving the UUID-based team tree.
      const inviter = await resolveInvitation(code, tx);
      assert.equal(inviter, owner);
      // Database constraints reject duplicate codes without aborting the transaction.
      const collision = await tx.insert(invitationCodesTable)
        .values({ accountId: randomUUID(), code }).onConflictDoNothing().returning();
      assert.equal(collision.length, 0);
      throw rollback;
    }), error => error === rollback);
  } finally {
    await pool.end();
  }
});
