import type { CheckStatus, Dimension, Finding } from "@/checks/types";
import { DIMENSIONS } from "@/scoring/score";
import type { ModelJudgedCheck } from "@/evaluation/validate";
import { dimensionCopy } from "@/dimension-copy";
import { describeCheckStatus } from "@/evaluation/copy";
import {
  checkTitle,
  describeCheckType,
  humanizeEvidence,
} from "@/evaluation/finding-copy";

export type ModelResultRow = {
  model: string;
  status: string;
  checks: ModelJudgedCheck[];
};

type Row = {
  checkId: string;
  status: CheckStatus;
  evidence: string;
  type: "deterministic" | "model";
  model?: string;
  dimension: Dimension;
};

function dimensionOf(checkId: string): Dimension {
  const prefix = checkId.split(".")[0]?.toLowerCase();
  return (DIMENSIONS as string[]).includes(prefix)
    ? (prefix as Dimension)
    : "d1";
}

function buildRows(
  deterministicFindings: Finding[],
  modelResults: ModelResultRow[],
): Row[] {
  const rows: Row[] = deterministicFindings.map((finding) => ({
    checkId: finding.checkId,
    status: finding.status,
    evidence: finding.evidence,
    type: "deterministic",
    dimension: finding.dimension,
  }));

  for (const result of modelResults) {
    if (result.status !== "completed") {
      continue;
    }
    for (const check of result.checks) {
      rows.push({
        checkId: check.checkId,
        status: check.status,
        evidence: check.evidence,
        type: "model",
        model: result.model,
        dimension: dimensionOf(check.checkId),
      });
    }
  }

  return rows;
}

const STATUS_ORDER: Record<CheckStatus, number> = {
  fail: 0,
  partial: 1,
  pass: 2,
};

function FindingList({ rows }: { rows: Row[] }) {
  return (
    <ul className="findings">
      {rows.map((row, index) => (
        <li key={`${row.checkId}-${row.model ?? "det"}-${index}`} className="finding">
          <div className="finding-head">
            <span className={`finding-status finding-status-${row.status}`}>
              {describeCheckStatus(row.status)}
            </span>
            <span className="finding-id">{checkTitle(row.checkId)}</span>
            <span className="finding-type">
              {describeCheckType(row.type)}
              {row.model ? ` · ${row.model}` : ""}
            </span>
          </div>
          <p className="finding-evidence">{humanizeEvidence(row.evidence)}</p>
        </li>
      ))}
    </ul>
  );
}

export function FindingsSection({
  id,
  deterministicFindings,
  modelResults,
}: {
  id?: string;
  deterministicFindings: Finding[];
  modelResults: ModelResultRow[];
}) {
  const rows = buildRows(deterministicFindings, modelResults);
  const reviewedModels = modelResults.filter((r) => r.status === "completed");

  return (
    <section id={id} className="card">
      <h2 className="card-title">Findings</h2>
      {rows.length === 0 ? (
        <p className="muted">No findings recorded for this evaluation.</p>
      ) : (
        <div className="dimension-findings">
          {DIMENSIONS.map((dimension) => {
            const scoped = rows
              .filter((row) => row.dimension === dimension)
              .sort(
                (a, b) =>
                  STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
                  a.checkId.localeCompare(b.checkId),
              );
            const actionable = scoped.filter((row) => row.status !== "pass");
            const passing = scoped.filter((row) => row.status === "pass");
            return (
              <div key={dimension} className="dimension-block">
                <h3 className="dimension-title">
                  {dimensionCopy(dimension).name}
                </h3>
                <p className="muted dimension-help">
                  {dimensionCopy(dimension).description}
                </p>
                {actionable.length === 0 ? (
                  <p className="muted">No issues found.</p>
                ) : (
                  <FindingList rows={actionable} />
                )}
                {passing.length > 0 ? (
                  <details className="passing">
                    <summary>{passing.length} passing checks</summary>
                    <FindingList rows={passing} />
                  </details>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <p className="muted">
        Model-judged findings shown for:{" "}
        {reviewedModels.map((r) => r.model).join(", ") || "no completed models"}.
      </p>
    </section>
  );
}
