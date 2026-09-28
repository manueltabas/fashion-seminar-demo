# Build Brief

## Problem

As shopping increasingly gets mediated by AI models and assistants, a store's
Product Detail Page must be readable and understandable by machines, not only by
humans. Agencies that advise e-commerce clients have no formal, repeatable way to
answer "how ready is this PDP for AI models?" They cannot produce a credible
score, cannot show evidence, and cannot hand the client a prioritized list of
fixes. The result is generic advice and missed visibility in AI-mediated
shopping.

## Current Workaround / Existing System

There is no formal process. The consultant relies on intuition and experience,
sometimes reading vendor/standards docs ad hoc. Nothing is scored, nothing is
stored, and results are not comparable across stores or over time.

## Target Users

- **Primary (MVP):** an e-commerce agency/consultant performing AI-readiness
  evaluations on client PDPs. Single user, no accounts in the MVP.
- **Secondary (post-MVP):** other users/colleagues in the agency, and eventually
  client-facing access — deferred.
- **Recipient of results:** the client, who consumes the findings through the
  consultant (not through the tool) in the MVP.

## Goals

- Produce a credible 0-10 readiness score for a PDP across four dimensions
  (Machine-readable Data, Content Extractability, Trust & Policy Signals,
  Transactional Readiness), per selected model plus an aggregate.
- Explain each score with concrete evidence (findings), not just numbers.
- Turn findings into specific, prioritized recommendations.
- Capture a qualitative, unscored read of how the model understands the brand.
- Make evaluations repeatable and comparable over time (immutable snapshots).
- Be fast and affordable enough to run inside a live client engagement.
- Present results in a clear, visual, client-defensible report.

## Non-Goals

- No export, PDF, or external client sharing.
- No multi-user accounts, teams, roles, or multi-tenant isolation.
- No bulk PDP import or whole-catalog crawl.
- No scheduled or continuous monitoring.
- No brand-vs-brand stats/comparison page.
- No custom rubrics or per-client model tuning.
- No checkout/transaction execution and no changes to the client's site.
- Not a store plugin or platform integration.
- No live model web-browsing mode (evaluation is in-context).

## MVP Slice

One end-to-end vertical slice:

1. On the home screen, the consultant pastes a PDP URL and selects one or more
   models, next to a list of previously evaluated PDPs grouped by brand.
2. The tool detects the brand, fetches the PDP as a crawler would, and normalizes
   it to text/markdown plus structured data.
3. A background job runs deterministic checks and sends the normalized content
   plus a fixed instruction set to each selected model, collecting structured
   output per dimension with evidence and the brand perception summary.
4. The tool computes per-model 0-10 scores and aggregate scores for the four
   dimensions, and maps findings to prioritized recommendations.
5. The report page presents per-model and aggregate scores, the brand perception
   summary, and the recommendations. The PDP is now listed under its brand.

## Validation Plan

- Run evaluations on a curated sample of real PDPs from well-known brands and
  compare scores against the consultant's manual expert judgment as the gold
  standard.
- Check reproducibility: same PDP + same models + same rubric version should
  produce stable scores within an agreed tolerance.
- Check failure behavior: blocked, JS-only, non-PDP, and 404 URLs must produce
  correct partial/failed states with a clear reason.
- Check cross-model behavior: differences between models should be explainable,
  not random.
- Usability check: the consultant can go from URL to a defensible report within
  one working session.

## Success Criteria

- A consultant can produce a report they would stand behind in front of a client,
  for one PDP, in roughly 10 minutes including review.
- Scores correlate with the consultant's expert manual assessment on the
  validation sample.
- Recommendations are specific and actionable rather than generic advice.
- The report is legible without the consultant having to narrate it.
- Cost and latency per evaluation are acceptable and observable.

## Notes

- The concrete rubric (checks, weights, and how deterministic checks combine with
  model judgment) is intentionally deferred to the spec phase; see
  `risks-and-open-questions.md`.
- The four scored dimensions are treated as a hypothesis about readiness and are
  subject to validation.
- All project documents are maintained in English.