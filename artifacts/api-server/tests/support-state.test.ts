import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and,eq,sql } from "drizzle-orm";
import { db,adminResourcesTable } from "@workspace/db";
import { setConversationStatus,supportStateKind } from "../src/lib/support-state";

test("l’état de traitement persiste, reste isolé et ne crée pas de doublon concurrent",async()=>{
  const accountId=randomUUID(),otherId=randomUUID();
  const scoped=sql`${adminResourcesTable.value}->>'accountId' in (${accountId},${otherId})`;
  try{
    await setConversationStatus(accountId,"in_progress");
    await setConversationStatus(otherId,"resolved");
    await setConversationStatus(accountId,"resolved");
    let rows=await db.select().from(adminResourcesTable).where(and(eq(adminResourcesTable.kind,supportStateKind),scoped));
    assert.equal(rows.length,2);
    assert.equal(rows.find(row=>row.value.accountId===accountId)?.value.status,"resolved");
    await Promise.all(Array.from({length:4},()=>setConversationStatus(accountId,"in_progress")));
    rows=await db.select().from(adminResourcesTable).where(and(eq(adminResourcesTable.kind,supportStateKind),scoped));
    assert.equal(rows.length,2);
    assert.equal(rows.find(row=>row.value.accountId===accountId)?.value.status,"in_progress");
    assert.equal(rows.find(row=>row.value.accountId===otherId)?.value.status,"resolved");
  }finally{
    await db.delete(adminResourcesTable).where(and(eq(adminResourcesTable.kind,supportStateKind),scoped));
  }
});
