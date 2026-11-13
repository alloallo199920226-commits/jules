import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/passwords.ts";

test("password hashes use independent salts and reject wrong passwords", async () => {
  const password = "Test-password-for-unit-tests";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
  assert.equal(await verifyPassword(password, "malformed-hash"), false);
});
