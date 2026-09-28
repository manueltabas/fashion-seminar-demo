# Risks and Open Questions

## Blocking Next Phase

- **Cost and content budget.** How many models per evaluation and how much page
  content per run is acceptable, and what the per-evaluation cost ceiling is,
  is undecided.
- **Readiness definition validation.** The four scored dimensions are a working
  hypothesis; they need validation against real expert judgment and, ideally,
  current agentic-commerce standards.
- **Deterministic check feasibility.** Which checks can be reliably detected from
  raw HTML versus needing model judgment must be confirmed before implementation.

## Implementation-Time Questions

- **Prompt re-validation.** After the run-01 prompt changes, re-run the manual
  validation and confirm cross-model divergence drops (see
  `spikes/validation/run-01-results.md`).
- **Weight calibration.** Rubric v0.1 check weights are placeholders and must be
  calibrated against expert judgment during validation.
- **Truncation strategy** for large pages, and whether truncation should always
  be reported as a finding.
- **Scraping compliance stance:** how strictly to honor robots.txt, what rate
  limiting to apply, and what content to retain and for how long.
- **PDP detection heuristics:** how to decide a URL is a PDP and not a homepage,
  category, or error page.
- **Model version pinning** and the tolerance within which repeat evaluations are
  considered stable.
- **Brand detection heuristics** for marketplaces, subdomains, and regional
  domains, and the rename/merge behavior.
- **Retry semantics:** what can be retried within an evaluation versus what
  requires a new snapshot.
- **Shared-password mechanics:** where the gate lives, how the secret rotates,
  and how it is replaced by real auth later.

## Later / Not MVP

- Stats/comparison page across brands.
- Export, PDF, and external client sharing.
- Multi-user accounts, teams, and multi-tenant isolation.
- Bulk PDP import and whole-catalog crawl.
- Scheduled/continuous monitoring.
- Custom rubrics and per-client model tuning.
- Live model web-browsing evaluation mode.
- Transactional/checkout execution testing and non-PDP page types.

## Assumptions

- The consultant has usable accounts/API keys for OpenAI, Anthropic, and Google.
- A meaningful share of target PDPs can be fetched server-side as a crawler
  would see them.
- Passing normalized in-context content to a model is an acceptable proxy for how
  models consume a page (versus live browsing).
- The four dimensions are a reasonable proxy for agentic-commerce readiness.

## Risks

- **Score credibility.** Models can be inconsistent or confabulate. Mitigation:
  hybrid rubric with deterministic checks, evidence per finding, and validation
  against expert judgment.
- **Scraping/legal/ToS exposure.** Mitigation: fetch only public pages, honor
  robots.txt and rate limits, store minimal content.
- **Cost blowups** from repeated or broad runs. Mitigation: password gate, run
  quotas/limits, per-evaluation cost logging.
- **Model drift** breaks comparability over time. Mitigation: pin model versions
  and store the rubric version and model identifiers with each evaluation.
- **Model availability changes** can break calls (for example `gemini-2.5-flash`
  returned 404 for new accounts). Mitigation: pin versions in profiles and
  surface provider 404s as configuration errors to fix.
- **Provider API changes** break integrations. Mitigation: provider-adapter
  abstraction and contract tests.
- **Normalization/truncation bias** distorts scores. Mitigation: document the
  strategy and surface truncation as a finding.
- **False PDP detection** scores the wrong page. Mitigation: explicit PDP
  detection and clear rejection messaging.

## Research Tasks

- Spike the model instructions and confirm they yield reliable, parseable
  structured scores with evidence across providers.
- Survey current agentic-commerce readiness guidance (structured product data,
  emerging protocols) to align the rubric with external standards.
- Measure fetch success and bot-block rates across a sample of target stores.
- Estimate per-evaluation cost and latency for a realistic model selection.
## Seminar MVP observed limitations

A real fashion run showed differing currencies and conflicting stock signals. The demo now rejects supported budget comparisons based on quotes in another recognizable currency and flags in-stock product data with out-of-stock page text. These are bounded checks, not comprehensive semantic validation. Quotes are source-matched but a model can still omit a shopper constraint, interpret a claim incorrectly, or summarize generic page copy as product-specific. Saved reports support seminar rehearsal; live runs depend on retailer access, regional redirects, and provider availability.
