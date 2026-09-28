import { parseShopperRequest } from "../seminar/request";
import { desc, eq } from "drizzle-orm";
import { addPdpWithBrand, getPdp } from "../brands/repository";
import type { DetectionResult } from "../capture/classify";
import { classifyPdp } from "../capture/classifyRepository";
import {
  getLatestNormalization,
  getNormalizationById,
  normalizePdp,
} from "../capture/normalizeRepository";
import { capturePdp } from "../capture/repository";
import { getLatestFetchRow } from "../capture/repository";
import { detectJsRendered } from "../capture/js-detect";
import {
  runD1ForPdp,
  runD2ForPdp,
  runD3ForPdp,
  runD4ForPdp,
} from "../checks/repository";
import type { Finding } from "../checks/types";
import { getDb } from "../db/client";
import {
  evaluations,
  modelEvaluations,
  type Evaluation,
  type EvaluationStatus,
  type ModelEvaluation,
} from "../db/schema";
import { enqueueJob } from "../jobs/queue";
import { getModelProfile } from "../models/repository";
import { createProvider } from "../providers/factory";
import type { ProviderName } from "../providers/types";
import { mapRecommendations, type Recommendation } from "../recommendations";
import {
  aggregateDimensionScores,
  modelOutputToFindings,
  scoreDimensions,
  type DimensionScore,
} from "../scoring";
import { isTerminalStatus } from "./status";
import { checkLimits, getEvaluationLimits, shouldStopForCost } from "./limits";
import { recordStep } from "./observability";
import { buildModelEvaluationValues, runAndRecordModelEvaluation } from "./repository";
import { evaluateWithModel } from "./run";
import type { ModelJudgedCheck } from "./validate";

export type EvaluationScores = {
  perModel: Array<
    | {
        modelProfileId: string | null;
        provider: string;
        model: string;
        status: "completed";
        scores: Record<string, DimensionScore>;
      }
    | {
        modelProfileId: string | null;
        provider: string;
        model: string;
        status: "failed";
      }
  >;
  aggregate: Record<string, number | null>;
};

export type ScorableModelEvaluation = {
  modelProfileId: string | null;
  provider: string;
  model: string;
  status: string;
  checks: ModelJudgedCheck[];
};

export function computeEvaluationScores(
  deterministicFindings: Finding[],
  modelRows: ScorableModelEvaluation[],
): {
  perModel: EvaluationScores["perModel"];
  aggregate: EvaluationScores["aggregate"];
  allModelFindings: Finding[];
} {
  const perModel: EvaluationScores["perModel"] = [];
  const completedScores: Record<string, DimensionScore>[] = [];
  const allModelFindings: Finding[] = [];

  for (const row of modelRows) {
    if (row.status !== "completed") {
      perModel.push({
        modelProfileId: row.modelProfileId,
        provider: row.provider,
        model: row.model,
        status: "failed",
      });
      continue;
    }
    const modelFindings = modelOutputToFindings({
      checks: row.checks,
      brandPerception: "",
      recommendationFit: "",
    });
    allModelFindings.push(...modelFindings);
    const scores = scoreDimensions([...deterministicFindings, ...modelFindings]);
    completedScores.push(scores);
    perModel.push({
      modelProfileId: row.modelProfileId,
      provider: row.provider,
      model: row.model,
      status: "completed",
      scores,
    });
  }

  return {
    perModel,
    aggregate: aggregateDimensionScores(completedScores),
    allModelFindings,
  };
}

export function resolveEvaluationStatus(
  completed: number,
  total: number,
): { status: EvaluationStatus; reason: string | null } {
  if (completed === 0) {
    return { status: "failed", reason: "all_models_failed" };
  }
  if (completed === total) {
    return { status: "completed", reason: null };
  }
  return {
    status: "partial",
    reason: `models_failed:${total - completed}/${total}`,
  };
}

export type CreateEvaluationInput = {
  url?: string;
  pdpId?: string;
  modelProfileIds: string[];
  title?: string;
  brandName?: string;
  shopperRequest?: string;
};

export type CreateEvaluationResult =
  | { evaluation: Evaluation }
  | {
      error:
        | "invalid_request"
        | "pdp_not_found"
        | "profile_not_found"
        | "too_many_models"
        | "cost_ceiling_exceeded";
    };

export async function createEvaluation(
  input: CreateEvaluationInput,
): Promise<CreateEvaluationResult> {
  const request = parseShopperRequest(input.shopperRequest);
  if (!request.ok) return { error: "invalid_request" };
  if (input.modelProfileIds.length === 0) {
    return { error: "invalid_request" };
  }

  const profiles = await Promise.all(
    input.modelProfileIds.map((id) => getModelProfile(id)),
  );
  if (profiles.some((profile) => !profile)) {
    return { error: "profile_not_found" };
  }
  const limitCheck = checkLimits(
    profiles.map((profile) => profile!.model),
    getEvaluationLimits(),
  );
  if (!limitCheck.allowed) {
    return { error: limitCheck.reason ?? "invalid_request" };
  }

  let pdpId = input.pdpId;
  if (pdpId) {
    const pdp = await getPdp(pdpId);
    if (!pdp) {
      return { error: "pdp_not_found" };
    }
  } else if (input.url) {
    const added = await addPdpWithBrand({
      url: input.url,
      title: input.title,
      brandName: input.brandName,
    });
    pdpId = added.pdp.id;
  } else {
    return { error: "invalid_request" };
  }

  const [evaluation] = await getDb()
    .insert(evaluations)
    .values({ pdpId, modelProfileIds: input.modelProfileIds, shopperRequest: request.value })
    .returning();

  await enqueueJob({
    type: "evaluation.run",
    payload: { evaluationId: evaluation.id },
  });

  return { evaluation };
}

export async function getEvaluation(
  id: string,
): Promise<Evaluation | undefined> {
  const [row] = await getDb()
    .select()
    .from(evaluations)
    .where(eq(evaluations.id, id))
    .limit(1);
  return row;
}

export async function listEvaluations(limit = 20): Promise<Evaluation[]> {
  return getDb()
    .select()
    .from(evaluations)
    .orderBy(desc(evaluations.createdAt))
    .limit(limit);
}

export async function listEvaluationsForPdp(
  pdpId: string,
  limit = 20,
): Promise<Evaluation[]> {
  return getDb()
    .select()
    .from(evaluations)
    .where(eq(evaluations.pdpId, pdpId))
    .orderBy(desc(evaluations.createdAt))
    .limit(limit);
}

export async function getLatestEvaluationForPdp(
  pdpId: string,
): Promise<Evaluation | undefined> {
  const [row] = await getDb()
    .select()
    .from(evaluations)
    .where(eq(evaluations.pdpId, pdpId))
    .orderBy(desc(evaluations.createdAt))
    .limit(1);
  return row;
}

export async function listEvaluationModelResults(
  evaluationId: string,
): Promise<ModelEvaluation[]> {
  return getDb()
    .select()
    .from(modelEvaluations)
    .where(eq(modelEvaluations.evaluationId, evaluationId));
}

async function updateEvaluation(
  id: string,
  patch: Partial<Evaluation>,
): Promise<void> {
  await getDb()
    .update(evaluations)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(evaluations.id, id));
}

export type RunEvaluationResult = {
  status: EvaluationStatus;
  reason?: string;
};

export async function runEvaluation(
  evaluationId: string,
): Promise<RunEvaluationResult> {
  const evaluation = await getEvaluation(evaluationId);
  if (!evaluation) {
    throw new Error(`evaluation ${evaluationId} not found`);
  }

  await updateEvaluation(evaluationId, {
    status: "fetching",
    startedAt: new Date(),
    reason: null,
    error: null,
  });

  const fail = async (
    reason: string,
    classification?: DetectionResult,
  ): Promise<RunEvaluationResult> => {
    await updateEvaluation(evaluationId, {
      status: "failed",
      reason,
      error: reason,
      finishedAt: new Date(),
      classification: classification ?? evaluation.classification,
    });
    return { status: "failed", reason };
  };

  const pdp = await getPdp(evaluation.pdpId);
  if (!pdp) {
    await recordStep({
      evaluationId,
      name: "resolve_pdp",
      status: "failed",
      message: "pdp_not_found",
    });
    return fail("pdp_not_found");
  }

  const fetchStart = Date.now();
  const capture = await capturePdp(pdp.id);
  const fetchDuration = Date.now() - fetchStart;
  if ("error" in capture) {
    await recordStep({
      evaluationId,
      name: "fetch",
      status: "failed",
      message: capture.error,
      durationMs: fetchDuration,
    });
    return fail(capture.error);
  }
  if (capture.fetch.blocked) {
    const reason = `fetch_blocked:${capture.fetch.blockReason ?? "blocked"}`;
    await recordStep({
      evaluationId,
      name: "fetch",
      status: "failed",
      message: reason,
      durationMs: fetchDuration,
      metadata: { statusCode: capture.fetch.statusCode },
    });
    return fail(reason);
  }
  if (!capture.fetch.ok && capture.fetch.htmlLength === 0) {
    const reason = `fetch_failed:${capture.fetch.statusCode}`;
    await recordStep({
      evaluationId,
      name: "fetch",
      status: "failed",
      message: reason,
      durationMs: fetchDuration,
      metadata: { statusCode: capture.fetch.statusCode },
    });
    return fail(reason);
  }
  await recordStep({
    evaluationId,
    name: "fetch",
    status: "ok",
    durationMs: fetchDuration,
    metadata: {
      statusCode: capture.fetch.statusCode,
      htmlLength: capture.fetch.htmlLength,
      blocked: capture.fetch.blocked,
    },
  });

  const normalizeStart = Date.now();
  const normalization = await normalizePdp(pdp.id, { fetchId: capture.fetch.id });
  const normalizeDuration = Date.now() - normalizeStart;
  if ("error" in normalization) {
    await recordStep({
      evaluationId,
      name: "normalize",
      status: "failed",
      message: normalization.error,
      durationMs: normalizeDuration,
    });
    return fail(normalization.error);
  }
  await recordStep({
    evaluationId,
    name: "normalize",
    status: "ok",
    durationMs: normalizeDuration,
    metadata: {
      textLength: normalization.normalization.textLength,
      jsonLdBlocks: normalization.normalization.jsonLd.length,
    },
  });

  await updateEvaluation(evaluationId, { normalizationId: normalization.normalization.id });
  const fetchRow = await getLatestFetchRow(pdp.id);
  const jsHeavy =
    typeof fetchRow?.rawHtml === "string" &&
    detectJsRendered({
      html: fetchRow.rawHtml,
      content: normalization.normalization.content,
    });

  const classifyStart = Date.now();
  const classification = await classifyPdp(pdp.id);
  const classifyDuration = Date.now() - classifyStart;
  const classificationResult =
    "result" in classification ? classification.result : null;
  if (
    classificationResult &&
    ["error", "homepage", "category"].includes(
      classificationResult.classification,
    )
  ) {
    const reason = `not_a_pdp:${classificationResult.classification}`;
    await recordStep({
      evaluationId,
      name: "classify",
      status: "failed",
      message: reason,
      durationMs: classifyDuration,
      metadata: { classification: classificationResult.classification },
    });
    return fail(reason, classificationResult);
  }
  await recordStep({
    evaluationId,
    name: "classify",
    status: "ok",
    durationMs: classifyDuration,
    metadata: {
      classification: classificationResult?.classification ?? "unknown",
    },
  });

  await updateEvaluation(evaluationId, {
    status: "evaluating",
    classification: classificationResult,
    jsHeavy,
  });

  const checksStart = Date.now();
  const findings: Finding[] = [];
  for (const run of [runD1ForPdp, runD2ForPdp, runD3ForPdp, runD4ForPdp]) {
    const result = await run(pdp.id);
    if ("findings" in result) {
      findings.push(...result.findings);
    }
  }
  await updateEvaluation(evaluationId, { deterministicFindings: findings });
  await recordStep({
    evaluationId,
    name: "deterministic_checks",
    status: "ok",
    durationMs: Date.now() - checksStart,
    metadata: {
      findings: findings.length,
      fail: findings.filter((finding) => finding.status === "fail").length,
      partial: findings.filter((finding) => finding.status === "partial").length,
    },
  });

  const limits = getEvaluationLimits();
  let accumulatedCost = 0;
  let stoppedForCost = false;
  for (const modelProfileId of evaluation.modelProfileIds) {
    if (shouldStopForCost(accumulatedCost, limits)) {
      stoppedForCost = true;
      await recordStep({
        evaluationId,
        name: "cost_ceiling",
        status: "failed",
        message: `cost_ceiling_exceeded:${accumulatedCost}`,
        metadata: { accumulatedCostUsd: accumulatedCost },
      });
      break;
    }
    const modelStart = Date.now();
    const outcome = await runAndRecordModelEvaluation({
      pdpId: pdp.id,
      evaluationId,
      modelProfileId,
      maxTokens: evaluation.shopperRequest ? 6000 : 4096,
      shopperRequest: evaluation.shopperRequest,
      normalizationId: normalization.normalization.id,
    });
    const record = "evaluation" in outcome ? outcome.evaluation : null;
    await recordStep({
      evaluationId,
      name: `model:${record?.model ?? modelProfileId}`,
      status: record?.status === "completed" ? "ok" : "failed",
      message: record?.error ?? undefined,
      durationMs: Date.now() - modelStart,
      metadata: {
        provider: record?.provider,
        attempts: record?.attempts,
        ...((record?.usage ?? {}) as Record<string, unknown>),
      },
    });
    accumulatedCost += record?.usage?.estimatedCostUsd ?? 0;
  }

  const scoringStart = Date.now();
  const modelRows = (await listEvaluationModelResults(evaluationId)).map(
    (row) => ({
      modelProfileId: row.modelProfileId,
      provider: row.provider,
      model: row.model,
      status: row.status,
      checks: row.checks,
    }),
  );

  const { perModel, aggregate, allModelFindings } = computeEvaluationScores(
    findings,
    modelRows,
  );
  const recommendations: Recommendation[] = mapRecommendations([
    ...findings,
    ...allModelFindings,
  ]);
  await recordStep({
    evaluationId,
    name: "scoring",
    status: "ok",
    durationMs: Date.now() - scoringStart,
    metadata: { aggregate },
  });

  const completedCount = perModel.filter(
    (row) => row.status === "completed",
  ).length;
  const totalModels = evaluation.modelProfileIds.length || perModel.length;
  const resolved = resolveEvaluationStatus(completedCount, totalModels);
  const status = resolved.status;
  const reason = stoppedForCost ? "cost_ceiling_exceeded" : resolved.reason;

  await updateEvaluation(evaluationId, {
    status,
    reason,
    scores: { perModel, aggregate },
    recommendations,
    finishedAt: new Date(),
  });

  return { status };
}

export type RetryFailedModelsResult =
  | { evaluation: Evaluation; retried: number; stillFailed: number }
  | { error: "evaluation_not_found" | "not_retryable" };

export async function retryFailedModels(
  evaluationId: string,
): Promise<RetryFailedModelsResult> {
  const evaluation = await getEvaluation(evaluationId);
  if (!evaluation) {
    return { error: "evaluation_not_found" };
  }
  if (!isTerminalStatus(evaluation.status)) {
    return { error: "not_retryable" };
  }

  const rows = await listEvaluationModelResults(evaluationId);
  const failed = rows.filter((row) => row.status !== "completed");
  if (failed.length === 0) {
    return { error: "not_retryable" };
  }

  const pdp = await getPdp(evaluation.pdpId);
  const normalization = evaluation.normalizationId
    ? await getNormalizationById(evaluation.normalizationId)
    : evaluation.shopperRequest ? undefined : await getLatestNormalization(evaluation.pdpId);
  if (!pdp || !normalization) {
    return { error: "not_retryable" };
  }

  await updateEvaluation(evaluationId, { status: "evaluating", reason: null });

  const db = getDb();
  for (const row of failed) {
    const retryStart = Date.now();
    let apiKey: string | undefined;
    if (row.modelProfileId) {
      const profile = await getModelProfile(row.modelProfileId);
      if (profile) {
        apiKey = process.env[profile.credentialRef];
      }
    }
    const provider = createProvider(
      row.provider as ProviderName,
      apiKey !== undefined ? { apiKey } : {},
    );
    const result = await evaluateWithModel({
      provider,
      model: row.model,
      maxTokens: evaluation.shopperRequest ? 6000 : 4096,
      content: {
        shopperRequest: evaluation.shopperRequest,
        url: pdp.url,
        title: normalization.title ?? undefined,
        truncated: normalization.truncated,
        jsonLd: normalization.jsonLd,
        content: normalization.content,
      },
    });
    await db
      .update(modelEvaluations)
      .set(
        buildModelEvaluationValues({
          pdpId: evaluation.pdpId,
          evaluationId,
          modelProfileId: row.modelProfileId,
          provider: row.provider as ProviderName,
          model: row.model,
          result,
        }),
      )
      .where(eq(modelEvaluations.id, row.id));
    await recordStep({
      evaluationId,
      name: `retry:${row.model}`,
      status: result.status === "completed" ? "ok" : "failed",
      message: result.status === "failed" ? result.error : undefined,
      durationMs: Date.now() - retryStart,
      metadata: {
        attempts: result.attempts,
        ...((result.status === "completed" ? result.usage : {}) ?? {}),
      },
    });
  }

  const updatedRows = await listEvaluationModelResults(evaluationId);
  const scorable = updatedRows.map((row) => ({
    modelProfileId: row.modelProfileId,
    provider: row.provider,
    model: row.model,
    status: row.status,
    checks: row.checks,
  }));
  const { perModel, aggregate, allModelFindings } = computeEvaluationScores(
    evaluation.deterministicFindings,
    scorable,
  );
  const recommendations = mapRecommendations([
    ...evaluation.deterministicFindings,
    ...allModelFindings,
  ]);
  const completed = perModel.filter((row) => row.status === "completed").length;
  const { status, reason } = resolveEvaluationStatus(completed, perModel.length);

  const [updated] = await db
    .update(evaluations)
    .set({
      status,
      reason,
      scores: { perModel, aggregate },
      recommendations,
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(evaluations.id, evaluationId))
    .returning();

  return {
    evaluation: updated,
    retried: failed.length,
    stillFailed: perModel.length - completed,
  };
}
