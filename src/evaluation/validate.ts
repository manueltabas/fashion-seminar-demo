import { validateShopperAssessment, type ShopperAssessment, type AssessmentSource } from "../seminar/assessment";

export type ModelJudgedStatus = "pass" | "partial" | "fail";
export type ModelJudgedConfidence = "high" | "medium" | "low";

export type ModelJudgedCheck = {
  checkId: string;
  status: ModelJudgedStatus;
  evidence: string;
  confidence: ModelJudgedConfidence;
};

export type ModelOutput = {
  checks: ModelJudgedCheck[];
  brandPerception: string;
  recommendationFit: string;
  shopperAssessment?: ShopperAssessment;
};

export type ValidationResult =
  | { ok: true; value: ModelOutput }
  | { ok: false; errors: string[] };

const STATUSES: ModelJudgedStatus[] = ["pass", "partial", "fail"];
const CONFIDENCES: ModelJudgedConfidence[] = ["high", "medium", "low"];
const MAX_EVIDENCE = 300;
const MAX_BRAND_PERCEPTION = 280;
const MAX_RECOMMENDATION_FIT = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateModelOutput(
  rawText: string,
  assignedCheckIds: string[],
  options: { requireShopperAssessment?: boolean; source?: AssessmentSource } = {},
): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, errors: ["response is not valid JSON"] };
  }

  if (!isRecord(parsed)) {
    return { ok: false, errors: ["response is not a JSON object"] };
  }

  const errors: string[] = [];

  const checksValue = parsed.checks;
  if (!Array.isArray(checksValue)) {
    errors.push("checks must be an array");
  }

  const checks: ModelJudgedCheck[] = [];
  const seen = new Map<string, number>();

  if (Array.isArray(checksValue)) {
    checksValue.forEach((entry, index) => {
      if (!isRecord(entry)) {
        errors.push(`checks[${index}] is not an object`);
        return;
      }
      const checkId = entry.check_id;
      const status = entry.status;
      const evidence = entry.evidence;
      const confidence = entry.confidence;

      if (typeof checkId !== "string" || checkId.trim() === "") {
        errors.push(`checks[${index}].check_id is missing`);
        return;
      }
      seen.set(checkId, (seen.get(checkId) ?? 0) + 1);

      if (!assignedCheckIds.includes(checkId)) {
        errors.push(`checks[${index}].check_id "${checkId}" was not assigned`);
      }
      if (
        typeof status !== "string" ||
        !STATUSES.includes(status as ModelJudgedStatus)
      ) {
        errors.push(`checks[${index}].status is invalid for ${checkId}`);
      }
      if (typeof evidence !== "string" || evidence.trim() === "") {
        errors.push(`checks[${index}].evidence is empty for ${checkId}`);
      } else if (evidence.length > MAX_EVIDENCE) {
        errors.push(
          `checks[${index}].evidence exceeds ${MAX_EVIDENCE} chars for ${checkId}`,
        );
      }
      if (
        typeof confidence !== "string" ||
        !CONFIDENCES.includes(confidence as ModelJudgedConfidence)
      ) {
        errors.push(`checks[${index}].confidence is invalid for ${checkId}`);
      }

      checks.push({
        checkId,
        status: status as ModelJudgedStatus,
        evidence: String(evidence ?? ""),
        confidence: confidence as ModelJudgedConfidence,
      });
    });
  }

  for (const id of assignedCheckIds) {
    const count = seen.get(id) ?? 0;
    if (count === 0) {
      errors.push(`missing check_id "${id}"`);
    } else if (count > 1) {
      errors.push(`check_id "${id}" appears ${count} times`);
    }
  }

  const brandPerception = parsed.brand_perception;
  if (typeof brandPerception !== "string" || brandPerception.trim() === "") {
    errors.push("brand_perception is missing");
  } else if (brandPerception.length > MAX_BRAND_PERCEPTION) {
    errors.push(`brand_perception exceeds ${MAX_BRAND_PERCEPTION} chars`);
  }

  const recommendationFit = parsed.recommendation_fit;
  if (
    typeof recommendationFit !== "string" ||
    recommendationFit.trim() === ""
  ) {
    errors.push("recommendation_fit is missing");
  } else if (recommendationFit.length > MAX_RECOMMENDATION_FIT) {
    errors.push(`recommendation_fit exceeds ${MAX_RECOMMENDATION_FIT} chars`);
  }

  let shopperAssessment: ShopperAssessment | undefined;
  if (options.requireShopperAssessment || parsed.shopper_assessment !== undefined) {
    const result = validateShopperAssessment(parsed.shopper_assessment, options.source);
    if (result.ok) shopperAssessment = result.value;
    else errors.push(...result.errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      checks,
      brandPerception: String(brandPerception),
      recommendationFit: String(recommendationFit),
      ...(shopperAssessment ? { shopperAssessment } : {}),
    },
  };
}
