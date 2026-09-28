import type { EvaluationStep } from "@/db/schema";
import { describeStep, describeStepStatus } from "@/evaluation/copy";

export function ProgressSection({
  steps,
  status,
}: {
  steps: EvaluationStep[];
  status: string;
}) {
  const active =
    status === "created" || status === "fetching" || status === "evaluating";
  if (!active) {
    return null;
  }

  return (
    <section className="card">
      <h2 className="card-title">Progress</h2>
      <p className="muted">
        The evaluation is running and this page updates automatically — no extra
        setup needed. Keep this tab open until it finishes.
      </p>
      {steps.length === 0 ? (
        <p className="muted">Getting started…</p>
      ) : (
        <ul className="steps">
          {steps.map((step) => (
            <li key={step.id} className="step">
              <span className={`step-status step-status-${step.status}`}>
                {describeStepStatus(step.status)}
              </span>
              <span className="step-name">{describeStep(step.name)}</span>
              {step.durationMs !== null ? (
                <span className="muted step-duration">
                  {step.durationMs} ms
                </span>
              ) : null}
            </li>
          ))}
          <li className="step step-current">
            <span className="step-status step-status-running">Running</span>
            <span className="step-name">Working…</span>
          </li>
        </ul>
      )}
    </section>
  );
}
