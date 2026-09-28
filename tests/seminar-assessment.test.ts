import test from "node:test";
import assert from "node:assert/strict";
import { validateShopperAssessment } from "../src/seminar/assessment";
import { ASSIGNED_CHECK_IDS } from "../src/evaluation/prompt";
import { validateModelOutput } from "../src/evaluation/validate";
import { evaluateWithModel } from "../src/evaluation/run";
import { buildModelEvaluationValues } from "../src/evaluation/repository";

const source = { content: "Trail jacket. Made from 100% recycled polyester. Adjustable hood.", jsonLd: [{ "@type": "Product", offers: { price: 129, priceCurrency: "EUR" } }] };
const assessment = {
  understood: "A polyester jacket with an adjustable hood.", verdict: "possible",
  requirements: [{ requirement: "Recycled material", status: "supports", explanation: "The page states the composition.", quote: "100% recycled polyester", source: "page" }],
  unknowns: [{ requirement: "Rain suitability", reason: "Waterproofness is not stated in the captured content.", next_step: "Publish waterproof testing or the intended weather conditions." }],
};
const output = (extra = {}) => JSON.stringify({ checks: ASSIGNED_CHECK_IDS.map(check_id => ({ check_id, status: "partial", evidence: "Captured text", confidence: "medium" })), brand_perception: "Outdoor apparel.", recommendation_fit: "A shopper seeking a recycled jacket.", ...extra });

test("material evidence is retained while rain suitability remains unknown", () => {
  const result = validateShopperAssessment(assessment, source);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.unknowns[0].requirement, "Rain suitability");
});
test("fabricated quotes and quotes attributed to the wrong source are rejected", () => {
  for (const patch of [{ quote: "Waterproof to 20,000 mm" }, { source: "product_data" }]) {
    assert.equal(validateShopperAssessment({ ...assessment, requirements: [{ ...assessment.requirements[0], ...patch }] }, source).ok, false);
  }
});
test("JSON-LD number values and normalized whitespace support provenance", () => {
  assert.equal(validateShopperAssessment({ ...assessment, requirements: [{ ...assessment.requirements[0], quote: "129", source: "product_data" }] }, source).ok, true);
  assert.equal(validateShopperAssessment({ ...assessment, requirements: [{ ...assessment.requirements[0], quote: "100%   recycled polyester" }] }, source).ok, true);
});
test("unknowns cannot produce an unconditional match or an unsupported rejection", () => {
  for (const verdict of ["supported", "not_supported"]) assert.equal(validateShopperAssessment({ ...assessment, verdict }, source).ok, false);
  assert.equal(validateShopperAssessment({ ...assessment, verdict: "not_supported", requirements: [{ ...assessment.requirements[0], status: "conflicts" }] }, source).ok, true);
});
test("missing and malformed assessments fail only when required", () => {
  assert.equal(validateModelOutput(output(), ASSIGNED_CHECK_IDS).ok, true);
  assert.equal(validateModelOutput(output(), ASSIGNED_CHECK_IDS, { requireShopperAssessment: true, source }).ok, false);
  for (const bad of [null, {}, { ...assessment, unknowns: [{ requirement: "Rain" }] }, { ...assessment, requirements: [], unknowns: [] }]) {
    assert.equal(validateShopperAssessment(bad, source).ok, false);
  }
});
test("repair retains shopper context and stores only the validated assessment", async () => {
  let calls = 0;
  const result = await evaluateWithModel({
    model: "test", content: { ...source, shopperRequest: "A recycled jacket for rain" },
    provider: { name: "google", async generate(request) {
      calls += 1;
      assert.ok(request.messages.some(m => m.content.includes("A recycled jacket for rain")));
      assert.ok(request.messages[0].content.includes("shopper-fit-v1"));
      return { text: calls === 1 ? output() : output({ shopper_assessment: assessment }), raw: {} };
    } },
  });
  assert.equal(result.status, "completed"); assert.equal(calls, 2);
  const values = buildModelEvaluationValues({ pdpId: "pdp", provider: "google", model: "test", result });
  assert.equal(values.shopperAssessment?.version, "shopper-fit-v1");
  assert.equal(values.shopperAssessment?.unknowns[0].requirement, "Rain suitability");
});

test("a budget in a different currency cannot be treated as a supported match", () => {
  const candidate = { ...assessment, requirements: [{ requirement: "Under $80", status: "supports", explanation: "Within budget", quote: "769", source: "product_data" }] };
  const captured = { content: "", shopperRequest: "Shoes under $80", jsonLd: [{price: 769, priceCurrency: "SEK"}] };
  assert.equal(validateShopperAssessment(candidate, captured).ok, false);
});

test("an unrelated dollar symbol cannot justify comparing a SEK quote with a dollar budget", () => {
 const candidate = { ...assessment, requirements: [{ requirement: "Under $80", status: "supports", explanation: "Within budget", quote: "SEK 769kr", source: "page" }] };
 assert.equal(validateShopperAssessment(candidate, { content: "SEK 769kr. Gifts from $10", shopperRequest: "Shoes under $80" }).ok, false);
});
