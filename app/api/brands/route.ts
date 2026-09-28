import { NextResponse } from "next/server";
import { listBrands } from "@/brands/repository";

export const runtime = "nodejs";

export async function GET() {
  const brands = await listBrands();
  return NextResponse.json({ brands });
}
