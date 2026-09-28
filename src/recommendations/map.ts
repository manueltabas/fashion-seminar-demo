import type { CheckStatus, Finding } from "../checks/types";
import { outcomeValue } from "../scoring/score";
import { RECOMMENDATION_CATALOG } from "./catalog";

export type Recommendation = {
  checkId: string;
  dimension: Finding["dimension"];
  status: CheckStatus;
  action: string;
  why: string;
  impact: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function recommendationImpact(
  weight: number,
  status: CheckStatus,
): number {
  return round2(weight * (1 - outcomeValue(status)));
}

export type RecommendationPriority = "High" | "Medium" | "Low";

export function priorityForImpact(impact: number): RecommendationPriority {
  if (impact >= 2) {
    return "High";
  }
  if (impact >= 1) {
    return "Medium";
  }
  return "Low";
}

export function mapRecommendations(findings: Finding[]): Recommendation[] {
  return findings
    .filter((finding) => finding.status === "fail" || finding.status === "partial")
    .map((finding) => {
      const template = RECOMMENDATION_CATALOG[finding.checkId] ?? {
        action: `Fix ${finding.checkId}`,
        why: "This check did not pass.",
        dimension: finding.dimension,
      };
      return {
        checkId: finding.checkId,
        dimension: template.dimension,
        status: finding.status,
        action: template.action,
        why: template.why,
        impact: recommendationImpact(finding.weight, finding.status),
      };
    })
    .sort(
      (a, b) => b.impact - a.impact || a.checkId.localeCompare(b.checkId),
    );
}
