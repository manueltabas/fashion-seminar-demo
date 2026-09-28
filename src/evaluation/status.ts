import { evaluationStatuses, type EvaluationStatus } from "../db/schema";

export { evaluationStatuses };
export type { EvaluationStatus };

export function isTerminalStatus(status: EvaluationStatus): boolean {
  return status === "completed" || status === "partial" || status === "failed";
}

const DESCRIPTIONS: Record<EvaluationStatus, string> = {
  created: "Evaluation created and queued for processing.",
  fetching: "Fetching and normalizing the PDP.",
  evaluating: "Running deterministic checks and model evaluations.",
  completed: "All selected models completed successfully.",
  partial: "Some models failed; the results are partial.",
  failed: "The evaluation failed.",
};

export function describeEvaluationStatus(status: EvaluationStatus): string {
  return DESCRIPTIONS[status];
}
