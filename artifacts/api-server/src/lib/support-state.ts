import { and,eq,sql } from "drizzle-orm";
import { db,adminResourcesTable } from "@workspace/db";
type DbTransaction=Parameters<Parameters<typeof db.transaction>[0]>[0];

export const supportStateKind="support-conversation";
export type ConversationStatus="in_progress"|"resolved";

/** Existing operator metadata storage, so no database migration is needed. */
export async function setConversationStatus(
  accountId: string,status: ConversationStatus,transaction?: DbTransaction,
): Promise<{status:ConversationStatus}> {
  const save=async(tx:DbTransaction)=>{
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"support-status:"+accountId},0))`);
    const [existing]=await tx.select().from(adminResourcesTable).where(and(
      eq(adminResourcesTable.kind,supportStateKind),
      sql`${adminResourcesTable.value}->>'accountId'=${accountId}`,
    )).limit(1);
    if(existing)await tx.update(adminResourcesTable).set({
      value:{...existing.value,accountId,status},updatedAt:new Date(),
    }).where(eq(adminResourcesTable.id,existing.id));
    else await tx.insert(adminResourcesTable).values({kind:supportStateKind,value:{accountId,status}});
    return {status};
  };
  return transaction?save(transaction):db.transaction(save);
}
