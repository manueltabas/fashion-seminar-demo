import { NextResponse } from "next/server";
import { MergeError, mergeBrands } from "@/brands/repository";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    targetId?: unknown;
  } | null;

  if (!body || typeof body.targetId !== "string") {
    return NextResponse.json(
      { error: "targetId is required and must be a string" },
      { status: 400 },
    );
  }

  try {
    const brand = await mergeBrands(id, body.targetId);
    if (!brand) {
      return NextResponse.json(
        { error: "source or target brand not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ brand });
  } catch (error) {
    if (error instanceof MergeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
