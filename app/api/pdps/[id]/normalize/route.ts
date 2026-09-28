import { NextResponse } from "next/server";
import {
  getLatestNormalization,
  normalizePdp,
} from "@/capture/normalizeRepository";

export const runtime = "nodejs";

const ERROR_STATUS: Record<string, number> = {
  pdp_not_found: 404,
  fetch_not_found: 404,
  no_html: 422,
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const normalization = await getLatestNormalization(id);
  if (!normalization) {
    return NextResponse.json(
      { error: "no normalization found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ normalization });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    fetchId?: unknown;
  } | null;
  const result = await normalizePdp(id, {
    fetchId: typeof body?.fetchId === "string" ? body.fetchId : undefined,
  });
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: ERROR_STATUS[result.error] ?? 400 },
    );
  }
  return NextResponse.json(result, { status: 201 });
}
