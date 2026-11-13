import { Router, type Request, type Response } from "express";
import { and, count, desc, eq, sql, or } from "drizzle-orm";
import { db, accountsTable, forumPostsTable, forumUploadsTable, supportMessagesTable } from "@workspace/db";
import { CreateForumPostBody, RequestUploadUrlBody, GetMemberTeamQueryParams } from "@workspace/api-zod";
import { getSession, publicAccount } from "../lib/account-session";
import { withinLimit } from "../lib/account-rate-limits";
import { ObjectStorageService } from "../lib/objectStorage";
import { ensureInvitationCode } from "../lib/invitation-codes";
import { isAdmin } from "../lib/administration";
import { forumPost } from "../lib/community";

const router = Router();
const storage = new ObjectStorageService();
async function member(req: Request, res: Response) {
  const session = await getSession(req);
  if (!session) { res.status(401).json({ error: "Connectez-vous pour continuer.", code: "AUTH_REQUIRED" }); return null; }
  if (!session.account.transactionPasswordHash) {
    res.status(403).json({ error: "Définissez votre mot de passe de transaction.", code: "ONBOARDING_REQUIRED" }); return null;
  }
  return session.account;
}
const imageType = (bytes: Buffer) =>
  bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png" :
  bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "image/jpeg" :
  bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : null;

router.get("/member/overview", async (req, res) => {
  const account = await member(req, res); if (!account) return;
  const [invited] = await db.select({ total: count() }).from(accountsTable).where(eq(accountsTable.invitation, account.id));
  const invitationCode = await ensureInvitationCode(account.id);
  res.json({ user: publicAccount(account), invitationCode, referrals: invited.total,
    financialServicesAvailable: false, lotteryChances: 0 });
});

router.get("/member/team", async (req, res) => {
  const account = await member(req, res); if (!account) return;
  if ([req.query.level, req.query.page].some(value => value !== undefined && typeof value !== "string")) {
    res.status(400).json({ error: "Niveau ou page invalide." }); return;
  }
  const parsed = GetMemberTeamQueryParams.safeParse({
    level: req.query.level === undefined ? 1 : Number(req.query.level),
    page: req.query.page === undefined ? 1 : Number(req.query.page),
  });
  if (!parsed.success) { res.status(400).json({ error: "Niveau ou page invalide." }); return; }
  const { level = 1, page = 1 } = parsed.data;
  const offset = (page - 1) * 50;
  // Invitation ownership, not a caller-supplied account ID, determines the accessible tree.
  // Transaction-password setup is not proof of financial activation.
  const result = await db.execute(sql`
    WITH RECURSIVE team_tree AS (
      SELECT a.id, a.nickname, a.avatar_path, a.created_at, 1 AS depth,
        ARRAY[${account.id}::uuid, a.id] AS path
      FROM iamgold_accounts a
      WHERE a.invitation = ${account.id} AND a.id <> ${account.id}::uuid
      UNION ALL
      SELECT a.id, a.nickname, a.avatar_path, a.created_at, t.depth + 1, t.path || a.id
      FROM iamgold_accounts a JOIN team_tree t ON a.invitation = t.id::text
      WHERE t.depth < 3 AND NOT (a.id = ANY(t.path))
    ), page_members AS (
      SELECT * FROM team_tree WHERE depth = ${level}
      ORDER BY created_at DESC, id LIMIT 51 OFFSET ${offset}
    )
    SELECT jsonb_build_object(
      'levels', (SELECT jsonb_agg(jsonb_build_object(
        'level', l.level, 'total', (SELECT count(*) FROM team_tree t WHERE t.depth = l.level),
        'activated', NULL
      ) ORDER BY l.level) FROM generate_series(1, 3) AS l(level)),
      'members', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', m.id, 'nickname', m.nickname, 'avatarPath', m.avatar_path,
        'joinedAt', m.created_at, 'activated', NULL
      ) ORDER BY m.created_at DESC, m.id)
      FROM (SELECT * FROM page_members ORDER BY created_at DESC, id LIMIT 50) m), '[]'::jsonb),
      'level', ${level}::int, 'page', ${page}::int,
      'hasMore', (SELECT count(*) > 50 FROM page_members)
    ) AS team
  `);
  res.json(result.rows[0]?.team);
});

router.get("/forum/posts", async (req, res) => {
  const account = await member(req, res); if (!account) return;
  const posts = await db.select({ id: forumPostsTable.id }).from(forumPostsTable)
    .where(or(eq(forumPostsTable.status, "approved"), eq(forumPostsTable.accountId, account.id)))
    .orderBy(desc(forumPostsTable.createdAt)).limit(50);
  res.json(await Promise.all(posts.map(p => forumPost(p.id, account.id))));
});

router.post("/storage/uploads/request-url", async (req, res) => {
  const account = await member(req, res); if (!account) return;
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Choisissez une image JPEG, PNG ou WebP de 5 Mo maximum." }); return; }
  if (!await withinLimit(`upload:${account.id}`, 20, 3_600_000)) { res.status(429).json({ error: "Trop d’envois d’images. Réessayez plus tard." }); return; }
  const uploadURL = await storage.getObjectEntityUploadURL();
  const objectPath = storage.normalizeObjectEntityPath(uploadURL);
  await db.insert(forumUploadsTable).values({ path: objectPath, accountId: account.id, contentType: parsed.data.contentType });
  res.json({ uploadURL, objectPath });
});

router.post("/forum/posts", async (req, res) => {
  const account = await member(req, res); if (!account) return;
  const parsed = CreateForumPostBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.content.trim()) { res.status(400).json({ error: "Ajoutez un texte, une image et acceptez les conditions." }); return; }
  if (!await withinLimit(`post:${account.id}`, 10, 3_600_000)) { res.status(429).json({ error: "Trop de publications. Réessayez plus tard." }); return; }
  const input = parsed.data;
  const [privateUse] = await db.select({id:supportMessagesTable.id}).from(supportMessagesTable).where(eq(supportMessagesTable.imagePath,input.imagePath)).limit(1);
  if(privateUse){res.status(409).json({error:"Transférez une nouvelle image pour cette publication ; cette pièce jointe appartient à une conversation privée."});return;}
  const [upload] = await db.select().from(forumUploadsTable).where(and(
    eq(forumUploadsTable.path, input.imagePath), eq(forumUploadsTable.accountId, account.id),
    eq(forumUploadsTable.uploadedByAdmin, false)));
  if (!upload) { res.status(403).json({ error: "Cette image ne vous appartient pas." }); return; }
  try {
    const file = await storage.getObjectEntityFile(input.imagePath);
    const [metadata] = await file.getMetadata();
    const [signature] = await file.download({ start: 0, end: 15 });
    if (Number(metadata.size) > 5_242_880 || imageType(signature) !== upload.contentType) {
      res.status(400).json({ error: "Le fichier n’est pas une image prise en charge de 5 Mo maximum." }); return;
    }
  } catch { res.status(400).json({ error: "Le transfert de l’image n’est pas terminé. Réessayez." }); return; }
  const [post] = await db.insert(forumPostsTable).values({
    accountId: account.id, content: input.content.trim(), imagePath: input.imagePath,
  }).onConflictDoNothing().returning();
  if (!post) { res.status(409).json({ error: "Cette image a déjà été publiée." }); return; }
  res.status(201).json(await forumPost(post.id, account.id));
});

router.get("/storage/objects/*path", async (req, res) => {
  const admin = await isAdmin(req);
  const account = admin ? null : await member(req, res); if (!account && !admin) return;
  const raw = req.params.path;
  const path = `/objects/${Array.isArray(raw) ? raw.join("/") : raw}`;
  const [upload] = await db.select().from(forumUploadsTable).where(eq(forumUploadsTable.path, path));
  if (!upload) { res.status(404).end(); return; }
  const [post] = await db.select({ id: forumPostsTable.id }).from(forumPostsTable)
    .where(and(eq(forumPostsTable.imagePath, path), eq(forumPostsTable.status, "approved")));
  if (!admin && upload.accountId !== account?.id && !post) { res.status(403).end(); return; }
  try {
    const file = await storage.getObjectEntityFile(path);
    res.set({ "Content-Type": upload.contentType, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" });
    file.createReadStream().on("error", () => res.destroy()).pipe(res);
  } catch { res.status(404).end(); }
});

router.get("/storage/public-objects/*filePath", async (req, res) => {
  const raw = req.params.filePath;
  const path = Array.isArray(raw) ? raw.join("/") : raw;
  if (path.includes("..")) { res.status(400).end(); return; }
  const file = await storage.searchPublicObject(path);
  if (!file) { res.status(404).end(); return; }
  const [metadata] = await file.getMetadata();
  res.set({ "Content-Type": metadata.contentType || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
  file.createReadStream().on("error", () => res.destroy()).pipe(res);
});
export default router;
