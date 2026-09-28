import { NextResponse } from "next/server";
import { setModelProfileEnabled } from "@/models/repository";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    enabled?: unknown;
  } | null;

  if (!body || typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "enabled must be a boolean" },
      { status: 400 },
    );
  }

  const profile = await setModelProfileEnabled(id, body.enabled);
  if (!profile) {
    return NextResponse.json({ error: "profile not found" }, { status: 404 });
  }
  return NextResponse.json({ profile });
}
