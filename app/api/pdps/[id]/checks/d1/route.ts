import { NextResponse } from "next/server";
import { runD1ForPdp } from "@/checks/repository";
import { summarize } from "@/checks/summary";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await runD1ForPdp(id);
  if ("error" in result) {
    const status = result.error === "pdp_not_found" ? 404 : 422;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({
    findings: result.findings,
    summary: summarize(result.findings),
  });
}
