import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import { inspect } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { createHttpClient, createHttpClientFromEnv, HttpClientError } from "../src/lib/http-client.ts";

const baseUrl = "https://trusted.example.invalid/v1/";
const json = value => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });
const errorCode = (code, status) => error => {
  assert.ok(error instanceof HttpClientError);
  assert.equal(error.code, code);
  assert.equal(error.status, status);
  assert.equal(error.cause, undefined);
  return true;
};

function streamResponse(chunks, headers = {}, onCancel = () => {}) {
  return new Response(new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
    cancel: onCancel,
  }), { headers });
}

test("import is inert: no fetch, no environment reads, no timers", async t => {
  let fetchCalls = 0, timerCalls = 0;
  t.mock.method(globalThis, "fetch", () => { fetchCalls++; throw Error("No network allowed"); });
  t.mock.method(globalThis, "setTimeout", () => { timerCalls++; throw Error("No import timers"); });
  // Separate module instance; missing configuration does not prevent import.
  await import("../src/lib/http-client.ts?isolated-import-test");
  assert.equal(fetchCalls, 0);
  assert.equal(timerCalls, 0);
});

test("GET encodes query, retains the base directory and uses secure transport options", async () => {
  let calls = 0;
  const client = createHttpClient({ baseUrl: baseUrl.slice(0, -1) }, async (url, init) => {
    calls++;
    assert.equal(url.href, `${baseUrl}items?text=a+%26+b&tag=x&tag=y&active=false&page=2`);
    assert.equal(init.method, "GET");
    assert.equal(init.body, undefined);
    assert.equal(init.headers.get("accept"), "application/json");
    assert.equal(init.headers.has("authorization"), false);
    assert.equal(init.redirect, "manual");
    assert.equal(init.credentials, "omit");
    assert.ok(init.signal instanceof AbortSignal);
    return json({ ok: true });
  });
  assert.deepEqual(await client.get("items", {
    query: { text: "a & b", tag: ["x", "y"], active: false, page: 2, omitted: undefined },
  }), { status: 200, data: { ok: true } });
  assert.equal(calls, 1);
});

test("POST serializes JSON, controls headers and keeps token configuration private", async () => {
  const config = { baseUrl, token: "synthetic-token-only", allowedRequestHeaders: ["X-Request-Id"] };
  let calls = 0;
  const client = createHttpClient(config, async (_, init) => {
    calls++;
    assert.equal(init.method, "POST");
    assert.equal(init.body, '{"name":"Fictif","count":2}');
    assert.equal(init.headers.get("content-type"), "application/json");
    assert.equal(init.headers.get("authorization"), "Bearer synthetic-token-only");
    assert.equal(init.headers.get("x-request-id"), "fake-request");
    return json({ created: true });
  });
  config.token = "changed-after-instantiation";
  assert.deepEqual(await client.post("items", { name: "Fictif", count: 2 }, {
    headers: { "X-Request-Id": "fake-request" },
  }), { status: 200, data: { created: true } });
  assert.equal(calls, 1);
  for (const headers of [
    { authorization: "other" }, { host: "evil.invalid" }, { cookie: "private" },
    { "content-type": "text/plain" }, { "x-unknown": "value" }, { "X-Request-Id": "a\r\nb" },
  ]) await assert.rejects(client.get("items", { headers }), errorCode("CONFIGURATION"));
  assert.equal(calls, 1);
});

test("HTTP errors preserve only useful status and cancel unread response bodies", async () => {
  for (const status of [301, 302, 307, 308, 400, 401, 429, 503]) {
    let cancelled = 0;
    const response = new Response(new ReadableStream({
      cancel() { cancelled++; },
    }), { status, headers: { location: "https://other.invalid/private?secret=fake" } });
    const client = createHttpClient({ baseUrl }, async () => response);
    await assert.rejects(client.get("items"), errorCode("HTTP_STATUS", status));
    assert.equal(cancelled, 1);
  }
});

test("network failures are sanitized and POST is never retried", async () => {
  for (const mode of ["reject", "throw", "http"]) {
    let calls = 0;
    const client = createHttpClient({ baseUrl }, () => {
      calls++;
      if (mode === "http") return Promise.resolve(new Response("private", { status: 503 }));
      if (mode === "throw") throw Error("private transport error");
      return Promise.reject(Error("private transport error"));
    });
    await assert.rejects(client.post("items", { private: "payload" }),
      errorCode(mode === "http" ? "HTTP_STATUS" : "NETWORK", mode === "http" ? 503 : undefined));
    assert.equal(calls, 1);
  }
});

test("timeout covers pending headers even when the injected fetch ignores abort", async () => {
  let signal, calls = 0;
  const client = createHttpClient({ baseUrl, timeoutMs: 15 }, async (_, init) => {
    calls++; signal = init.signal;
    return new Promise(() => {});
  });
  await assert.rejects(client.post("items", {}), errorCode("TIMEOUT"));
  assert.equal(signal.aborted, true);
  assert.equal(calls, 1);
});

test("timeout covers a stalled body and releases the reader", async () => {
  let cancelled = 0;
  const response = new Response(new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('{"partial":')); },
    cancel() { cancelled++; },
  }));
  const client = createHttpClient({ baseUrl, timeoutMs: 15 }, async () => response);
  await assert.rejects(client.get("items"), errorCode("TIMEOUT"));
  assert.equal(cancelled, 1);
  assert.equal(response.body.locked, false);
});

test("the default deadline is 10 seconds and timers/listeners are cleaned on every exit", async t => {
  const originalSet = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  const active = new Set(), durations = [];
  t.mock.method(globalThis, "setTimeout", (fn, ms, ...args) => {
    durations.push(ms);
    const handle = originalSet(fn, ms, ...args);
    active.add(handle);
    return handle;
  });
  t.mock.method(globalThis, "clearTimeout", handle => {
    active.delete(handle);
    return originalClear(handle);
  });
  for (const outcome of ["success", "http", "network", "json", "validation", "size", "timeout", "cancelled"]) {
    const caller = new AbortController();
    let transportSignal;
    const client = createHttpClient({
      baseUrl, ...(outcome === "timeout" ? { timeoutMs: 5 } : {}), maxResponseBytes: 20,
    }, async (_, init) => {
      transportSignal = init.signal;
      if (outcome === "cancelled") caller.abort(Error("sensitive reason"));
      if (outcome === "timeout" || outcome === "cancelled") return new Promise(() => {});
      if (outcome === "network") throw Error("private");
      if (outcome === "http") return new Response("private", { status: 500 });
      if (outcome === "json") return new Response("{");
      if (outcome === "size") return new Response("x".repeat(21));
      return json({ ok: true });
    });
    const result = client.get("items", {
      signal: caller.signal,
      ...(outcome === "validation" ? { validate() { throw Error("private"); } } : {}),
    });
    if (outcome === "success") await result;
    else await assert.rejects(result, HttpClientError);
    assert.equal(active.size, 0, outcome);
    assert.equal(getEventListeners(caller.signal, "abort").length, 0, outcome);
    assert.equal(transportSignal.aborted, true, outcome);
  }
  assert.deepEqual(durations, [10_000, 10_000, 10_000, 10_000, 10_000, 10_000, 5, 10_000]);
});

test("caller cancellation works before fetch, during headers and during body", async () => {
  for (const phase of ["before", "headers", "body"]) {
    const caller = new AbortController();
    let calls = 0, response;
    if (phase === "before") caller.abort(Error("private reason"));
    const client = createHttpClient({ baseUrl }, async () => {
      calls++;
      if (phase === "headers") { caller.abort(); return new Promise(() => {}); }
      response = new Response(new ReadableStream({
        pull() { caller.abort(Error("private reason")); },
      }));
      return response;
    });
    await assert.rejects(client.get("items", { signal: caller.signal }), errorCode("CANCELLED"));
    assert.equal(calls, phase === "before" ? 0 : 1);
    assert.equal(getEventListeners(caller.signal, "abort").length, 0);
    if (response) assert.equal(response.body.locked, false);
  }
});

test("late response after timeout is discarded without an unhandled rejection", async () => {
  let resolveFetch, cancelled = 0;
  const client = createHttpClient({ baseUrl, timeoutMs: 5 }, () => new Promise(resolve => { resolveFetch = resolve; }));
  await assert.rejects(client.get("items"), errorCode("TIMEOUT"));
  resolveFetch(new Response(new ReadableStream({ cancel() { cancelled++; } })));
  await delay(0);
  assert.equal(cancelled, 1);
});

test("invalid JSON, invalid UTF-8, runtime validation and empty responses", async () => {
  for (const response of [new Response("{private"), new Response(new Uint8Array([0xff]))]) {
    await assert.rejects(createHttpClient({ baseUrl }, async () => response).get("items"),
      errorCode("INVALID_JSON", 200));
  }
  for (const response of [new Response(null, { status: 204 }), new Response(""), new Response(null)]) {
    let validated = false;
    const result = await createHttpClient({ baseUrl }, async () => response).get("items", {
      validate() { validated = true; throw Error("must not run"); },
    });
    assert.equal(result.data, undefined);
    assert.equal(validated, false);
  }
  await assert.rejects(createHttpClient({ baseUrl }, async () => json({ ok: false })).get("items", {
    validate() { throw Error("private validator data"); },
  }), errorCode("INVALID_RESPONSE", 200));
  const result = await createHttpClient({ baseUrl }, async () => json({ count: 2 })).get("items", {
    validate(value) { assert.equal(typeof value.count, "number"); return value.count; },
  });
  assert.equal(result.data, 2);
  assert.equal((await createHttpClient({ baseUrl }, async () => json(null)).get("items")).data, null);
});

test("streaming byte limit works with absent, false and oversized Content-Length", async () => {
  for (const headers of [{}, { "content-length": "1" }, { "content-length": "garbage" }]) {
    const response = streamResponse(['"é', 'é', 'é"'], headers);
    await assert.rejects(createHttpClient({ baseUrl, maxResponseBytes: 6 }, async () => response).get("items"),
      errorCode("RESPONSE_TOO_LARGE", 200));
    assert.equal(response.body.locked, false);
  }
  let cancelled = 0;
  const response = new Response(new ReadableStream({ cancel() { cancelled++; } }), {
    headers: { "content-length": "999999999999999999999" },
  });
  await assert.rejects(createHttpClient({ baseUrl }, async () => response).get("items"),
    errorCode("RESPONSE_TOO_LARGE", 200));
  assert.equal(cancelled, 1);
  assert.equal((await createHttpClient({ baseUrl, maxResponseBytes: 4 },
    async () => streamResponse(['"é"'])).get("items")).data, "é");
  await assert.rejects(createHttpClient({ baseUrl }, async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(1_048_577)); },
  }))).get("items"), errorCode("RESPONSE_TOO_LARGE", 200));
});

test("body transport errors are safe and cancel/release the stream", async () => {
  const response = new Response(new ReadableStream({
    start(controller) { controller.error(Error("private body failure")); },
  }));
  await assert.rejects(createHttpClient({ baseUrl }, async () => response).get("items"), errorCode("NETWORK"));
  assert.equal(response.body.locked, false);
});

test("invalid configuration fails only at instantiation", () => {
  for (const value of ["", "http://trusted.invalid", "ftp://trusted.invalid", "/relative", "//trusted.invalid",
    "https://user:pass@trusted.invalid", "https://trusted.invalid?secret=x", "https://trusted.invalid/#x",
    " https://trusted.invalid", "https://trusted.invalid\\escape"]) {
    assert.throws(() => createHttpClient({ baseUrl: value }), errorCode("CONFIGURATION"));
  }
  for (const timeoutMs of [0, -1, 1.1, NaN, Infinity, 120_001]) {
    assert.throws(() => createHttpClient({ baseUrl, timeoutMs }), errorCode("CONFIGURATION"));
  }
  for (const maxResponseBytes of [0, -1, 0.5, NaN, 16_777_217]) {
    assert.throws(() => createHttpClient({ baseUrl, maxResponseBytes }), errorCode("CONFIGURATION"));
  }
  for (const token of ["", "token\r\nunsafe", "has space"]) {
    assert.throws(() => createHttpClient({ baseUrl, token }), errorCode("CONFIGURATION"));
  }
  for (const name of ["Authorization", "Host", "Cookie", "Content-Length", "Sec-Fetch-Site", "bad header"]) {
    assert.throws(() => createHttpClient({ baseUrl, allowedRequestHeaders: [name] }), errorCode("CONFIGURATION"));
  }
});

test("only relative paths inside the configured base are accepted; no redirects followed", async () => {
  let calls = 0;
  const client = createHttpClient({ baseUrl }, async () => { calls++; return json({}); });
  for (const path of [
    "https://evil.invalid", "http://trusted.example.invalid", "//evil.invalid", "/outside", "../outside",
    "a/../../outside", "%2e%2e/outside", "a/%2e%2e/outside", "\\\\evil.invalid", "%2f%2fevil.invalid",
    "https:%2f%2fevil.invalid", "a\\..\\outside", "%252e%252e/outside", "items?token=secret", "items#fragment",
    "\nhttps://evil.invalid", "https://user:pass@evil.invalid", "%",
  ]) await assert.rejects(client.get(path), errorCode("CONFIGURATION"));
  await assert.rejects(client.get("items", { query: { bad: NaN } }), errorCode("CONFIGURATION"));
  assert.equal(calls, 0);
  const response = json({});
  Object.defineProperty(response, "redirected", { value: true });
  await assert.rejects(createHttpClient({ baseUrl }, async () => response).get("items"), errorCode("HTTP_STATUS", 200));
});

test("environment factory reads only its three explicit keys, with no process mutation", async () => {
  const reads = [];
  const env = new Proxy({
    EXTERNAL_API_BASE_URL: baseUrl, EXTERNAL_API_TIMEOUT_MS: "42", EXTERNAL_API_TOKEN: "synthetic-only",
  }, { get(target, key) { reads.push(key); return target[key]; } });
  const client = createHttpClientFromEnv(env, async (_, init) => {
    assert.equal(init.headers.get("authorization"), "Bearer synthetic-only");
    return json({});
  });
  await client.get("items");
  assert.deepEqual(reads.sort(), ["EXTERNAL_API_BASE_URL", "EXTERNAL_API_TIMEOUT_MS", "EXTERNAL_API_TOKEN"].sort());
  assert.throws(() => createHttpClientFromEnv({}), errorCode("CONFIGURATION"));
  for (const value of ["", " ", "1.5", "1e3", "-2", "0", "120001", "Infinity"]) {
    assert.throws(() => createHttpClientFromEnv({
      EXTERNAL_API_BASE_URL: baseUrl, EXTERNAL_API_TIMEOUT_MS: value,
    }), errorCode("CONFIGURATION"));
  }
});

test("errors do not leak URL, query, headers, payload, body, token or raw cause", async () => {
  const secrets = ["SYNTHETIC_TOKEN", "SYNTHETIC_PAYLOAD", "SYNTHETIC_QUERY", "SYNTHETIC_BODY",
    "SYNTHETIC_HEADER", "SYNTHETIC_CAUSE", "trusted.example.invalid"];
  for (const outcome of ["network", "http", "json", "validation", "cancelled", "configuration"]) {
    const caller = new AbortController();
    const client = createHttpClient({ baseUrl, token: secrets[0], allowedRequestHeaders: ["x-test"] }, async () => {
      if (outcome === "network") throw Error(secrets.join(" "));
      if (outcome === "http") return new Response(secrets[3], {
        status: 401, statusText: secrets[4], headers: { "x-private": secrets[4] },
      });
      if (outcome === "json") return new Response(secrets[3]);
      if (outcome === "cancelled") { caller.abort(Error(secrets[5])); return new Promise(() => {}); }
      return json({ private: secrets[3] });
    });
    await assert.rejects(client.post(outcome === "configuration" ? `https://${secrets[0]}@evil.invalid` : "items",
      { private: secrets[1] }, {
        query: { token: secrets[2] }, headers: { "x-test": secrets[4] }, signal: caller.signal,
        validate() { throw Error(secrets.join(" ")); },
      }), error => {
      assert.ok(error instanceof HttpClientError);
      for (const rendering of [String(error), JSON.stringify(error), inspect(error), JSON.stringify({ ...error })]) {
        for (const secret of secrets) assert.ok(!rendering.includes(secret), `${outcome} leaked ${secret}`);
      }
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test("even a transport throwing an enriched client error cannot inject sensitive fields", async () => {
  const unsafe = new HttpClientError("NETWORK");
  unsafe.message = "SYNTHETIC_SENSITIVE_MESSAGE";
  unsafe.cause = Error("SYNTHETIC_SENSITIVE_CAUSE");
  unsafe.private = "SYNTHETIC_SENSITIVE_FIELD";
  const client = createHttpClient({ baseUrl }, async () => { throw unsafe; });
  await assert.rejects(client.get("items"), error => {
    assert.notEqual(error, unsafe);
    assert.ok(!inspect(error).includes("SYNTHETIC_SENSITIVE"));
    assert.ok(!JSON.stringify(error).includes("SYNTHETIC_SENSITIVE"));
    return errorCode("NETWORK")(error);
  });
});
