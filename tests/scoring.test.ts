import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  CheckStatus,
  Dimension,
  Finding,
} from "../src/checks/types";
import {
  aggregateDimensionScores,
  aggregateScores,
  modelOutputToFindings,
  scoreDimension,
  scoreDimensions,
} from "../src/scoring/score";

function finding(
  checkId: string,
  dimension: Dimension,
  status: CheckStatus,
  weight: number,
): Finding {
  return {
    checkId,
    dimension,
    type: "deterministic",
    status,
    weight,
    evidence: "e",
  };
}

test("weighted scoring maps pass/partial/fail to 10/5/0", () => {
  const allPass = scoreDimension("d1", [
    finding("D1.a", "d1", "pass", 3),
    finding("D1.b", "d1", "pass", 2),
  ]);
  assert.equal(allPass.score, 10);

  const allPartial = scoreDimension("d1", [
    finding("D1.a", "d1", "partial", 3),
    finding("D1.b", "d1", "partial", 2),
  ]);
  assert.equal(allPartial.score, 5);

  const allFail = scoreDimension("d1", [
    finding("D1.a", "d1", "fail", 3),
    finding("D1.b", "d1", "fail", 2),
  ]);
  assert.equal(allFail.score, 0);

  const mixed = scoreDimension("d1", [
    finding("D1.a", "d1", "pass", 3),
    finding("D1.b", "d1", "partial", 2),
    finding("D1.c", "d1", "fail", 1),
  ]);
  assert.equal(mixed.weightedScore, 6.7);
  assert.equal(mixed.score, 6.7);
});

test("the D1 cap lowers a critical failure", () => {
  const result = scoreDimension("d1", [
    finding("D1.jsonld_product", "d1", "fail", 3),
    finding("D1.offer_price", "d1", "pass", 3),
    finding("D1.price_currency", "d1", "pass", 2),
  ]);
  assert.equal(result.capped, true);
  assert.equal(result.cap, 3);
  assert.equal(result.score, 3);
  assert.ok(result.weightedScore > 3);
});

test("D1 is not capped when the critical checks pass", () => {
  const result = scoreDimension("d1", [
    finding("D1.jsonld_product", "d1", "pass", 3),
    finding("D1.offer_price", "d1", "pass", 3),
  ]);
  assert.equal(result.capped, false);
  assert.equal(result.cap, null);
});

test("D3 is capped only when shipping and returns both fail", () => {
  const bothFail = scoreDimension("d3", [
    finding("D3.shipping_info", "d3", "fail", 2),
    finding("D3.returns_policy", "d3", "fail", 2),
    finding("D3.reviews", "d3", "pass", 2),
    finding("D3.contact", "d3", "pass", 1),
    finding("D3.privacy_policy", "d3", "pass", 1),
    finding("D3.tax_duties", "d3", "pass", 1),
  ]);
  assert.equal(bothFail.capped, true);
  assert.equal(bothFail.score, 4);

  const oneFails = scoreDimension("d3", [
    finding("D3.shipping_info", "d3", "fail", 2),
    finding("D3.returns_policy", "d3", "pass", 2),
    finding("D3.reviews", "d3", "pass", 2),
  ]);
  assert.equal(oneFails.capped, false);
});

test("D4 is capped when the fetch was bot-blocked", () => {
  const result = scoreDimension("d4", [
    finding("D4.fetch_not_blocked", "d4", "fail", 3),
    finding("D4.price_displayed", "d4", "pass", 3),
  ]);
  assert.equal(result.capped, true);
  assert.equal(result.score, 3);
});

test("aggregate is the mean of model scores", () => {
  assert.equal(aggregateScores([8, 6, 4]), 6);
  assert.equal(aggregateScores([9, 10]), 9.5);
  assert.equal(aggregateScores([]), null);
});

test("scoreDimensions returns a score for every dimension", () => {
  const scores = scoreDimensions([]);
  assert.deepEqual(Object.keys(scores).sort(), ["d1", "d2", "d3", "d4"]);
});

test("model output findings carry the right dimension and weight", () => {
  const findings = modelOutputToFindings({
    checks: [
      {
        checkId: "D2.specs_complete",
        status: "partial",
        evidence: "e",
        confidence: "high",
      },
      {
        checkId: "D4.checkout_path_agent",
        status: "pass",
        evidence: "e",
        confidence: "high",
      },
    ],
    brandPerception: "Brand.",
    recommendationFit: "Fit.",
  });
  assert.equal(findings[0].dimension, "d2");
  assert.equal(findings[0].type, "model");
  assert.equal(findings[0].weight, 3);
  assert.equal(findings[1].dimension, "d4");
  assert.equal(findings[1].weight, 2);
});

test("aggregateDimensionScores averages across models per dimension", () => {
  const modelA = scoreDimensions([finding("D1.jsonld_product", "d1", "pass", 3)]);
  const modelB = scoreDimensions([finding("D1.jsonld_product", "d1", "fail", 3)]);
  const aggregated = aggregateDimensionScores([modelA, modelB]);
  assert.equal(aggregated.d1, 5);
});
