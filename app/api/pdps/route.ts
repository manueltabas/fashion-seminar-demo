import { NextResponse } from "next/server";
import { addPdpWithBrand, listPdps } from "@/brands/repository";

export const runtime = "nodejs";

export async function GET() {
  const pdps = await listPdps();
  return NextResponse.json({ pdps });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    url?: unknown;
    brandName?: unknown;
    title?: unknown;
    structuredData?: unknown;
  } | null;

  if (!body || typeof body.url !== "string") {
    return NextResponse.json(
      { error: "url is required and must be a string" },
      { status: 400 },
    );
  }

  try {
    new URL(body.url);
  } catch {
    return NextResponse.json(
      { error: "url must be a valid absolute URL" },
      { status: 400 },
    );
  }

  if (body.brandName !== undefined && typeof body.brandName !== "string") {
    return NextResponse.json(
      { error: "brandName must be a string" },
      { status: 400 },
    );
  }

  if (body.title !== undefined && typeof body.title !== "string") {
    return NextResponse.json({ error: "title must be a string" }, { status: 400 });
  }

  const result = await addPdpWithBrand({
    url: body.url,
    brandName: typeof body.brandName === "string" ? body.brandName : undefined,
    title: typeof body.title === "string" ? body.title : undefined,
    structuredData: body.structuredData,
  });

  return NextResponse.json(result, { status: result.created ? 201 : 200 });
}
