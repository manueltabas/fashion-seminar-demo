"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { describeApiError } from "@/evaluation/copy";

import { FASHION_EXAMPLES, MAX_SHOPPER_REQUEST } from "@/seminar/request";

export type ModelOption = {
  id: string;
  label: string;
  model: string;
  provider: string;
};

export function EvaluationForm({ profiles }: { profiles: ModelOption[] }) {
  const router = useRouter();
  const [shopperRequest, setShopperRequest] = useState("");
  const requestField = useRef<HTMLTextAreaElement>(null);
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<string[]>(
    profiles.length > 0 ? [profiles[0].id] : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(id: string) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      new URL(url);
    } catch {
      setError("Enter a valid absolute URL (including https://).");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one model.");
      return;
    }

    setSubmitting(true);
    try {
    const response = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, modelProfileIds: selected, shopperRequest }),
    });

    if (response.ok) {
      const data = (await response.json()) as { evaluation: { id: string } };
      router.push(`/evaluations/${data.evaluation.id}`);
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    setError(describeApiError(data.error));
    } catch {
      setError("Could not start the evaluation. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <fieldset className="field example-field">
        <legend>Start with a shopper</legend>
        <div className="example-grid">
          {FASHION_EXAMPLES.map((example) => (
            <button className="example-button" type="button" key={example.label}
              onClick={() => { setShopperRequest(example.request); requestField.current?.focus(); }}>
              <strong>{example.label}</strong><span>{example.detail}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>What is the shopper looking for?</span>
        <textarea ref={requestField} value={shopperRequest} rows={4} maxLength={MAX_SHOPPER_REQUEST}
          onChange={(event) => setShopperRequest(event.target.value)}
          placeholder="Describe their budget, intended use, size and preferences…"
          aria-describedby="request-help" />
        <span id="request-help" className="field-hint">Choose an example or write your own. Leave blank for a general readiness audit.</span>
      </label>
      <label className="field">
        <span>Product page URL</span>
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://store.example.com/products/..."
          required
        />
      </label>

      <fieldset className="field">
        <legend>Models to assess the page</legend>
        {profiles.length === 0 ? (
          <p className="muted">No models are configured.</p>
        ) : (
          <div className="checkbox-list">
            {profiles.map((profile) => (
              <label key={profile.id} className="checkbox">
                <input
                  type="checkbox"
                  checked={selected.includes(profile.id)}
                  onChange={() => toggle(profile.id)}
                />
                <span>
                  {profile.label}{" "}
                  <span className="muted">
                    ({profile.provider} · {profile.model})
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {error ? <p role="alert" className="error">{error}</p> : null}

      <button
        className="button-primary"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Starting..." : "Explore this product"}
      </button>
    </form>
  );
}
