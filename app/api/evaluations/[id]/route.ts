import { NextResponse } from "next/server";
import {
  getEvaluation,
  listEvaluationModelResults,
} from "@/evaluation/orchestrator";

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
  const modelResults = await listEvaluationModelResults(id);
  return NextResponse.json({ evaluation, modelResults });
}
