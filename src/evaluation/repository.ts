import { desc, eq } from "drizzle-orm";
import { getPdp } from "../brands/repository";
import { getDb } from "../db/client";
import {
  modelEvaluations,
  type ModelEvaluation,
  type NewModelEvaluation,
} from "../db/schema";
import { getLatestNormalization, getNormalizationById } from "../capture/normalizeRepository";
import { getModelProfile } from "../models/repository";
import { createProvider } from "../providers/factory";
import type { ProviderName } from "../providers/types";
import { evaluateWithModel, type ModelEvaluationResult } from "./run";

export type RecordModelEvaluationInput = {
  pdpId: string;
  evaluationId?: string | null;
  modelProfileId?: string | null;
  provider: ProviderName;
  model: string;
  result: ModelEvaluationResult;
};

export function buildModelEvaluationValues(
  input: RecordModelEvaluationInput,
): NewModelEvaluation {
  const { result } = input;
  return {
    pdpId: input.pdpId,
    evaluationId: input.evaluationId ?? null,
    modelProfileId: input.modelProfileId ?? null,
    provider: input.provider,
    model: input.model,
    status: result.status,
    attempts: result.attempts,
    brandPerception:
      result.status === "completed" ? result.output.brandPerception : null,
    recommendationFit:
      result.status === "completed" ? result.output.recommendationFit : null,
    shopperAssessment: result.status === "completed" ? result.output.shopperAssessment ?? null : null,
    checks: result.status === "completed" ? result.output.checks : [],
    usage: result.status === "completed" ? (result.usage ?? null) : null,
    error: result.status === "failed" ? result.error : null,
    errors: result.status === "failed" ? result.errors : [],
  };
}

export async function recordModelEvaluation(
  input: RecordModelEvaluationInput,
): Promise<ModelEvaluation> {
  const [row] = await getDb()
    .insert(modelEvaluations)
    .values(buildModelEvaluationValues(input))
    .returning();
  return row;
}

export async function getModelEvaluation(
  id: string,
): Promise<ModelEvaluation | undefined> {
  const [row] = await getDb()
    .select()
    .from(modelEvaluations)
    .where(eq(modelEvaluations.id, id))
    .limit(1);
  return row;
}

export async function listModelEvaluations(
  pdpId: string,
): Promise<ModelEvaluation[]> {
  return getDb()
    .select()
    .from(modelEvaluations)
    .where(eq(modelEvaluations.pdpId, pdpId))
    .orderBy(desc(modelEvaluations.createdAt));
}

export type RunAndRecordInput = {
  pdpId: string;
  evaluationId?: string;
  modelProfileId?: string;
  provider?: ProviderName;
  model?: string;
  maxTokens?: number;
  shopperRequest?: string | null;
  normalizationId?: string;
};

export type RunAndRecordResult =
  | { evaluation: ModelEvaluation }
  | {
      error:
        | "pdp_not_found"
        | "no_normalization"
        | "profile_not_found"
        | "invalid_request";
    };

export async function runAndRecordModelEvaluation(
  input: RunAndRecordInput,
): Promise<RunAndRecordResult> {
  const pdp = await getPdp(input.pdpId);
  if (!pdp) {
    return { error: "pdp_not_found" };
  }

  const normalization = input.normalizationId
    ? await getNormalizationById(input.normalizationId)
    : await getLatestNormalization(input.pdpId);
  if (!normalization || normalization.pdpId !== input.pdpId) {
    return { error: "no_normalization" };
  }

  let providerName: ProviderName;
  let model: string;
  let apiKey: string | undefined;
  let modelProfileId: string | null = null;

  if (input.modelProfileId) {
    const profile = await getModelProfile(input.modelProfileId);
    if (!profile) {
      return { error: "profile_not_found" };
    }
    providerName = profile.provider;
    model = profile.model;
    apiKey = process.env[profile.credentialRef];
    modelProfileId = profile.id;
  } else if (input.provider && input.model) {
    providerName = input.provider;
    model = input.model;
  } else {
    return { error: "invalid_request" };
  }

  const provider = createProvider(
    providerName,
    apiKey !== undefined ? { apiKey } : {},
  );

  const result = await evaluateWithModel({
    provider,
    model,
    maxTokens: input.maxTokens,
    content: {
      shopperRequest: input.shopperRequest,
      url: pdp.url,
      title: normalization.title ?? undefined,
      truncated: normalization.truncated,
      jsonLd: normalization.jsonLd,
      content: normalization.content,
    },
  });

  const evaluation = await recordModelEvaluation({
    pdpId: input.pdpId,
    evaluationId: input.evaluationId ?? null,
    modelProfileId,
    provider: providerName,
    model,
    result,
  });

  return { evaluation };
}
