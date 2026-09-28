import assert from "node:assert/strict";
import { test } from "node:test";
import {
  describeEvaluationStatus,
  evaluationStatuses,
  isTerminalStatus,
} from "../src/evaluation/status";

test("terminal statuses are completed, partial, and failed", () => {
  assert.equal(isTerminalStatus("completed"), true);
  assert.equal(isTerminalStatus("partial"), true);
  assert.equal(isTerminalStatus("failed"), true);
  assert.equal(isTerminalStatus("created"), false);
  assert.equal(isTerminalStatus("fetching"), false);
  assert.equal(isTerminalStatus("evaluating"), false);
});

test("every status has a description", () => {
  for (const status of evaluationStatuses) {
    assert.ok(describeEvaluationStatus(status).length > 0);
  }
});
