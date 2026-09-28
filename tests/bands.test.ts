import assert from "node:assert/strict";
import { test } from "node:test";
import { overallScore, scoreBand } from "../src/scoring/bands";

test("scoreBand maps ranges to plain-language bands", () => {
  assert.equal(scoreBand(0)?.label, "Needs work");
  assert.equal(scoreBand(3.9)?.label, "Needs work");
  assert.equal(scoreBand(4)?.label, "Fair");
  assert.equal(scoreBand(6.9)?.label, "Fair");
  assert.equal(scoreBand(7)?.label, "Good");
  assert.equal(scoreBand(8.9)?.label, "Good");
  assert.equal(scoreBand(9)?.label, "Excellent");
  assert.equal(scoreBand(10)?.label, "Excellent");
  assert.equal(scoreBand(null), null);
});

test("overallScore averages the available dimension scores", () => {
  assert.equal(overallScore({ d1: 8, d2: 6, d3: 7, d4: 9 }), 7.5);
  assert.equal(overallScore({ d1: 8, d2: null, d3: null, d4: 8 }), 8);
  assert.equal(overallScore({ d1: null }), null);
});
