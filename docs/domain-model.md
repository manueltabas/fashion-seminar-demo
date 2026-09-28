# Domain Model

## Core Concepts

- **Consultant** — the single MVP user who runs evaluations.
- **Brand** — a merchant/company; groups PDPs.
- **PDP** — a Product Detail Page; the unit of analysis, identified by URL.
- **Model Profile** — a selectable model: provider, model identifier, credential
  reference, enabled/disabled.
- **Provider** — an external model vendor (OpenAI, Anthropic, Google).
- **Rubric** — versioned definition of dimensions, checks, weights, and scoring
  rules.
- **Evaluation** — one immutable, timestamped run of the pipeline against one PDP
  with a selected set of models and one rubric version.
- **Dimension Result** — the outcome for one dimension in one evaluation, per
  model. Four are scored; `Brand Perception` is unscored.
- **Score** — 0-10 for one dimension and one model.
- **Aggregate Score** — average of per-model scores for one dimension.
- **Finding** — a pass/partial/fail result inside a dimension, with evidence.
- **Recommendation** — an actionable improvement mapped from findings and
  prioritized.
- **Report** — the rendered view of one evaluation.

## Relationships

- A **Brand** has zero or more **PDPs**.
- A **PDP** belongs to exactly one **Brand** and has many **Evaluations**
  (its history).
- An **Evaluation** targets exactly one **PDP**, uses one **Rubric** version, one
  set of **Models**, and produces one **Model Result** per selected model.
- A **Model Result** contains one **Dimension Result** per dimension (four scored
  + one unscored Brand Perception).
- A **Dimension Result** contains zero or more **Findings** and has one **Score**
  (scored dimensions only).
- **Findings** drive zero or more **Recommendations**.
- **Aggregate Scores** are derived from the **Scores** of the models selected for
  that evaluation.
- **Model Profiles** define which **Models** can be selected.

## States and Lifecycles

### Evaluation

- **Created** — URL and model selection captured.
- **Fetching** — PDP fetched and normalized.
- **Evaluating** — deterministic checks run; each selected model is called.
- **Completed** — every selected model succeeded; scores and recommendations are
  ready.
- **Partial** — at least one model or step failed, but at least one model
  succeeded; the report shows what succeeded and explains what failed; failed
  models can be retried.
- **Failed** — nothing usable (for example the fetch was blocked/404 or all
  models failed).

A full re-run of the same PDP creates a **new Evaluation snapshot**. Retrying the
failed models of the current evaluation appends to that evaluation rather than
creating a new snapshot.

### PDP

- **Added** — created when an evaluation is started for its URL.
- **Evaluated** — has one or more evaluations.
- (Deletion/archival is out of scope for the MVP.)

### Brand

- **Detected** — auto-created from the first PDP that maps to it.
- **Confirmed / Edited** — renamed or merged by the consultant.

## Important Scenarios

**MVP vertical slice.** The consultant opens the home screen, pastes a PDP URL,
selects models, and submits. The tool detects the brand, fetches and normalizes
the page, runs the rubric and the models, computes per-model and aggregate
scores, generates recommendations, and renders the report. The PDP then appears
under its brand on the home list.

**Re-evaluation.** The consultant re-runs a previously evaluated PDP to show
improvement; a new snapshot is added and the trend is visible in history.

**Model disagreement.** Two models score a dimension differently. Both scores and
their evidence are retained; the aggregate is the average; the report must make
the disagreement inspectable.

## Edge Cases

- **URL is not a PDP** (homepage, category, 404) — detected and rejected or
  flagged rather than scored.
- **JS-only content** — counts as a Content Extractability gap in the MVP, not a
  rendering failure.
- **Bot protection / 403 / CAPTCHA** — surfaces as Fetching failure and leads to
  Failed or Partial with an explanation.
- **Multiple variants** (size/color) on one PDP — the base page is evaluated;
  variant handling is reported as a gap.
- **Brand ambiguity** (subdomains, regional domains, marketplaces) — manual
  rename/merge resolves it.
- **Invalid model output** — the model is retried/repaired; if still invalid,
  that model is marked failed and the evaluation becomes Partial.
- **Rate limits / timeouts** — queued retries with backoff; the evaluation may
  end Partial.
- **Very large pages / token limits** — content is truncated with a documented
  strategy; truncation itself may be a finding.
- **Model deprecation or rename** — the model profile is disabled without
  breaking past evaluations.
## Seminar copy extension

An Evaluation optionally stores `shopperRequest` (trimmed, up to 1,000 characters). Empty or omitted requests keep the legacy audit flow. The evaluation links to the exact normalization used for its seminar assessment and product card; retries reuse that capture. Historical evaluations without this link remain readable.

A model result can additionally store an unscored `shopperAssessment`: a short understanding of the product, an assessment (`supported`, `possible`, or `not_supported`), requirement-level evidence (`supports` or `conflicts`), and explicit unknowns with a suggested question or retailer improvement. This is evidence from the supplied page, not a promise of suitability or purchasing capability.

POST /api/evaluations accepts optional `shopperRequest`. Non-string values and values exceeding 1,000 characters return 400 before a run is created.
