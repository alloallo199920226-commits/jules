import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, accountsTable, forumPostsTable, forumUploadsTable } from "@workspace/db";
import { credit, wallet, DomainError } from "../src/lib/administration";
import { resourceInput } from "../src/lib/admin-resources";

test("portefeuille : tous les gains crédités alimentent le solde sans rendre le cumul historique retirable une seconde fois", async () => {
  const rollback = new Error("TEST_WALLET_TOTALS_ROLLBACK");
  try {
    await db.transaction(async tx => {
      const [account] = await tx.insert(accountsTable).values({
        country: "BJ", phone: `test${randomUUID().replaceAll("-", "").slice(0, 12)}`,
        nickname: "Wallet-totals-test", passwordHash: "test-only-not-a-valid-password-hash",
      }).returning();
      assert.deepEqual(await wallet(account.id, tx), { balance: 0, credits: 0 });
      // Test recorded entries only; this does not simulate automatic award engines.
      const sources = [
        ["referral_bonus", 500], ["wheel_reward", 1000], ["mission_bonus", 1500],
        ["task_bonus", 200], ["product_income", 400], ["forum_bonus", 300],
      ] as const;
      let total = 0;
      for (const [type, amount] of sources) {
        const input = { accountId: account.id, amount, type, requestId: randomUUID() };
        await credit(tx, input);
        await credit(tx, input);
        total += amount;
        assert.deepEqual(await wallet(account.id, tx), { balance: total, credits: total });
      }
      await credit(tx, { accountId: account.id, amount: -1000, type: "withdrawal", requestId: randomUUID() });
      await credit(tx, { accountId: account.id, amount: -400, type: "purchase", requestId: randomUUID() });
      assert.deepEqual(await wallet(account.id, tx), { balance: total - 1400, credits: total });
      await assert.rejects(credit(tx, {
        accountId: account.id, amount: -total, type: "withdrawal", requestId: randomUUID(),
      }), DomainError);
      assert.deepEqual(await wallet(account.id, tx), { balance: total - 1400, credits: total });
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
});

test("catalogue : trois catégories et conservation des champs lors des modifications partielles", () => {
  for (const category of ["stable", "wellbeing", "activity"]) {
    const product=resourceInput("product",{name:"Lot de test",price:2000,dailyIncome:400,totalIncome:40000,durationDays:100,category});
    assert.equal(product.category,category);
    const updated=resourceInput("product",{name:"Lot modifié"},product);
    assert.equal(updated.category,category);
    assert.equal(updated.price,2000);
  }
  assert.throws(()=>resourceInput("product",{name:"Invalide",price:1,dailyIncome:10,totalIncome:500,durationDays:1}),DomainError);
  const channel=resourceInput("channel",{country:"Bénin",countryCode:"+229",operatorName:"Test",receiverNumber:"0199999999"});
  assert.equal(resourceInput("channel",{isActive:false},channel).isActive,false);
});

test("portefeuille : crédits exacts, idempotence, débit contrôlé et conservation d’un bonus après suppression", async () => {
  const rollback=new Error("TEST_ROLLBACK");
  try {
    await db.transaction(async tx=>{
      const [account]=await tx.insert(accountsTable).values({country:"BJ",phone:`test${randomUUID().replaceAll("-","").slice(0,12)}`,
        nickname:"Administration-test-rollback",passwordHash:"test-only-not-a-valid-password-hash"}).returning();
      const path=`/objects/uploads/${randomUUID()}`;
      await tx.insert(forumUploadsTable).values({path,accountId:account.id,contentType:"image/png"});
      const [post]=await tx.insert(forumPostsTable).values({accountId:account.id,content:"Fixture",imagePath:path}).returning();
      const requestId=randomUUID();
      const first=await credit(tx,{accountId:account.id,amount:1234567,type:"forum_bonus",postId:post.id,requestId});
      assert.equal(first.duplicate,false);
      const repeated=await credit(tx,{accountId:account.id,amount:1234567,type:"forum_bonus",postId:post.id,requestId});
      assert.equal(repeated.duplicate,true);
      assert.equal((await wallet(account.id,tx)).balance,1234567);
      await assert.rejects(credit(tx,{accountId:account.id,amount:1,type:"forum_bonus",postId:post.id,requestId}),DomainError);
      await credit(tx,{accountId:account.id,amount:500,type:"admin_credit",requestId:randomUUID()});
      await credit(tx,{accountId:account.id,amount:-67,type:"admin_debit",requestId:randomUUID()});
      assert.deepEqual(await wallet(account.id,tx),{balance:1235000,credits:1235067});
      await assert.rejects(credit(tx,{accountId:account.id,amount:-2000000,type:"admin_debit",requestId:randomUUID()}),DomainError);
      const { eq }=await import("drizzle-orm");
      await tx.delete(forumPostsTable).where(eq(forumPostsTable.id,post.id));
      assert.equal((await wallet(account.id,tx)).balance,1235000);
      throw rollback;
    });
  } catch(e) { if(e!==rollback)throw e; }
});
