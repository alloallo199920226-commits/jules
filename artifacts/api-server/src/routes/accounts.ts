import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db, accountsTable, accountFlagsTable, type Account } from "@workspace/db";
import { RegisterAccountBody, LoginAccountBody, SetupTransactionPasswordBody } from "@workspace/api-zod";
import { consumePersistentCode } from "../lib/persistent-codes";
import { endSession, getSession, newSession, publicAccount, setSessionCookie } from "../lib/account-session";
import { hashPassword, verifyPassword } from "../lib/passwords";
import { withinLimit } from "../lib/account-rate-limits";
import { ensureInvitationCode, resolveInvitation } from "../lib/invitation-codes";

const router = Router();
const dummyHash = hashPassword("No account matches this random dummy password");
const validPhone = (country: string, phone: string) => phone.length <= (country === "FR" ? 13 : 12);

router.get("/auth/me", async (req, res) => {
  const session = await getSession(req);
  res.json({ user: session ? publicAccount(session.account) : null });
});

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterAccountBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.nickname.trim() || !validPhone(parsed.data.country, parsed.data.phone)) {
    res.status(400).json({ error: "Vérifiez le pays, le numéro, le surnom et le mot de passe (6 à 128 caractères)." });
    return;
  }
  const input = parsed.data;
  if (!(await withinLimit(`register-ip:${req.ip}`, 50, 600_000)) ||
      !(await withinLimit(`register-phone:${input.country}:${input.phone}`, 10, 600_000))) {
    res.status(429).json({ error: "Trop de tentatives. Réessayez dans quelques minutes." });
    return;
  }
  try {
    const result = await db.transaction(async (tx): Promise<{ status: number; error: string } | { account: Account; token: string }> => {
      const [existing] = await tx.select({ id: accountsTable.id }).from(accountsTable)
        .where(and(eq(accountsTable.country, input.country), eq(accountsTable.phone, input.phone)));
      if (existing) return { status: 409, error: "Ce numéro possède déjà un compte. Connectez-vous." };
      const invalid = await consumePersistentCode(tx, input, "registration");
      if (invalid) return invalid;
      const [account] = await tx.insert(accountsTable).values({
        country: input.country, phone: input.phone, nickname: input.nickname.trim(),
        passwordHash: await hashPassword(input.password),
        invitation: await resolveInvitation(input.invitation, tx),
      }).returning();
      await ensureInvitationCode(account.id, tx);
      const token = await newSession(tx, account.id);
      return { account, token };
    });
    if ("status" in result) { res.status(result.status).json({ error: result.error }); return; }
    // Rotate any prior browser session only after the account transaction succeeds.
    await endSession(req, res);
    setSessionCookie(res, result.token);
    res.status(201).json({ user: publicAccount(result.account) });
  } catch (error) {
    let current: unknown = error;
    for (let depth = 0; depth < 3 && current && typeof current === "object"; depth++) {
      if ("code" in current && current.code === "23505") {
        res.status(409).json({ error: "Ce numéro possède déjà un compte. Connectez-vous." });
        return;
      }
      current = "cause" in current ? current.cause : null;
    }
    throw error;
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginAccountBody.safeParse(req.body);
  if (!parsed.success) { res.status(401).json({ error: "Numéro ou mot de passe incorrect." }); return; }
  const { country, phone, password } = parsed.data;
  if (!(await withinLimit(`login-ip:${req.ip}`, 100, 900_000)) ||
      !(await withinLimit(`login-phone:${country}:${phone}`, 15, 900_000))) {
    res.status(429).json({ error: "Trop de tentatives de connexion. Réessayez dans quinze minutes." });
    return;
  }
  const [account] = await db.select().from(accountsTable).where(and(eq(accountsTable.country, country), eq(accountsTable.phone, phone)));
  const matches = await verifyPassword(password, account?.passwordHash ?? await dummyHash);
  if (!account || !matches) { res.status(401).json({ error: "Numéro ou mot de passe incorrect." }); return; }
  const [flags] = await db.select().from(accountFlagsTable).where(eq(accountFlagsTable.accountId, account.id));
  if (flags?.isBanned || flags?.isBlocked) { res.status(403).json({ error: "Ce compte est suspendu. Contactez le service client." }); return; }
  const token = await db.transaction((tx) => newSession(tx, account.id));
  await endSession(req, res);
  setSessionCookie(res, token);
  res.json({ user: publicAccount(account) });
});

router.post("/auth/logout", async (req, res) => {
  await endSession(req, res);
  res.status(204).end();
});

router.post("/onboarding/transaction-password", async (req, res) => {
  const session = await getSession(req);
  if (!session) { res.status(401).json({ error: "Connectez-vous pour continuer." }); return; }
  if (session.account.transactionPasswordHash) { res.status(409).json({ error: "Le mot de passe de transaction est déjà défini." }); return; }
  const parsed = SetupTransactionPasswordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Saisissez un mot de passe de 6 à 128 caractères et un code de six chiffres." }); return; }
  if (!(await withinLimit(`setup:${session.account.id}`, 20, 600_000))) {
    res.status(429).json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }); return;
  }
  const input = parsed.data;
  if (await verifyPassword(input.password, session.account.passwordHash)) {
    res.status(400).json({ error: "Le mot de passe de transaction doit être différent du mot de passe de connexion." }); return;
  }
  const result = await db.transaction(async (tx) => {
    const invalid = await consumePersistentCode(tx, {
      ...input, country: session.account.country, phone: session.account.phone,
    }, "transaction", { accountId: session.account.id, sessionHash: session.sessionHash });
    if (invalid) return invalid;
    const [account] = await tx.update(accountsTable).set({ transactionPasswordHash: await hashPassword(input.password) })
      .where(and(eq(accountsTable.id, session.account.id), isNull(accountsTable.transactionPasswordHash))).returning();
    if (!account) return { status: 409, error: "Le mot de passe de transaction est déjà défini." };
    return { account };
  });
  if ("error" in result) { res.status(result.status).json({ error: result.error }); return; }
  res.json({ user: publicAccount(result.account) });
});

router.get("/dashboard", async (req, res) => {
  const session = await getSession(req);
  if (!session) { res.status(401).json({ error: "Connexion requise.", code: "AUTH_REQUIRED" }); return; }
  if (!session.account.transactionPasswordHash) {
    res.status(403).json({ error: "Définissez votre mot de passe de transaction avant d’accéder au tableau de bord.", code: "ONBOARDING_REQUIRED" });
    return;
  }
  res.json({ user: publicAccount(session.account) });
});

export default router;
