import type { EvaluationStep } from "@/db/schema";
import type { ModelUsage } from "@/providers/types";
import {
  describeModelError,
  describeModelStatus,
  describeStepStatus,
} from "@/evaluation/copy";

export type ModelMetricsRow = {
  model: string;
  status: string;
  usage: ModelUsage | null;
};

function formatMs(value: number | null): string {
  return value === null ? "—" : `${value} ms`;
}

function formatCost(value: number | undefined): string {
  return value === undefined ? "n/a" : `$${value.toFixed(6)}`;
}

function formatTokens(value: number | undefined): string {
  return value === undefined ? "—" : String(value);
}

export function StepsSection({
  id,
  steps,
  modelMetrics,
}: {
  id?: string;
  steps: EvaluationStep[];
  modelMetrics: ModelMetricsRow[];
}) {
  return (
    <details id={id} className="card details-card">
      <summary className="card-title">Steps &amp; metrics</summary>

      <h3 className="dimension-title">Per-model metrics</h3>
      <table className="metrics-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Status</th>
            <th>Latency</th>
            <th>Input</th>
            <th>Output</th>
            <th>Est. cost</th>
          </tr>
        </thead>
        <tbody>
          {modelMetrics.length === 0 ? (
            <tr>
              <td colSpan={6} className="muted">
                No model metrics recorded.
              </td>
            </tr>
          ) : (
            modelMetrics.map((row) => (
              <tr key={row.model}>
                <td>{row.model}</td>
                <td>{describeModelStatus(row.status)}</td>
                <td>{formatMs(row.usage?.latencyMs ?? null)}</td>
                <td>{formatTokens(row.usage?.inputTokens)}</td>
                <td>{formatTokens(row.usage?.outputTokens)}</td>
                <td>{formatCost(row.usage?.estimatedCostUsd)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3 className="dimension-title step-heading">Steps</h3>
      {steps.length === 0 ? (
        <p className="muted">No steps recorded.</p>
      ) : (
        <ul className="steps">
          {steps.map((step) => (
            <li key={step.id} className="step">
              <span className={`step-status step-status-${step.status}`}>
                {describeStepStatus(step.status)}
              </span>
              <span className="step-name">{step.name}</span>
              <span className="muted step-duration">
                {formatMs(step.durationMs)}
              </span>
              {step.message ? (
                <span className="step-message muted">
                  {step.name.startsWith("model:") ||
                  step.name.startsWith("retry:")
                    ? describeModelError(step.message)
                    : step.message}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
