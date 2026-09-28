import assert from "node:assert/strict";
import { test } from "node:test";
import type { Finding } from "../src/checks/types";
import { computeEvaluationScores } from "../src/evaluation/orchestrator";

function detFinding(status: Finding["status"], weight: number): Finding {
  return {
    checkId: "D1.jsonld_product",
    dimension: "d1",
    type: "deterministic",
    status,
    weight,
    evidence: "e",
  };
}

function modelRow(status: "completed" | "failed") {
  return {
    modelProfileId: "profile-1",
    provider: "google",
    model: "gemini-3.5-flash",
    status,
    checks:
      status === "completed"
        ? [
            {
              checkId: "D1.physical_attributes",
              status: "partial" as const,
              evidence: "e",
              confidence: "high" as const,
            },
          ]
        : [],
  };
}

test("computeEvaluationScores combines deterministic and model findings", () => {
  const { perModel, aggregate, allModelFindings } = computeEvaluationScores(
    [detFinding("pass", 3)],
    [modelRow("completed")],
  );
  assert.equal(perModel.length, 1);
  assert.equal(perModel[0].status, "completed");
  assert.equal(allModelFindings.length, 1);
  assert.equal(typeof aggregate.d1, "number");
  if (perModel[0].status === "completed") {
    assert.ok(perModel[0].scores.d1.score > 0);
  }
});

test("failed models are recorded without scores", () => {
  const { perModel, aggregate } = computeEvaluationScores(
    [detFinding("pass", 3)],
    [modelRow("failed")],
  );
  assert.equal(perModel[0].status, "failed");
  assert.equal(aggregate.d1, null);
});
