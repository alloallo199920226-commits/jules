import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db, forumPostsTable, accountsTable, forumUploadsTable } from "@workspace/db";
import { ModerateForumPostBody } from "@workspace/api-zod";
import { requireAdmin, audit, credit, fail, isAdmin, requireMember } from "../lib/administration";
import { communityStorage } from "../lib/community";
import { ObjectNotFoundError } from "../lib/objectStorage";

const router=Router();
const uid=(value:unknown)=>{const p=z.string().uuid().safeParse(value);if(!p.success)fail(400,"Identifiant invalide.");return p.data;};
router.use("/admin/social",requireAdmin);
router.get("/admin/social/posts",async(req,res)=>{
  const status=z.enum(["pending","approved","rejected"]).catch("pending").parse(req.query.status);
  const cursor=z.coerce.number().int().min(0).max(10000000).catch(0).parse(req.query.cursor);
  const rows=await db.select({post:forumPostsTable,author:accountsTable}).from(forumPostsTable)
    .innerJoin(accountsTable,eq(accountsTable.id,forumPostsTable.accountId)).where(eq(forumPostsTable.status,status))
    .orderBy(desc(forumPostsTable.createdAt),desc(forumPostsTable.id)).limit(26).offset(cursor);
  res.json({posts:rows.slice(0,25).map(({post:p,author:a})=>({id:p.id,caption:p.content,status:p.status,bonus:p.bonus,
    createdAt:p.createdAt,approvedAt:p.approvedAt,reviewNote:p.reviewNote,images:[{id:p.id}],
    author:{userId:a.id,registrationNumber:a.phone,nickname:a.nickname,phone:a.phone,country:a.country,email:a.email}})),
    nextCursor:rows.length>25?String(cursor+25):null});
});
router.post("/admin/social/posts/:id/:action",async(req,res)=>{
  const postId=uid(req.params.id),action=String(req.params.action);
  const input=ModerateForumPostBody.safeParse(req.body);if(!input.success)fail(400,"Décision ou montant invalide.");
  const result=await db.transaction(async tx=>{
    await tx.execute(sql`select id from iamgold_forum_posts where id=${postId}::uuid for update`);
    const [p]=await tx.select().from(forumPostsTable).where(eq(forumPostsTable.id,postId));
    if(!p)fail(404,"Publication introuvable.");
    if(action==="approve"){
      const bonus=input.data.bonus;
      if(bonus===undefined||!Number.isSafeInteger(bonus)||bonus<0)fail(400,"Saisissez un bonus entier positif ou zéro.");
      if(p.status==="approved"){
        if(p.bonus!==bonus)fail(409,"Publication déjà approuvée. Utilisez l’ajout de bonus.");
        return {ok:true,duplicate:true,bonus:p.bonus};
      }
      if(p.status!=="pending")fail(409,"Seules les publications en attente peuvent être approuvées.");
      if(bonus>0)await credit(tx,{accountId:p.accountId,postId,amount:bonus,type:"forum_bonus",requestId:`forum-approve:${postId}`});
      await tx.update(forumPostsTable).set({status:"approved",approvedAt:new Date(),reviewNote:null,bonus}).where(eq(forumPostsTable.id,postId));
    }else if(action==="reject"){
      if(p.status!=="pending")fail(409,"La publication n’est plus en attente.");
      const reason=input.data.reason?.trim();if(!reason)fail(400,"Ajoutez le motif du refus.");
      await tx.update(forumPostsTable).set({status:"rejected",reviewNote:reason}).where(eq(forumPostsTable.id,postId));
    }else if(action==="bonus"){
      if(p.status!=="approved")fail(409,"Approuvez la publication avant d’ajouter un bonus.");
      const amount=input.data.amount,requestId=input.data.requestId;
      if(!amount||!requestId||!Number.isSafeInteger(amount)||!Number.isSafeInteger(p.bonus+amount))fail(400,"Montant ou identifiant d’opération invalide.");
      const entry=await credit(tx,{accountId:p.accountId,postId,amount,type:"forum_bonus",requestId});
      if(!entry.duplicate)await tx.update(forumPostsTable).set({bonus:p.bonus+amount}).where(eq(forumPostsTable.id,postId));
    }else fail(404,"Décision inconnue.");
    await audit(`forum_${action}`,{postId},tx);
    const [updated]=await tx.select({bonus:forumPostsTable.bonus}).from(forumPostsTable).where(eq(forumPostsTable.id,postId));
    return {ok:true,bonus:updated.bonus};
  });
  res.json(result);
});
router.delete("/admin/social/posts/:id",async(req,res)=>{
  const postId=uid(req.params.id);
  await db.transaction(async tx=>{
    await tx.execute(sql`select id from iamgold_forum_posts where id=${postId}::uuid for update`);
    const [p]=await tx.select().from(forumPostsTable).where(eq(forumPostsTable.id,postId));
    if(!p)fail(404,"Publication introuvable.");
    // An upload used in a private conversation remains private; never destroy an unrelated chat attachment.
    const refs=await tx.execute(sql`select 1 from iamgold_support_messages where image_path=${p.imagePath} limit 1`);
    if(refs.rows.length)fail(409,"Cette image est également utilisée dans une conversation ; supprimez une publication avec une image distincte.");
    try {
      const file=await communityStorage.getObjectEntityFile(p.imagePath);await file.delete({ignoreNotFound:true});
    }catch(e){if(!(e instanceof ObjectNotFoundError)&&!(e instanceof Error && "code" in e && e.code===404))fail(503,"L’image n’a pas pu être supprimée du stockage. Aucune suppression définitive n’a été confirmée.");}
    await tx.delete(forumPostsTable).where(eq(forumPostsTable.id,postId));
    await tx.delete(forumUploadsTable).where(eq(forumUploadsTable.path,p.imagePath));
    await audit("forum_delete",{postId,bonusRetained:p.bonus},tx);
  });
  res.json({ok:true,deleted:true});
});
router.get("/social/images/:id",async(req,res)=>{
  const postId=uid(req.params.id),admin=await isAdmin(req);
  const a=admin?null:await requireMember(req);
  const [p]=await db.select().from(forumPostsTable).where(eq(forumPostsTable.id,postId));
  if(!p||(!admin&&p.accountId!==a?.id&&p.status!=="approved"))fail(404,"Image introuvable.");
  const [upload]=await db.select().from(forumUploadsTable).where(eq(forumUploadsTable.path,p.imagePath));
  if(!upload)fail(404,"Image introuvable.");
  try{
    const file=await communityStorage.getObjectEntityFile(p.imagePath);
    res.set({"Content-Type":upload.contentType,"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"});
    file.createReadStream().on("error",()=>res.destroy()).pipe(res);
  }catch{fail(404,"Image introuvable.");}
});
export default router;
