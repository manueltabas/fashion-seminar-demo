"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { describeApiError } from "@/evaluation/copy";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = new FormData();
    body.append("password", password);

    const response = await fetch("/api/auth/login", { method: "POST", body });
    if (response.ok) {
      router.replace(next);
      router.refresh();
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    setError(describeApiError(data.error));
    setSubmitting(false);
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          required
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button className="button-primary" type="submit" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
