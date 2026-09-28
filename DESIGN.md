---
name: PDP AI-Readiness Tool
description: Clean, trustworthy analytics dashboard for evaluating how well a PDP is read and understood by AI models.
designAssets:
  sourceOfTruth: []
  generatedConcepts: []
colors:
  primary: "#4F46E5"
  secondary: "#0EA5E9"
  accent: "#F59E0B"
  success: "#16A34A"
  warning: "#F59E0B"
  danger: "#DC2626"
  background: "#F8FAFC"
  surface: "#FFFFFF"
  border: "#E2E8F0"
  text: "#0F172A"
  textMuted: "#64748B"
typography:
  h1:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 28px
    fontWeight: 700
  h2:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 20px
    fontWeight: 600
  body:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 15px
    fontWeight: 400
  score:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 40px
    fontWeight: 700
rounded:
  sm: 6px
  md: 10px
  lg: 16px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
  score-pill:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
---

# Design Direction

## Overview

The product is a diagnostic instrument. It should feel calm, precise, and
trustworthy, so a consultant can present it to a client without the UI getting in
the way. Data density and legibility matter more than decoration. Light theme by
default; dark mode is not required for the MVP.

## Existing Design Assets

None. This document is the source of truth for visual direction. No generated
concept images exist; the alpha/values below are the initial direction.

## Generated Concept Images

None.

## Product Feel

- Professional analytics: neutral surfaces, clear hierarchy, restrained color.
- Every score is backed by visible evidence nearby; nothing looks like a black
  box.
- Color is used to signal state (good/warning/bad) but is never the only signal.
- Numbers are the hero: large, aligned, and comparable.

## Colors

- **Primary `#4F46E5`** — primary actions, active states, brand accent.
- **Secondary `#0EA5E9`** — secondary data series and chart accents.
- **Background `#F8FAFC`** with **surface `#FFFFFF`** cards on a light canvas.
- **Text `#0F172A`**, muted `#64748B`.
- **State colors:** success `#16A34A`, warning `#F59E0B`, danger `#DC2626`.
  Always pair with an icon or label.

## Typography

- Inter across the app; system fallback in the stack.
- Large score numerals (40px, 700) for dimension and aggregate scores.
- Muted labels above numbers; no all-caps paragraphs.

## Layout

- Home: a prominent URL input and model selector at the top, then a brand-grouped
  list of evaluated PDPs.
- Report: a summary strip (aggregate scores) first, then per-dimension detail,
  then recommendations.
- Max content width for readability; cards on a light canvas; consistent 16/24px
  spacing rhythm.

## Shapes

- Cards and panels use 16px radius; controls 10px; small pills 6px.
- Borders are soft (`#E2E8F0`); shadows are subtle and rare.

## Components

- **URL input + submit** — primary action on Home.
- **Model selector** — multi-select of available model profiles with clear
  selected state.
- **Score card / dimension gauge** — one per dimension, showing the score,
  per-model breakdown, and the aggregate.
- **Brand group** — collapsible grouping of PDPs on Home.
- **Finding item** — pass/partial/fail with evidence text.
- **Recommendation item** — prioritized action tied to a dimension.
- **Status badge** — evaluation state (Completed / Partial / Failed) with reason
  on hover or inline.

## Core Screens

- **Home:** URL entry, model selection, evaluated-PDP list grouped by brand.
- **Report:** aggregate + per-model scores for the four dimensions, brand
  perception summary, findings with evidence, prioritized recommendations.

## Content & Vocabulary

Use plain, customer-facing names for the four dimensions in the UI. Keep the
technical terms only in internal docs (`docs/evaluation-contract.md`).

| Dimension | UI name | Helper sentence |
| --- | --- | --- |
| D1 Machine-readable Data | Product data | Can an AI read the key product facts: name, price, stock and identifiers? |
| D2 Content Extractability | Page content | Is the important content readable as text, not only inside images, tabs or scripts? |
| D3 Trust & Policy Signals | Trust & policy | Are shipping, returns, warranty, reviews and contact details clear? |
| D4 Transactional Readiness | Buying path | Can an AI find the price, the stock and a clear way to buy? |

Also: state that each dimension is scored from 0 (not ready) to 10 (fully ready),
and label the brand perception as "unscored". Copy lives in
`src/dimension-copy.ts`.

## Score Bands

Scores are shown with a plain-language band and a distinct color so "Good" and
"Excellent" are easy to tell apart:

| Range | Band | Treatment |
| --- | --- | --- |
| 0–3.9 | Needs work | red (`#dc2626`) |
| 4–6.9 | Fair | amber (`#d97706`) |
| 7–8.9 | Good | light green (`#22c55e`) |
| 9–10 | Excellent | deep green, filled chip (`#15803d`) |

Recommendations show a priority chip derived from the impact:
High (>= 2), Medium (>= 1), Low (< 1), plus "Potential score +X".

## Report Hero

The report opens with a hero command bar (inspired by instrument-style
dashboards):

- Layered surface: subtle gradient from `surface` to `background` with a hairline
  border and a soft inset highlight.
- Left: back link, status badge, run date, product title (headline), monospace
  URL, brand + detected page type + rubric, and model chips.
- Right: overall readiness ring gauge (SVG) colored by band, labeled
  "Overall readiness", plus a retry action when models failed.
- Use a monospace font (`--font-mono`) for data: the gauge number, URLs, model
  chips, score values, and metric table cells.
- Put the sticky section nav ABOVE the hero, and merge the executive summary
  (verdict + top fixes) into the hero. Do not render a separate summary card.
- Keep colors as accents, not fills (chips are outlined).

## Responsive Baseline

- Desktop-first; the report degrades to a single column on narrow screens.
- Score cards stack vertically on mobile; charts remain legible without hover.

## Accessibility Baseline

- Text/background contrast meets WCAG AA.
- Score state is conveyed by label and icon, not color alone.
- Full keyboard navigation for inputs, selectors, and expandable groups.
- Charts provide a text/table alternative for the underlying numbers.

## Do's and Don'ts

- Do keep score, evidence, and recommended action visually linked.
- Do show disagreement between models rather than hiding it behind an average.
- Don't use decorative gradients or heavy shadows.
- Don't rely on color alone to communicate a score or state.
- Don't crowd the report; the aggregate summary must be scannable in seconds.

## Open Design Questions

- Chart type for per-dimension comparison: grouped bars versus radar; radar may
  mislead.
- Whether per-model scores are shown inline or revealed on interaction.
- Dark mode timing (post-MVP unless requested).
## Fashion seminar presentation

For the seminar copy, the shopper's decision leads and readiness scores follow. Use a spacious product card, a large request quotation, and three labelled sections per model: What the model understood, Supporting evidence (with conflicts explicitly labelled), and What remains unknown. Use existing indigo and neutral tokens, dark readable text, and an amber treatment for unknowns. Example request buttons are keyboard accessible and populate an editable textarea. Product imagery is optional; missing images or offers must not look like a failed run. At narrow widths all sections stack. Include a clear captured-content simulation label and capture timestamp.
