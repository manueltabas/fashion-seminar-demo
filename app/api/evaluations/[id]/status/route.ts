import { NextResponse } from "next/server";
import { getEvaluation } from "@/evaluation/orchestrator";
import {
  describeEvaluationStatus,
  isTerminalStatus,
} from "@/evaluation/status";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const evaluation = await getEvaluation(id);
  if (!evaluation) {
    return NextResponse.json(
      { error: "evaluation not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    id: evaluation.id,
    status: evaluation.status,
    label: describeEvaluationStatus(evaluation.status),
    reason: evaluation.reason,
    isTerminal: isTerminalStatus(evaluation.status),
    startedAt: evaluation.startedAt,
    finishedAt: evaluation.finishedAt,
  });
}
