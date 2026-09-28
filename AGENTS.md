# Project Agent Instructions

This repository is the independent fashion seminar demo of the existing PDP
AI-readiness app. Show how captured product-page information supports a
recommendation for a shopper request, with evidence and explicit unknowns.
The demo is implemented and passed its own baseline on 2026-09-22.

Work only in `/Users/mtabas/Documents/Fashion Seminar Demo`. Do not edit the
original `/Users/mtabas/Documents/Default Project` or use its database.
The seminar scope in `SEMINAR-DEMO.md` and the new seminar features take
precedence over the inherited consultant-oriented brief for this extension.

## Read First

- `SEMINAR-DEMO.md` — approved seminar direction and isolation requirements.

- `CONTEXT.md` — shared domain language (PDP, Brand, Model, Evaluation, Dimension, Score).
- `docs/build-brief.md` — problem, users, goals, non-goals, and MVP slice.
- `docs/domain-model.md` — core entities, relationships, and evaluation states.
- `docs/risks-and-open-questions.md` — current risks and unresolved questions.

Read these when the work touches them:

- `docs/evaluation-contract.md` — how a PDP is scored (rubric, caps, recommendations).
- `docs/model-evaluation-prompt.md` — exact model prompt, output schema, and validation.
- `docs/technical-discovery.md` — stack, integrations, deployment, auth, operations.
- `DESIGN.md` — visual direction and design tokens for the UI.
- `spikes/validation/` — manual validation runs and findings.

## Startup Workflow

Before writing code:

1. Confirm the working directory with `pwd`.
2. Read `PROGRESS.md` for current verified state and the next step.
3. Read `feature_list.json` and pick the first ready unfinished feature in list order.
4. Run `./init.sh`.
5. If baseline verification fails, fix the baseline before adding feature work.

## Working Rules

- Work on one feature at a time.
- Do not mark a feature complete just because code was added.
- Keep changes inside the selected feature scope unless a blocker requires a narrow fix.
- Do not silently change verification rules during implementation.
- Update durable repo artifacts instead of relying on chat summaries.
- Do not implement product behavior that contradicts `docs/evaluation-contract.md`
  or `docs/model-evaluation-prompt.md`; update those docs first if a change is needed.

## Required Artifacts

- `feature_list.json`: source of truth for feature state.
- `PROGRESS.md`: current verified state and lightweight session log.
- `init.sh`: standard startup and verification path.

## Local Environment

- Local development needs PostgreSQL and a dedicated database named
  `fashion_seminar_demo`; set `DATABASE_URL` in this copy’s `.env` using
  `.env.example` as a template. Never copy the original database URL.
- `./init.sh` checks the database name before installing or migrating, then
  runs the inherited verification commands. Health is at `GET /api/health`.
  Development uses port 3001 by default; override with `DEMO_PORT`.
- Evaluations are processed automatically in the app while the report page is
  open (the page drives the job queue). `npm run worker` is optional and only
  needed for background processing when no tab is open.

## Definition Of Done

A feature is done only when all are true:

- target behavior is implemented,
- required verification actually ran,
- evidence is recorded in `feature_list.json` or `PROGRESS.md`,
- the repository remains restartable from the standard startup path,
- relevant docs are updated if product behavior, domain rules, API, or verification changed.

## End Of Session

Before ending a session:

1. Update `PROGRESS.md`.
2. Update `feature_list.json`.
3. Record unresolved risks or blockers.
4. Leave the repo clean enough for the next session to run `./init.sh` immediately.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
