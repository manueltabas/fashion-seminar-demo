import assert from "node:assert/strict";
import { test } from "node:test";
import { buildModelEvaluationValues } from "../src/evaluation/repository";
import type { ModelEvaluationResult } from "../src/evaluation/run";

const COMPLETED: ModelEvaluationResult = {
  status: "completed",
  attempts: 1,
  usage: { inputTokens: 10, outputTokens: 5 },
  output: {
    checks: [
      {
        checkId: "D1.structured_data_matches_content",
        status: "pass",
        evidence: "quote",
        confidence: "high",
      },
    ],
    brandPerception: "A sustainable footwear brand.",
    recommendationFit: "Shoppers looking for washable kids' shoes.",
  },
};

const FAILED: ModelEvaluationResult = {
  status: "failed",
  attempts: 2,
  error: "model did not return valid JSON after repair",
  errors: ["missing check_id"],
};

test("completed results store the brand perception and checks", () => {
  const values = buildModelEvaluationValues({
    pdpId: "pdp-1",
    provider: "google",
    model: "gemini-3.5-flash",
    result: COMPLETED,
  });
  assert.equal(values.status, "completed");
  assert.equal(values.brandPerception, "A sustainable footwear brand.");
  assert.equal(
    values.recommendationFit,
    "Shoppers looking for washable kids' shoes.",
  );
  assert.equal(values.checks?.length, 1);
  assert.equal(values.error, null);
  assert.deepEqual(values.usage, { inputTokens: 10, outputTokens: 5 });
});

test("failed results store the error and no brand perception", () => {
  const values = buildModelEvaluationValues({
    pdpId: "pdp-1",
    provider: "google",
    model: "gemini-3.5-flash",
    result: FAILED,
  });
  assert.equal(values.status, "failed");
  assert.equal(values.brandPerception, null);
  assert.equal(values.recommendationFit, null);
  assert.deepEqual(values.checks, []);
  assert.equal(values.error, "model did not return valid JSON after repair");
  assert.deepEqual(values.errors, ["missing check_id"]);
});
