import { Router } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db, supportMessagesTable, supportLikesTable, forumUploadsTable, forumPostsTable } from "@workspace/db";
import { SendSupportMessageBody, SendConsoleMessageBody, ReactSupportMessageBody, RequestConsoleUploadBody,UpdateSupportConversationStatusBody,UpdateSupportPresenceBody,UpdateConsoleSupportPresenceBody,GetSupportPresenceResponse } from "@workspace/api-zod";
import { requireMember, requireAdmin, userSummary, fail } from "../lib/administration";
import { communityStorage, validateImage } from "../lib/community";
import { withinLimit } from "../lib/account-rate-limits";
import { setConversationStatus } from "../lib/support-state";
import { readSupportPresence, recordSupportActivity } from "../lib/support-presence";

const router = Router();
const uid = (value: unknown) => { const p=z.string().uuid().safeParse(value); if (!p.success) fail(400,"Identifiant invalide."); return p.data; };
async function messages(accountId: string, admin: boolean) {
  const actor = admin ? "admin" : accountId;
  // Return persisted messages in chronological order; no client-supplied identity is trusted.
  const rows = await db.select({ id: supportMessagesTable.id, clientId: supportMessagesTable.clientId, body: supportMessagesTable.body, imagePath: supportMessagesTable.imagePath,
    sender: supportMessagesTable.sender, createdAt: supportMessagesTable.createdAt,seenAt:supportMessagesTable.seenAt,
    liked: sql<boolean>`exists(select 1 from iamgold_support_likes l where l.message_id=${supportMessagesTable.id} and l.actor=${actor})`,
    likes: sql<number>`(select count(*)::int from iamgold_support_likes l where l.message_id=${supportMessagesTable.id})` })
    .from(supportMessagesTable).where(eq(supportMessagesTable.accountId,accountId)).orderBy(asc(supportMessagesTable.createdAt));
  return { messages: rows, user: await userSummary(accountId) };
}
async function send(accountId: string, admin: boolean, input: unknown) {
  const p=(admin ? SendConsoleMessageBody : SendSupportMessageBody).safeParse(input);
  if (!p.success || (!p.data.body.trim() && !p.data.imagePath)) fail(400,"Ajoutez un message ou une image.");
  if (!await withinLimit(`chat:${admin ? "admin" : accountId}`,120,60000)) fail(429,"Trop de messages. Réessayez dans une minute.");
  const sender=admin?"admin":"member";
  const [existing]=await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.clientId,p.data.clientId));
  if (existing) {
    if (existing.accountId!==accountId || existing.sender!==sender || existing.body!==p.data.body.trim() || existing.imagePath!==(p.data.imagePath??null))
      fail(409,"Identifiant de message déjà utilisé.");
    return { ...existing, liked:false, likes:0 };
  }
  await userSummary(accountId);
  if (p.data.imagePath) {
    const [publicUse]=await db.select({id:forumPostsTable.id}).from(forumPostsTable).where(eq(forumPostsTable.imagePath,p.data.imagePath)).limit(1);
    if(publicUse)fail(409,"Transférez une nouvelle image pour votre conversation privée.");
    await validateImage(p.data.imagePath,accountId,admin);
  }
  const row=await db.transaction(async tx=>{
    const [created]=await tx.insert(supportMessagesTable).values({ accountId,sender,body:p.data.body.trim(),
      imagePath:p.data.imagePath,clientId:p.data.clientId }).onConflictDoNothing().returning();
    if(created&&!admin)await setConversationStatus(accountId,"in_progress",tx);
    return created;
  });
  if (!row) fail(409,"Ce message est déjà enregistré. Actualisez la conversation.");
  return { ...row, liked:false,likes:0 };
}
async function like(messageId: string, actor: string, body: unknown, accountId?: string) {
  const p=ReactSupportMessageBody.safeParse(body); if (!p.success) fail(400,"Réaction invalide.");
  const [m]=await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.id,messageId));
  if (!m || (accountId && m.accountId!==accountId)) fail(404,"Message introuvable.");
  if (p.data.liked) await db.insert(supportLikesTable).values({messageId,actor}).onConflictDoNothing();
  else await db.delete(supportLikesTable).where(and(eq(supportLikesTable.messageId,messageId),eq(supportLikesTable.actor,actor)));
  const result=await db.execute(sql`select count(*)::int likes from iamgold_support_likes where message_id=${messageId}::uuid`);
  return { liked:p.data.liked,likes:result.rows[0].likes };
}
router.use(["/support", "/admin/support"], (_req,res,next) => {
  res.setHeader("Cache-Control","private, no-store");
  next();
});
router.get("/support/presence",async(req,res)=>{await requireMember(req);res.json(GetSupportPresenceResponse.parse(await readSupportPresence("admin")));});
router.post("/support/presence",async(req,res)=>{
  const a=await requireMember(req);
  const p=UpdateSupportPresenceBody.safeParse(req.body);
  if(!p.success)fail(400,"Activité invalide.");
  if(!await withinLimit(`presence:${a.id}`,600,60000))fail(429,"Activité trop fréquente.");
  res.json(GetSupportPresenceResponse.parse(await recordSupportActivity(a.id,false,p.data)));
});
router.get("/support/messages",async(req,res)=>{const a=await requireMember(req);res.json(await messages(a.id,false));});
router.post("/support/messages",async(req,res)=>{const a=await requireMember(req);res.status(201).json(await send(a.id,false,req.body));});
router.post("/support/messages/:id/like",async(req,res)=>{const a=await requireMember(req);res.json(await like(uid(req.params.id),a.id,req.body,a.id));});
router.use("/admin/support",requireAdmin);
router.get("/admin/support/conversations/:id/presence",async(req,res)=>{
  const id=uid(req.params.id);await userSummary(id);
  res.json(GetSupportPresenceResponse.parse(await readSupportPresence(id)));
});
router.post("/admin/support/conversations/:id/presence",async(req,res)=>{
  const id=uid(req.params.id);await userSummary(id);
  const p=UpdateConsoleSupportPresenceBody.safeParse(req.body);
  if(!p.success)fail(400,"Activité invalide.");
  if(!await withinLimit("presence:admin",1800,60000))fail(429,"Activité trop fréquente.");
  res.json(GetSupportPresenceResponse.parse(await recordSupportActivity(id,true,p.data)));
});
router.get("/admin/support/conversations",async(_req,res)=>{
  const result=await db.execute(sql`
    select a.id,a.id as "accountId",a.nickname,a.phone,a.country,a.email,a.avatar_path as "avatarPath",a.created_at as "createdAt",
    (select body from iamgold_support_messages where account_id=a.id order by created_at desc limit 1) as "lastMessage",
    (select created_at from iamgold_support_messages where account_id=a.id order by created_at desc limit 1) as "lastMessageAt",
    (select sender from iamgold_support_messages where account_id=a.id order by created_at desc limit 1) as "lastSender",
    (select image_path from iamgold_support_messages where account_id=a.id order by created_at desc limit 1) as "lastImagePath",
    coalesce((select value->>'status' from iamgold_admin_resources where kind='support-conversation' and value->>'accountId'=a.id::text order by id desc limit 1),'in_progress') as status,
    (select count(*)::int from iamgold_support_messages where account_id=a.id and sender='member' and seen_at is null) unread,
    json_build_object(
      'online',exists(select 1 from iamgold_support_presence_leases l where l.actor=a.id::text and l.expires_at>now()),
      'firstSeenAt',(select p.first_seen_at from iamgold_support_presence p where p.actor=a.id::text),
      'lastSeenAt',(select p.last_seen_at from iamgold_support_presence p where p.actor=a.id::text),
      'onlineUntil',(select max(l.expires_at) from iamgold_support_presence_leases l where l.actor=a.id::text and l.expires_at>now())
    ) presence
    from iamgold_accounts a where exists(select 1 from iamgold_support_messages where account_id=a.id)
    order by (select max(created_at) from iamgold_support_messages where account_id=a.id) desc`);
  res.json({conversations:result.rows,serverNow:new Date().toISOString()});
});
router.patch("/admin/support/conversations/:id/status",async(req,res)=>{
  const accountId=uid(req.params.id);
  const parsed=UpdateSupportConversationStatusBody.safeParse(req.body);
  if(!parsed.success)fail(400,"État de conversation invalide.");
  await userSummary(accountId);
  res.json(await setConversationStatus(accountId,parsed.data.status));
});
router.get("/admin/support/conversations/:id/messages",async(req,res)=>{res.json(await messages(uid(req.params.id),true));});
router.post("/admin/support/conversations/:id/messages",async(req,res)=>{res.status(201).json(await send(uid(req.params.id),true,req.body));});
router.post("/admin/support/messages/:id/like",async(req,res)=>{res.json(await like(uid(req.params.id),"admin",req.body));});
router.post("/admin/support/uploads/request-url",async(req,res)=>{
  const p=RequestConsoleUploadBody.safeParse(req.body);if(!p.success)fail(400,"Image ou destinataire invalide (5 Mo maximum).");
  if(!await withinLimit("admin-uploads",100,3600000))fail(429,"Trop de transferts. Réessayez plus tard.");
  await userSummary(p.data.accountId);
  const uploadURL=await communityStorage.getObjectEntityUploadURL();
  const objectPath=communityStorage.normalizeObjectEntityPath(uploadURL);
  await db.insert(forumUploadsTable).values({path:objectPath,accountId:p.data.accountId,contentType:p.data.contentType,uploadedByAdmin:true});
  res.json({uploadURL,objectPath});
});
export default router;
