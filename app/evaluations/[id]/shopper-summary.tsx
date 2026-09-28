import Link from "next/link";
import type { ShopperAssessment } from "@/seminar/assessment";
import type { ProductCardData } from "@/seminar/product";
import { safeWebUrl } from "@/seminar/product";
import { describeEvaluationStatusShort, describeReason } from "@/evaluation/copy";
import { RetryButton } from "./retry-button";
import { ProductImage } from "./product-image";

const VERDICTS = { supported: "Evidence supports the match", possible: "Possible match · questions remain", not_supported: "A requirement is not met" };
export type ShopperModelRow = { id: string; model: string; status: string; shopperAssessment: ShopperAssessment | null };

export function ShopperSummary({ request, product, url, capturedAt, truncated, status, reason, evaluationId, models, stockNote }: {
  stockNote: string | null;
  request: string; product: ProductCardData; url: string; capturedAt: Date | null; truncated: boolean;
  status: string; reason: string | null; evaluationId: string; models: ShopperModelRow[];
}) {
  const active = ["created", "fetching", "evaluating"].includes(status);
  const failure = status === "failed" || status === "partial" ? describeReason(reason) : null;
  const sourceUrl = safeWebUrl(url, url);
  return <section id="shopper-fit" className="seminar-summary">
    <div className="seminar-topline"><Link href="/">← New exploration</Link><span className={`badge badge-${status}`}>{describeEvaluationStatusShort(status)}</span></div>
    <p className="eyebrow">Fashion · Agentic commerce demo</p>
    <h1 className="seminar-title">From a product page to a recommendation.</h1>
    <p className="seminar-intro">A simulation using captured page content. See what the selected model can support, and what it still needs to know.</p>

    <section className="shopper-request-panel" aria-labelledby="shopper-request-title">
      <h2 id="shopper-request-title">The shopper request</h2>
      <blockquote>{request}</blockquote>
    </section>

    <article className="product-card" aria-labelledby="product-card-title">
      <ProductImage src={product.imageUrl} title={product.title} />
      <div className="product-card-body">
        <p className="eyebrow">The product being considered</p>
        <h2 id="product-card-title">{product.title}</h2>
        <p className="muted">{product.brand ? `${product.brand} · ` : ""}{sourceUrl ? new URL(sourceUrl).hostname : "Product page"}</p>
        <dl className="product-facts"><div><dt>Price in product data</dt><dd>{product.price ?? "Not captured"}</dd></div><div><dt>Availability in product data</dt><dd>{product.availability ?? "Not captured"}</dd></div></dl>
        {stockNote ? <p className="stock-note">{stockNote}</p> : null}
        {product.multipleOffers ? <p className="capture-note">Multiple offers or variants. Confirm the selected size and colour on the retailer’s page.</p> : null}
        <div className="product-source-row">{sourceUrl ? <a className="button-secondary" href={sourceUrl} target="_blank" rel="noopener noreferrer">Open product website ↗</a> : null}
          <span className="capture-note">{capturedAt ? `Captured ${new Date(capturedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC` : "Capture not available yet"}</span></div>
        <p className="capture-note">Price and stock may have changed. {truncated ? "The captured text was shortened; some information may be missing." : "These are page observations, not live inventory checks."}</p>
      </div>
    </article>

    {active ? <p className="seminar-state" role="status">Reading the page and assessing this shopper’s needs. The actual processing steps appear below.</p> : null}
    {failure ? <div className="seminar-state"><strong>{failure.title}</strong><p>{failure.detail}</p></div> : null}
    {models.map(row => {
      const assessment = row.shopperAssessment;
      if (row.status !== "completed" || !assessment) return <div className="seminar-state" key={row.id}><strong>{row.model}</strong><p>{row.status !== "completed" ? "This model could not complete its assessment." : "This saved result has no shopper-specific assessment."}</p></div>;
      return <article className="model-assessment" key={row.id}>
        <header className="assessment-header"><div><p className="eyebrow">Model interpretation · unscored</p><h2>{row.model}</h2></div><span className={`fit-verdict fit-${assessment.verdict}`}>{VERDICTS[assessment.verdict]}</span></header>
        <section className="understood-panel"><h3>What the model understood</h3><p>{assessment.understood}</p></section>
        <div className="assessment-columns">
          <section className="evidence-panel"><h3>Supporting evidence</h3><p className="section-hint">Quotes found in this capture. Conflicts are labelled.</p>
            {assessment.requirements.length ? <ul className="assessment-list">{assessment.requirements.map((item, i) => <li key={i}>
              <div className="requirement-heading"><h4>{item.requirement}</h4><span className={`evidence-tag ${item.status}`}>{item.status === "supports" ? "Supports" : "Conflicts"}</span></div>
              <blockquote>{item.quote}</blockquote><span className="quote-source">{item.source === "page" ? "Page text" : "Structured product data"}</span><p>{item.explanation}</p>
            </li>)}</ul> : <p>No requirement has verified supporting evidence in this capture.</p>}
          </section>
          <section className="unknowns-panel"><h3>What remains unknown</h3><p className="section-hint">Unknown does not mean the product lacks a capability.</p>
            {assessment.unknowns.length ? <ul className="assessment-list">{assessment.unknowns.map((item, i) => <li key={i}><h4>{item.requirement}</h4><p>{item.reason}</p><div className="next-question"><span>What would help</span><p>{item.next_step}</p></div></li>)}</ul> : <p>No open questions reported by this model. Verify suitability and current details on the product website.</p>}
          </section>
        </div>
        <p className="assessment-footnote">Quotes are checked against the captured content. Product claims and the model’s interpretation are not independently verified.</p>
      </article>;
    })}
    {models.some(m => m.status !== "completed") ? <RetryButton evaluationId={evaluationId} /> : null}
    {!active && !models.length ? <p className="seminar-state">No model assessment is available for this run. Start a new exploration to try another page.</p> : null}
  </section>;
}
