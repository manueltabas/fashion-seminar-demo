import Link from "next/link";
import {
  describeEvaluationStatusShort,
  describeReason,
} from "@/evaluation/copy";
import type { Recommendation } from "@/recommendations/map";
import { dimensionCopy } from "@/dimension-copy";
import { overallScore, scoreBand } from "@/scoring/bands";
import { RetryButton } from "./retry-button";
import { ScoreGauge } from "./score-gauge";

export function HeroSection({
  id,
  title,
  url,
  brandName,
  status,
  classificationLabel,
  models,
  rubricVersion,
  createdAt,
  aggregate,
  recommendations,
  reason,
  failedModels,
}: {
  id: string;
  title: string;
  url: string;
  brandName?: string;
  status: string;
  classificationLabel?: string;
  models: string[];
  rubricVersion: string;
  createdAt: Date;
  aggregate: Record<string, number | null>;
  recommendations: Recommendation[];
  reason: string | null;
  failedModels: number;
}) {
  const isActive =
    status === "created" || status === "fetching" || status === "evaluating";
  const failed = status === "failed";
  const overall = overallScore(aggregate);
  const band = scoreBand(overall);
  const topFixes = recommendations.slice(0, 3);
  const failureCopy = failed ? describeReason(reason) : null;
  const partialCopy = status === "partial" ? describeReason(reason) : null;

  return (
    <section className="hero" id="summary">
      <div className="hero-left">
        <div className="hero-toprow">
          <Link className="button-secondary hero-back" href="/">
            ← Back to home
          </Link>
          <span className={`badge badge-${status}`}>
            {describeEvaluationStatusShort(status)}
          </span>
          <span className="muted hero-date">
            Run {new Date(createdAt).toLocaleString()}
          </span>
        </div>

        <h1 className="hero-title">{title}</h1>
        <p className="hero-url">{url}</p>

        <div className="hero-meta">
          {brandName ? <span className="hero-brand">{brandName}</span> : null}
          {classificationLabel ? (
            <span className="muted">{classificationLabel}</span>
          ) : null}
          <span className="muted">Rubric {rubricVersion}</span>
        </div>

        <div className="hero-models">
          <span className="muted">Tested with</span>
          {models.length === 0 ? (
            <span className="muted">no models</span>
          ) : (
            models.map((model) => (
              <span key={model} className="model-chip">
                {model}
              </span>
            ))
          )}
        </div>

        {failureCopy ? (
          <div className="hero-verdict">
            <p className="reason-title">{failureCopy.title}</p>
            <p className="muted">{failureCopy.detail}</p>
          </div>
        ) : null}

        {!isActive && !failed ? (
          <div className="hero-fixes">
            <h2 className="hero-fixes-title">
              Overall readiness
              {band ? (
                <span className={`band-chip ${band.className}`}>
                  {band.label}
                </span>
              ) : null}
            </h2>
            <p className="hero-fixes-title muted">Top fixes</p>
            {topFixes.length === 0 ? (
              <p className="muted">No critical fixes found.</p>
            ) : (
              <ol className="summary-fixes">
                {topFixes.map((recommendation) => (
                  <li key={`${recommendation.checkId}-${recommendation.status}`}>
                    <span className="summary-fix-action">
                      {recommendation.action}
                    </span>
                    <span className="muted">
                      {" "}
                      — {dimensionCopy(recommendation.dimension).name}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {partialCopy ? (
              <p className="muted hero-partial-note">
                {partialCopy.title}. {partialCopy.detail}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="hero-right">
        {!isActive && !failed ? (
          <div className="hero-score">
            <ScoreGauge score={overall} />
          </div>
        ) : null}
        {failedModels > 0 ? <RetryButton evaluationId={id} /> : null}
      </div>
    </section>
  );
}
