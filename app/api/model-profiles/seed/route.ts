import { NextResponse } from "next/server";
import { seedModelProfiles } from "@/models/repository";

export const runtime = "nodejs";

export async function POST() {
  const result = await seedModelProfiles();
  return NextResponse.json(result);
}
