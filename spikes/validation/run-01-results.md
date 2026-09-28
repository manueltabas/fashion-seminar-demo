# Manual Validation Run 01 — Results

PDP: https://www.rothys.com/products/kids-clog-u-topline-revelvet-butterscotch-burst
Models: ChatGPT, Claude, Gemini. Prompt: `run-01-rothys-kids-clog.md` (rubric
v0.1). Captured via HTTP fetch; navigation stripped by hand.

## Structured output reliability

- 3/3 models returned valid JSON matching the schema.
- 11/11 `check_id` entries present and correct in every response; enums valid;
  `brand_perception` present.
- Conclusion: the JSON output contract is reliable enough to proceed. The
  blocking question "do models return the contract reliably?" is answered yes.

## Agreement matrix

| Check | ChatGPT | Claude | Gemini |
| --- | --- | --- | --- |
| D1.structured_data_matches_content | fail | partial | partial |
| D1.physical_attributes | partial | partial | pass |
| D1.category_attributes | pass | pass | pass |
| D2.critical_facts_not_only_images | pass | pass | pass |
| D2.no_critical_info_only_pdfs | pass | pass | pass |
| D2.specs_complete | partial | partial | pass |
| D2.text_clean | pass | pass | pass |
| D3.policy_clear_actionable | partial | partial | partial |
| D4.checkout_path_agent | partial | partial | fail |
| D4.landed_cost_clear | partial | partial | partial |
| D4.no_agent_hostile_friction | pass | pass | pass |

- Unanimous on 7/11; majority on 11/11.
- ChatGPT and Claude agree 10/11 with each other.
- Gemini is the outlier on 3 of the 4 split checks (more lenient on
  physical_attributes and specs_complete, harsher on checkout_path_agent).
- All divergences are on judgment checks, not factual ones.

## Findings and actions taken

1. **Judgment boundaries were too loose.** physical_attributes, specs_complete,
   structured_data_matches_content and checkout_path_agent diverged. Action:
   sharpened pass/partial/fail criteria in `model-evaluation-prompt.md`
   (measurable specs required for pass; contradiction vs minor mismatch defined).
2. **Two checks are not model-verifiable from text.** text_clean measures the
   normalizer, and no_agent_hostile_friction is an HTML signal. Action: moved
   both to deterministic checks in `evaluation-contract.md`.
3. **Evidence quality varies.** Gemini used non-probative quotes (breadcrumbs,
   section titles) as evidence. Action: added an evidence rule forbidding
   breadcrumb/section-title evidence and allowing concrete observations for
   absence checks.
4. **Capture bug.** The manual normalization dropped the primary CTA, making
   checkout_path_agent unjudgeable. Action: added capture requirements — the
   normalizer must preserve CTA text, price, and availability.

## Trap-case outcome

The Rothy's page has JSON-LD price `USD 65.0` while the page shows `SEK 769kr`,
and JSON-LD `InStock` while the page shows `Out Of Stock Online`. All three
models detected the mismatch; ChatGPT scored it `fail`, Claude and Gemini
`partial`. The sharpened criteria now make a price/currency/availability
contradiction a `fail`.

## Open follow-ups

- Repeat the run after prompt changes and confirm divergence drops (target:
  unanimous on the factual checks, ≤1 split on judgment checks).
- Run a second sample with rich structured data but no price/currency mismatch to
  confirm checks are not over-firing.
- Run the H&M URL as the bot-block/failure-path case (fetch returns 403).
