# Fashion Seminar Demo — Progress

## Current Verified State

- Repository: `/Users/mtabas/Documents/Fashion Seminar Demo`.
- Local app: http://localhost:3001 (running). Original source checked against pre-session hashes: unchanged.
- Isolated database: `fashion_seminar_demo`. Local credentials are in ignored `.env`; no secrets in source or logs.
- Standard startup: `./init.sh`; `RUN_START_COMMAND=1 ./init.sh` starts port 3001.
- Standard verification: `./init.sh` (install, migrate, seed, lint, typecheck, tests), then `npm run build`.
- Latest verification: 2026-09-22; startup and build pass; 121/121 unit tests. Health and authenticated home return 200.
- Additional integration check: `node --import tsx scripts/smoke-seminar.ts` (demo database only, stubbed provider, temporary rows cleaned up).
- Next ready feature: none. All four seminar features are passing; no checkout or multi-product comparison implemented.
- Blocker: none. Next useful activity: rehearse the saved examples and select additional fashion pages for the seminar.

## GitHub setup — 2026-09-28

- Initialized Git with `main` for this demo folder; private repository: https://github.com/manueltabas/fashion-seminar-demo.
- Added README and setup instructions, including explicit commit/push and pull request workflows.
- Initial source commit `b1d908c` pushed to `origin/main`; GitHub privacy and matching local/remote commit verified. Local branch tracks `origin/main` and working tree was clean.
- Verified `.env`, dependencies, build output, and TypeScript cache are ignored. Scanned the 205 initial source/document files for common provider tokens and private keys; no matches.
- No application behavior changed; prior runtime verification remains historical. No new database operations or model calls were performed.
- Saved reports remain in the local PostgreSQL database. GitHub syncing requires commit and push; it is not automatic.

## Implementation Session — 2026-09-22

- Created the isolated runtime and verified the inherited baseline before implementation.
- Added editable fashion example prompts and optional 1,000-character shopper requests, persisted per evaluation.
- Added unscored model assessments: interpretation, supported/conflicting requirements with quotes, and unknowns with next questions or retailer improvements.
- Quotes are checked against the corresponding captured text or structured-data values. Unsupported recognizable currency comparisons trigger repair instead of a fabricated budget match.
- Added a product card with retailer image, captured price, stock, timestamp, and source link. Product groups, variants, numeric prices, regional redirect URLs, and missing data are handled.
- Report leads with shopper fit, then retains the original readiness audit. Model attribution, captured-content simulation label, and stock-disagreement note explain the scope.
- Linked each new evaluation to its exact normalization; retries and cards retain that capture even after subsequent evaluations.
- Verification: full startup/build; 121 unit tests; complete Chrome form-to-report run on a real Rothys PDP; desktop/mobile visual inspection; no browser errors or mobile overflow; legacy report compatibility; capture-bound retry integration.
- Live example with USD budget: `/evaluations/82ef0826-42d9-4655-a62c-bbdc17fd2dea`.
- Live example with SEK budget: `/evaluations/89f69827-1338-43bc-8546-20dbb915e2d0`.
- Temporary fixture records and the two superseded development runs with unsupported currency comparisons were removed from the demo database.
- Remaining limitations: model interpretations may omit constraints or overinterpret seller claims; quote matching verifies provenance, not semantic correctness. Only raw captured HTML/JSON-LD is evaluated, not live browsing or checkout. Stock inconsistency note is a heuristic. Regional pricing and model outputs may vary between runs; use saved examples for a predictable seminar.

---

## Harness setup history

## Session — 2026-09-22

- Applied the user-invoked harness-starter skill to the four harness files only.
- Corrected the stale pre-bootstrap description and routed future work to seminar scope.
- Added ordered features for isolated runtime verification, shopper request capture, model assessment, and seminar summary.
- Startup requires the dedicated database name before installation or migrations and defaults to port 3001. Existing lint/typecheck/test rules are unchanged.
- Verification: JSON fields and dependency graph, shell syntax, executable mode, and missing-database startup guard checked. No dependencies installed or product source changed.
- Risks: inherited scoring and extraction limitations remain; seminar output must distinguish unknown information from missing product capabilities. Product contracts need updating when the corresponding feature is implemented.
- Next step: configure the isolated environment and run the baseline, then implement the first shopper-request slice.

---

## Historical source-project log (not verification of this copy)

# Seminar Copy Status — 2026-09-22

- Independent copy at `/Users/mtabas/Documents/Fashion Seminar Demo`.
- Original source files verified identical at copy time.
- No product changes yet; inherited feature states are historical evidence only.
- Startup pending separate PostgreSQL database and local environment configuration.
- See `SEMINAR-DEMO.md` for scope and isolation requirements.

---

# Progress Log

## Current Verified State

- Repository root: `/Users/mtabas/Documents/Default Project`
- Standard startup path: `./init.sh` (install, migrate, seed, lint, typecheck, test; `RUN_START_COMMAND=1` starts dev)
- Standard verification path: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`; DB via `npm run db:migrate` and `GET /api/health`
- Stack: Next.js 16 (App Router) + TypeScript; Drizzle ORM + `pg`; PostgreSQL 17 (local Homebrew); tests via `node:test` + `tsx`
- Current next ready feature: none (all 30 features passing)
- Current blocker: none
- Last verified at: 2026-09-21 (pdp-evaluation-history passing — all features complete)

## Session Log

### Session 046

- Date: `2026-09-21`
- Goal: Handle JavaScript-rendered content (Option 1: detect + note).
- Completed: `cx-js-rendered-note` — `detectJsRendered` (terms present in
  `<script>` blocks but missing from the extracted text), stored as
  `evaluations.js_heavy` (migration 0011), and a report note when true explaining
  that crawler-based checks may be conservative. Also (from the GANT
  investigation) provider errors are retried up to 3 attempts and
  gemini-3.1-flash-lite is the default model.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 102/102;
  `npm run build`; GANT -> js_heavy true + note; Rothy's/IKEA -> false.
- Evidence captured: recorded in `feature_list.json` evidence for
  `cx-js-rendered-note`.
- Files or artifacts updated: js-detect, orchestrator, schema, report page,
  styles, tests, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: detection is heuristic; a future headless
  render pass (Option 2) would let us compare crawler vs rendered views.
- Next best step: continue the review.

### Session 045

- Date: `2026-09-21`
- Goal: GANT evaluation "fails" — investigate.
- Finding: the evaluation failed because Gemini 3.5 Flash returned HTTP 503
  (transient provider unavailability), not the page. Re-running with
  gemini-3.1-flash-lite completed (d1 7.1 / d2 7.5 / d3 1.2 / d4 9). GANT's low
  Trust & policy score is because its policies come from Contentful/JS, so they
  are absent from the raw HTML (crawler view).
- Completed: retryable provider errors are now retried (up to 3 attempts) in
  `evaluateWithModel`; `gemini-3.1-flash-lite` added to the default catalog as
  the first model (default in the form); friendlier "no model could be reached"
  copy; unit test for provider retry.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 99/99;
  `npm run build`; GANT completed via gemini-3.1-flash-lite.
- Evidence captured: recorded here.
- Known risk or unresolved issue: JS/Contentful-rendered policy content is not
  in the raw HTML, so crawler-based D3 checks can be conservative; consider a
  "page renders content with JavaScript" note in the report.
- Next best step: consider a JS-rendered-content note, or continue the review.

### Session 044

- Date: `2026-09-21`
- Goal: Review fixes — duplicated return policy and a false "buy button" finding.
- Completed: D4.add_to_cart now passes when the offer is in the product data
  even if the page renders the button with JavaScript (with explanatory
  evidence). Distinguished D1 (product data) vs D3 (on the page) scopes in the
  customer-facing titles and recommendation actions so returns/shipping don't
  read as duplicates. Updated D4/plain copy.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 98/98;
  `npm run build`; offline D4 run on the IKEA bed PDP -> add_to_cart pass with
  the JavaScript explanation.
- Evidence captured: recorded in `feature_list.json` (deterministic-checks-d4)
  and here.
- Files or artifacts updated: src/checks/d4.ts, finding copy, recommendation
  catalog, tests, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: return policy still appears in both dimensions
  (structured data vs page) by rubric design; titles now make the scope explicit.
- Next best step: continue the review.

### Session 043

- Date: `2026-09-21`
- Goal: Fix a misleading D4 finding from review (IKEA price).
- Completed: D4 price_displayed / currency_locale / stock_signal now fall back to
  JSON-LD Offer data when the page renders the price with JavaScript, so a
  JS-rendered price no longer shows "Show the price as text on the page". Added
  a unit test.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 98/98;
  `npm run build`; live IKEA evaluation -> price/currency/stock pass with
  evidence 'Price is in the structured data (24.99); the page shows it with
  JavaScript.'
- Evidence captured: recorded in `feature_list.json` (deterministic-checks-d4)
  and here.
- Files or artifacts updated: src/checks/d4.ts, tests, `feature_list.json`,
  `PROGRESS.md`.
- Known risk or unresolved issue: a JS-only page with no JSON-LD price still
  fails correctly; consider a clearer message for that case.
- Next best step: continue the review.

### Session 042

- Date: `2026-09-21`
- Goal: Hero fixes from review — duplicated URL and black score.
- Completed: `displayTitle(title, url)` derives a readable product name from the
  URL when the title is missing (used in the hero and the home list), so the URL
  no longer appears twice; the gauge number is now colored by score band.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 97/97;
  `npm run build`; render shows a derived title ('Mens Rs01 Sneaker Bone'), the
  URL only once, and gauge-number with a band class.
- Evidence captured: recorded here.
- Files or artifacts updated: copy helper, gauge, report page, home page, tests,
  `PROGRESS.md`.
- Known risk or unresolved issue: none.
- Next best step: continue the review.

### Session 041

- Date: `2026-09-21`
- Goal: Hero/summary layout feedback — nav on top, merge hero + summary.
- Completed: moved the sticky section nav above the hero and merged the
  executive summary (verdict band + top fixes) into the hero command bar;
  removed the separate SummarySection. Updated DESIGN.md (Report Hero).
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 96/96;
  `npm run build`; render confirms nav before hero, hero contains 'Top fixes',
  and no separate summary card.
- Evidence captured: recorded in `feature_list.json` evidence for
  `cx-hero-command-bar`.
- Files or artifacts updated: hero component, report page, styles, DESIGN.md,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: none.
- Next best step: continue the review (e.g., detected/missing chips).

### Session 040

- Date: `2026-09-21`
- Goal: Better hero command bar for the report (design).
- Completed: `cx-hero-command-bar` — `HeroSection` + `ScoreGauge` replace the old
  plain header/status card: product title, monospace URL, status badge, brand,
  detected page type, rubric, model chips, run date, an overall readiness ring
  gauge, and actions (back / retry). Adopted a few AgenticLens design ideas
  (layered surface, ring gauge, mono for data).
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 96/96;
  `npm run build`; render shows the hero, gauge (8.0 matching the aggregate),
  and model chips.
- Evidence captured: recorded in `feature_list.json` evidence for
  `cx-hero-command-bar`.
- Files or artifacts updated: hero + gauge components, report page, styles,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: DESIGN.md not yet updated with hero/gauge/
  mono tokens.
- Next best step: update DESIGN.md, or continue with detected/missing chips.

### Session 039

- Date: `2026-09-21`
- Goal: Report usability — order, navigation, collapsed technical details.
- Completed: `cx-report-navigation` — reordered the report (Summary → Scores →
  Recommendations → Findings → History → Details), added a sticky section nav
  with anchors, and turned "Steps & metrics" into a collapsed `<details>`.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 96/96;
  `npm run build`; render shows the nav anchors, the ascending section order, and
  a collapsed details section.
- Evidence captured: recorded in `feature_list.json` evidence for
  `cx-report-navigation`.
- Files or artifacts updated: report page, section components (id props),
  steps component, styles, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: none.
- Next best step: continue the review or tackle the other UX ideas (header,
  friendly section titles, score legend, guided home).

### Session 038

- Date: `2026-09-21`
- Goal: Fix unreadable "Excellent" score (text and background same color).
- Completed: removed background colors from all colored chips (score bands,
  priority, status badges, finding/step status, recommendation pill); chips are
  now outlined with colored text, so the score number is always readable. Score
  bars keep their fill color (they are graphics).
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 96/96;
  `npm run build`. Only the score-bar fills keep colored backgrounds.
- Evidence captured: recorded here.
- Files or artifacts updated: app/globals.css, `PROGRESS.md`.
- Known risk or unresolved issue: none.
- Next best step: continue the review.

### Session 037

- Date: `2026-09-21`
- Goal: Review feedback — band colors/labels and recommendation priority.
- Completed: `cx-band-priority-polish` — "Strong" renamed to "Excellent" with a
  distinct filled deep-green chip and a lighter green for "Good";
  recommendations now show a High/Medium/Low priority chip and
  "Potential score +X" instead of a bare "impact". Documented in `DESIGN.md`.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 96/96;
  `npm run build`; report renders distinct band colors and priority chips.
- Evidence captured: recorded in `feature_list.json` evidence for
  `cx-band-priority-polish`.
- Files or artifacts updated: bands, recommendation priority, recommendation UI,
  styles, `DESIGN.md`, tests, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: none.
- Next best step: continue the review.

### Session 036

- Date: `2026-09-21`
- Goal: Review feedback — fix contact evidence and add a recommendation-fit line.
- Completed: `cx-recommendation-fit` — model output now includes
  `recommendation_fit` (prompt, schema, validation, `model_evaluations.recommendation_fit`
  column + migration 0010), shown as "Would recommend for:" under brand
  perception. Also fixed the D3 contact check to prefer real contact details or
  a contact link over customer-review text.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 95/95;
  `npm run build`; live run on Rothy's: recommendation_fit stored and rendered,
  and contact evidence is now "Contact link present".
- Evidence captured: recorded in `feature_list.json` evidence for
  `cx-recommendation-fit`.
- Files or artifacts updated: prompt/validate/repository/schema, report UI,
  CONTEXT.md, docs/model-evaluation-prompt.md, tests, `feature_list.json`,
  `PROGRESS.md`.
- Known risk or unresolved issue: existing evaluations (stored before this
  change) have no recommendation fit and won't show the second line.
- Next best step: review the UI again or calibrate rubric weights.

### Session 035

- Date: `2026-09-21`
- Goal: Plain-language findings and recommendations (customer feedback).
- Completed: `cx-plain-language` — friendly check titles + translated evidence
  (`src/evaluation/finding-copy.ts`), plain-language recommendation catalog,
  plain status/type labels, and friendly API/auth/classification/status copy
  (`describeApiError`, `describeClassification`, `describeEvaluationStatusShort`,
  `describeStepStatus`, `describeCheckStatus`, `describeModelError`).
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 95/95
  (incl. a guardrail test forbidding schema.org jargon in the catalog);
  `npm run build`; rendered report shows friendly titles/evidence and no raw ids
  or `Offer.` terms.
- Evidence captured: recorded in `feature_list.json` evidence for
  `cx-plain-language`.
- Files or artifacts updated: finding copy, recommendation catalog, findings/
  recommendations/steps/progress/report/login/home components, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: copy is fixed English; some evidence is a
  verbatim page quote by design.
- Next best step: rubric weight calibration, or review the UI again.

### Session 034

- Date: `2026-09-21`
- Goal: Remove the need for a separate worker (customer experience).
- Completed: `cx-auto-process` — `ReportRefresh` now posts `/api/jobs/drain`
  while the evaluation is not terminal (and polls status), so evaluations are
  processed automatically while the report page is open. The worker remains
  optional for background processing. Progress copy and AGENTS.md updated.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 93/93;
  `npm run build`; confirmed no worker process running, created an evaluation
  (status created) and drain returned {processed:1} reaching completed.
- Evidence captured: recorded in `feature_list.json` evidence for
  `cx-auto-process`.
- Files or artifacts updated: report-refresh, progress copy, AGENTS.md,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: a run only advances while a tab is open (or
  the optional worker runs); the model call still happens inside the drain
  request, so a very slow provider could hit the request timeout.
- Next best step: rubric weight calibration.

### Session 033

- Date: `2026-09-21`
- Goal: Customer-experience improvements (5 features).
- Completed: `cx-live-run-progress` (ProgressSection + describeStep + interval
  refresh); `cx-executive-summary` (SummarySection with overall readiness band +
  top 3 fixes); `cx-score-bands` (scoreBand + colored scores); `cx-friendly-errors`
  (describeReason in summary/status); `cx-responsive-and-score-visuals` (score
  bars + <=640px rules). Added the 5 features to `feature_list.json`.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 93/93;
  `npm run build`; each feature verified by rendering fixtures (progress steps,
  summary 8.2/10 + bands, colored scores, friendly partial/failed copy, 4 score
  bars at 75/86/74/92%).
- Evidence captured: recorded in `feature_list.json` for each cx feature.
- Files or artifacts updated: report components, copy helpers, scoring bands,
  styles, tests, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: copy is fixed English; review wording with the
  consultant.
- Next best step: rubric weight calibration, or run the app and review the UI.

### Session 032

- Date: `2026-09-21`
- Goal: Customer-facing wording for the dimensions in the report.
- Completed: `src/dimension-copy.ts` with plain names + helper sentences
  (Product data, Page content, Trust & policy, Buying path); report scores now
  show the helper sentence and a "0 (not ready) to 10 (fully ready)" subtitle;
  findings and recommendations use the plain names. Documented in `DESIGN.md`.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 91/91;
  `npm run build`; report renders the new names/helpers and no longer shows the
  technical labels.
- Evidence captured: recorded in this log and `DESIGN.md`.
- Files or artifacts updated: dimension copy, report/findings/recommendations,
  styles, `DESIGN.md`, `PROGRESS.md`.
- Known risk or unresolved issue: copy is fixed English; review wording with the
  consultant.
- Next best step: rubric weight calibration, or more customer-facing polish.

### Session 031

- Date: `2026-09-21`
- Goal: Implement `pdp-evaluation-history` (final feature).
- Completed: `listEvaluationsForPdp` / `getLatestEvaluationForPdp`; HistorySection
  on the report (snapshots with latest/viewing tags); `/pdps/[id]` redirect to
  the latest evaluation; home PDP links now point to `/pdps/[id]`; styles.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 91/91;
  `npm run build`; live: two evaluations of one PDP -> /pdps/[id] 307 to the
  latest and the report lists both snapshots with latest/viewing tags.
- Evidence captured: recorded in `feature_list.json` evidence for
  `pdp-evaluation-history`.
- Milestone: feature_list.json is 30/30 passing; the MVP is feature-complete.
- Files or artifacts updated: orchestrator, history component, /pdps route,
  home page, styles, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: none blocking; see docs/risks-and-open-questions.md
  (rubric weight calibration, model drift, scraping compliance).
- Next best step: rubric weight calibration with the consultant, or run the app.

### Session 030

- Date: `2026-09-21`
- Goal: Implement `per-evaluation-cost-ceiling`.
- Completed: limits module (`src/evaluation/limits.ts`), enforcement in
  `createEvaluation` (reject too many models / over ceiling) and mid-run in
  `runEvaluation` (stop when accumulated estimated cost reaches the ceiling),
  `cost_ceiling_exceeded` reason, tests, and `.env.example` limits.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 91/91;
  `npm run build`; live: 2 models with max 1 -> 400 too_many_models; low ceiling
  -> 400 cost_ceiling_exceeded; defaults -> 201.
- Evidence captured: recorded in `feature_list.json` evidence for
  `per-evaluation-cost-ceiling`.
- Files or artifacts updated: limits module, orchestrator, route, tests,
  `.env.example`, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: the pre-run estimate uses assumed token
  counts; unknown models have no estimate.
- Next best step: `pdp-evaluation-history`.

### Session 029

- Date: `2026-09-21`
- Goal: Implement `evaluation-observability`.
- Completed: `evaluation_steps` table + migration 0009; `recordStep`/`listSteps`
  (`src/evaluation/observability.ts`); latency + estimated cost in `run.ts`
  (`src/evaluation/pricing.ts`); step recording in `runEvaluation` and
  `retryFailedModels`; route GET /api/evaluations/[id]/steps; report
  Steps & metrics section; pricing tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 85/85;
  `npm run build`; live: success run recorded all steps with durations and model
  usage (latency 6304ms, 7425/657 tokens, $0.000754); blocked fetch recorded a
  failed fetch step.
- Evidence captured: recorded in `feature_list.json` evidence for
  `evaluation-observability`.
- Files or artifacts updated: schema, observability/pricing, orchestrator, run,
  route, report UI, styles, tests, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: pricing values are estimates and unknown
  models report no cost.
- Next best step: `per-evaluation-cost-ceiling`.

### Session 028

- Date: `2026-09-21`
- Goal: Implement `retry-failed-models`.
- Completed: `resolveEvaluationStatus` helper, `retryFailedModels`
  (re-runs failed model rows in place and recomputes scores/recommendations/
  status), route POST /api/evaluations/[id]/retry, report Retry button, styles,
  and tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 82/82;
  `npm run build`; live: partial evaluation -> retry -> completed with no new
  snapshot; retry on a completed evaluation -> 400.
- Evidence captured: recorded in `feature_list.json` evidence for
  `retry-failed-models`.
- Files or artifacts updated: orchestrator, route, retry button, report page,
  styles, tests, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: retry re-runs the same model; a persistently
  failing model (e.g., invalid model id) will fail again.
- Next best step: `evaluation-observability`.

### Session 027

- Date: `2026-09-21`
- Goal: Implement `report-recommendations` (5 of 5 for a tryable site).
- Completed: RecommendationsSection
  (app/evaluations/[id]/recommendations.tsx) rendering the ordered
  recommendation list and per-model brand perception (unscored), plus styles.
- Verification run: `npm run lint`; `npm run typecheck`; `npm run build`; GET
  /evaluations/[id] -> 200 with both recommendations in impact order, the
  unscored brand perception for both models, and dimension labels.
- Evidence captured: recorded in `feature_list.json` evidence for
  `report-recommendations`.
- Milestone: the site is now end-to-end tryable in a browser: paste a PDP URL,
  pick models, submit, and read scores/findings/recommendations.
- Files or artifacts updated: recommendations component, report page, styles,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: the background worker must be running
  (`npm run worker`) for evaluations to process; `gemini-3.5-flash`/`3.6-flash`
  show intermittent 503.
- Next best step: optional features, or run the app and review the UI.

### Session 026

- Date: `2026-09-21`
- Goal: Implement `report-findings` (4 of 5 for a tryable site).
- Completed: FindingsSection (app/evaluations/[id]/findings.tsx) merging
  deterministic and model-judged findings, grouped by dimension with status
  chips, evidence, type label, and a collapsible passing-checks list; styles.
- Verification run: `npm run lint`; `npm run typecheck`; `npm run build`; GET
  /evaluations/[id] -> 200 with fail/partial chips, deterministic and
  "model · <name>" labels, evidence, and passing-checks details.
- Evidence captured: recorded in `feature_list.json` evidence for
  `report-findings`.
- Files or artifacts updated: findings component, report page, styles,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: model findings repeat per model (no
  cross-model aggregation), which is intentional for transparency.
- Next best step: `report-recommendations`.

### Session 025

- Date: `2026-09-21`
- Goal: Implement `report-scores-view` (3 of 5 for a tryable site).
- Completed: report route app/evaluations/[id]/page.tsx (status, reason,
  classification, rubric, four dimension cards with aggregate + per-model
  scores), ReportRefresh client auto-refresh, DIMENSION_LABELS, and styles.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 79/79;
  `npm run build`; GET /evaluations/[id] on a fixture with 2 models -> 200 with
  dimension labels, aggregates, and visible per-model disagreement (7.1 vs 9.0).
- Evidence captured: recorded in `feature_list.json` evidence for
  `report-scores-view`.
- Files or artifacts updated: report page, refresh component, scoring labels,
  styles, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: report shows only scores so far; findings and
  recommendations are the next two features.
- Next best step: `report-findings`.

### Session 024

- Date: `2026-09-21`
- Goal: Implement `home-brand-grouped-list` (2 of 5 for a tryable site).
- Completed: home now loads brands, PDPs, and recent evaluations, groups PDPs by
  brand, and links each PDP to its latest evaluation (app/page.tsx + styles).
- Verification run: `npm run lint`; `npm run typecheck`; `npm run build`; live:
  home rendered 2 brand groups (Rothys with 2 PDPs, Example with 1), each row
  linking to its evaluation.
- Evidence captured: recorded in `feature_list.json` evidence for
  `home-brand-grouped-list`.
- Files or artifacts updated: home page, styles, `feature_list.json`,
  `PROGRESS.md`.
- Known risk or unresolved issue: the report route `/evaluations/[id]` is still
  not built (links 404 for now).
- Next best step: `report-scores-view`.

### Session 023

- Date: `2026-09-21`
- Goal: Implement `home-pdp-entry` (first of the 5 features needed to try the site).
- Completed: home server component with real content (app/page.tsx), client
  evaluation form (app/evaluation-form.tsx: URL + model checkboxes), URL
  validation in POST /api/evaluations, and form styles.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 79/79;
  `npm run build`; GET / (authenticated) -> 200 with the form; invalid URL ->
  400 with message.
- Evidence captured: recorded in `feature_list.json` evidence for
  `home-pdp-entry`.
- Files or artifacts updated: home page, form, evaluation route, styles,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: the report route `/evaluations/[id]` is not
  built yet (next features); submitting currently redirects to a 404.
- Next best step: `home-brand-grouped-list`, then the report features.

### Session 022

- Date: `2026-09-21`
- Goal: Implement `evaluation-status-states`.
- Completed: status helpers (`src/evaluation/status.ts`), status route
  `/api/evaluations/[id]/status`, and orchestrator reasons for partial/failed
  (`fetch_blocked:*`, `not_a_pdp:*`, `all_models_failed`, `models_failed:N/M`);
  unit tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 79/79;
  `npm run build`; live: blocked fetch -> failed `fetch_blocked:http_403`;
  one model failing -> partial `models_failed:1/2`.
- Evidence captured: recorded in `feature_list.json` evidence for
  `evaluation-status-states`.
- Files or artifacts updated: status module, route, orchestrator, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: `gemini-3.5-flash`/`gemini-3.6-flash` return
  intermittent HTTP 503; failed models are not retried yet (that is
  `retry-failed-models`).
- Next best step: `home-pdp-entry` (UI) or `retry-failed-models`.

### Session 021

- Date: `2026-09-21`
- Goal: Implement `evaluation-run-orchestration`.
- Completed: `evaluations` table + migration `drizzle/0008_tense_deathbird.sql`;
  `model_evaluations.evaluation_id`; orchestrator
  (`src/evaluation/orchestrator.ts`: createEvaluation, runEvaluation,
  computeEvaluationScores); `evaluation.run` job handler in the registry;
  routes `GET/POST /api/evaluations` and `GET /api/evaluations/[id]`; unit tests
  for score combination.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 77/77;
  `npm run build`; live end-to-end via API + worker reaching `completed` with
  persisted scores, recommendations, and step outputs.
- Evidence captured: recorded in `feature_list.json` evidence for
  `evaluation-run-orchestration`.
- Files or artifacts updated: schema, orchestrator, registry, routes, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: worker must be running (or `drain` called) for
  jobs to process; regenerating a full evaluation re-fetches and re-calls models.
- Next best step: `evaluation-status-states` (expose states) or `home-pdp-entry`.

### Session 020

- Date: `2026-09-21`
- Goal: Implement `recommendation-mapping`.
- Completed: canonical recommendation catalog
  (`src/recommendations/catalog.ts`, one action+why per check id) and
  `mapRecommendations` (`src/recommendations/map.ts`) ranking by
  impact = round2(weight * (1 - outcome)); unit tests incl. catalog coverage.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 75/75;
  `npm run build`.
- Evidence captured: recorded in `feature_list.json` evidence for
  `recommendation-mapping`.
- Files or artifacts updated: recommendations module, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: recommendation copy is fixed English; the
  catalog must be kept in sync when checks change.
- Next best step: `evaluation-run-orchestration`.

### Session 019

- Date: `2026-09-21`
- Goal: Implement `dimension-scoring-engine`.
- Completed: scoring module (`src/scoring/score.ts`): weighting
  (pass/partial/fail = 1/0.5/0), per-dimension caps (D1=3, D2=4, D3=4, D4=3)
  triggered by critical deterministic findings, model-output to findings mapping,
  and per-dimension aggregation; unit tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 71/71;
  `npm run build`.
- Evidence captured: recorded in `feature_list.json` evidence for
  `dimension-scoring-engine`.
- Files or artifacts updated: scoring module, tests, `feature_list.json`,
  `PROGRESS.md`.
- Known risk or unresolved issue: weights are v0.1 placeholders; no end-to-end
  wiring yet (that is `evaluation-run-orchestration`).
- Next best step: `recommendation-mapping`.

### Session 018

- Date: `2026-09-21`
- Goal: Implement `brand-perception-capture`.
- Completed: `model_evaluations` table + migration `drizzle/0007_foamy_zeigeist.sql`;
  `buildModelEvaluationValues` / `recordModelEvaluation` /
  `runAndRecordModelEvaluation` (`src/evaluation/repository.ts`); routes
  `GET/POST /api/pdps/[id]/model-evaluations`; `getModelProfile`; added
  `gemini-3.5-flash` to the default catalog; unit tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 62/62;
  `npm run build`; live Gemini via profile -> completed, 9 checks,
  brand_perception stored and returned.
- Evidence captured: recorded in `feature_list.json` evidence for
  `brand-perception-capture`.
- Files or artifacts updated: schema, evaluation module, routes, catalog, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: a model evaluation is stored per call; grouping
  multiple model evaluations under one Evaluation is the next feature.
- Next best step: `dimension-scoring-engine`.

### Session 017

- Date: `2026-09-21`
- Goal: Implement `model-evaluation-call`.
- Completed: prompt builder (`src/evaluation/prompt.ts`, 9 model-judged
  checks), schema validation (`validate.ts`), `evaluateWithModel` with one
  repair attempt then failed (`run.ts`), `npm run smoke:evaluation`, and tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 60/60;
  `npm run build`; live Gemini `gemini-3.5-flash` -> completed in 1 attempt,
  9/9 checks, caught the JSON-LD availability contradiction.
- Evidence captured: recorded in `feature_list.json` evidence for
  `model-evaluation-call`.
- Files or artifacts updated: evaluation module, smoke script, tests,
  `package.json`, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: `gemini-3.6-flash` and `gemini-flash-latest`
  returned transient HTTP 503; provider errors are not retried inside
  `evaluateWithModel` (retry belongs to orchestration).
- Next best step: `brand-perception-capture`.

### Session 016

- Date: `2026-09-21`
- Goal: Implement `deterministic-checks-d4`.
- Completed: `CheckContext` extended with `fetch` and `robots`; 10 D4 checks
  (`src/checks/d4.ts`); `runD4ForPdp` auto-captures robots.txt when absent;
  route `/api/pdps/[id]/checks/d4`; HTML fixtures (`tests/fixtures/d4-*.html`)
  and tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 54/54;
  `npm run build`; live Rothy's PDP -> 9 pass / 1 partial.
- Evidence captured: recorded in `feature_list.json` evidence for
  `deterministic-checks-d4`.
- Files or artifacts updated: checks module, route, fixtures, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: text matchers can attach imprecise evidence
  (e.g., "checkout" inside a VAT sentence counts as a CTA; a shipping amount is
  picked as the first price text).
- Next best step: `model-evaluation-call`.

### Session 015

- Date: `2026-09-21`
- Goal: Implement `deterministic-checks-d3`.
- Completed: shared JSON-LD helpers (`src/checks/jsonld.ts`, d1 refactored to
  use them), 11 D3 checks (`src/checks/d3.ts`), `runD3ForPdp`, route
  `/api/pdps/[id]/checks/d3`, HTML fixtures (`tests/fixtures/d3-*.html`) and
  tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 50/50;
  `npm run build`; live Rothy's PDP -> 8 pass / 3 fail after tightening the
  delivery-time and legal-identity patterns.
- Evidence captured: recorded in `feature_list.json` evidence for
  `deterministic-checks-d3`.
- Files or artifacts updated: checks module, route, fixtures, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: regex evidence can surface a semantically
  imprecise line (e.g., contact matched a review mentioning customer service).
- Next best step: `deterministic-checks-d4`.

### Session 014

- Date: `2026-09-21`
- Goal: Implement `deterministic-checks-d2`.
- Completed: 8 D2 checks (`src/checks/d2.ts`), `runD2ForPdp`, route
  `/api/pdps/[id]/checks/d2`, shared `summarize` helper, HTML fixtures
  (`tests/fixtures/d2-*.html`) and tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 46/46;
  `npm run build`; live Rothy's PDP -> 7 pass / 1 partial.
- Evidence captured: recorded in `feature_list.json` evidence for
  `deterministic-checks-d2`.
- Files or artifacts updated: checks module, routes, fixtures, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: hidden-content heuristic can flag legitimate
  hidden markup as partial (as seen on Rothy's).
- Next best step: `deterministic-checks-d3`.

### Session 013

- Date: `2026-09-21`
- Goal: Implement `deterministic-checks-d1`.
- Completed: check framework (`src/checks/types.ts`), 12 D1 checks
  (`src/checks/d1.ts`), `runD1ForPdp` (`src/checks/repository.ts`), route
  `/api/pdps/[id]/checks/d1`, and JSON fixture corpus
  (`tests/fixtures/d1-*.json`) with tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 42/42;
  `npm run build`; live Rothy's PDP -> 9 pass / 3 fail; missing normalization
  422.
- Evidence captured: recorded in `feature_list.json` evidence for
  `deterministic-checks-d1`.
- Files or artifacts updated: checks module, route, fixtures, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: D1 depends on the JSON-LD extracted upstream;
  checks use a simplified identifier/availability token set.
- Next best step: `deterministic-checks-d2`.

### Session 012

- Date: `2026-09-21`
- Goal: Implement `non-pdp-url-detection`.
- Completed: rule-based page classifier (`src/capture/classify.ts`) and
  `classifyPdp` (`src/capture/classifyRepository.ts`); route
  `/api/pdps/[id]/classification`; unit tests. Threshold tuned so a real PDP
  with a single price + title is accepted (low confidence) without JSON-LD/CTA.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 38/38;
  `npm run build`; live: books.toscrape product -> product, homepage ->
  homepage, 404 -> error http_404.
- Evidence captured: recorded in `feature_list.json` evidence for
  `non-pdp-url-detection`.
- Files or artifacts updated: capture module, route, tests, `feature_list.json`,
  `PROGRESS.md`.
- Known risk or unresolved issue: classification is heuristic; the dataset
  listing path (no JSON-LD/CTA) lands as low-confidence product, which callers
  may want to treat as "review" rather than reject.
- Next best step: `deterministic-checks-d1`.

### Session 011

- Date: `2026-09-21`
- Goal: Implement `agent-access-robots`.
- Completed: robots.txt parsing and AI-crawler evaluation
  (`src/capture/robots.ts`: parseRobots, isPathAllowed, evaluateRobots,
  checkAgentAccess, AI_CRAWLERS), `robots_reports` table + migration
  `drizzle/0006_lively_nightshade.sql`, repository, route
  `/api/pdps/[id]/robots`, and unit tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 32/32;
  `npm run build`; live: nytimes.com blocked (GPTBot, ClaudeBot, ...),
  example.com allowed (no robots.txt), unknown pdp 404.
- Evidence captured: recorded in `feature_list.json` evidence for
  `agent-access-robots`.
- Files or artifacts updated: schema, robots module, route, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: robots parsing is a simplified prefix/longest
  match (no full spec wildcard handling); root-path access only.
- Next best step: `non-pdp-url-detection`.

### Session 010

- Date: `2026-09-21`
- Goal: Implement `pdp-content-normalization`.
- Completed: cheerio-based normalization (`src/capture/normalize.ts`) producing
  text/markdown, extracted JSON-LD, and price/availability/CTA signals; storage
  table `pdp_normalizations` + migration `drizzle/0005_blue_shiva.sql`;
  `normalizePdp`/`getLatestNormalization`; route
  `/api/pdps/[id]/normalize`; fixture `tests/fixtures/sample-pdp.html` and
  normalization tests.
- Verification run: `npm run lint`; `npm run typecheck`; `npm test` -> 25/25;
  `npm run build`; live fetch+normalize of a books.toscrape PDP (title/price/
  availability captured), unknown pdp 404.
- Evidence captured: recorded in `feature_list.json` evidence for
  `pdp-content-normalization`.
- Files or artifacts updated: schema, capture module, routes, fixture, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: no CTA on every real page (some pages omit the
  add-to-cart button in the fetched HTML); global line dedupe could drop
  legitimately repeated lines (acceptable for MVP).
- Next best step: `agent-access-robots`.

### Session 009

- Date: `2026-09-21`
- Goal: Implement `pdp-fetch-raw-capture`.
- Completed: `pdp_fetches` table + migration
  `drizzle/0004_common_hemingway.sql`, crawler fetch with bot-block detection
  (`src/capture/fetch.ts`), repository (`src/capture/repository.ts`:
  capturePdp, listFetches, getLatestFetch), route
  `/api/pdps/[id]/fetch` (GET history, POST capture), `getPdp` helper, and
  capture unit tests.
- Verification run: `npm run db:generate` + `db:migrate`; `npm run lint`;
  `npm run typecheck`; `npm test` -> 20/20; `npm run build`; curl: example.com
  -> 200 (raw HTML stored), H&M -> 403 blocked http_403, unknown pdp 404.
- Evidence captured: recorded in `feature_list.json` evidence for
  `pdp-fetch-raw-capture`.
- Files or artifacts updated: schema, capture module, routes, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: no headless rendering, so JS-only content is
  treated as a gap (by design); large pages stored in full (no size cap yet).
- Next best step: `pdp-content-normalization` (HTML -> text/markdown + JSON-LD).

### Session 008

- Date: `2026-09-21`
- Goal: Implement `brand-grouping`.
- Completed: `brands` + `pdps` tables and migration
  `drizzle/0003_same_iron_fist.sql`, brand detection (`src/brands/detect.ts`),
  repository (`src/brands/repository.ts`: addPdpWithBrand, listBrands, listPdps,
  renameBrand, mergeBrands), API routes (`/api/pdps`, `/api/brands`,
  `/api/brands/[id]`, `/api/brands/[id]/merge`), and detection unit tests.
- Verification run: `npm run db:generate` + `db:migrate`; `npm run lint`;
  `npm run typecheck`; `npm test` -> 15/15; `npm run build`; curl: two same-domain
  PDPs grouped (pdpCount 2), rename persists, merge moved PDPs (count 3, source
  brand gone), invalid URL 400.
- Evidence captured: recorded in `feature_list.json` evidence for
  `brand-grouping`.
- Files or artifacts updated: schema, brands module, routes, tests,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: registrable-domain heuristic is naive for
  multi-part suffixes (e.g. co.uk); manual rename/merge is the fallback.
- Next best step: `pdp-fetch-raw-capture` (HTTP fetch + raw capture).

### Session 007

- Date: `2026-09-21`
- Goal: Implement `model-profiles-catalog`.
- Completed: `model_profiles` table + migration `drizzle/0002_young_amazoness.sql`,
  catalog with env-provided extras (`src/models/catalog.ts`), repository with
  seed/list/toggle (`src/models/repository.ts`), seed script (`npm run db:seed`),
  API routes (`/api/model-profiles`, `/api/model-profiles/[id]`,
  `/api/model-profiles/seed`), and catalog unit tests. `init.sh` now seeds after
  migrate.
- Verification run: `npm run db:seed` (inserted 2); `npm run lint`;
  `npm run typecheck`; `npm test` -> 10/10; `npm run build`; curl: list, disable
  (enabled 2 -> 1), re-enable (-> 2), idempotent seed `{inserted:0,total:2}`,
  unauth 401.
- Evidence captured: recorded in `feature_list.json` evidence for
  `model-profiles-catalog`.
- Files or artifacts updated: schema, models module, seed script, routes, tests,
  `package.json`, `init.sh`, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: **GEMINI_API_KEY was printed in session output
  and should be rotated**; `APP_PASSWORD` was changed by the user in `.env`
  (verification reads it from the environment, not hardcoded).
- Next best step: `brand-grouping` (brand detection + override).

### Session 006

- Date: `2026-09-21`
- Goal: Implement `model-provider-adapter`.
- Completed: `ModelProvider` interface (`src/providers/types.ts`), typed
  `ProviderError` (`errors.ts`), shared `postJson` with timeout + error mapping
  (`http.ts`), REST adapters for Google/OpenAI/Anthropic, factory and barrel.
  Added `node:test` + `tsx` test runner (`npm test`), `npm run smoke:provider`,
  and `.env.example` provider keys.
- Verification run: `npm test` -> 7/7 passing; `npm run lint`; `npm run typecheck`;
  `npm run build`; `./init.sh` (now runs tests) exit 0; live
  `npm run smoke:provider` (gemini-3.6-flash) -> `{"ok": true}` with usage.
- Evidence captured: recorded in `feature_list.json` evidence for
  `model-provider-adapter`.
- Files or artifacts updated: providers module, tests, smoke script,
  `package.json`, `init.sh`, `.env.example`, `feature_list.json`, `PROGRESS.md`,
  `docs/technical-discovery.md`.
- Known risk or unresolved issue: OpenAI/Anthropic adapters are mock-tested only
  until keys exist; `gemini-2.5-flash` is unavailable to new accounts (use
  `gemini-3.6-flash`).
- Next best step: `model-profiles-catalog`.

### Session 005

- Date: `2026-09-21`
- Goal: Implement `bootstrap-background-jobs`.
- Completed: `jobs` table + migration `drizzle/0001_fresh_solo.sql`, queue
  (`src/jobs/queue.ts`) with `FOR UPDATE SKIP LOCKED` claiming, attempts and
  backoff, handler registry (`src/jobs/registry.ts`), worker
  (`scripts/worker.ts`, `npm run worker`), and job API routes
  (`/api/jobs`, `/api/jobs/[id]`, `/api/jobs/drain`).
- Verification run: `npm run db:generate` + `db:migrate`; `npm run lint`;
  `npm run typecheck`; `npm run build`; curl: echo job -> completed,
  fail job (maxAttempts 1) -> failed with error, drain `{processed:1}`,
  unauth 401; `npm run worker` processed an enqueued job (pending -> completed);
  `./init.sh` exit 0.
- Evidence captured: recorded in `feature_list.json` evidence for
  `bootstrap-background-jobs`.
- Files or artifacts updated: schema, queue, registry, worker, routes, scripts,
  `feature_list.json`, `PROGRESS.md`, `docs/technical-discovery.md`.
- Known risk or unresolved issue: worker is a separate process (not yet wired
  into serverless scheduling); job claiming is single-worker-safe via
  SKIP LOCKED but not load-tested.
- Next best step: `model-provider-adapter` (OpenAI/Anthropic/Google adapter).

### Session 004

- Date: `2026-09-21`
- Goal: Implement `bootstrap-auth-gate`.
- Completed: signed HMAC session cookie (`src/auth/token.ts`,
  `src/auth/config.ts`), Next 16 `proxy.ts` gate, login page
  (`app/login/page.tsx`, `app/login/login-form.tsx`), login/logout routes,
  sign-out server action, `APP_PASSWORD` env, styles.
- Verification run: `npm run lint`; `npm run typecheck`; `npm run build`;
  curl against `npm run start`: home 307 -> /login, health 200, login 200,
  wrong password 401, correct password 200 + cookie, authed home 200,
  protected API 401, logout 200, post-logout 307; `./init.sh` exit 0.
- Evidence captured: recorded in `feature_list.json` evidence for
  `bootstrap-auth-gate`.
- Files or artifacts updated: auth modules, proxy, login/logout UI and routes,
  `.env`/`.env.example`, `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: single shared password is a temporary gate,
  not real auth; middleware convention renamed to `proxy` in Next 16.
- Next best step: `bootstrap-background-jobs` (hosted queue or worker).

### Session 003

- Date: `2026-09-21`
- Goal: Implement `bootstrap-database`.
- Completed: Drizzle ORM + pg client (`src/db/client.ts`), initial schema
  (`src/db/schema.ts`, `app_metadata`), health check (`src/db/health.ts`,
  `app/api/health/route.ts`), `drizzle.config.ts`, migration
  `drizzle/0000_condemned_blob.sql`, `.env`/`.env.example`, `db:generate` and
  `db:migrate` scripts, updated `init.sh` to apply migrations.
- Verification run: `npm run db:migrate`; `psql \dt`; `npm run lint`;
  `npm run typecheck`; `npm run build`; `GET /api/health` -> 200; degraded path
  with bad URL -> 503; `./init.sh` exit 0.
- Evidence captured: recorded in `feature_list.json` evidence for
  `bootstrap-database`.
- Files or artifacts updated: DB layer, config, migration, env files, scripts,
  `init.sh`, `tsconfig.json` alias (`@/*` -> `./src/*`), `feature_list.json`,
  `PROGRESS.md`.
- Known risk or unresolved issue: local Postgres is a Homebrew service
  (postgresql@17) that must be running; `npm install` reported 4 moderate
  advisories in dev dependencies.
- Next best step: `bootstrap-auth-gate` (shared password gate).

### Session 002

- Date: `2026-09-21`
- Goal: Implement `bootstrap-app-shell`.
- Completed: Next.js 16 + TypeScript app shell (`app/layout.tsx`,
  `app/page.tsx`, `app/globals.css`), config (`package.json`, `tsconfig.json`,
  `next.config.ts`, `eslint.config.mjs`, `.gitignore`), bootstrapped `init.sh`.
- Verification run: `./init.sh` (exit 0); `npm run build` (compiled);
  `npm run start` + `GET /` -> HTTP 200.
- Evidence captured: recorded in `feature_list.json` evidence for
  `bootstrap-app-shell`; home rendered "PDP AI-Readiness" and "Application shell".
- Files or artifacts updated: app shell files, config, `init.sh`,
  `feature_list.json`, `PROGRESS.md`.
- Known risk or unresolved issue: no test runner yet (`npm test` not defined);
  add one before features that need unit tests; rubric weights still provisional.
- Next best step: `bootstrap-database` (Postgres + ORM + initial migration).

### Session 001

- Date: `2026-09-21`
- Goal: Complete product discovery and create the minimal startup harness.
- Completed: discovery docs (`CONTEXT.md`, `docs/build-brief.md`,
  `docs/domain-model.md`, `docs/technical-discovery.md`,
  `docs/risks-and-open-questions.md`, `docs/evaluation-contract.md`,
  `docs/model-evaluation-prompt.md`, `DESIGN.md`); manual model prompt validation
  runs under `spikes/validation/`; harness created (`AGENTS.md`, `init.sh`,
  `PROGRESS.md`, `feature_list.json`).
- Verification run: `json` validation of `feature_list.json`; `chmod +x init.sh`.
- Evidence captured: 3/3 models returned valid schema JSON; cross-model
  divergence recorded in `spikes/validation/run-01-results.md`.
- Files or artifacts updated: listed above.
- Known risk or unresolved issue: rubric weights are placeholders; deterministic
  check feasibility not yet confirmed; per-evaluation cost ceiling undecided.
- Next best step: start `bootstrap-app-shell` (Next.js + TypeScript app shell).

## Design adjustment — 2026-09-23

- Matched brand perception and recommendation-fit paragraphs to the main text colour for consistent readability.
- Verification: baseline ./init.sh passed (lint, typecheck, 121 tests); confirmed both CSS rules use var(--text). CSS-only change; no new tests needed.
- No new blockers.
