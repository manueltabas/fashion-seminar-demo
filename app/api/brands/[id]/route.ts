import { NextResponse } from "next/server";
import { renameBrand } from "@/brands/repository";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
  } | null;

  if (
    !body ||
    typeof body.name !== "string" ||
    body.name.trim() === ""
  ) {
    return NextResponse.json(
      { error: "name is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  const brand = await renameBrand(id, body.name.trim());
  if (!brand) {
    return NextResponse.json({ error: "brand not found" }, { status: 404 });
  }
  return NextResponse.json({ brand });
}
