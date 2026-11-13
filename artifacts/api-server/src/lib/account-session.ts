import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import type { Request, Response } from "express";
import { db, accountsTable, sessionsTable, accountFlagsTable, type Account } from "@workspace/db";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const COOKIE = "iamgold_session";
const LIFETIME = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = { httpOnly: true, secure: true, sameSite: "none" as const, path: "/api" };

export function publicAccount(account: Account) {
  return {
    id: account.id, country: account.country, phone: account.phone,
    nickname: account.nickname, createdAt: account.createdAt.toISOString(),
    email: account.email, avatarPath: account.avatarPath,
    transactionPasswordSet: account.transactionPasswordHash !== null,
    // The on-site code cannot establish ownership of a phone number.
    phoneVerified: false,
  };
}

function tokenFromRequest(req: Request) {
  const token = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export async function getSession(req: Request) {
  const token = tokenFromRequest(req);
  if (!token) return null;
  const hash = sha256(token);
  const [row] = await db.select({ account: accountsTable }).from(sessionsTable)
    .innerJoin(accountsTable, eq(accountsTable.id, sessionsTable.accountId))
    .where(and(eq(sessionsTable.tokenHash, hash), gt(sessionsTable.expiresAt, new Date())));
  if (!row) return null;
  const [flags] = await db.select().from(accountFlagsTable).where(eq(accountFlagsTable.accountId, row.account.id));
  if (flags?.isBanned || flags?.isBlocked) return null;
  return { account: row.account, sessionHash: hash };
}

export async function newSession(tx: DbTransaction, accountId: string) {
  const token = randomBytes(32).toString("hex");
  await tx.insert(sessionsTable).values({ tokenHash: sha256(token), accountId, expiresAt: new Date(Date.now() + LIFETIME) });
  await tx.delete(sessionsTable).where(lt(sessionsTable.expiresAt, new Date()));
  return token;
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: LIFETIME });
}

export async function endSession(req: Request, res: Response) {
  const token = tokenFromRequest(req);
  if (token) await db.delete(sessionsTable).where(eq(sessionsTable.tokenHash, sha256(token)));
  res.clearCookie(COOKIE, cookieOptions);
}
