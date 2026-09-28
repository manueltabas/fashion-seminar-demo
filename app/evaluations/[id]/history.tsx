import Link from "next/link";
import type { Evaluation } from "@/db/schema";
import { describeEvaluationStatus } from "@/evaluation/status";

export function HistorySection({
  id,
  evaluations,
  currentId,
}: {
  id?: string;
  evaluations: Evaluation[];
  currentId: string;
}) {
  return (
    <section id={id} className="card">
      <h2 className="card-title">History</h2>
      {evaluations.length === 0 ? (
        <p className="muted">No evaluations recorded for this PDP.</p>
      ) : (
        <ul className="history">
          {evaluations.map((evaluation, index) => {
            const isLatest = index === 0;
            const isCurrent = evaluation.id === currentId;
            return (
              <li
                key={evaluation.id}
                className={`history-item${isCurrent ? " history-current" : ""}`}
              >
                <Link className="history-link" href={`/evaluations/${evaluation.id}`}>
                  <span className="history-date">
                    {new Date(evaluation.createdAt).toLocaleString()}
                  </span>
                  <span className="muted">
                    {describeEvaluationStatus(evaluation.status)}
                  </span>
                </Link>
                <div className="history-tags">
                  {isLatest ? <span className="history-tag">latest</span> : null}
                  {isCurrent ? (
                    <span className="history-tag history-tag-current">
                      viewing
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="muted">Snapshots are immutable; the latest is shown by default.</p>
    </section>
  );
}
