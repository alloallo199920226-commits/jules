import { db, rateLimitsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { sha256 } from "./account-session";

export async function withinLimit(key: string, maximum: number, windowMs: number) {
  const now = new Date();
  const resetsAt = new Date(now.getTime() + windowMs);
  const [row] = await db.insert(rateLimitsTable).values({ key: sha256(key), attempts: 1, resetsAt })
    .onConflictDoUpdate({
      target: rateLimitsTable.key,
      set: {
        attempts: sql`CASE WHEN ${rateLimitsTable.resetsAt} <= ${now} THEN 1 ELSE ${rateLimitsTable.attempts} + 1 END`,
        resetsAt: sql`CASE WHEN ${rateLimitsTable.resetsAt} <= ${now} THEN ${resetsAt} ELSE ${rateLimitsTable.resetsAt} END`,
      },
    }).returning();
  return row.attempts <= maximum;
}
