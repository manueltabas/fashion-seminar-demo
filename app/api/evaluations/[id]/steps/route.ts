import { NextResponse } from "next/server";
import { listSteps } from "@/evaluation/observability";
import { getEvaluation } from "@/evaluation/orchestrator";

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
  const steps = await listSteps(id);
  return NextResponse.json({ steps });
}
