import { notFound, redirect } from "next/navigation";
import { getLatestEvaluationForPdp } from "@/evaluation/orchestrator";

export const dynamic = "force-dynamic";

export default async function PdpReportRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const latest = await getLatestEvaluationForPdp(id);
  if (!latest) {
    notFound();
  }
  redirect(`/evaluations/${latest.id}`);
}
