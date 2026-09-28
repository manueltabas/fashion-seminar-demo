import { asc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { evaluationSteps, type EvaluationStep } from "../db/schema";

export type RecordStepInput = {
  evaluationId: string;
  name: string;
  status: "ok" | "failed";
  message?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

export async function recordStep(input: RecordStepInput): Promise<void> {
  await getDb()
    .insert(evaluationSteps)
    .values({
      evaluationId: input.evaluationId,
      name: input.name,
      status: input.status,
      message: input.message,
      durationMs: input.durationMs,
      metadata: input.metadata ?? {},
    });
}

export async function listSteps(
  evaluationId: string,
): Promise<EvaluationStep[]> {
  return getDb()
    .select()
    .from(evaluationSteps)
    .where(eq(evaluationSteps.evaluationId, evaluationId))
    .orderBy(asc(evaluationSteps.createdAt));
}
