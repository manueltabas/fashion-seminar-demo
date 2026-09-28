import assert from "node:assert/strict";
import { test } from "node:test";
import { ProviderError } from "../src/providers/errors";
import { createProvider } from "../src/providers/factory";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

type Captured = { url: string; body: Record<string, unknown> };

function capturingFetch(
  response: Response,
  captured: Captured,
): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.url = String(input);
    captured.body = JSON.parse(String(init?.body ?? "{}")) as Record<
      string,
      unknown
    >;
    return response;
  }) as typeof fetch;
}

test("google parses text and usage and sends system + JSON config", async () => {
  const captured: Captured = { url: "", body: {} };
  const fetchImpl = capturingFetch(
    jsonResponse({
      candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 },
    }),
    captured,
  );

  const provider = createProvider("google", { apiKey: "test-key", fetchImpl });
  const result = await provider.generate({
    model: "gemini-2.5-flash",
    json: true,
    messages: [
      { role: "system", content: "Return JSON only." },
      { role: "user", content: "ping" },
    ],
  });

  assert.equal(result.text, '{"ok":true}');
  assert.deepEqual(result.usage, { inputTokens: 5, outputTokens: 3 });
  assert.match(captured.url, /gemini-2\.5-flash:generateContent/);
  assert.deepEqual(captured.body.systemInstruction, {
    parts: [{ text: "Return JSON only." }],
  });
  assert.deepEqual(captured.body.generationConfig, {
    temperature: 0,
    responseMimeType: "application/json",
  });
});

test("google without credentials throws a typed failure", async () => {
  const provider = createProvider("google", { apiKey: "" });
  await assert.rejects(
    () => provider.generate({ model: "gemini-2.5-flash", messages: [] }),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, "missing_credentials");
      assert.equal(error.provider, "google");
      return true;
    },
  );
});

test("google maps HTTP 401 to unauthorized", async () => {
  const captured: Captured = { url: "", body: {} };
  const provider = createProvider("google", {
    apiKey: "test-key",
    fetchImpl: capturingFetch(jsonResponse({ error: "bad key" }, 401), captured),
  });
  await assert.rejects(
    () => provider.generate({ model: "gemini-2.5-flash", messages: [] }),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, "unauthorized");
      assert.equal(error.status, 401);
      assert.equal(error.retryable, false);
      return true;
    },
  );
});

test("google maps HTTP 429 to a retryable rate limit", async () => {
  const captured: Captured = { url: "", body: {} };
  const provider = createProvider("google", {
    apiKey: "test-key",
    fetchImpl: capturingFetch(jsonResponse({ error: "slow down" }, 429), captured),
  });
  await assert.rejects(
    () => provider.generate({ model: "gemini-2.5-flash", messages: [] }),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, "rate_limited");
      assert.equal(error.retryable, true);
      return true;
    },
  );
});

test("non-JSON response becomes malformed_response", async () => {
  const captured: Captured = { url: "", body: {} };
  const provider = createProvider("google", {
    apiKey: "test-key",
    fetchImpl: capturingFetch(
      new Response("<html>nope</html>", { status: 200 }),
      captured,
    ),
  });
  await assert.rejects(
    () => provider.generate({ model: "gemini-2.5-flash", messages: [] }),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, "malformed_response");
      return true;
    },
  );
});

test("openai parses choices into text", async () => {
  const captured: Captured = { url: "", body: {} };
  const provider = createProvider("openai", {
    apiKey: "test-key",
    fetchImpl: capturingFetch(
      jsonResponse({
        choices: [{ message: { content: "hello from openai" } }],
        usage: { prompt_tokens: 1, completion_tokens: 2 },
      }),
      captured,
    ),
  });
  const result = await provider.generate({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "hi" }],
  });
  assert.equal(result.text, "hello from openai");
  assert.deepEqual(result.usage, { inputTokens: 1, outputTokens: 2 });
});

test("anthropic parses content blocks and lifts the system message", async () => {
  const captured: Captured = { url: "", body: {} };
  const provider = createProvider("anthropic", {
    apiKey: "test-key",
    fetchImpl: capturingFetch(
      jsonResponse({
        content: [{ text: "hello from claude" }],
        usage: { input_tokens: 4, output_tokens: 6 },
      }),
      captured,
    ),
  });
  const result = await provider.generate({
    model: "claude-sonnet",
    messages: [
      { role: "system", content: "Be terse." },
      { role: "user", content: "hi" },
    ],
  });
  assert.equal(result.text, "hello from claude");
  assert.equal(captured.body.system, "Be terse.");
});
