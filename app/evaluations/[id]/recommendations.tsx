import type { Recommendation } from "@/recommendations/map";
import { priorityForImpact } from "@/recommendations/map";
import { dimensionCopy } from "@/dimension-copy";

export type BrandPerceptionRow = {
  model: string;
  status: string;
  brandPerception: string | null;
  recommendationFit: string | null;
};

export function RecommendationsSection({
  id,
  recommendations,
  brandPerceptions,
}: {
  id?: string;
  recommendations: Recommendation[];
  brandPerceptions: BrandPerceptionRow[];
}) {
  const completed = brandPerceptions.filter(
    (row) => row.status === "completed",
  );

  return (
    <>
      <section id={id} className="card">
        <h2 className="card-title">Recommendations</h2>
        {recommendations.length === 0 ? (
          <p className="muted">No recommendations — no checks failed.</p>
        ) : (
          <ol className="recommendations">
            {recommendations.map((recommendation) => {
              const priority = priorityForImpact(recommendation.impact);
              return (
                <li
                  key={`${recommendation.checkId}-${recommendation.status}`}
                  className="recommendation"
                >
                  <div className="recommendation-head">
                    <span
                      className={`priority-chip priority-${priority.toLowerCase()}`}
                    >
                      {priority} priority
                    </span>
                    <span className="recommendation-dimension">
                      {dimensionCopy(recommendation.dimension).name}
                    </span>
                    <span className="muted recommendation-gain">
                      Potential score +{recommendation.impact.toFixed(1)}
                    </span>
                  </div>
                  <p className="recommendation-action">
                    {recommendation.action}
                  </p>
                  <p className="muted recommendation-why">{recommendation.why}</p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">
          Brand perception{" "}
          <span className="muted unscored-label">unscored</span>
        </h2>
        {completed.length === 0 ? (
          <p className="muted">
            No model produced a brand perception for this evaluation.
          </p>
        ) : (
          <ul className="brand-perceptions">
            {completed.map((row) => (
              <li key={row.model} className="brand-perception">
                <span className="brand-perception-model">{row.model}</span>
                <p className="brand-perception-text">
                  {row.brandPerception ?? "—"}
                </p>
                {row.recommendationFit ? (
                  <p className="brand-perception-fit">
                    Would recommend for: {row.recommendationFit}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
