# Context

Shared vocabulary for this project. This file is a glossary only. It must not
contain plans, tasks, implementation details, or decisions.

## Glossary

### Consultant
The primary user of the MVP. An e-commerce agency/consultant who runs
readiness evaluations and uses the results to advise a client. In the MVP
there is a single consultant and no user accounts.

### Brand
The merchant/company behind a PDP. Used to group evaluated PDPs on the home
screen and (post-MVP) to compare brands. Auto-detected from the PDP domain and
structured data, and overridable by the consultant.

### PDP (Product Detail Page)
The single product page under evaluation. The PDP is the unit of analysis; the
MVP evaluates one PDP per evaluation. Identified by its public URL.

### Model
A large language model used as an evaluator (for example a GPT/ChatGPT model, a
Claude model, a Gemini model). The consultant selects which models run on a PDP.
Previously and informally called an "agent"; the canonical term is **model**.

### Model Profile
The configuration of one available model: provider, model identifier, credential
reference, and enabled/disabled state. The catalog of selectable models is built
from model profiles.

### Provider
An external API vendor that serves models (for example OpenAI, Anthropic,
Google). Accessed through a single provider adapter so models can be added
without changing the evaluation core.

### Evaluation
One execution of the evaluation pipeline against one PDP with a selected set of
models and one rubric version. An evaluation is an immutable, timestamped
snapshot. Each PDP keeps a history of evaluations.

### Rubric
The versioned definition of the scored dimensions, the checks inside each
dimension, their weights, and the rules that convert checks and model judgment
into a 0-10 score. Rubric detail is defined in the spec phase.

### Dimension
One scored axis of readiness. The MVP scores four dimensions, each 0-10:
1. Machine-readable Data
2. Content Extractability
3. Trust & Policy Signals
4. Transactional Readiness

### Brand Perception
A fifth, unscored dimension. A 1-2 line qualitative summary of what the model
understands about the brand from the PDP. It is written, not scored.

### Recommendation Fit
An additional unscored, one-line note paired with the Brand Perception: for which
shopper need or use case the model would recommend the product. Written, not
scored.

### Finding
A single result inside a dimension (pass / partial / fail) with evidence, such as
"Offer has no priceCurrency" or "Returns policy not present in the normalized
content".

### Score
The 0-10 value for one dimension, for one model. Produced by the hybrid rubric:
deterministic checks set the baseline, and model judgment adds structured
assessment with evidence.

### Aggregate Score
The average of the per-model scores for one dimension, across the models selected
for that evaluation.

### Recommendation
An actionable improvement derived from findings, prioritized, and tied to the
dimension it improves. Recommendations are the "what to change" output of the
report.

### Report
The rendered view of one evaluation: per-model and aggregate scores for the four
dimensions, the brand perception summary, and prioritized recommendations.

### Snapshot / History
The ordered set of evaluations for a PDP over time, enabling "improved since last
audit" comparisons.

## Rejected / Ambiguous Terms

### Agent
Avoid using `Agent` for the LLM evaluators. Use `Model`. Reason: an "agent" in
this domain is an external AI shopping assistant that the PDP should be ready
for, not the LLM that performs the evaluation.

### Agentic commerce
Too broad to be a scoring term on its own. Use the four named `Dimension`s plus
`Brand Perception` when describing what "ready" means.

### Score
Do not use `Score` without a dimension and model/aggregate qualifier. Always make
clear which dimension and whether it is a per-model `Score` or an `Aggregate
Score`.

### Audit / Study
Prefer `Evaluation` for a single run. Reserve "audit" for the consultant's overall
engagement with a client.