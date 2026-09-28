"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryButton({ evaluationId }: { evaluationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function retry() {
    setBusy(true);
    try {
      await fetch(`/api/evaluations/${evaluationId}/retry`, {
        method: "POST",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className="button-secondary"
      type="button"
      onClick={retry}
      disabled={busy}
    >
      {busy ? "Retrying..." : "Retry failed models"}
    </button>
  );
}
