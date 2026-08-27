# Traceli model economics and efficiency policy

Updated: 27 August 2026
Status: Accepted operating constraint

## Decision

Treat model usage as a metered, evaluated operating input. Traceli will measure both **product inference** and **engineering-agent work**, route each bounded task to the least expensive option that clears its quality and data-policy gate, and judge efficiency by cost per accepted outcome rather than token price alone.

Traceli does not need a self-hosted open-weight model today. There is no stable production inference workload, measured utilization curve, or customer requirement that justifies the operational burden. Early experiments should use a provider-neutral route and remain replaceable. Open-weight models stay in the architecture as an evaluated option, not an assumed destination.

## What must be measured

No model-backed capability moves beyond an internal experiment without an invocation ledger. The same accounting discipline applies to coding, research, and supervisory agents used to build or operate Traceli.

Minimum fields for each model invocation or agent run:

- run ID, environment, tenant reference when applicable, task class, task version, prompt version, and code revision;
- provider, model ID, route tier, hosting class (`hosted`, `dedicated`, or `self_hosted_open_weight`), region, and price-catalog version;
- input tokens, cached input tokens, output tokens, reasoning tokens when exposed, tool calls, retries, elapsed time, and latency;
- estimated model cost, infrastructure allocation, and any external tool or retrieval cost;
- structured-output validation result, evaluation result, human disposition, material edit/rework indicator, and final outcome;
- data classification, retention route, error class, fallback reason, and whether a more expensive route was used.

Do not log raw prompts, tender text, supplier evidence, secrets, signed URLs, or hidden model reasoning into the cost ledger. Store versions, hashes, counts, classifications, and outcome metadata instead.

## The metrics that matter

Token totals are diagnostic. The commercial and operational measures are:

- cost per accepted requirement, evidence mapping, finding, or review artifact;
- model cost per procurement and per pilot organization;
- human review minutes and material-edit rate per accepted artifact;
- retry, fallback, validation-failure, and abandonment rates;
- median and p95 completion latency;
- total engineering-agent cost per shipped outcome, including discarded iterations;
- model spend as a percentage of pilot revenue and gross margin.

An apparently cheaper model is not cheaper when it creates more retries, review time, unsupported claims, or failed customer outcomes.

## Efficiency order of operations

Apply these controls before changing providers or self-hosting:

1. Use deterministic code for authorization, hashing, calculations, thresholds, schema validation, workflow state, and severity.
2. Send only the permitted source fragments needed for the task; do not pass an entire workspace or conversation by default.
3. Use structured outputs, explicit stop conditions, and hard input/output/tool/retry limits.
4. Cache immutable transformations by task version and source-content hash. Never pay twice for the same unchanged extraction without a documented reason.
5. Route to the lowest-cost evaluated tier and escalate only ambiguity or validation failure. Allow one repair attempt, then stop for human review.
6. Batch offline work where latency is not customer-visible and deduplicate queued tasks by idempotency key.
7. Measure incremental changes instead of repeatedly re-summarizing the full record.
8. Do not build or run model work when missing customer evidence is the actual blocker.

For engineering agents, begin with a bounded objective and evidence packet, use parallel work only for genuinely independent subtasks, prefer deterministic repository and test tools, and stop once the requested artifact is verified. Long conversations and repeated rediscovery are waste, not memory.

## Budgets and controls

Every job definition must declare:

- expected and maximum input/output tokens;
- maximum attempts, tool calls, elapsed time, and cost per run;
- monthly run cadence and spend envelope;
- the quality threshold and fallback behavior;
- whether the work is required, deferrable, or optional.

Warn at 70% of a job or monthly envelope. At 100%, stop optional model work and require an owner decision before continuing. Deterministic security, access-control, and availability checks continue without a model.

Before the first AI-backed pilot, set explicit budgets per procurement and per accepted artifact. Review actual versus forecast weekly during the pilot and monthly thereafter. A material overrun, repeated route escalation, or model spend above 10% of pilot revenue opens an efficiency finding rather than silently increasing the limit.

## Open-weight model adoption gate

“Open-weight” is not automatically open-source, cheaper, private, or operationally safe. A candidate becomes eligible for a workload only when all of these are true:

1. The workload is repeatable and has a versioned, representative evaluation set built from fictional, sanitized, or contractually permitted data.
2. The license permits Traceli's intended commercial use, modification, hosting, and customer deployment.
3. Hosting, region, isolation, patching, logging, retention, incident response, and model-supply-chain controls satisfy the data policy.
4. The candidate has no critical-error regression and clears the task's acceptance, citation, latency, and structured-output thresholds. Consequential procurement judgment remains human-owned regardless of model.
5. Fully loaded cost includes accelerators, idle capacity, orchestration, observability, security, upgrades, evaluation, support, and engineering time—not only compute during generation.
6. The projected fully loaded cost is at least 30% below the approved hosted route over the next three months, or a documented customer data/residency requirement provides a stronger reason.
7. The route can be canaried, monitored, rate-limited, and rolled back without changing the domain workflow or audit record.

Good early open-weight candidates are public-source classification, strongly bounded extraction from sanitized material, deduplication, and repository-only analysis. Restricted supplier evidence, ambiguous compliance reasoning, and high-impact challenge work remain on the highest-assurance approved route until evaluation and customer policy prove otherwise.

## Cost comparison

Use the same workload and acceptance standard for every route.

```text
hosted monthly cost = input cost + cached-input cost + output cost
                    + retries + external tools + human rework

self-hosted monthly cost = accelerator and platform cost + idle capacity
                         + storage and network + operations and security
                         + upgrades and evaluations + human rework
```

Compare cost per accepted outcome, p95 latency, critical-error rate, review time, and availability. Do not promote a route using a token-price comparison alone.

## Review triggers

Revisit this decision:

- before the first external AI-backed pilot;
- after the first 50 accepted model-backed workflow outcomes;
- monthly once model spend is non-zero;
- when a buyer introduces a data-residency, offline, retention, or approved-provider constraint;
- when an existing route breaches its quality, latency, availability, or cost envelope;
- before committing to dedicated accelerators or a long-term inference contract.

The supervisory `Spend` brief should separate product inference from engineering-agent usage, show forecast versus actual, identify escalation and rework drivers, and list cheaper routes only after they pass evaluation.

## Current build boundary

Build now only when the first model-backed feature begins:

- the provider-neutral model adapter and evaluated route registry;
- the invocation ledger and price-catalog versioning;
- per-task and per-tenant budgets, alerts, and kill switches;
- representative evaluation fixtures and an outcome/rework review loop.

Do not build now:

- a self-hosted inference cluster;
- provider-specific model logic scattered through product code;
- autonomous model fallback that bypasses data or cost policy;
- a vector or inference platform without measured workload evidence;
- agent activity whose only purpose is to keep an agent busy while customer evidence matures.
