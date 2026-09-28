import { NextResponse } from "next/server";
import { listModelProfiles } from "@/models/repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const enabledOnly =
    new URL(request.url).searchParams.get("enabled") === "true";
  const profiles = await listModelProfiles({ enabledOnly });
  return NextResponse.json({ profiles });
}
