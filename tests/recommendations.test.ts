import assert from "node:assert/strict";
import { test } from "node:test";
import { ASSIGNED_CHECK_IDS } from "../src/evaluation/prompt";
import { D1_CHECK_META } from "../src/checks/d1";
import { D2_CHECK_META } from "../src/checks/d2";
import { D3_CHECK_META } from "../src/checks/d3";
import { D4_CHECK_META } from "../src/checks/d4";
import { RECOMMENDATION_CATALOG } from "../src/recommendations/catalog";
import {
  mapRecommendations,
  priorityForImpact,
} from "../src/recommendations/map";
import type { CheckStatus, Finding } from "../src/checks/types";

function finding(
  checkId: string,
  status: CheckStatus,
  weight: number,
): Finding {
  return {
    checkId,
    dimension: "d1",
    type: "deterministic",
    status,
    weight,
    evidence: "e",
  };
}

test("every check id has a canonical recommendation", () => {
  const ids = [
    ...D1_CHECK_META.map((m) => m.id),
    ...D2_CHECK_META.map((m) => m.id),
    ...D3_CHECK_META.map((m) => m.id),
    ...D4_CHECK_META.map((m) => m.id),
    ...ASSIGNED_CHECK_IDS,
  ];
  for (const id of ids) {
    assert.ok(RECOMMENDATION_CATALOG[id], `missing recommendation for ${id}`);
  }
});

test("failed and partial checks yield recommendations, passes do not", () => {
  const recommendations = mapRecommendations([
    finding("D1.jsonld_product", "fail", 3),
    finding("D1.brand", "pass", 1),
    finding("D1.price_currency", "partial", 2),
  ]);
  assert.equal(recommendations.length, 2);
  assert.ok(recommendations.every((r) => r.action.length > 0));
});

test("impact is weight * (1 - outcome)", () => {
  const [failed] = mapRecommendations([finding("D1.jsonld_product", "fail", 3)]);
  assert.equal(failed.impact, 3);
  const [partial] = mapRecommendations([
    finding("D1.price_currency", "partial", 2),
  ]);
  assert.equal(partial.impact, 1);
});

test("recommendations are ordered by impact descending", () => {
  const recommendations = mapRecommendations([
    finding("D1.brand", "partial", 1),
    finding("D1.jsonld_product", "fail", 3),
    finding("D1.price_currency", "partial", 2),
  ]);
  const impacts = recommendations.map((r) => r.impact);
  assert.deepEqual(impacts, [3, 1, 0.5]);
});

test("priority bands map impact to High/Medium/Low", () => {
  assert.equal(priorityForImpact(3), "High");
  assert.equal(priorityForImpact(2), "High");
  assert.equal(priorityForImpact(1), "Medium");
  assert.equal(priorityForImpact(0.5), "Low");
});
