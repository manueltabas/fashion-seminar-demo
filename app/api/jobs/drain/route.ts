import { NextResponse } from "next/server";
import { drainOnce } from "@/jobs/queue";

export const runtime = "nodejs";

export async function POST() {
  let processed = 0;
  for (;;) {
    const { processed: count } = await drainOnce();
    if (count === 0) {
      break;
    }
    processed += count;
  }
  return NextResponse.json({ processed });
}
