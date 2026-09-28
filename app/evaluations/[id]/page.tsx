import { getFetchById } from "@/capture/repository";
import { getNormalizationById } from "@/capture/normalizeRepository";
import { extractProductCard, stockCaptureDisagreement } from "@/seminar/product";
import { ShopperSummary } from "./shopper-summary";
import { notFound } from "next/navigation";
import { getBrand, getPdp } from "@/brands/repository";
import {
  getEvaluation,
  listEvaluationModelResults,
  listEvaluationsForPdp,
} from "@/evaluation/orchestrator";
import { listSteps } from "@/evaluation/observability";
import {
  describeClassification,
  describeModelStatus,
  displayTitle,
} from "@/evaluation/copy";
import type { ModelUsage } from "@/providers/types";
import { DIMENSIONS } from "@/scoring/score";
import { scoreBand } from "@/scoring/bands";
import { dimensionCopy } from "@/dimension-copy";
import { ReportRefresh } from "./report-refresh";
import { FindingsSection } from "./findings";
import { RecommendationsSection } from "./recommendations";
import { StepsSection } from "./steps";
import { HistorySection } from "./history";
import { ProgressSection } from "./progress";
import { HeroSection } from "./hero";

export const dynamic = "force-dynamic";

type PerModel = {
  modelProfileId: string | null;
  provider: string;
  model: string;
  status: "completed" | "failed";
  scores?: Record<string, { score: number; capped: boolean }>;
};

type Scores = {
  perModel: PerModel[];
  aggregate: Record<string, number | null>;
};

export default async function EvaluationReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evaluation = await getEvaluation(id);
  if (!evaluation) {
    notFound();
  }

  const pdp = await getPdp(evaluation.pdpId);
  const [modelResults, steps, history, brand] = await Promise.all([
    listEvaluationModelResults(id),
    listSteps(id),
    listEvaluationsForPdp(evaluation.pdpId),
    pdp ? getBrand(pdp.brandId) : Promise.resolve(undefined),
  ]);

  const normalization = evaluation.normalizationId ? await getNormalizationById(evaluation.normalizationId) : undefined;
  const capture = normalization?.fetchId ? await getFetchById(normalization.fetchId) : undefined;
  const capturedUrl = capture?.finalUrl ?? pdp?.url ?? "";
  const product = extractProductCard(normalization?.jsonLd ?? [], capturedUrl, normalization?.title ?? displayTitle(pdp?.title, pdp?.url ?? ""));

  const scores = (evaluation.scores as Scores | null) ?? null;
  const failedModels = modelResults.filter((row) => row.status !== "completed");
  const classificationLabel = evaluation.classification
    ? `Detected page type: ${describeClassification(
        (evaluation.classification as { classification?: string })
          .classification,
      )}`
    : undefined;

  return (
    <main className={`page${evaluation.shopperRequest ? " seminar-page" : ""}`}>
      <nav className="report-nav" aria-label="Report sections">
        {evaluation.shopperRequest ? <a href="#shopper-fit">Shopper fit</a> : <a href="#summary">Summary</a>}
        <a href="#scores">Scores</a>
        <a href="#recommendations">Recommendations</a>
        <a href="#findings">Findings</a>
        <a href="#history">History</a>
      </nav>

      {evaluation.shopperRequest ? (
        <ShopperSummary request={evaluation.shopperRequest} product={product} url={capturedUrl}
          stockNote={stockCaptureDisagreement(product.availability, normalization?.content ?? "")}
          capturedAt={capture?.fetchedAt ?? normalization?.createdAt ?? null} truncated={normalization?.truncated ?? false}
          status={evaluation.status} reason={evaluation.reason} evaluationId={evaluation.id}
          models={modelResults.map(row => ({ id: row.id, model: row.model, status: row.status, shopperAssessment: row.shopperAssessment }))} />
      ) : null}
      <ReportRefresh evaluationId={evaluation.id} status={evaluation.status} />
      <ProgressSection steps={steps} status={evaluation.status} />
      {evaluation.shopperRequest ? <div className="audit-divider"><p className="eyebrow">A closer look at the page</p><h2>Readiness audit</h2><p>These scores assess the page’s information, independently of the shopper request above.</p></div> : null}

      <HeroSection
        id={evaluation.id}
        title={displayTitle(pdp?.title, pdp?.url ?? "")}
        url={pdp?.url ?? ""}
        brandName={brand?.name}
        status={evaluation.status}
        classificationLabel={classificationLabel}
        models={modelResults.map((row) => row.model)}
        rubricVersion={evaluation.rubricVersion}
        createdAt={evaluation.createdAt}
        aggregate={scores?.aggregate ?? {}}
        recommendations={evaluation.recommendations}
        reason={evaluation.reason}
        failedModels={failedModels.length}
      />



      {evaluation.jsHeavy ? (
        <section className="card note-card">
          <p className="reason-title">
            Some content is loaded with JavaScript
          </p>
          <p className="muted">
            This page builds key content (like the price or policies) in the
            browser. A crawler without JavaScript may not see it, so some checks
            can look worse than the page does in a browser. Putting that content
            in the page HTML or the structured data makes it visible to every
            agent.
          </p>
        </section>
      ) : null}



      <section id="scores" className="card">
        <h2 className="card-title">Scores</h2>
        <p className="muted">
          Each dimension is scored from 0 (not ready) to 10 (fully ready) for AI
          agents.
        </p>
        {!scores ? (
          <p className="muted">Scores are not available yet.</p>
        ) : (
          <div className="score-grid">
            {DIMENSIONS.map((dimension) => {
              const aggregate = scores.aggregate[dimension];
              const copy = dimensionCopy(dimension);
              const band = scoreBand(aggregate);
              return (
                <div key={dimension} className="score-card">
                  <div className="score-card-head">
                    <span className="score-label">{copy.name}</span>
                    <span
                      className={`score-value ${band?.className ?? ""}`}
                    >
                      {aggregate === null ? "—" : aggregate.toFixed(1)}
                    </span>
                  </div>
                  {band ? (
                    <p className="score-band-row">
                      <span className={`band-chip ${band.className}`}>
                        {band.label}
                      </span>
                    </p>
                  ) : null}
                  <div className="score-bar" aria-hidden="true">
                    <div
                      className={`score-bar-fill ${band?.className ?? ""}`}
                      style={{
                        width: `${
                          aggregate === null
                            ? 0
                            : Math.max(0, Math.min(100, aggregate * 10))
                        }%`,
                      }}
                    />
                  </div>
                  <p className="score-description muted">{copy.description}</p>
                  <ul className="model-scores">
                    {scores.perModel.map((row) => {
                      const value =
                        row.status === "completed"
                          ? row.scores?.[dimension]?.score
                          : undefined;
                      return (
                        <li key={`${row.model}-${dimension}`}>
                          <span className="muted">{row.model}</span>
                          <span className="model-score">
                            {row.status !== "completed"
                              ? describeModelStatus(row.status)
                              : value === undefined
                                ? "—"
                                : value.toFixed(1)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {scores ? <RecommendationsSection
        id="recommendations"
        recommendations={evaluation.recommendations}
        brandPerceptions={modelResults.map((row) => ({
          model: row.model,
          status: row.status,
          brandPerception: row.brandPerception,
          recommendationFit: row.recommendationFit,
        }))}
      />

      : null}

      <FindingsSection
        id="findings"
        deterministicFindings={evaluation.deterministicFindings}
        modelResults={modelResults.map((row) => ({
          model: row.model,
          status: row.status,
          checks: row.checks,
        }))}
      />

      <HistorySection
        id="history"
        evaluations={history}
        currentId={evaluation.id}
      />

      <StepsSection
        id="details"
        steps={steps}
        modelMetrics={modelResults.map((row) => ({
          model: row.model,
          status: row.status,
          usage: (row.usage as ModelUsage | null) ?? null,
        }))}
      />
    </main>
  );
}
