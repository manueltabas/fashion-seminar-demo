import { NextResponse } from "next/server";
import { capturePdp, listFetches } from "@/capture/repository";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fetches = await listFetches(id);
  return NextResponse.json({ fetches });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await capturePdp(id);
  if ("error" in result) {
    return NextResponse.json({ error: "pdp not found" }, { status: 404 });
  }
  return NextResponse.json(result, { status: 201 });
}
