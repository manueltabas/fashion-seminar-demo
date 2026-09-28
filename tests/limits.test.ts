import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkLimits,
  getEvaluationLimits,
  shouldStopForCost,
  type EvaluationLimits,
} from "../src/evaluation/limits";

const LIMITS: EvaluationLimits = {
  maxModels: 2,
  maxEstimatedCostUsd: 1,
  assumedInputTokens: 20000,
  assumedOutputTokens: 2000,
};

test("checkLimits rejects too many models", () => {
  const result = checkLimits(["gemini-3.5-flash", "a", "b"], LIMITS);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "too_many_models");
});

test("checkLimits rejects when the estimated cost exceeds the ceiling", () => {
  const result = checkLimits(["gemini-3.5-flash"], {
    ...LIMITS,
    maxEstimatedCostUsd: 0.001,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "cost_ceiling_exceeded");
  assert.ok((result.estimatedCostUsd ?? 0) > 0.001);
});

test("checkLimits allows a run within the limits", () => {
  const result = checkLimits(["gemini-3.5-flash"], LIMITS);
  assert.equal(result.allowed, true);
  assert.ok((result.estimatedCostUsd ?? 0) > 0);
});

test("checkLimits reports null cost for unknown models", () => {
  const result = checkLimits(["unknown-model"], LIMITS);
  assert.equal(result.allowed, true);
  assert.equal(result.estimatedCostUsd, null);
});

test("shouldStopForCost stops once the ceiling is reached", () => {
  assert.equal(shouldStopForCost(1, LIMITS), true);
  assert.equal(shouldStopForCost(0.5, LIMITS), false);
  assert.equal(
    shouldStopForCost(5, { ...LIMITS, maxEstimatedCostUsd: 0 }),
    false,
  );
});

test("getEvaluationLimits reads env with defaults", () => {
  const limits = getEvaluationLimits({
    MAX_MODELS_PER_EVALUATION: "5",
    MAX_EVALUATION_COST_USD: "0.25",
  });
  assert.equal(limits.maxModels, 5);
  assert.equal(limits.maxEstimatedCostUsd, 0.25);
  assert.equal(limits.assumedInputTokens, 20000);
});
