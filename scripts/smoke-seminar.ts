/** Opt-in local DB integration check. Provider responses are stubbed; no paid calls. */
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db/client";
import { brands, pdps, pdpNormalizations, evaluations, modelEvaluations } from "../src/db/schema";
import { retryFailedModels, listEvaluationModelResults } from "../src/evaluation/orchestrator";
import { ASSIGNED_CHECK_IDS } from "../src/evaluation/prompt";

async function main() {
  assert.equal(new URL(process.env.DATABASE_URL ?? "").pathname, "/fashion_seminar_demo", "Use only the demo database");
  const db = getDb();
  const brandId = randomUUID();
  const pdpId = randomUUID();
  const evaluationId = randomUUID();
  const captureId = randomUUID();
  const originalFetch = globalThis.fetch;
  const oldKey = process.env.GEMINI_API_KEY;
  let calls = 0;
  try {
    await db.insert(brands).values({ id: brandId, key: `smoke-${brandId}.invalid`, name: "Temporary verification" });
    await db.insert(pdps).values({ id: pdpId, brandId, domain: "seminar-test.invalid", url: `https://seminar-test.invalid/products/${pdpId}` });
    await db.insert(pdpNormalizations).values({ id: captureId, pdpId, content: "Original capture: 100% recycled polyester", createdAt: new Date("2026-01-01") });
    await db.insert(pdpNormalizations).values({ pdpId, content: "Newer capture: silk", createdAt: new Date("2026-01-02") });
    await db.insert(evaluations).values({ id: evaluationId, pdpId, status: "failed", shopperRequest: "A recycled jacket for rain", normalizationId: captureId });
    await db.insert(modelEvaluations).values({ evaluationId, pdpId, provider: "google", model: "test", status: "failed" });
    process.env.GEMINI_API_KEY = "local-stub-only";
    globalThis.fetch = async (_url, init) => {
      calls += 1;
      const body = JSON.parse(String(init?.body));
      const text = JSON.stringify(body.contents);
      assert.ok(text.includes("A recycled jacket for rain"));
      assert.ok(text.includes("Original capture: 100% recycled polyester"));
      assert.ok(!text.includes("Newer capture: silk"));
      const output = {
        checks: ASSIGNED_CHECK_IDS.map(check_id => ({ check_id, status: "partial", evidence: "Original capture", confidence: "medium" })),
        brand_perception: "Recycled apparel", recommendation_fit: "A shopper seeking recycled fabric",
        shopper_assessment: { understood: "A polyester jacket", verdict: "possible", requirements: [{ requirement: "Recycled fabric", status: "supports", explanation: "The composition is stated", quote: "100% recycled polyester", source: "page" }], unknowns: [{ requirement: "Rain suitability", reason: "Waterproofness is not captured", next_step: "Ask for a waterproof rating" }] },
      };
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] });
    };
    const result = await retryFailedModels(evaluationId);
    assert.ok("evaluation" in result);
    assert.equal(result.evaluation.status, "completed");
    assert.equal(result.evaluation.normalizationId, captureId);
    const [saved] = await listEvaluationModelResults(evaluationId);
    assert.equal(saved.shopperAssessment?.unknowns[0].requirement, "Rain suitability");
    assert.equal(calls, 1);
    console.log("PASS: retry uses the original capture and shopper request despite a newer normalization; assessment persists.");
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
    await db.delete(brands).where(eq(brands.id, brandId));
  }
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
