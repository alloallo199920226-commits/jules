import test from "node:test";
import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";

const base = process.env.TEST_API_URL ?? "http://127.0.0.1:8080/api";
function browser() {
  let cookie = "";
  return async (path, method = "GET", data) => {
    const response = await fetch(base + path, {
      method, headers: { ...(data ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    for (const value of response.headers.getSetCookie()) cookie = value.split(";")[0];
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  };
}

test("profile persists; password changes verify the old secret, isolate OTP purpose and rotate sessions", async () => {
  const api = browser(), other = browser(), guest = browser();
  const country = "BJ", phone = `99${randomInt(10000000,99999999)}`;
  const nickname = `settings-api-${randomUUID().slice(0,8)}`;
  const password = `Login-${randomUUID()}`, transactionPassword = `Transaction-${randomUUID()}`;
  const nextPassword = `NewLogin-${randomUUID()}`, nextTransaction = `NewTransaction-${randomUUID()}`;
  const code = await api("/internal-codes","POST",{country,phone});
  const created = await api("/auth/register","POST",{ country,phone,nickname,password,challengeId:code.body.challengeId,code:code.body.code });
  assert.equal(created.status,201);
  await writeFile("/tmp/iamgold-settings-api-test.json",JSON.stringify({id:created.body.user.id}));
  assert.equal((await guest("/member/profile","PUT",{nickname})).status,401);
  assert.equal((await api("/member/profile","PUT",{nickname})).status,403);
  assert.equal((await api("/member/password","POST",{oldPassword:password,newPassword:nextPassword})).status,403);
  assert.equal((await api("/internal-codes","POST",{country,phone,purpose:"transaction-change"})).status,409);
  const setupCode = await api("/internal-codes","POST",{country,phone,purpose:"transaction"});
  assert.equal((await api("/onboarding/transaction-password","POST",{
    password:transactionPassword,challengeId:setupCode.body.challengeId,code:setupCode.body.code,
  })).status,200);
  const changedProfile = await api("/member/profile","PUT",{nickname:`${nickname}-updated`,email:"test@example.invalid",avatarPath:null});
  assert.equal(changedProfile.status,200);
  const persisted = await api("/member/overview");
  assert.equal(persisted.body.user.nickname,`${nickname}-updated`);
  assert.equal(persisted.body.user.email,"test@example.invalid");
  assert.equal(persisted.body.user.phone,phone);
  assert.equal(persisted.body.user.phoneVerified,false);
  assert.equal((await api("/member/profile","PUT",{nickname,email:"invalid"})).status,400);
  assert.equal((await api("/member/profile","PUT",{nickname:"   "})).status,400);
  assert.equal((await api("/member/profile","PUT",{nickname,avatarPath:`/objects/uploads/${randomUUID()}`})).status,403);
  assert.equal((await other("/auth/login","POST",{country,phone,password})).status,200);
  const foreignChallenge = await other("/internal-codes","POST",{country,phone,purpose:"transaction-change"});
  assert.equal(foreignChallenge.status,200);
  const foreign = await api("/member/transaction-password","POST",{
    oldPassword:transactionPassword,newPassword:nextTransaction,challengeId:foreignChallenge.body.challengeId,code:foreignChallenge.body.code,
  });
  assert.notEqual(foreign.status,200);
  assert.equal((await api("/member/password","POST",{oldPassword:"incorrect",newPassword:nextPassword})).status,400);
  assert.equal((await api("/member/password","POST",{oldPassword:password,newPassword:transactionPassword})).status,400);
  assert.equal((await api("/member/password","POST",{oldPassword:password,newPassword:password})).status,400);
  assert.equal((await api("/member/password","POST",{oldPassword:password,newPassword:nextPassword})).status,200);
  assert.equal((await other("/auth/me")).body.user,null);
  assert.equal((await guest("/auth/login","POST",{country,phone,password})).status,401);
  assert.equal((await guest("/auth/login","POST",{country,phone,password:nextPassword})).status,200);
  const registration = await api("/internal-codes","POST",{country,phone});
  assert.notEqual((await api("/member/transaction-password","POST",{
    oldPassword:transactionPassword,newPassword:nextTransaction,challengeId:registration.body.challengeId,code:registration.body.code,
  })).status,200);
  const issued = await api("/internal-codes","POST",{country,phone,purpose:"transaction-change"});
  assert.equal(issued.status,200); assert.equal(issued.body.expiresIn,60);
  const change = {oldPassword:transactionPassword,newPassword:nextTransaction,challengeId:issued.body.challengeId,code:issued.body.code};
  assert.equal((await api("/member/transaction-password","POST",{...change,oldPassword:"incorrect"})).status,400);
  assert.equal((await api("/member/transaction-password","POST",{...change,newPassword:nextPassword})).status,400);
  assert.equal((await api("/member/transaction-password","POST",{
    ...change,code:issued.body.code === "000000" ? "111111" : "000000",
  })).status,400);
  assert.equal((await api("/member/transaction-password","POST",change)).status,200);
  assert.equal((await guest("/auth/me")).body.user,null);
  assert.notEqual((await api("/member/transaction-password","POST",{
    ...change,oldPassword:nextTransaction,newPassword:transactionPassword,
  })).status,200);
  assert.equal((await api("/member/overview")).body.user.id,created.body.user.id);
  assert.equal((await api("/auth/logout","POST",{})).status,204);
});
