import { NextResponse } from "next/server";
import { retryFailedModels } from "@/evaluation/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await retryFailedModels(id);
  if ("error" in result) {
    const status = result.error === "evaluation_not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
