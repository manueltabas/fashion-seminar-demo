"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Drives evaluation processing from the browser: while the evaluation is not
 * terminal it asks the server to process queued jobs, polls the status, and
 * refreshes the page so progress and results appear without a separate worker.
 */
export function ReportRefresh({
  evaluationId,
  status,
}: {
  evaluationId: string;
  status: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const active =
      status === "created" || status === "fetching" || status === "evaluating";
    if (!active) {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      // Kick processing. This request may run the whole evaluation; it is
      // intentionally not awaited so we can keep polling status meanwhile.
      void fetch("/api/jobs/drain", { method: "POST" }).catch(() => {});
      try {
        const response = await fetch(
          `/api/evaluations/${evaluationId}/status`,
        );
        if (response.ok) {
          const data = (await response.json()) as { isTerminal?: boolean };
          if (data.isTerminal) {
            router.refresh();
            if (!cancelled) {
              clearInterval(timer);
            }
            return;
          }
        }
      } catch {
        // ignore transient errors
      }
      router.refresh();
    };

    void tick();
    const timer = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [evaluationId, router, status]);

  return null;
}
