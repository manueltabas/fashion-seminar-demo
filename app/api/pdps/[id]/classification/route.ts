import { NextResponse } from "next/server";
import { classifyPdp } from "@/capture/classifyRepository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await classifyPdp(id);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}
