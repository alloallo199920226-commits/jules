import { Router, type Request, type Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db, accountsTable, forumUploadsTable, sessionsTable } from "@workspace/db";
import { ChangeLoginPasswordBody, ChangeTransactionPasswordBody, UpdateMemberProfileBody } from "@workspace/api-zod";
import { getSession, newSession, publicAccount, setSessionCookie } from "../lib/account-session";
import { withinLimit } from "../lib/account-rate-limits";
import { hashPassword, verifyPassword } from "../lib/passwords";
import { consumePersistentCode } from "../lib/persistent-codes";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const storage = new ObjectStorageService();
async function currentMember(req: Request, res: Response) {
  const session = await getSession(req);
  if (!session) { res.status(401).json({ error: "Connectez-vous pour continuer.", code: "AUTH_REQUIRED" }); return null; }
  if (!session.account.transactionPasswordHash) {
    res.status(403).json({ error: "Définissez d’abord votre mot de passe de transaction.", code: "ONBOARDING_REQUIRED" }); return null;
  }
  return session;
}

router.put("/member/profile", async (req, res) => {
  const session = await currentMember(req, res); if (!session) return;
  const parsed = UpdateMemberProfileBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.nickname.trim()) {
    res.status(400).json({ error: "Vérifiez le nom d’utilisateur et l’adresse e-mail." }); return;
  }
  if (!await withinLimit(`profile:${session.account.id}`, 30, 600_000)) {
    res.status(429).json({ error: "Trop de modifications. Réessayez dans quelques minutes." }); return;
  }
  const input = parsed.data;
  if (input.avatarPath) {
    const [upload] = await db.select().from(forumUploadsTable).where(and(
      eq(forumUploadsTable.path, input.avatarPath), eq(forumUploadsTable.accountId, session.account.id)));
    if (!upload) { res.status(403).json({ error: "Cette image ne vous appartient pas." }); return; }
    try {
      const file = await storage.getObjectEntityFile(input.avatarPath);
      const [metadata] = await file.getMetadata();
      const [bytes] = await file.download({ start: 0, end: 15 });
      const mime = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png" :
        bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "image/jpeg" :
        bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP" ? "image/webp" : null;
      const size = Number(metadata.size);
      if (!Number.isFinite(size) || size <= 0 || size > 5_242_880 || mime !== upload.contentType) {
        res.status(400).json({ error: "Choisissez une image JPEG, PNG ou WebP de 5 Mo maximum." }); return;
      }
    } catch { res.status(400).json({ error: "Le transfert de l’image n’est pas terminé." }); return; }
  }
  const [account] = await db.update(accountsTable).set({
    nickname: input.nickname.trim(),
    ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
    ...(input.avatarPath !== undefined ? { avatarPath: input.avatarPath } : {}),
  }).where(eq(accountsTable.id, session.account.id)).returning();
  if (!account) { res.status(401).json({ error: "Session expirée." }); return; }
  res.json({ user: publicAccount(account) });
});

for (const kind of ["login", "transaction"] as const) {
  router.post(kind === "login" ? "/member/password" : "/member/transaction-password", async (req, res) => {
    const session = await currentMember(req, res); if (!session) return;
    const parsed = kind === "login" ? ChangeLoginPasswordBody.safeParse(req.body) : ChangeTransactionPasswordBody.safeParse(req.body);
    if (!parsed.success || !parsed.data.newPassword.trim()) {
      res.status(400).json({ error: "Vérifiez les mots de passe (6 à 128 caractères) et le code demandé." }); return;
    }
    if (!await withinLimit(`password-change:${kind}:${session.account.id}`, 10, 600_000)) {
      res.status(429).json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }); return;
    }
    const input = parsed.data;
    const result = await db.transaction(async tx => {
      const [account] = await tx.select().from(accountsTable).where(eq(accountsTable.id, session.account.id)).for("update");
      const [active] = await tx.select({ tokenHash: sessionsTable.tokenHash }).from(sessionsTable)
        .where(and(eq(sessionsTable.tokenHash, session.sessionHash), gt(sessionsTable.expiresAt, new Date())));
      if (!account || !active) return { status: 401, error: "Votre session a expiré. Reconnectez-vous." };
      const oldHash = kind === "login" ? account.passwordHash : account.transactionPasswordHash;
      if (!oldHash || !await verifyPassword(input.oldPassword, oldHash)) {
        return { status: 400, error: "L’ancien mot de passe est incorrect." };
      }
      if (input.oldPassword === input.newPassword) return { status: 400, error: "Choisissez un nouveau mot de passe différent de l’ancien." };
      const otherHash = kind === "login" ? account.transactionPasswordHash : account.passwordHash;
      if (otherHash && await verifyPassword(input.newPassword, otherHash)) {
        return { status: 400, error: "Les mots de passe de connexion et de transaction doivent être différents." };
      }
      if (kind === "transaction") {
        const challenge = ChangeTransactionPasswordBody.parse(input);
        const invalid = await consumePersistentCode(tx, {
          country: account.country, phone: account.phone, challengeId: challenge.challengeId, code: challenge.code,
        }, "transaction-change", { accountId: account.id, sessionHash: session.sessionHash });
        if (invalid) return invalid;
      }
      const hash = await hashPassword(input.newPassword);
      const [updated] = await tx.update(accountsTable).set(kind === "login"
        ? { passwordHash: hash } : { transactionPasswordHash: hash }).where(eq(accountsTable.id, account.id)).returning();
      // Rotate this browser and revoke every other session atomically with the change.
      await tx.delete(sessionsTable).where(eq(sessionsTable.accountId, account.id));
      const token = await newSession(tx, account.id);
      return { account: updated, token };
    });
    if ("error" in result) { res.status(result.status).json({ error: result.error }); return; }
    setSessionCookie(res, result.token);
    res.json({ user: publicAccount(result.account) });
  });
}
export default router;
