import { parseShopperRequest } from "@/seminar/request";
import { NextResponse } from "next/server";
import {
  createEvaluation,
  listEvaluations,
} from "@/evaluation/orchestrator";

export const runtime = "nodejs";

export async function GET() {
  const evaluations = await listEvaluations();
  return NextResponse.json({ evaluations });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    url?: unknown;
    pdpId?: unknown;
    modelProfileIds?: unknown;
    title?: unknown;
    brandName?: unknown;
    shopperRequest?: unknown;
  } | null;

  const shopperRequest = parseShopperRequest(body?.shopperRequest);
  if (!shopperRequest.ok) {
    return NextResponse.json({ error: shopperRequest.error }, { status: 400 });
  }

  const modelProfileIds = Array.isArray(body?.modelProfileIds)
    ? body.modelProfileIds.filter((id): id is string => typeof id === "string")
    : [];

  if (modelProfileIds.length === 0) {
    return NextResponse.json(
      { error: "modelProfileIds must be a non-empty string array" },
      { status: 400 },
    );
  }

  const url = typeof body?.url === "string" ? body.url : undefined;
  const pdpId = typeof body?.pdpId === "string" ? body.pdpId : undefined;
  if (!url && !pdpId) {
    return NextResponse.json(
      { error: "provide a url or a pdpId" },
      { status: 400 },
    );
  }

  if (url) {
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "url must be a valid absolute URL" },
        { status: 400 },
      );
    }
  }

  const result = await createEvaluation({
    url,
    pdpId,
    shopperRequest: shopperRequest.value ?? undefined,
    modelProfileIds,
    title: typeof body?.title === "string" ? body.title : undefined,
    brandName: typeof body?.brandName === "string" ? body.brandName : undefined,
  });

  if ("error" in result) {
    const status =
      result.error === "pdp_not_found" || result.error === "profile_not_found"
        ? 404
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result, { status: 201 });
}
