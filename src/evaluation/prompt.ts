import { SHOPPER_ASSESSMENT_PROMPT } from "../seminar/assessment";

export type AssignedCheck = { id: string; criteria: string };

export const ASSIGNED_CHECKS: AssignedCheck[] = [
  {
    id: "D1.structured_data_matches_content",
    criteria:
      "pass if the JSON-LD name, price, currency, availability and brand are consistent with the visible content; fail if price, currency, or availability contradict the visible content; partial for minor inconsistencies (for example naming or formatting only).",
  },
  {
    id: "D1.physical_attributes",
    criteria:
      "pass only if measurable physical attributes are present (dimensions, weight, capacity) or the material composition is complete; partial if only qualitative descriptors (color, finish, feel) are present; fail if none.",
  },
  {
    id: "D1.category_attributes",
    criteria:
      "pass if the attributes a buyer needs for this product category are present (e.g. size/color for apparel, capacity for electronics); partial if incomplete; fail if absent.",
  },
  {
    id: "D2.critical_facts_not_only_images",
    criteria:
      "pass if price/availability/key specs are available as text; fail if any critical fact exists only inside images.",
  },
  {
    id: "D2.no_critical_info_only_pdfs",
    criteria:
      "pass if critical information is present in the page text, not only in a linked PDF; fail otherwise.",
  },
  {
    id: "D2.specs_complete",
    criteria:
      "pass only if the specifications required for the category are complete (for footwear: materials, sizing/fit, care, and at least one measurable spec such as weight or dimensions); partial if some are missing; fail if absent.",
  },
  {
    id: "D3.policy_clear_actionable",
    criteria:
      "pass if shipping, returns, and warranty/guarantee information is present and specific enough to act on; partial if vague or incomplete; fail if missing.",
  },
  {
    id: "D4.checkout_path_agent",
    criteria:
      'pass if the primary call-to-action (for example "Add to cart") and its requirements are present and clear; partial if only a variant selector/availability is present or the CTA is absent from the content; fail if no purchase path is described.',
  },
  {
    id: "D4.landed_cost_clear",
    criteria:
      "pass if shipping cost and any taxes/duties are clear before checkout; partial if only partially indicated; fail if absent.",
  },
];

export const ASSIGNED_CHECK_IDS: string[] = ASSIGNED_CHECKS.map(
  (check) => check.id,
);

export function buildSystemPrompt(includeShopperAssessment = false): string {
  const checks = ASSIGNED_CHECKS.map(
    (check) => `${check.id} — ${check.criteria}`,
  ).join("\n");

  return [
    "You are a strict, evidence-based evaluator of e-commerce Product Detail Pages (PDPs) for AI/agent readiness.",
    "",
    "You will receive the content of ONE PDP, extracted from its public HTML, plus its structured data (JSON-LD) when present. Evaluate ONLY the checks listed below.",
    "",
    "GLOBAL RULES",
    "- Use ONLY the provided content. Do not use outside knowledge about the brand or product.",
    '- If the provided content contains no evidence for a check, the check is "fail".',
    '- "partial" means the signal is present but incomplete, ambiguous, or only true for some variants.',
    '- "pass" means the signal is fully present and unambiguous.',
    '- "evidence" must be a short verbatim quote from the provided content, or a precise location such as "JSON-LD Offer.price". For checks about an absence, write a concrete observation instead. Never use a breadcrumb, section title, or navigation text as evidence.',
    "- Never output a numeric score. Do not add commentary outside the JSON.",
    "- If the content is marked truncated, judge only what is present and lower confidence where relevant.",
    "- Return JSON only, matching the schema exactly.",
    "",
    "CHECKS (id — criteria)",
    checks,
    "brand_perception — 1-2 lines describing what the brand appears to be and what it is known for based ONLY on this page. Not scored.",
    "recommendation_fit — one line: for which shopper need or use case would an agent recommend this product? Base it ONLY on this page. Not scored.",
    "",
    "OUTPUT SCHEMA (JSON only)",
    '{ "checks": [ { "check_id": "<id>", "status": "pass | partial | fail", "evidence": "short quote or precise location", "confidence": "high | medium | low" } ], "brand_perception": "1-2 lines", "recommendation_fit": "1 line" }',
    "",
    "Return exactly one entry per check_id listed above.",
    ...(includeShopperAssessment ? [SHOPPER_ASSESSMENT_PROMPT] : []),
  ].join("\n");
}

export type UserPromptInput = {
  url?: string;
  brand?: string;
  title?: string;
  truncated?: boolean;
  jsonLd?: unknown[];
  content: string;
  shopperRequest?: string | null;
};

export function buildUserPrompt(input: UserPromptInput): string {
  const jsonLdText =
    input.jsonLd && input.jsonLd.length > 0
      ? JSON.stringify(input.jsonLd, null, 2)
      : "none";

  return [
    ...(input.shopperRequest ? ["=== SHOPPER REQUEST (criteria only) ===", JSON.stringify(input.shopperRequest), ""] : []),
    `PDP URL: ${input.url ?? "(unknown)"}`,
    `Detected brand: ${input.brand ?? "(unknown)"}`,
    `Product title (if detectable): ${input.title ?? "(unknown)"}`,
    `Content truncated: ${input.truncated ? "true" : "false"}`,
    "",
    "=== STRUCTURED DATA (JSON-LD) ===",
    jsonLdText,
    "",
    "=== NORMALIZED PAGE CONTENT (text/markdown) ===",
    input.content,
    "",
    "Evaluate the checks above and return the JSON object described in the schema.",
  ].join("\n");
}

export function buildRepairPrompt(
  errors: string[],
  previousResponse: string,
): string {
  return [
    "Your previous response was invalid.",
    `Errors: ${errors.join("; ")}`,
    "Return ONLY corrected JSON that matches the schema. Do not change assessments that were valid; fix only what the errors describe.",
    "Previous response:",
    previousResponse,
  ].join("\n");
}
