import { NextResponse } from "next/server";
import { runD4ForPdp } from "@/checks/repository";
import { summarize } from "@/checks/summary";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await runD4ForPdp(id);
  if ("error" in result) {
    const status = result.error === "pdp_not_found" ? 404 : 422;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({
    findings: result.findings,
    summary: summarize(result.findings),
  });
}
