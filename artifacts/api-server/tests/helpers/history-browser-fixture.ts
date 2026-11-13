/** Explicit development-only synthetic member; never called by the app. */
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { db, pool, accountsTable, walletLedgerTable } from "@workspace/db";
import { hashPassword } from "../../src/lib/passwords";

const destination = "/tmp/iamgold-history-verification.json";
if (process.env.REPLIT_DEPLOYMENT === "1" || process.env.NODE_ENV === "production") throw new Error("Development only");
try {
  if (process.argv[2] === "cleanup") {
    const fixture = JSON.parse(await readFile(destination, "utf8"));
    await db.delete(accountsTable).where(eq(accountsTable.id, fixture.member.id));
    const { unlink } = await import("node:fs/promises");
    await unlink(destination);
  } else {
    try {
      await readFile(destination);
      throw new Error("Clean up the existing history fixture first");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const password = `Test-${randomBytes(16).toString("hex")}`;
    const [member] = await db.insert(accountsTable).values({
      country: "BJ", phone: `0198${randomBytes(4).readUInt32BE().toString().padStart(10, "0").slice(-6)}`,
      nickname: `History-${randomBytes(4).toString("hex")}`,
      passwordHash: await hashPassword(password),
      transactionPasswordHash: await hashPassword(randomBytes(16).toString("hex")),
    }).returning();
    try {
      const rows = await db.insert(walletLedgerTable).values([
        ...Array.from({ length: 52 }, (_, index) => ({
          type: "recharge", amount: 2000,
          createdAt: index === 0 ? new Date("2026-01-01T00:00:00Z") : new Date(Date.now() - index * 1000),
        })),
        { type: "withdrawal", amount: -1000, createdAt: new Date() },
        { type: "admin_credit", amount: 50000, createdAt: new Date() },
        { type: "admin_debit", amount: -10000, createdAt: new Date() },
      ].map(row => ({ ...row, accountId: member.id, requestId: randomUUID() }))).returning();
      await writeFile(destination, JSON.stringify({
        member: { id: member.id, country: member.country, phone: member.phone, password },
        expected: { recharges: 52, withdrawals: 1, all: 55, credits: 154000, balance: 143000 },
        reference: rows.find(row => row.type === "admin_credit")!.id,
      }), { mode: 0o600 });
    } catch (error) {
      await db.delete(accountsTable).where(eq(accountsTable.id, member.id));
      throw error;
    }
  }
} finally {
  await pool.end();
}
