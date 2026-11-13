import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, adminSessionsTable, adminAuditTable, walletLedgerTable, accountsTable, accountFlagsTable } from "@workspace/db";
import { sha256, getSession, type DbTransaction } from "./account-session";

export class DomainError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function fail(status: number, message: string): never { throw new DomainError(status, message); }
export const adminCookie = "iamgold_admin";
export const adminCookieOptions = { httpOnly: true, secure: true, sameSite: "none" as const, path: "/api" };
function credentialVersion() {
  const password = process.env.ADMIN_CONSOLE_PASSWORD;
  if (!password || password.length < 16) return null;
  return createHmac("sha256", process.env.SESSION_SECRET || password).update(password).digest("hex");
}
export async function isAdmin(req: Request) {
  const version = credentialVersion();
  if (!version) return false;
  const token = req.headers.cookie?.split(";").map(p => p.trim()).find(p => p.startsWith(`${adminCookie}=`))?.slice(adminCookie.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const [session] = await db.select().from(adminSessionsTable).where(and(
    eq(adminSessionsTable.tokenHash, sha256(token)), eq(adminSessionsTable.credentialVersion, version),
    gt(adminSessionsTable.expiresAt, new Date())));
  return !!session;
}
export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!await isAdmin(req)) fail(401, "Authentification administrateur requise.");
  next();
}
export async function loginAdmin(password: string, res: Response) {
  const version = credentialVersion();
  if (!version) fail(503, "L’accès administrateur doit être activé dans les secrets du projet (ADMIN_CONSOLE_PASSWORD, 16 caractères minimum).");
  if (!timingSafeEqual(Buffer.from(sha256(password)), Buffer.from(sha256(process.env.ADMIN_CONSOLE_PASSWORD!)))) fail(401, "Mot de passe incorrect.");
  const token = randomBytes(32).toString("hex");
  await db.insert(adminSessionsTable).values({ tokenHash: sha256(token), credentialVersion: version, expiresAt: new Date(Date.now() + 8 * 3600000) });
  res.cookie(adminCookie, token, { ...adminCookieOptions, maxAge: 8 * 3600000 });
}
export async function requireMember(req: Request) {
  const session = await getSession(req);
  if (!session) fail(401, "Connectez-vous pour continuer.");
  if (!session.account.transactionPasswordHash) fail(403, "Définissez votre mot de passe de transaction.");
  return session.account;
}
export async function audit(event: string, details: Record<string, unknown>, tx: DbTransaction | typeof db = db) {
  await tx.insert(adminAuditTable).values({ event, details });
}
export async function wallet(accountId: string, tx: DbTransaction | typeof db = db) {
  const result = await tx.select({ balance: sql<string>`coalesce(sum(${walletLedgerTable.amount}),0)::text`,
    credits: sql<string>`coalesce(sum(${walletLedgerTable.amount}) filter (where ${walletLedgerTable.amount}>0),0)::text` })
    .from(walletLedgerTable).where(eq(walletLedgerTable.accountId, accountId));
  return { balance: Number(result[0].balance), credits: Number(result[0].credits) };
}
export async function credit(tx: DbTransaction, input: {accountId: string; amount: number; type: string; requestId: string; postId?: string}) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${input.requestId},0))`);
  const [prior] = await tx.select().from(walletLedgerTable).where(eq(walletLedgerTable.requestId, input.requestId));
  if (prior) {
    if (prior.accountId !== input.accountId || prior.amount !== input.amount || prior.type !== input.type || prior.postId !== (input.postId ?? null))
      fail(409, "Cet identifiant correspond à une autre opération.");
    return { ...prior, duplicate: true };
  }
  const result = await tx.execute(sql`select id from iamgold_accounts where id=${input.accountId}::uuid for no key update`);
  if (!result.rows.length) fail(404, "Utilisateur introuvable.");
  const current = await wallet(input.accountId, tx);
  if (!Number.isSafeInteger(input.amount) || input.amount === 0 ||
      !Number.isSafeInteger(current.balance + input.amount) || !Number.isSafeInteger(current.credits + Math.max(input.amount, 0)))
    fail(400, "Le montant dépasse la précision prise en charge.");
  if (current.balance + input.amount < 0) fail(409, "Solde insuffisant.");
  const [entry] = await tx.insert(walletLedgerTable).values(input).returning();
  await audit(input.type, { accountId: input.accountId, amount: input.amount, requestId: input.requestId }, tx);
  await tx.execute(sql`select pg_notify('iamgold_wallet_changed', ${input.accountId})`);
  return { ...entry, duplicate: false };
}
export async function userSummary(accountId: string) {
  const [a] = await db.select().from(accountsTable).where(eq(accountsTable.id, accountId));
  if (!a) fail(404, "Utilisateur introuvable.");
  const [flags] = await db.select().from(accountFlagsTable).where(eq(accountFlagsTable.accountId, accountId));
  return { id: a.id, phone: a.phone, nickname: a.nickname, country: a.country, email: a.email,
    avatarPath: a.avatarPath, createdAt: a.createdAt, registrationNumber: a.phone,
    isBanned: flags?.isBanned ?? false, isBlocked: flags?.isBlocked ?? false,
    withdrawalsDisabled: flags?.withdrawalsDisabled ?? false };
}
