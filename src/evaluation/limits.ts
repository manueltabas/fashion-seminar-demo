import { estimateCostUsd } from "./pricing";

export type EvaluationLimits = {
  maxModels: number;
  maxEstimatedCostUsd: number;
  assumedInputTokens: number;
  assumedOutputTokens: number;
};

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getEvaluationLimits(
  env: Record<string, string | undefined> = process.env,
): EvaluationLimits {
  return {
    maxModels: Math.max(1, Math.floor(num(env.MAX_MODELS_PER_EVALUATION, 3))),
    maxEstimatedCostUsd: num(env.MAX_EVALUATION_COST_USD, 1),
    assumedInputTokens: num(env.ASSUMED_INPUT_TOKENS, 20000),
    assumedOutputTokens: num(env.ASSUMED_OUTPUT_TOKENS, 2000),
  };
}

export type LimitsReason = "too_many_models" | "cost_ceiling_exceeded";

export type LimitsCheck = {
  allowed: boolean;
  reason?: LimitsReason;
  estimatedCostUsd: number | null;
};

export function checkLimits(
  models: string[],
  limits: EvaluationLimits,
): LimitsCheck {
  if (models.length > limits.maxModels) {
    return { allowed: false, reason: "too_many_models", estimatedCostUsd: null };
  }

  if (models.length === 0) {
    return { allowed: true, estimatedCostUsd: 0 };
  }

  let total = 0;
  let allKnown = true;
  for (const model of models) {
    const cost = estimateCostUsd(model, {
      inputTokens: limits.assumedInputTokens,
      outputTokens: limits.assumedOutputTokens,
    });
    if (cost === null) {
      allKnown = false;
      continue;
    }
    total += cost;
  }

  const estimatedCostUsd = allKnown
    ? Math.round(total * 1_000_000) / 1_000_000
    : null;

  if (
    limits.maxEstimatedCostUsd > 0 &&
    estimatedCostUsd !== null &&
    estimatedCostUsd > limits.maxEstimatedCostUsd
  ) {
    return {
      allowed: false,
      reason: "cost_ceiling_exceeded",
      estimatedCostUsd,
    };
  }

  return { allowed: true, estimatedCostUsd };
}

export function shouldStopForCost(
  accumulatedCostUsd: number,
  limits: EvaluationLimits,
): boolean {
  return (
    limits.maxEstimatedCostUsd > 0 &&
    accumulatedCostUsd >= limits.maxEstimatedCostUsd
  );
}
