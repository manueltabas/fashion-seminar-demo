import { NextResponse } from "next/server";
import { checkDatabase } from "@/db/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabase();
  return NextResponse.json(
    {
      status: database.ok ? "ok" : "degraded",
      database,
    },
    { status: database.ok ? 200 : 503 },
  );
}
