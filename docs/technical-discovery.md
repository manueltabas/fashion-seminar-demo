# Technical Discovery

## Product Surface

Web application (desktop-first, responsive) with:

- **Home** — PDP URL entry, model selector, and a list of previously evaluated
  PDPs grouped by brand.
- **Report** — per-model and aggregate scores for the four dimensions, the
  unscored brand perception summary, findings, and prioritized recommendations.
- **Stats / comparison** — deferred (post-MVP).

## Candidate Stack

- **Framework:** Next.js (App Router) with TypeScript, single full-stack app.
- **UI:** Tailwind CSS with a component library; charts for score visualization.
- **Runtime:** serverless deploy with route handlers for API and a hosted queue
  for background evaluations.
- **Data access:** Drizzle ORM with the `pg` driver over managed Postgres (local
  development uses Homebrew PostgreSQL 17; connection via `DATABASE_URL`).
- **Model providers:** a single provider-adapter abstraction over OpenAI,
  Anthropic, and Google, with structured output.

## Data and Storage

- **Postgres** holds brands, PDPs, model profiles, evaluations, model results,
  dimension results, findings, recommendations, and rubric versions.
- Each evaluation stores the rubric version and the exact model identifiers used,
  so past scores stay interpretable.
- The fetched raw HTML and the normalized content are stored as evaluation
  artifacts for evidence and audit. Aliasing, retention window, and size limits
  are implementation-time questions.
- Aggregate scores are derived, not stored as the source of truth.

## Integrations

- **LLM providers:** OpenAI, Anthropic, Google via one `ModelProvider`
  interface with REST adapters and a typed `ProviderError`. Models are added by
  configuration (model profiles), not code changes.
- **PDP fetch:** server-side HTTP fetch as a crawler would see it, followed by
  normalization to text/markdown plus structured data. No headless browser in the
  MVP.
- **Queue / jobs:** the MVP uses a Postgres-backed job queue (a `jobs` table)
  plus a worker (`npm run worker`) that claims and processes jobs with retries.
  A hosted queue (QStash/Inngest) can replace the worker later for serverless
  scheduling.
- **Credentials:** provider keys and the access gate secret come from environment
  configuration, never from source.

## Authentication and Authorization

- MVP: a single shared password gate in front of the deployed app to prevent
  unknown visitors from consuming model API budget.
- Implemented as a signed, expiring httpOnly cookie (`APP_PASSWORD` from env)
  validated in the Next proxy; `/login`, `/api/auth/login`, and `/api/health`
  are public.
- No user accounts, roles, or per-resource permissions in the MVP.
- Full multi-user authentication is deferred; the shared gate is a temporary
  measure, not the long-term access model.

## Deployment and Operations

- Target: serverless hosting (for example Vercel) + managed Postgres (for example
  Neon/Supabase) + hosted queue.
- The app is deployed from the start because post-MVP work adds other users.
- Secrets are managed through the hosting environment; no secrets in the repo.
- Operational ownership: the consultant (single operator) in the MVP.

## Testing and Verification

- Unit tests for normalization, deterministic checks, and scoring math.
- Provider adapter contract tests using mocked fetch responses (`node:test` +
  `tsx`, run with `npm test`).
- A fixture corpus of saved PDP HTML for reproducible check tests.
- An opt-in `npm run smoke:provider` call that runs one real provider against a
  known prompt (needs a provider key).
- Validation against expert judgment on a curated sample (see build brief).

## Observability

- Structured logs per evaluation step (fetch, normalize, per-model call,
  scoring).
- Per-model latency, token usage, and estimated cost recorded per evaluation.
- Error tracking for fetch failures, provider errors, and invalid model output.
- Evaluation timeline and status persisted so failures are explainable.

## Constraints

- **Cost and rate limits** of model APIs bound how many models/pages can run.
- **Token limits** force a truncation strategy for large pages.
- **Scraping ethics and legality:** respect robots.txt and rate limits, fetch
  only public pages, and store minimal content.
- **Provider terms of service** shape how content may be sent.
- **Reproducibility** degrades as providers update models; pin versions and store
  them per evaluation.
- **Serverless/queue timeouts** bound how long a single evaluation step may run.
- **Language/geo/currency variance** across stores may affect comparability.
## Seminar copy runtime

The demo uses a separate local `fashion_seminar_demo` database and runs on port 3001. Migration 0012 adds the optional shopper request; 0013 adds the evaluation normalization reference and per-model shopper assessment. The card reads the stored normalization and its fetch's final URL, so regional redirects and subsequent evaluations do not switch an older report's product capture. The existing tab-driven queue processes the demo while its report is open.
