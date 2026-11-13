import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { db, internalCodesTable } from "@workspace/db";
import { sha256, type DbTransaction } from "./account-session";

type CodeInput = { country: string; phone: string; challengeId: string; code: string };
type Owner = { accountId: string; sessionHash: string };
export type CodePurpose = "registration" | "transaction" | "transaction-change";

export async function issuePersistentCode(country: string, phone: string, purpose: CodePurpose, owner?: Owner) {
  const challengeId = randomBytes(24).toString("hex");
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresIn = purpose === "registration" ? 120 : 60;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const identityHash = sha256(`${country}:${phone}`);
  await db.transaction(async (tx) => {
    // Serialize issuance for a number/purpose so concurrent requests cannot leave two active codes.
    await tx.execute(andLock(`${identityHash}:${purpose}`));
    await tx.update(internalCodesTable).set({ consumedAt: new Date() })
      .where(and(eq(internalCodesTable.identityHash, identityHash), eq(internalCodesTable.purpose, purpose), isNull(internalCodesTable.consumedAt)));
    await tx.insert(internalCodesTable).values({
      id: challengeId, identityHash, codeHash: sha256(`${challengeId}:${code}`), purpose,
      accountId: owner?.accountId, sessionHash: owner?.sessionHash, expiresAt,
    });
    await tx.delete(internalCodesTable).where(lt(internalCodesTable.expiresAt, new Date(Date.now() - 86_400_000)));
  });
  return { challengeId, code, expiresAt: expiresAt.getTime(), expiresIn };
}

// Caller must use the SAME transaction for validation and the account/password write.
export async function consumePersistentCode(tx: DbTransaction, input: CodeInput, purpose: CodePurpose, owner?: Owner) {
  const [challenge] = await tx.select().from(internalCodesTable).where(eq(internalCodesTable.id, input.challengeId)).for("update");
  if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() <= Date.now()) {
    return { status: 410, error: "Code expiré, remplacé ou déjà utilisé. Demandez un nouveau code." };
  }
  const actual = Buffer.from(sha256(`${input.challengeId}:${input.code}`), "hex");
  const valid = challenge.purpose === purpose &&
    challenge.identityHash === sha256(`${input.country}:${input.phone}`) &&
    (purpose === "registration" || (challenge.accountId === owner?.accountId && challenge.sessionHash === owner?.sessionHash)) &&
    timingSafeEqual(Buffer.from(challenge.codeHash, "hex"), actual);
  if (!valid) {
    const attempts = challenge.attempts + 1;
    await tx.update(internalCodesTable).set({ attempts, ...(attempts >= 5 ? { consumedAt: new Date() } : {}) }).where(eq(internalCodesTable.id, input.challengeId));
    return { status: attempts >= 5 ? 429 : 400, error: attempts >= 5 ? "Trop de tentatives. Demandez un nouveau code." : "Code interne incorrect." };
  }
  await tx.update(internalCodesTable).set({ consumedAt: new Date() }).where(eq(internalCodesTable.id, input.challengeId));
  return null;
}

function andLock(key: string) {
  return sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}
