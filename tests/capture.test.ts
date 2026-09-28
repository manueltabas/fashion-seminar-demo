import assert from "node:assert/strict";
import { test } from "node:test";
import { detectBotBlock, fetchPdpPage } from "../src/capture/fetch";

test("detectBotBlock flags block statuses", () => {
  assert.equal(detectBotBlock({ statusCode: 403, body: "" }).blocked, true);
  assert.equal(
    detectBotBlock({ statusCode: 403, body: "" }).reason,
    "http_403",
  );
  assert.equal(detectBotBlock({ statusCode: 200, body: "ok" }).blocked, false);
});

test("detectBotBlock flags CAPTCHA and access-denied bodies", () => {
  assert.equal(
    detectBotBlock({ statusCode: 200, body: "<title>Access Denied</title>" })
      .blocked,
    true,
  );
  assert.equal(
    detectBotBlock({ statusCode: 200, body: "Please complete the CAPTCHA" })
      .reason,
    "captcha",
  );
});

test("fetchPdpPage captures HTML and metadata", async () => {
  const html = "<html><head><title>Test</title></head><body>hi</body></html>";
  const fetchImpl = (async () =>
    new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    })) as typeof fetch;

  const result = await fetchPdpPage("https://example.com/p/1", { fetchImpl });
  assert.equal(result.statusCode, 200);
  assert.equal(result.ok, true);
  assert.equal(result.blocked, false);
  assert.equal(result.rawHtml, html);
  assert.equal(result.byteSize, html.length);
  assert.ok(result.contentType?.includes("text/html"));
});

test("fetchPdpPage records a blocked response", async () => {
  const fetchImpl = (async () =>
    new Response("<H1>Access Denied</H1>", {
      status: 403,
      headers: { "content-type": "text/html" },
    })) as typeof fetch;

  const result = await fetchPdpPage("https://example.com/p/1", { fetchImpl });
  assert.equal(result.ok, false);
  assert.equal(result.blocked, true);
  assert.equal(result.blockReason, "http_403");
  assert.equal(result.statusCode, 403);
});

test("fetchPdpPage reports a timeout", async () => {
  const fetchImpl = ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new Error("aborted")),
      );
    })) as typeof fetch;

  const result = await fetchPdpPage("https://example.com/p/1", {
    fetchImpl,
    timeoutMs: 10,
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "timeout");
});
