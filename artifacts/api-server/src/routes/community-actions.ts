import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, forumLikesTable, forumViewsTable, forumCommentsTable, adminResourcesTable, walletLedgerTable, vipGrantsTable } from "@workspace/db";
import { ReactForumPostBody, AddForumCommentBody, ListMemberTransactionsQueryParams, ListMemberTransactionsResponse } from "@workspace/api-zod";
import { approvedPost, comments, forumPost } from "../lib/community";
import { requireMember, wallet, fail } from "../lib/administration";
import { withinLimit } from "../lib/account-rate-limits";
import { subscribeWalletChanges } from "../lib/wallet-notifications";
import { listMemberTransactions } from "../lib/member-transactions";

const router = Router();
const uuid = z.string().uuid();
function id(value: unknown) { const p = uuid.safeParse(value); if (!p.success) fail(400, "Identifiant invalide."); return p.data; }
router.post("/forum/posts/:id/view", async (req, res) => {
  const a = await requireMember(req); const postId = id(req.params.id);
  await approvedPost(postId);
  await db.insert(forumViewsTable).values({ postId, accountId: a.id }).onConflictDoNothing();
  const p = await forumPost(postId, a.id); res.json({ views: p.views });
});
router.post("/forum/posts/:id/like", async (req, res) => {
  const a = await requireMember(req); const postId = id(req.params.id);
  const body = ReactForumPostBody.safeParse(req.body);
  if (!body.success) fail(400, "Réaction invalide.");
  await approvedPost(postId);
  if (body.data.liked) await db.insert(forumLikesTable).values({ postId, accountId: a.id }).onConflictDoNothing();
  else await db.delete(forumLikesTable).where(and(eq(forumLikesTable.postId, postId), eq(forumLikesTable.accountId, a.id)));
  const p = await forumPost(postId, a.id); res.json({ likes: p.likes, liked: p.liked });
});
router.get("/forum/posts/:id/comments", async (req, res) => {
  await requireMember(req); const postId = id(req.params.id); await approvedPost(postId);
  res.json({ comments: await comments(postId) });
});
router.post("/forum/posts/:id/comments", async (req, res) => {
  const a = await requireMember(req); const postId = id(req.params.id); await approvedPost(postId);
  const p = AddForumCommentBody.safeParse(req.body);
  if (!p.success || !p.data.body.trim()) fail(400, "Écrivez un commentaire (2 000 caractères maximum).");
  if (!await withinLimit(`comment:${a.id}`, 50, 3600000)) fail(429, "Trop de commentaires. Réessayez plus tard.");
  const [row] = await db.insert(forumCommentsTable).values({ postId, accountId: a.id, body: p.data.body.trim() }).returning();
  res.status(201).json({ ...row, authorName: a.nickname });
});
router.get("/member/products", async (req, res) => {
  await requireMember(req);
  const rows = await db.select().from(adminResourcesTable).where(eq(adminResourcesTable.kind, "product"));
  const [marker] = await db.select().from(adminResourcesTable).where(eq(adminResourcesTable.kind, "catalog-configured"));
  res.json({ configured: !!marker || rows.length > 0, products: rows.filter(r => r.value.active).map(r => ({ ...r.value, id: r.id })) });
});
router.get("/member/transactions", async (req, res) => {
  const account = await requireMember(req);
  const parsed = ListMemberTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) fail(400, "Filtre ou curseur invalide.");
  const page = await listMemberTransactions(account.id, parsed.data.kind ?? "all", parsed.data.cursor);
  res.json(ListMemberTransactionsResponse.parse(page));
});
router.get("/member/wallet/events", async (req, res) => {
  const account = await requireMember(req);
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let unsubscribe = () => {};
  const close = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    unsubscribe();
    res.end();
  };
  res.on("close", close);
  const changed = () => {
    if (!closed && !res.write("event: wallet-changed\ndata: {}\n\n")) close();
  };
  try {
    unsubscribe = await subscribeWalletChanges(account.id, { changed, disconnected: close });
  } catch {
    if (!closed) res.status(503).json({ error: "Notifications temporairement indisponibles." });
    return;
  }
  if (closed) { unsubscribe(); return; }
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write("retry: 3000\n\n");
  // Rehydrate after every connection: events missed during reconnect are not lost.
  changed();
  let checking = false;
  heartbeat = setInterval(async () => {
    if (checking || closed) return;
    checking = true;
    try {
      const current = await requireMember(req);
      if (current.id !== account.id) { close(); return; }
      if (!closed && !res.write(": heartbeat\n\n")) close();
    } catch { close(); }
    finally { checking = false; }
  }, 15000);
});
router.get("/member/wallet", async (req, res) => {
  const a = await requireMember(req);
  const transactions = await db.select({ id: walletLedgerTable.id, type: walletLedgerTable.type,
    amount: walletLedgerTable.amount, createdAt: walletLedgerTable.createdAt })
    .from(walletLedgerTable).where(eq(walletLedgerTable.accountId, a.id)).orderBy(desc(walletLedgerTable.createdAt)).limit(200);
  res.json({ ...await wallet(a.id), transactions });
});
router.get("/member/orders", async (req,res) => {
  const a=await requireMember(req);
  const rows=await db.select().from(vipGrantsTable).where(eq(vipGrantsTable.accountId,a.id)).orderBy(desc(vipGrantsTable.createdAt));
  res.json({orders:rows.map(g=>({id:String(g.id),productName:g.snapshot.name,price:0,amount:0,dailyIncome:g.snapshot.dailyIncome,
    totalIncome:g.snapshot.totalIncome,durationDays:g.snapshot.durationDays,source:"admin",
    status:g.status==="active"&&g.expiresAt<new Date()?"expired":g.status,createdAt:g.createdAt,expiresAt:g.expiresAt}))});
});
router.get("/member/announcements",async(req,res)=>{
  await requireMember(req);
  const rows=await db.select().from(adminResourcesTable).where(eq(adminResourcesTable.kind,"announcement")).orderBy(desc(adminResourcesTable.updatedAt));
  res.json({announcements:rows.filter(r=>r.value.status==="published"&&r.value.audience==="all").map(r=>({...r.value,id:r.id}))});
});
export default router;
