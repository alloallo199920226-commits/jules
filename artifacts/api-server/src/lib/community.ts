import { and, asc, count, eq, sql } from "drizzle-orm";
import { db, forumPostsTable, forumUploadsTable, accountsTable, forumLikesTable, forumViewsTable, forumCommentsTable } from "@workspace/db";
import { ObjectStorageService } from "./objectStorage";
import { fail } from "./administration";

export const communityStorage = new ObjectStorageService();
export async function validateImage(path: string, accountId: string, admin = false) {
  const [upload] = await db.select().from(forumUploadsTable).where(and(eq(forumUploadsTable.path, path),
    eq(forumUploadsTable.accountId, accountId), eq(forumUploadsTable.uploadedByAdmin, admin)));
  if (!upload) fail(403, "Cette image ne vous appartient pas.");
  try {
    const file = await communityStorage.getObjectEntityFile(path);
    const [meta] = await file.getMetadata();
    const [bytes] = await file.download({ start: 0, end: 15 });
    const type = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png" :
      bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "image/jpeg" :
      bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP" ? "image/webp" : null;
    if (!Number(meta.size) || Number(meta.size) > 5_242_880 || type !== upload.contentType) fail(400, "Image invalide ou supérieure à 5 Mo.");
  } catch (e) {
    if (e instanceof Error && e.name === "Error" && "status" in e) throw e;
    fail(400, "Le transfert de l’image n’est pas terminé.");
  }
  return upload;
}
export async function forumPost(postId: string, accountId: string) {
  const [row] = await db.select({ post: forumPostsTable, author: accountsTable }).from(forumPostsTable)
    .innerJoin(accountsTable, eq(accountsTable.id, forumPostsTable.accountId)).where(eq(forumPostsTable.id, postId));
  if (!row) fail(404, "Publication introuvable.");
  const [counters] = await db.select({
    views: sql<number>`(select count(*)::int from iamgold_forum_views where post_id=${postId}::uuid)`,
    likes: sql<number>`(select count(*)::int from iamgold_forum_likes where post_id=${postId}::uuid)`,
    liked: sql<boolean>`exists(select 1 from iamgold_forum_likes where post_id=${postId}::uuid and account_id=${accountId}::uuid)`,
    commentCount: sql<number>`(select count(*)::int from iamgold_forum_comments where post_id=${postId}::uuid)`,
  }).from(forumPostsTable).where(eq(forumPostsTable.id, postId));
  return { id: row.post.id, content: row.post.content, imagePath: row.post.imagePath, status: row.post.status,
    bonus: row.post.bonus, reviewNote: row.post.reviewNote, createdAt: row.post.createdAt.toISOString(),
    authorName: row.author.nickname, authorPhoneMasked: `${row.author.phone.slice(0,2)}***${row.author.phone.slice(-3)}`,
    mine: row.post.accountId === accountId, ...counters };
}
export async function approvedPost(postId: string) {
  const [p] = await db.select().from(forumPostsTable).where(eq(forumPostsTable.id, postId));
  if (!p || p.status !== "approved") fail(404, "Publication publique introuvable.");
  return p;
}
export async function comments(postId: string) {
  return db.select({ id: forumCommentsTable.id, body: forumCommentsTable.body,
    authorName: accountsTable.nickname, createdAt: forumCommentsTable.createdAt })
    .from(forumCommentsTable).innerJoin(accountsTable, eq(accountsTable.id, forumCommentsTable.accountId))
    .where(eq(forumCommentsTable.postId, postId)).orderBy(asc(forumCommentsTable.createdAt)).limit(500);
}
