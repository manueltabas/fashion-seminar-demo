import type { ModelUsage } from "../providers/types";

/**
 * Estimated model pricing in USD per 1M tokens. These are best-effort
 * estimates for cost reporting, not billing-grade prices; unknown models
 * return a null cost rather than a guess.
 */
export type ModelPricing = { inputPer1M: number; outputPer1M: number };

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "gemini-3.5-flash": { inputPer1M: 0.3, outputPer1M: 2.5 },
  "gemini-3.6-flash": { inputPer1M: 0.3, outputPer1M: 2.5 },
  "gemini-3.1-flash-lite": { inputPer1M: 0.075, outputPer1M: 0.3 },
  "gemini-3.1-pro-preview": { inputPer1M: 1.25, outputPer1M: 10 },
};

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function estimateCostUsd(
  model: string,
  usage: Pick<ModelUsage, "inputTokens" | "outputTokens">,
): number | null {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return null;
  }
  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  return round6(
    (inputTokens / 1_000_000) * pricing.inputPer1M +
      (outputTokens / 1_000_000) * pricing.outputPer1M,
  );
}
