import type {
  CheckStatus,
  Dimension,
  Finding,
} from "../checks/types";
import type { ModelJudgedCheck, ModelOutput } from "../evaluation/validate";

export function outcomeValue(status: CheckStatus): number {
  if (status === "pass") {
    return 1;
  }
  if (status === "partial") {
    return 0.5;
  }
  return 0;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export const DIMENSIONS: Dimension[] = ["d1", "d2", "d3", "d4"];

export const DIMENSION_LABELS: Record<Dimension, string> = {
  d1: "Machine-readable Data",
  d2: "Content Extractability",
  d3: "Trust & Policy Signals",
  d4: "Transactional Readiness",
};

export const MODEL_CHECK_WEIGHTS: Record<string, number> = {
  "D1.structured_data_matches_content": 2,
  "D1.physical_attributes": 2,
  "D1.category_attributes": 2,
  "D2.critical_facts_not_only_images": 2,
  "D2.no_critical_info_only_pdfs": 1,
  "D2.specs_complete": 3,
  "D3.policy_clear_actionable": 3,
  "D4.checkout_path_agent": 2,
  "D4.landed_cost_clear": 2,
};

export const DIMENSION_CAPS: Record<Dimension, number> = {
  d1: 3,
  d2: 4,
  d3: 4,
  d4: 3,
};

type CapPredicate = (byId: Map<string, Finding>) => boolean;

const CAP_RULES: Record<Dimension, CapPredicate> = {
  d1: (byId) =>
    byId.get("D1.jsonld_product")?.status === "fail" ||
    byId.get("D1.offer_price")?.status === "fail",
  d2: (byId) => byId.get("D2.main_content_in_html")?.status === "fail",
  d3: (byId) =>
    byId.get("D3.shipping_info")?.status === "fail" &&
    byId.get("D3.returns_policy")?.status === "fail",
  d4: (byId) =>
    byId.get("D4.fetch_not_blocked")?.status === "fail" ||
    byId.get("D4.price_displayed")?.status === "fail",
};

export type DimensionScore = {
  dimension: Dimension;
  score: number;
  weightedScore: number;
  cap: number | null;
  capped: boolean;
  totalWeight: number;
  statusCounts: { pass: number; partial: number; fail: number };
};

function dimensionFromCheckId(checkId: string): Dimension {
  const prefix = checkId.split(".")[0]?.toLowerCase();
  return DIMENSIONS.includes(prefix as Dimension)
    ? (prefix as Dimension)
    : "d1";
}

export function modelOutputToFindings(output: ModelOutput): Finding[] {
  return output.checks.map((check) => toFinding(check));
}

function toFinding(check: ModelJudgedCheck): Finding {
  return {
    checkId: check.checkId,
    dimension: dimensionFromCheckId(check.checkId),
    type: "model",
    status: check.status,
    weight: MODEL_CHECK_WEIGHTS[check.checkId] ?? 1,
    evidence: check.evidence,
  };
}

export function scoreDimension(
  dimension: Dimension,
  findings: Finding[],
): DimensionScore {
  const scoped = findings.filter((finding) => finding.dimension === dimension);
  const totalWeight = scoped.reduce((sum, finding) => sum + finding.weight, 0);

  let weightedSum = 0;
  const statusCounts = { pass: 0, partial: 0, fail: 0 };
  const byId = new Map<string, Finding>();

  for (const finding of scoped) {
    weightedSum += finding.weight * outcomeValue(finding.status);
    statusCounts[finding.status] += 1;
    byId.set(finding.checkId, finding);
  }

  const weightedScore =
    totalWeight > 0 ? round1((10 * weightedSum) / totalWeight) : 0;

  const capApplies = CAP_RULES[dimension](byId);
  const cap = capApplies ? DIMENSION_CAPS[dimension] : null;
  const score = cap !== null ? Math.min(weightedScore, cap) : weightedScore;

  return {
    dimension,
    score,
    weightedScore,
    cap,
    capped: cap !== null && weightedScore > cap,
    totalWeight,
    statusCounts,
  };
}

export function scoreDimensions(
  findings: Finding[],
): Record<Dimension, DimensionScore> {
  return {
    d1: scoreDimension("d1", findings),
    d2: scoreDimension("d2", findings),
    d3: scoreDimension("d3", findings),
    d4: scoreDimension("d4", findings),
  };
}

export function aggregateScores(scores: number[]): number | null {
  if (scores.length === 0) {
    return null;
  }
  const mean = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  return round1(mean);
}

export function aggregateDimensionScores(
  perModel: Record<Dimension, DimensionScore>[],
): Record<Dimension, number | null> {
  const result = {} as Record<Dimension, number | null>;
  for (const dimension of DIMENSIONS) {
    result[dimension] = aggregateScores(
      perModel.map((scores) => scores[dimension].score),
    );
  }
  return result;
}
