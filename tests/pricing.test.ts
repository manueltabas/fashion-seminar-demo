import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateCostUsd } from "../src/evaluation/pricing";

test("estimateCostUsd computes cost from tokens and pricing", () => {
  const cost = estimateCostUsd("gemini-3.1-flash-lite", {
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
  });
  assert.equal(cost, 0.375);
});

test("estimateCostUsd returns null for unknown models", () => {
  assert.equal(
    estimateCostUsd("some-unknown-model", { inputTokens: 1000 }),
    null,
  );
});

test("estimateCostUsd handles missing token counts", () => {
  assert.equal(estimateCostUsd("gemini-3.5-flash", {}), 0);
});
