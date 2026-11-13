import { Router } from "express";
import { randomBytes } from "node:crypto";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db, accountsTable, adminSessionsTable, adminResourcesTable, accountFlagsTable, sessionsTable, walletLedgerTable, vipGrantsTable, invitationCodesTable } from "@workspace/db";
import { LoginConsoleBody } from "@workspace/api-zod";
import { loginAdmin, requireAdmin, adminCookie, adminCookieOptions, audit, credit, wallet, userSummary, fail } from "../lib/administration";
import { sha256 } from "../lib/account-session";
import { resourceInput, resourceKinds } from "../lib/admin-resources";
import { withinLimit } from "../lib/account-rate-limits";

const router=Router();
const uid=(value:unknown)=>{const p=z.string().uuid().safeParse(value);if(!p.success)fail(400,"Identifiant utilisateur invalide.");return p.data;};
const int=(value:unknown,max=Number.MAX_SAFE_INTEGER,min=1)=>{const p=z.coerce.number().int().min(min).max(max).safeParse(value);if(!p.success)fail(400,"Montant ou identifiant invalide.");return p.data;};
const cursor=(v:unknown)=>v===undefined?0:int(v,10000000,0);
const requestId=(v:unknown)=>{const p=z.string().min(8).max(120).regex(/^[a-zA-Z0-9_-]+$/).safeParse(v);if(!p.success)fail(400,"Identifiant d’opération invalide.");return p.data;};
router.post("/admin/login",async(req,res)=>{
  if(!await withinLimit(`admin-login:${req.ip}`,10,900000))fail(429,"Trop de tentatives. Réessayez dans quinze minutes.");
  const p=LoginConsoleBody.safeParse(req.body);if(!p.success)fail(400,"Mot de passe invalide.");
  await loginAdmin(p.data.password,res);res.json({ok:true});
});
router.use("/admin",requireAdmin);
router.post("/admin/logout",async(req,res)=>{
  const token=req.headers.cookie?.split(";").map(s=>s.trim()).find(s=>s.startsWith(`${adminCookie}=`))?.slice(adminCookie.length+1);
  if(token)await db.delete(adminSessionsTable).where(eq(adminSessionsTable.tokenHash,sha256(token)));
  res.clearCookie(adminCookie,adminCookieOptions);res.json({ok:true});
});
async function resources(kind:string){return (await db.select().from(adminResourcesTable).where(eq(adminResourcesTable.kind,kind)).orderBy(desc(adminResourcesTable.id))).map(r=>({...r.value,id:r.id}));}
async function users(search="",offset=0,limit=50){
  const escaped=search.replace(/[\\%_]/g,"\\$&");
  const where=search?or(ilike(accountsTable.phone,`%${escaped}%`),ilike(accountsTable.nickname,`%${escaped}%`),sql`${accountsTable.id}::text=${search}`):undefined;
  const [total]=await db.select({n:count()}).from(accountsTable).where(where);
  const rows=await db.select({id:accountsTable.id,phone:accountsTable.phone,nickname:accountsTable.nickname,
    email:accountsTable.email,avatarPath:accountsTable.avatarPath,country:accountsTable.country,createdAt:accountsTable.createdAt,
    referrerId:accountsTable.invitation,registrationNumber:accountsTable.phone,
    referralCode:sql<string>`(select code from iamgold_invitation_codes where account_id=${accountsTable.id})`,
    isBanned:sql<boolean>`coalesce(${accountFlagsTable.isBanned},false)`,
    isBlocked:sql<boolean>`coalesce(${accountFlagsTable.isBlocked},false)`,
    withdrawalsDisabled:sql<boolean>`coalesce(${accountFlagsTable.withdrawalsDisabled},false)`,
    balance:sql<string>`(select coalesce(sum(amount),0)::text from iamgold_wallet_ledger where account_id=${accountsTable.id})`,
  }).from(accountsTable).leftJoin(accountFlagsTable,eq(accountsTable.id,accountFlagsTable.accountId))
    .where(where).orderBy(desc(accountsTable.createdAt),desc(accountsTable.id)).limit(limit+1).offset(offset);
  const list=rows.slice(0,limit).map(a=>({...a,balance:Number(a.balance)}));
  return {users:list,total:total.n,nextCursor:rows.length>limit?String(offset+limit):null};
}
async function grants(accountId?:string){
  const rows=await db.select({g:vipGrantsTable,a:accountsTable}).from(vipGrantsTable).innerJoin(accountsTable,eq(accountsTable.id,vipGrantsTable.accountId))
    .where(accountId?eq(vipGrantsTable.accountId,accountId):undefined).orderBy(desc(vipGrantsTable.createdAt)).limit(500);
  return rows.map(({g,a})=>({id:g.id,userId:a.id,userPhone:a.phone,productId:g.productId,productName:g.snapshot.name,
    price:0,amount:0,dailyIncome:g.snapshot.dailyIncome,totalIncome:g.snapshot.totalIncome,durationDays:g.snapshot.durationDays,
    source:"admin",status:g.status==="active"&&g.expiresAt<new Date()?"expired":g.status,createdAt:g.createdAt,expiresAt:g.expiresAt}));
}
router.get("/admin/overview",async(_req,res)=>{
  const [totals]=await db.select({users:count()}).from(accountsTable);
  const [credits]=await db.select({amount:sql<string>`coalesce(sum(amount) filter(where amount>0),0)::text`}).from(walletLedgerTable);
  const orders=await grants();
  res.json({stats:{users:totals.users,approvedDeposits:0,approvedWithdrawals:0,approvedDepositCount:0,approvedWithdrawalCount:0,
    adminCredits:Number(credits.amount),investments:orders.filter(o=>o.status==="active").length,pendingDeposits:0,pendingWithdrawals:0,
    rejectedDepositCount:0,rejectedWithdrawalCount:0},
    users:(await users("",0,500)).users,transactions:[],deposits:[],withdrawals:[],products:await resources("product"),orders,
    community:{isOpen:true,closureMessage:""},withdrawalsOverride:false,withdrawalsForceOpen:false});
});
router.get("/admin/users/search",async(req,res)=>{res.json(await users(String(req.query.search??"").slice(0,100),cursor(req.query.cursor)));});
router.get("/admin/users/:id",async(req,res)=>{
  const accountId=uid(req.params.id),user=await userSummary(accountId);
  const transactions=await db.select().from(walletLedgerTable).where(eq(walletLedgerTable.accountId,accountId)).orderBy(desc(walletLedgerTable.createdAt)).limit(100);
  const [sums]=await db.select({credits:sql<string>`coalesce(sum(amount) filter(where amount>0),0)::text`,
    debits:sql<string>`coalesce(-sum(amount) filter(where amount<0),0)::text`}).from(walletLedgerTable).where(eq(walletLedgerTable.accountId,accountId));
  res.json({user,wallet:{...await wallet(accountId),totalDeposits:0,totalWithdrawals:0,totalCommissions:0,
    totalAdminCredits:Number(sums.credits),totalAdminDebits:Number(sums.debits),reservedAmount:0},
    transactions:transactions.map(t=>({...t,status:"completed"})),orders:await grants(accountId),checkins:[]});
});
router.post("/admin/users/:id/:action",async(req,res)=>{
  const accountId=uid(req.params.id),action=String(req.params.action);
  await userSummary(accountId);
  if(action==="credit"||action==="debit"){
    const amount=int(req.body?.amount),rid=requestId(req.body?.requestId);
    const result=await db.transaction(tx=>credit(tx,{accountId,amount:action==="credit"?amount:-amount,type:`admin_${action}`,requestId:rid}));
    res.json({ok:true,amount,type:result.type});return;
  }
  if(action==="grant-vip"){
    const productId=int(req.body?.productId,2147483647),rid=requestId(req.body?.requestId);
    const result=await db.transaction(async tx=>{
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${rid},0))`);
      const [prior]=await tx.select().from(vipGrantsTable).where(eq(vipGrantsTable.requestId,rid));
      if(prior){if(prior.accountId!==accountId||prior.productId!==productId)fail(409,"Identifiant déjà utilisé.");return prior;}
      const [p]=await tx.select().from(adminResourcesTable).where(and(eq(adminResourcesTable.id,productId),eq(adminResourcesTable.kind,"product")));
      if(!p?.value.active)fail(404,"Produit actif introuvable.");
      const [g]=await tx.insert(vipGrantsTable).values({accountId,productId,requestId:rid,snapshot:p.value,
        expiresAt:new Date(Date.now()+Number(p.value.durationDays)*86400000)}).returning();
      await audit("grant_vip",{accountId,grantId:g.id},tx);return g;
    });
    res.json({ok:true,purchaseId:result.id});return;
  }
  const flags:Record<string,Partial<typeof accountFlagsTable.$inferInsert>>={
    ban:{isBanned:true},unban:{isBanned:false},block:{isBlocked:true},unblock:{isBlocked:false},
    "close-withdrawals":{withdrawalsDisabled:true},"open-withdrawals":{withdrawalsDisabled:false}};
  if(!flags[action])fail(404,"Action inconnue.");
  await db.transaction(async tx=>{
    await tx.insert(accountFlagsTable).values({accountId,...flags[action]}).onConflictDoUpdate({target:accountFlagsTable.accountId,set:flags[action]});
    if(action==="ban"||action==="block")await tx.delete(sessionsTable).where(eq(sessionsTable.accountId,accountId));
    await audit(action,{accountId},tx);
  });
  res.json({ok:true});
});
router.post("/admin/orders/:id/revoke-vip",async(req,res)=>{
  const id=int(req.params.id,2147483647);
  const rows=await db.update(vipGrantsTable).set({status:"revoked"}).where(and(eq(vipGrantsTable.id,id),eq(vipGrantsTable.status,"active"))).returning();
  if(!rows.length)fail(404,"Attribution active introuvable.");
  await audit("revoke_vip",{id});res.json({ok:true});
});
router.get("/admin/transaction-trace",async(req,res)=>{
  const offset=cursor(req.query.cursor),search=String(req.query.search??"").slice(0,120),user=String(req.query.user??"");
  const kind=z.enum(["all","bonus","commission","recharge","withdrawal","purchase","income"]).safeParse(req.query.kind??"all");
  if(!kind.success)fail(400,"Type d’écriture invalide.");
  const pattern=`%${search.replace(/[\\%_]/g,"\\$&")}%`;
  const where=and(user?eq(walletLedgerTable.accountId,uid(user)):undefined,
    kind.data!=="all"&&kind.data!=="bonus"?sql`false`:undefined,
    search?or(sql`${walletLedgerTable.accountId}::text ilike ${pattern}`,ilike(accountsTable.phone,pattern),
      ilike(walletLedgerTable.requestId,pattern),ilike(walletLedgerTable.type,pattern)):undefined);
  const rows=await db.select({t:walletLedgerTable,a:accountsTable}).from(walletLedgerTable)
    .innerJoin(accountsTable,eq(accountsTable.id,walletLedgerTable.accountId)).where(where).orderBy(desc(walletLedgerTable.createdAt)).limit(31).offset(offset);
  const [total]=await db.select({n:count()}).from(walletLedgerTable).innerJoin(accountsTable,eq(accountsTable.id,walletLedgerTable.accountId)).where(where);
  res.json({transactions:rows.slice(0,30).map(({t,a})=>({...t,userId:a.id,user_id:a.id,userPhone:a.phone,phone:a.phone,registrationNumber:a.phone,
    created_at:t.createdAt,provider_reference:t.requestId,kind:"bonus",amount_fcfa:t.amount,
    signedAmount:t.amount,amount:Math.abs(t.amount),status:"completed",label:t.type==="forum_bonus"?"Prime de publication":t.type,
    details:{request_id:t.requestId,postId:t.postId,admin_type:t.type,admin_id:null}})),
    total:total.n,nextCursor:rows.length>30?String(offset+30):null});
});
for(const path of ["transaction-history","today-withdrawals"]){
  // No payment provider or pending payment requests exist in this IAMGOLD database.
  router.get(`/admin/${path}`,async(_req,res)=>{res.json({transactions:[],total:0,nextCursor:null});});
}
router.get("/admin/cameroon-totals",async(_req,res)=>{res.json({country:"Cameroun",currency:"XAF",totalDeposits:0,totalWithdrawals:0});});
router.get("/admin/payment-provider-controls",async(_req,res)=>{res.json({saspayEnabled:false,sonarapayAutomaticEnabled:false,sonarapayConfigured:false});});
router.patch("/admin/payment-provider-controls",async()=>{fail(503,"Aucun prestataire de paiement n’est connecté ; aucun paiement n’a été autorisé.");});
router.get("/admin/popup-config",async(_req,res)=>{res.json({config:{depositMin:2000,withdrawalMin:2000,withdrawalFeePercent:null,dashboxDeposit:2000,
  dashboxWithdraw:2000,signupBonus:0,checkinBonus:null,maxWithdrawals:null},referenceOnly:true});});
router.post("/admin/popup-config",async()=>{fail(409,"Les règles financières ne sont pas connectées à un service de paiement. Aucun paramètre n’a été modifié.");});
router.patch("/admin/popup-config",async()=>{fail(409,"Les règles financières ne sont pas connectées à un service de paiement. Aucun paramètre n’a été modifié.");});
router.get("/admin/withdraw-override",async(_req,res)=>{res.json({withdrawalsOverride:false,withdrawalsForceOpen:false});});
router.patch("/admin/withdraw-override",async()=>{fail(503,"Le service de retrait n’est pas connecté.");});
router.all(["/admin/users-purge-preview","/admin/users-purge","/admin/customer-reset/preview","/admin/customer-reset"],async()=>{
  fail(403,"Suppression massive désactivée : les comptes, soldes et historiques IAMGOLD sont conservés.");
});
router.all("/admin/:resource{/:id}{/:action}",async(req,res,next)=>{
  const segment=String(req.params.resource),definition=resourceKinds[segment];if(!definition){next();return;}
  const {kind,key}=definition,id=req.params.id?int(req.params.id,2147483647):null,action=String(req.params.action??"");
  if(!id){
    if(req.method==="GET"){res.json({[key]:await resources(kind)});return;}
    if(req.method!=="POST")fail(405,"Méthode non autorisée.");
    const value=resourceInput(kind,req.body);
    const [r]=await db.transaction(async tx=>{
      await tx.execute(sql`select pg_advisory_xact_lock(17401337)`);
      if(kind==="product"||kind==="gift_code"){
        const existing=await tx.select().from(adminResourcesTable).where(eq(adminResourcesTable.kind,kind));
        if(existing.some(r=>r.value.code===value.code))fail(409,"Ce code existe déjà.");
      }
      if(kind==="product")await tx.insert(adminResourcesTable).values({kind:"catalog-configured",value:{configured:true}});
      const rows=await tx.insert(adminResourcesTable).values({kind,value}).returning();
      await audit(`create_${kind}`,{id:rows[0].id},tx);return rows;
    });
    res.status(201).json({ok:true,[kind==="gift_code"?"code":kind]:{...r.value,id:r.id}});return;
  }
  await db.transaction(async tx=>{
    await tx.execute(sql`select pg_advisory_xact_lock(17401337)`);
    const [r]=await tx.select().from(adminResourcesTable).where(and(eq(adminResourcesTable.id,id),eq(adminResourcesTable.kind,kind)));
    if(!r)fail(404,"Élément introuvable.");
    let value=r.value;
    if(req.method==="DELETE"&&kind==="product"&&action==="permanent"){
      const [g]=await tx.select().from(vipGrantsTable).where(eq(vipGrantsTable.productId,id)).limit(1);
      if(g)fail(409,"Produit déjà attribué. Désactivez-le pour conserver l’historique.");
      await tx.delete(adminResourcesTable).where(eq(adminResourcesTable.id,id));
    }else if(kind==="product"&&((req.method==="PATCH"&&action==="activate")||(req.method==="DELETE"&&!action))){
      value={...value,active:action==="activate"};
      await tx.update(adminResourcesTable).set({value,updatedAt:new Date()}).where(eq(adminResourcesTable.id,id));
    }else if(kind==="announcement"&&req.method==="POST"&&["publish","withdraw"].includes(action)){
      value={...value,status:action==="publish"?"published":"draft",publishedAt:action==="publish"?new Date().toISOString():null};
      await tx.update(adminResourcesTable).set({value,updatedAt:new Date()}).where(eq(adminResourcesTable.id,id));
    }else if(req.method==="PATCH"&&!action&&kind!=="gift_code"){
      if(kind==="announcement"&&value.status!=="draft")fail(409,"Retirez l’annonce avant de la modifier.");
      value=resourceInput(kind,req.body,value);
      if(kind==="product"){
        const existing=await tx.select().from(adminResourcesTable).where(eq(adminResourcesTable.kind,kind));
        if(existing.some(p=>p.id!==id&&p.value.code===value.code))fail(409,"Ce code existe déjà.");
      }
      await tx.update(adminResourcesTable).set({value,updatedAt:new Date()}).where(eq(adminResourcesTable.id,id));
    }else if(req.method==="DELETE"&&!action){
      if(kind==="gift_code")await tx.update(adminResourcesTable).set({value:{...value,active:false}}).where(eq(adminResourcesTable.id,id));
      else await tx.delete(adminResourcesTable).where(eq(adminResourcesTable.id,id));
    }else fail(405,"Action non autorisée.");
    await audit(`update_${kind}`,{id,action:action||req.method},tx);
  });
  res.json({ok:true});
});
export default router;
