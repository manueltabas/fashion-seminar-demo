# Fashion seminar demo

Independent source copy of `/Users/mtabas/Documents/Default Project` created 2026-09-22.
The original project was not modified. Source files were verified against the original after copying.

## Intended direction

Use fashion product pages to demonstrate how page information supports product recommendations for a shopper request. Proposed demo flow: shopper request, actual product page, model interpretation, supporting evidence, unknowns, and concrete improvements. Explain that this is a simulation using captured page content.

## Isolation and startup

The active `.env`, dependencies, build caches, and local tool state were not copied. Existing evaluation records are not included: they reside in PostgreSQL.
The local demo database `fashion_seminar_demo` and ignored `.env` are configured. On another machine, provision that separate database and create `.env` using `.env.example` before running `./init.sh`. Never point this copy at the original database. Use a separate port (for example `npm run dev -- --port 3001`) if both apps run together.

## Current state

The seminar MVP is implemented. The independent baseline, full build, 121 unit tests, browser flow, and snapshot retry integration check pass. See PROGRESS.md for verification and saved examples. Inherited feature evidence remains historical unless explicitly reverified.

## Approved MVP extension

One real fashion PDP per evaluation, with an optional shopper request (maximum 1,000 characters). Three editable example requests cover running shoes, a rain jacket, and an occasion outfit. The report leads with a compact product card, the shopper request, and each selected model's explanation: what it understood, supporting or conflicting evidence, and unknowns. Price and stock are captured observations, not live guarantees. Product links open the real website.

The request-specific explanation is unscored. Existing readiness scores and findings remain available below it. The presenter can expose actual processing steps; no fictional background agents are shown.

Out of scope: checkout, payment, carts, order management, purchasing autonomy, mock catalogue, autonomous product search, multi-product comparison, and a full chat flow.

## Seminar rehearsal

Open http://localhost:3001 and sign in with the existing local app password. The saved Rothys exploration includes a SEK-budget scenario and an earlier USD-budget scenario in its history. Start with the shopper request, open the actual retailer page, explain the supporting quotes and unknowns, and use the stock-disagreement note to show why inconsistent information complicates recommendations. The original readiness audit remains below. New live runs may differ; the saved reports are available without another model call.
