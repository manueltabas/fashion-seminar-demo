import { NextResponse } from "next/server";
import { enqueueJob, listJobs } from "@/jobs/queue";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam) || 20, 100) : 20;
  const jobs = await listJobs(limit);
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    type?: unknown;
    payload?: unknown;
    runAt?: unknown;
    maxAttempts?: unknown;
  } | null;

  if (!body || typeof body.type !== "string" || body.type.trim() === "") {
    return NextResponse.json(
      { error: "type is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  if (body.payload !== undefined && typeof body.payload !== "object") {
    return NextResponse.json(
      { error: "payload must be an object" },
      { status: 400 },
    );
  }

  const payload = (body.payload as Record<string, unknown> | undefined) ?? {};
  const job = await enqueueJob({
    type: body.type,
    payload,
    runAt: typeof body.runAt === "string" ? new Date(body.runAt) : undefined,
    maxAttempts:
      typeof body.maxAttempts === "number" ? body.maxAttempts : undefined,
  });

  return NextResponse.json({ job }, { status: 201 });
}
