import type { Job } from "../db/schema";
import { runEvaluation } from "../evaluation/orchestrator";

export type JobHandlerContext = Pick<Job, "id" | "attempts">;

export type JobHandler = (
  payload: Record<string, unknown>,
  context: JobHandlerContext,
) => Promise<unknown>;

const handlers = new Map<string, JobHandler>();

export function registerJobHandler(type: string, handler: JobHandler): void {
  handlers.set(type, handler);
}

export function getJobHandler(type: string): JobHandler | undefined {
  return handlers.get(type);
}

registerJobHandler("sample.echo", async (payload) => ({ echoed: payload }));
registerJobHandler("sample.fail", async () => {
  throw new Error("sample job failed as requested");
});

registerJobHandler("evaluation.run", async (payload) => {
  const evaluationId =
    typeof payload.evaluationId === "string" ? payload.evaluationId : "";
  if (!evaluationId) {
    throw new Error("evaluation.run requires an evaluationId");
  }
  return runEvaluation(evaluationId);
});
