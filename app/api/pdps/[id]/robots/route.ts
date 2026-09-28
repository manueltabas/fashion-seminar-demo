import { NextResponse } from "next/server";
import {
  captureRobots,
  getLatestRobotsReport,
} from "@/capture/robotsRepository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const report = await getLatestRobotsReport(id);
  if (!report) {
    return NextResponse.json(
      { error: "no robots report found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ report });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await captureRobots(id);
  if ("error" in result) {
    return NextResponse.json({ error: "pdp not found" }, { status: 404 });
  }
  return NextResponse.json(result, { status: 201 });
}
