import { NextResponse } from "next/server";
import { providerNames, type ProviderName } from "@/providers/types";
import {
  listModelEvaluations,
  runAndRecordModelEvaluation,
} from "@/evaluation/repository";

export const runtime = "nodejs";
export const maxDuration = 60;

function isProvider(value: unknown): value is ProviderName {
  return (
    typeof value === "string" &&
    (providerNames as readonly string[]).includes(value)
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const evaluations = await listModelEvaluations(id);
  return NextResponse.json({ evaluations });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    modelProfileId?: unknown;
    provider?: unknown;
    model?: unknown;
    maxTokens?: unknown;
  } | null;

  const modelProfileId =
    typeof body?.modelProfileId === "string" ? body.modelProfileId : undefined;
  const provider = isProvider(body?.provider) ? body.provider : undefined;
  const model = typeof body?.model === "string" ? body.model : undefined;
  const maxTokens =
    typeof body?.maxTokens === "number" ? body.maxTokens : undefined;

  if (!modelProfileId && !(provider && model)) {
    return NextResponse.json(
      { error: "provide modelProfileId or both provider and model" },
      { status: 400 },
    );
  }

  const result = await runAndRecordModelEvaluation({
    pdpId: id,
    modelProfileId,
    provider,
    model,
    maxTokens,
  });

  if ("error" in result) {
    const status =
      result.error === "pdp_not_found" || result.error === "profile_not_found"
        ? 404
        : result.error === "no_normalization"
          ? 422
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result, { status: 201 });
}
