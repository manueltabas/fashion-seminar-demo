import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveEvaluationStatus } from "../src/evaluation/orchestrator";

test("all models completed yields completed", () => {
  assert.deepEqual(resolveEvaluationStatus(2, 2), {
    status: "completed",
    reason: null,
  });
});

test("some models completed yields partial with a reason", () => {
  assert.deepEqual(resolveEvaluationStatus(1, 2), {
    status: "partial",
    reason: "models_failed:1/2",
  });
});

test("no models completed yields failed", () => {
  assert.deepEqual(resolveEvaluationStatus(0, 2), {
    status: "failed",
    reason: "all_models_failed",
  });
});
