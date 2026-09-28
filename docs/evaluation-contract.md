# Evaluation Contract (Draft for Review)

Status: v0.1 — dimensions and checks reviewed by the consultant. Weights are v0.1
placeholders to be calibrated against expert judgment during validation.
Purpose: define how a PDP is scored, what the models are asked to produce, and
how the tool turns that into 0-10 dimension scores. This is the credibility core
of the product; `docs/specs/*` will reference it.

## 1. Inputs

- Normalized PDP content (text/markdown) plus structured data (JSON-LD) and the
  raw HTML, captured by a crawler-style HTTP fetch.
- One or more selected **models** (from model profiles).
- One **rubric version**.

## 2. Rubric Structure and Scoring Rule (proposed)

Instead of asking a model for a free 0-10 number, the rubric is a **list of
weighted checks per dimension**. Every check is resolved in one of two ways:

- **Deterministic check** — the tool verifies it from HTML/JSON-LD (schema
  presence, fields, semantics). No model call needed.
- **Model-judged check** — the model evaluates it from the normalized content and
  returns status + evidence.

Scoring rule:

```
check outcome: pass = 1.0, partial = 0.5, fail = 0.0
dimension_score = round(10 * sum(weight_i * outcome_i) / sum(weight_i), 1)
```

- Scores are **computed by the tool**, not returned by the model. The model only
  judges its assigned checks and writes evidence. This keeps scores reproducible
  and prevents the model from inventing a number.
- Dimension weights are relative to each dimension; the four dimension scores are
  not combined into a single overall number in the MVP (each is reported 0-10).
  If a combined score is ever needed, dimension-level weights must be defined
  first (an external proposal suggested 35/35/30 across differently-shaped
  dimensions); this is deferred.
- Per-model score = the computation above for that model. **Aggregate score** =
  arithmetic mean of the selected models' scores for that dimension.

**Cap rule (critical failures).** Some failures reflect a real blocker and cap
the dimension regardless of the weighted sum, because a store cannot be
"ready" without them:

| Dimension | Critical failure | Cap |
| --- | --- | --- |
| D1 Machine-readable Data | No JSON-LD `Product`, or no `Offer`/`price` | 3.0 |
| D2 Content Extractability | Main content absent from raw HTML (JS-only) | 4.0 |
| D3 Trust & Policy Signals | Neither shipping nor returns policy present | 4.0 |
| D4 Transactional Readiness | Fetch bot-blocked/CAPTCHA, or no displayed price | 3.0 |

Final dimension score = `min(weighted_sum_score, applicable_cap)`. Caps are part
of the rubric version and shown as an explicit finding in the report.

## 3. Dimensions and Example Checks

Weights are placeholders to be tuned; deterministic vs model split is shown.

### D1. Machine-readable Data

| Check | Type | Weight |
| --- | --- | --- |
| JSON-LD `Product` present and parseable (`@type` correct) | deterministic | 3 |
| `Offer` present with `price` | deterministic | 3 |
| `priceCurrency` present | deterministic | 2 |
| `availability` present and valid | deterministic | 2 |
| `priceValidUntil` present | deterministic | 1 |
| Product identifier (`gtin`/`mpn`/`sku`) | deterministic | 2 |
| Variant-level GTIN/SKU for variants | deterministic | 2 |
| `brand` present in structured data | deterministic | 1 |
| `aggregateRating`/`review` data | deterministic | 1 |
| `image` and `description` in structured data | deterministic | 1 |
| `shippingDetails` in `Offer` | deterministic | 2 |
| `hasMerchantReturnPolicy` in `Offer` | deterministic | 2 |
| Structured data matches visible content (incl. price) | model | 2 |
| Physical attributes present: dimensions, materials, compatibility | model | 2 |
| Category-required attributes present | model | 2 |

### D2. Content Extractability

| Check | Type | Weight |
| --- | --- | --- |
| Main product content present in raw HTML (not JS-only) | deterministic | 3 |
| Key content not hidden behind JS tabs/accordions | deterministic | 2 |
| Single `H1` and sane heading hierarchy | deterministic | 1 |
| Attributes present as text/table/list | deterministic | 2 |
| Specs in parseable table/definition list | deterministic | 1 |
| Description present and substantive | deterministic | 1 |
| Coherent language/locale | deterministic | 1 |
| Critical facts not only inside images | model | 2 |
| No critical info only in PDFs | model | 1 |
| Specs complete and unambiguous for the category | model | 3 |
| Text is clean (no duplicate/boilerplate noise) | deterministic | 1 |

### D3. Trust & Policy Signals

| Check | Type | Weight |
| --- | --- | --- |
| Shipping cost and delivery-timeline info present | deterministic | 2 |
| Concrete estimated delivery times present | deterministic | 1 |
| Returns policy present | deterministic | 2 |
| Explicit return window (number of days) | deterministic | 1 |
| Warranty/guarantee present | deterministic | 1 |
| Reviews / social proof present | deterministic | 2 |
| Review verification / rating distribution | deterministic | 1 |
| Contact / company info present | deterministic | 1 |
| Legal business identity (legal name, address, VAT) | deterministic | 1 |
| Privacy policy present | deterministic | 1 |
| Tax/duties info present where applicable | deterministic | 1 |
| Policy content is clear and actionable | model | 3 |

### D4. Transactional Readiness

| Check | Type | Weight |
| --- | --- | --- |
| Price clearly displayed | deterministic | 3 |
| Price not hidden behind login | deterministic | 2 |
| Stock/availability signal present | deterministic | 2 |
| Variant selection with per-variant stock | deterministic | 1 |
| Currency and locale clear | deterministic | 2 |
| Add-to-cart entry present with clear semantics | deterministic | 2 |
| Payment methods visible | deterministic | 1 |
| `robots.txt` allows AI/agent crawlers | deterministic | 2 |
| Fetch was not CAPTCHA/bot-blocked | deterministic | 3 |
| Checkout path understandable to an agent | model | 2 |
| Landed cost (shipping/taxes/duties) clear before checkout | model | 2 |
| No agent-hostile friction (interstitials, forced login) | deterministic | 2 |

### D5. Brand Perception (unscored)

A model-judged, 1-2 line qualitative summary of what the model understands about
the brand from the PDP. Not scored, not aggregated.

### Deferred dimension (post-MVP): Protocol & Agent-Commerce Maturity

These are valid parts of agentic-commerce readiness but are **not observable
from a public PDP fetch**. They require merchant integration, API credentials, or
an agent actually executing a flow, so they are out of scope for the MVP and are
recorded here as the next dimension to build. They came from an external
proposal reviewed on this date.

- Real-time inventory/price sync (feed/API latency and live stock verification).
- Programmatic checkout endpoints (emerging ACP/UCP-style session endpoints).
- Delegated payment compliance (scoped/single-use payment tokens; emerging
  AP2/verifiable-credential style rails).
- Post-purchase automation (order-status webhooks, programmatic returns/refunds).
- Agent step efficiency and DOM navigability metrics requiring a rendered or
  agent-driven session.

MVP stance: do not score these. Report protocol readiness separately as
"not assessed" until the integration exists, and never imply it was measured.

## 4. Model Output Contract

The model receives the normalized content plus only the model-judged checks, and
returns JSON with a `checks` array (`check_id`, `status`, `evidence`,
`confidence`) and a `brand_perception` string. The model never returns a score.
Full prompt text, schema, validation rules, and the repair prompt are defined in
`model-evaluation-prompt.md`.

## 5. Recommendations

Each failed/partial check maps to one canonical recommendation entry (dimension,
action, why). Recommendations are ranked by `weight * (1 - outcome)` so the
highest-impact fixes appear first. The model may add context but cannot invent
new recommendation types in the MVP.

## 6. Versioning

- The rubric has a version. Every evaluation stores its rubric version and the
  exact model identifiers used, so scores remain interpretable after changes.
- Changing checks, weights, or the scoring rule requires a new rubric version.
- Current: **rubric v0.1** — four dimensions and their checks agreed; weights are
  provisional and expected to change during calibration.

## 7. Open Items (for the next 30 minutes and spec phase)

- Confirm the check lists and weights per dimension.
- Confirm the cap values per dimension.
- Decide how many decimals and whether to round aggregate scores.
- Confirm deterministic feasibility: which of the D1/D3/D4 checks can be reliably
  detected from raw HTML, and which should become model-judged.
- Decide how the deterministic checks behave when JSON-LD exists but is partial.

Decided: the model never returns a score (tool computes it); evidence is a
verbatim quote or precise location (`model-evaluation-prompt.md`); the deferred
Protocol & Agent-Commerce Maturity dimension is out of scope until a merchant
integration exists.

## Seminar copy — shopper fit v1

When a shopper request is present, additionally assess it using the captured page content and JSON-LD. This assessment is unscored and does not enter the readiness scoring functions, weights, or recommendation priority math. Keep existing checks independent of the shopper request.

Distinguish observed support, observed conflict, and unknown information. Missing evidence is not proof of a missing product capability. A captured product offer is not proof of a working checkout. Do not infer waterproofness, sizing suitability, delivery guarantees, current stock, or total landed cost without evidence. Unknowns should identify the missing information and a concrete question or page improvement.

The product card displays data associated with the evaluated Product's offers only; do not select offers from unrelated recommendations. Missing or ambiguous fields are labelled not captured. Multiple offers are labelled as such. All price and stock observations are timestamped.

The seminar card flags a possible stock disagreement when associated offers say InStock but normalized text also contains out-of-stock or sold-out wording. The note reports conflicting signals, not confirmed product availability; page text may include another variant or generic interface copy.
