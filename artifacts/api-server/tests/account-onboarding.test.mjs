import test from "node:test";
import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";

const base = process.env.TEST_API_URL ?? "http://127.0.0.1:8080/api";
function browser() {
  let cookie = "";
  return async (path, method = "GET", data, extra = {}) => {
    const response = await fetch(base + path, {
      method, headers: { ...(data ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...extra },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    for (const value of response.headers.getSetCookie()) cookie = value.split(";")[0];
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null, response };
  };
}

test("real account creation, mandatory transaction setup, persistence and login", async () => {
  const api = browser();
  const guest = browser();
  const country = "BJ";
  const phone = `99${randomInt(10_000_000, 99_999_999)}`;
  const nickname = `onboarding-test-${randomUUID().slice(0, 8)}`;
  const password = `Test-login-${randomUUID()}`;
  const transactionPassword = `Test-transaction-${randomUUID()}`;
  assert.equal((await guest("/dashboard")).status, 401);
  assert.equal((await guest("/internal-codes", "POST", { country, phone, purpose: "transaction" })).status, 401);
  assert.equal((await api("/auth/me")).body.user, null);

  const issue = await api("/internal-codes", "POST", { country, phone });
  assert.equal(issue.status, 200);
  assert.match(issue.body.code, /^\d{6}$/);
  assert.equal(issue.body.expiresIn, 120);
  const registration = { country, phone, nickname, password, invitation: "", challengeId: issue.body.challengeId, code: issue.body.code };
  const created = await api("/auth/register", "POST", registration);
  assert.equal(created.status, 201);
  await writeFile("/tmp/iamgold-onboarding-api-test.json", JSON.stringify({ id: created.body.user.id }));
  assert.equal(created.body.user.nickname, nickname);
  assert.equal(created.body.user.transactionPasswordSet, false);
  assert.equal(created.body.user.phoneVerified, false);
  assert.ok(!JSON.stringify(created.body).includes(password));
  assert.ok(!("passwordHash" in created.body.user));
  const cookies = created.response.headers.getSetCookie().join(";");
  assert.match(cookies, /HttpOnly/i);
  assert.match(cookies, /Secure/i);
  assert.match(cookies, /SameSite=None/i);

  assert.equal((await api("/auth/me")).body.user.id, created.body.user.id);
  assert.equal((await api("/dashboard")).status, 403);
  assert.equal((await api("/dashboard")).body.code, "ONBOARDING_REQUIRED");
  assert.equal((await api("/auth/register", "POST", registration)).status, 409);
  assert.equal((await guest("/auth/register", "POST", { ...registration, phone: `98${phone.slice(2)}` })).status, 410);

  assert.equal((await api("/auth/logout", "POST", {})).status, 204);
  assert.equal((await api("/dashboard")).status, 401);
  assert.equal((await api("/auth/login", "POST", { country, phone, password: "incorrect" })).status, 401);
  const resumed = await api("/auth/login", "POST", { country, phone, password });
  assert.equal(resumed.status, 200);
  assert.equal(resumed.body.user.transactionPasswordSet, false);
  assert.equal((await api("/dashboard")).status, 403);

  assert.equal((await api("/internal-codes", "POST", { country, phone: `97${phone.slice(2)}`, purpose: "transaction" })).status, 400);
  const txCode = await api("/internal-codes", "POST", { country, phone, purpose: "transaction" });
  assert.equal(txCode.status, 200);
  assert.equal(txCode.body.expiresIn, 60);
  const setup = { password: transactionPassword, challengeId: txCode.body.challengeId, code: txCode.body.code };
  assert.equal((await guest("/onboarding/transaction-password", "POST", setup)).status, 401);
  assert.equal((await api("/onboarding/transaction-password", "POST", { ...setup, password })).status, 400);
  const wrongCode = txCode.body.code === "000000" ? "111111" : "000000";
  assert.equal((await api("/onboarding/transaction-password", "POST", { ...setup, code: wrongCode })).status, 400);
  assert.equal((await api("/dashboard")).status, 403);
  const complete = await api("/onboarding/transaction-password", "POST", setup);
  assert.equal(complete.status, 200);
  assert.equal(complete.body.user.transactionPasswordSet, true);
  assert.equal((await api("/dashboard")).status, 200);
  assert.equal((await api("/auth/me")).body.user.transactionPasswordSet, true);
  assert.equal((await api("/onboarding/transaction-password", "POST", setup)).status, 409);

  await api("/auth/logout", "POST", {});
  const login = await api("/auth/login", "POST", { country, phone, password });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.transactionPasswordSet, true);
  assert.equal((await api("/dashboard")).body.user.id, created.body.user.id);
  await api("/auth/logout", "POST", {});
  assert.equal((await api("/dashboard")).status, 401);

  assert.equal((await guest("/auth/login", "POST", { country, phone, password }, { "sec-fetch-site": "cross-site" })).status, 403);
});
