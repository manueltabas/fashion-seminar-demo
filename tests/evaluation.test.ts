import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ASSIGNED_CHECK_IDS,
  buildSystemPrompt,
  buildUserPrompt,
} from "../src/evaluation/prompt";
import { evaluateWithModel } from "../src/evaluation/run";
import { validateModelOutput } from "../src/evaluation/validate";
import { ProviderError } from "../src/providers/errors";
import type { ModelProvider } from "../src/providers/types";

function validOutputText(): string {
  return JSON.stringify({
    checks: ASSIGNED_CHECK_IDS.map((id) => ({
      check_id: id,
      status: "pass",
      evidence: '"Regular price $65.00"',
      confidence: "high",
    })),
    brand_perception: "A sustainable footwear brand for kids.",
    recommendation_fit: "Shoppers looking for washable, eco-friendly kids' shoes.",
  });
}

function stubProvider(responses: string[]): {
  provider: ModelProvider;
  calls: () => number;
} {
  let index = 0;
  const provider: ModelProvider = {
    name: "google",
    async generate() {
      const text = responses[Math.min(index, responses.length - 1)];
      index += 1;
      return { text, raw: {}, usage: { inputTokens: 1, outputTokens: 2 } };
    },
  };
  return { provider, calls: () => index };
}

test("a mocked valid response passes validation", async () => {
  const { provider } = stubProvider([validOutputText()]);
  const result = await evaluateWithModel({
    provider,
    model: "gemini-3.6-flash",
    content: { url: "https://example.com/p/1", content: "$65.00" },
  });
  assert.equal(result.status, "completed");
  if (result.status === "completed") {
    assert.equal(result.output.checks.length, 9);
    assert.equal(result.attempts, 1);
    assert.equal(result.output.brandPerception.length > 0, true);
  }
});

test("an invalid response triggers repair and then succeeds", async () => {
  const invalid = JSON.stringify({
    checks: ASSIGNED_CHECK_IDS.slice(0, 8).map((id) => ({
      check_id: id,
      status: "pass",
      evidence: "x",
      confidence: "high",
    })),
    brand_perception: "Brand.",
  });
  const { provider, calls } = stubProvider([invalid, validOutputText()]);
  const result = await evaluateWithModel({
    provider,
    model: "gemini-3.6-flash",
    content: { content: "text" },
  });
  assert.equal(result.status, "completed");
  assert.equal(result.attempts, 2);
  assert.equal(calls(), 2);
});

test("two invalid responses mark the model failed", async () => {
  const invalid = JSON.stringify({ checks: [], brand_perception: "" });
  const { provider, calls } = stubProvider([invalid, invalid]);
  const result = await evaluateWithModel({
    provider,
    model: "gemini-3.6-flash",
    content: { content: "text" },
  });
  assert.equal(result.status, "failed");
  if (result.status === "failed") {
    assert.ok(result.errors.length > 0);
    assert.equal(result.attempts, 2);
  }
  assert.equal(calls(), 2);
});

test("provider errors surface as a failed result", async () => {
  const provider: ModelProvider = {
    name: "google",
    async generate() {
      throw new Error("provider exploded");
    },
  };
  const result = await evaluateWithModel({
    provider,
    model: "gemini-3.6-flash",
    content: { content: "text" },
  });
  assert.equal(result.status, "failed");
  if (result.status === "failed") {
    assert.match(result.error, /provider exploded/);
  }
});

test("validator enforces the schema and exact check ids", () => {
  const missing = JSON.stringify({
    checks: [
      { check_id: ASSIGNED_CHECK_IDS[0], status: "pass", evidence: "x", confidence: "high" },
    ],
    brand_perception: "Brand.",
  });
  const missingResult = validateModelOutput(missing, ASSIGNED_CHECK_IDS);
  assert.equal(missingResult.ok, false);

  const duplicate = JSON.parse(validOutputText()) as {
    checks: Array<{ check_id: string }>;
  };
  duplicate.checks.push({ check_id: ASSIGNED_CHECK_IDS[0] });
  const dupResult = validateModelOutput(
    JSON.stringify(duplicate),
    ASSIGNED_CHECK_IDS,
  );
  assert.equal(dupResult.ok, false);

  const extra = JSON.parse(validOutputText()) as {
    checks: Array<{ check_id: string }>;
  };
  extra.checks.push({
    check_id: "D9.not_assigned",
    status: "pass",
    evidence: "x",
    confidence: "high",
  } as never);
  const extraResult = validateModelOutput(
    JSON.stringify(extra),
    ASSIGNED_CHECK_IDS,
  );
  assert.equal(extraResult.ok, false);

  const badStatus = JSON.parse(validOutputText()) as {
    checks: Array<{ status: string }>;
  };
  badStatus.checks[0].status = "excellent";
  const statusResult = validateModelOutput(
    JSON.stringify(badStatus),
    ASSIGNED_CHECK_IDS,
  );
  assert.equal(statusResult.ok, false);

  const noFit = JSON.parse(validOutputText()) as Record<string, unknown>;
  delete noFit.recommendation_fit;
  const noFitResult = validateModelOutput(
    JSON.stringify(noFit),
    ASSIGNED_CHECK_IDS,
  );
  assert.equal(noFitResult.ok, false);
});

test("retryable provider errors are retried before failing", async () => {
  process.env.PROVIDER_RETRY_BASE_MS = "1";
  let calls = 0;
  const provider: ModelProvider = {
    name: "google",
    async generate() {
      calls += 1;
      if (calls < 3) {
        throw new ProviderError("provider busy", {
          provider: "google",
          code: "rate_limited",
          retryable: true,
        });
      }
      return { text: validOutputText(), raw: {}, usage: {} };
    },
  };
  const result = await evaluateWithModel({
    provider,
    model: "gemini-x",
    content: { content: "x" },
  });
  assert.equal(result.status, "completed");
  assert.equal(calls, 3);
  delete process.env.PROVIDER_RETRY_BASE_MS;
});

test("prompt includes every assigned check and the PDP content", () => {
  const system = buildSystemPrompt();
  for (const id of ASSIGNED_CHECK_IDS) {
    assert.match(system, new RegExp(id.replace(".", "\\.")));
  }
  const user = buildUserPrompt({
    url: "https://example.com/p/1",
    brand: "Example",
    content: "Regular price $65.00",
  });
  assert.match(user, /https:\/\/example\.com\/p\/1/);
  assert.match(user, /\$65\.00/);
});
