# Traceli autonomous operations strategy

Updated: 26 August 2026

## Decision

Build an **autonomous operations control plane**, not one long-running omnipotent agent.

The control plane should collect machine-verifiable signals, apply deterministic rules, assign bounded tasks to the least expensive capable model, and give a supervisory agent a compact set of verified findings to explain and prioritize. Production changes, dependency merges, secret rotation, data deletion, and customer-facing incident declarations remain human-gated unless a narrow containment action has been explicitly pre-authorized and tested.

The first version runs beside Sprint 1. It should make the current prototype safer without delaying the tenant-safe data spine.

## Correction to the initial assumption

Persistent worktrees, subagents, and Markdown are useful interfaces, but they are not reliable system memory.

- **Durable memory:** Postgres run/finding records, workflow checkpoints, immutable evidence artifacts, test results, and Git commits.
- **Execution:** bounded jobs in disposable GitHub-hosted runners, Vercel Functions, or isolated worktrees.
- **Human view:** Markdown or an operations dashboard rendered from validated structured records.
- **Agent context:** a fresh task packet containing only the objective, policy, permitted tools, relevant evidence references, budgets, and output schema.

No job should depend on an agent remembering a prior conversation. A run can resume only from an explicit checkpoint. Worktrees are retained while a pull request is active and destroyed after merge or closure; they are not databases.

## Operating architecture

```text
GitHub / Vercel / Postgres / WorkOS / object store / external probes
                              |
                     signal collectors
                              |
          deterministic detectors and severity policy
                              |
             normalized ops_run + ops_finding records
                    /                         \
        bounded specialist worker       notification rules
                    |                         |
          structured proposal/PR        immediate P0/P1 alert
                    \                         /
              supervisory synthesis agent
                              |
                 daily/weekly owner brief
                              |
                   human approval gates
```

### Scheduler and execution boundaries

| Work type | First executor | Rule |
| --- | --- | --- |
| Pull-request tests, static analysis, dependency updates | GitHub Actions, CodeQL, and Dependabot | Event-driven where possible; scheduled maintenance runs on the default branch |
| Outside-in uptime and latency | Independent synthetic monitor | Must be outside Vercel so it can detect a full Vercel or application outage |
| Short application checks | Authenticated Vercel Cron endpoint | Verify `CRON_SECRET`, acquire an idempotency lease, dispatch work, and return quickly |
| Multi-step or failure-prone runtime work | Vercel Workflow initially | Persist each step and retry safely; Postgres remains canonical for job and domain state |
| Code remediation | Disposable branch/worktree and bounded coding agent | May open a pull request; may not merge or deploy production |
| Owner briefing | Read-only supervisory agent | Reads normalized findings and links to evidence; has no production mutation credentials |

Prefer event triggers over polling. A failed deployment, vulnerability alert, authorization denial spike, or workflow error should create a finding when it happens. Cron is for reconciliation and work that genuinely depends on time.

## Finding and run contracts

Every collector and agent must emit versioned JSON that validates before it is stored or shown. Markdown is generated from this record and cannot add unsupported facts.

Minimum `ops_run` fields:

- schema version, run ID, job definition/version, trigger, environment, start/end time, and status;
- idempotency key, attempt, lease owner, checkpoint, and parent run when applicable;
- code revision, tool versions, model route, prompt/task version, token usage, cost, and latency;
- input artifact hashes, output artifact hashes, tests run, and policy decisions;
- error class, retry state, and human disposition.

Minimum `ops_finding` fields:

- finding ID, fingerprint, detector ID/version, source, environment, and affected component;
- deterministic severity, observed state, expected state, first/last seen, and occurrence count;
- verification status, confidence for inferred fields, and evidence references with content hashes;
- tenant reference only when essential; never tender text, supplier content, prompts, secrets, or signed URLs;
- safe recommended action, action owner, due state, related pull request or incident, and resolution evidence;
- optional model summary clearly separated from confirmed facts.

The same fingerprint updates an open finding rather than creating noise. A finding closes only when its detector passes again or a named human accepts documented residual risk.

## Severity is policy, not model opinion

The model may explain impact and recommend order. It does not manufacture a P0.

| Severity | Deterministic trigger examples | Default response |
| --- | --- | --- |
| **P0** | Confirmed cross-tenant access; active production authentication bypass; exposed production secret with verified access; loss or corruption of canonical decision evidence; complete outage during an active pilot confirmed by independent probes | Notify immediately, stop further agent actions, preserve evidence, and execute only pre-approved containment |
| **P1** | Restricted document access-control failure caught before exploitation; production deploy rollback; durable workflow repeatedly failing for a live procurement; backup or restore objective missed | Same-day owner review and incident record; remediation PR or runbook action requires approval |
| **P2** | Material performance regression, dependency vulnerability without a verified exploit path, flaky critical test, repeated job budget exhaustion, stale integration cursor | Add to the next triage brief with an owner and target state |
| **P3** | Low-risk dependency update, documentation drift, minor performance opportunity, non-critical warning | Batch into weekly maintenance |

Before real buyer data exists, marketing-site downtime is normally P2 and demo-workspace failure is normally P1 during an announced meeting window. Severity rises with actual exposure, customer commitment, and data impact.

## Model routing policy

Route by **task class and evaluated capability**, not by model brand. A registry maps each tier to currently approved model IDs, providers, regions, retention policy, context limits, measured quality, latency, and price. Changing a model is configuration plus an evaluation gate, not a code rewrite.

| Tier | Use | Model needed | Data allowed |
| --- | --- | --- | --- |
| **D — deterministic** | Tests, schema validation, health probes, dependency comparison, thresholds, severity assignment | No model | Inputs required by the tool |
| **F — fast** | Labeling already-verified findings, deduplication suggestions, short summaries | Small/fast model with structured output | Public or strongly minimized operational metadata |
| **R — reasoning** | Correlating several verified findings, proposing a remediation plan, reviewing a dependency-change explanation | Strong reasoning model | Minimized metadata and code; restricted records only under an approved route |
| **H — high assurance** | Ambiguous security analysis, architecture review, or challenge of a high-impact recommendation | Frontier model, optionally independent second-model challenge | Case-specific approved packet; no unrestricted workspace search |

Controls for every model-backed job:

- hard input, output, tool-call, elapsed-time, token, and cost ceilings;
- explicit provider/model allowlist and retention policy; no silent fallback to a disallowed provider or more expensive tier;
- structured output validation; one repair attempt, then fail closed to human review;
- bounded fan-out and no recursive delegation; maximum three task handoffs in the first implementation;
- citations to source artifacts and a separate `confirmed`, `inferred`, and `unknown` representation;
- a task evaluation set and threshold before a new model or prompt version is promoted;
- invocation ledger and per-job cost attribution.

Route selection is mechanical: exclude models that fail the data, region, tool, context, or retention policy; choose the lowest-cost tier that clears the task's evaluation threshold; and fail to human review if no route qualifies. Each job definition carries expected and maximum input/output tokens, maximum cost per run, and a monthly envelope calculated from cadence. Warn at 70% of that envelope and stop optional model work at 100%; security alerts and deterministic monitors continue without a model.

For sensitive buyer or supplier data, start with contractually approved closed-source routes that enforce the required retention, training, and regional policy. An open or self-hosted model becomes eligible only when its hosting boundary, security patching, isolation, evaluation result, and total operating cost are demonstrably acceptable. Public-source fetching and repository-only analysis are the safest early tasks for lower-cost or open models.

## Supervisory agent

The “super agent” is a **read-only operations analyst**, not the source of truth and not the incident commander.

It receives:

- open findings that already passed schema validation;
- severity and environment determined by policy;
- changes since the previous brief;
- SLO, cost, token, failure, and queue aggregates;
- links to tests, logs, traces, deployment records, and proposed pull requests.

It returns:

1. `Act now`: all P0/P1 findings, unchanged and never suppressed;
2. `Decide`: conflicts or high-impact choices that need the owner;
3. `Delegate`: bounded tasks suitable for an agent or maintainer;
4. `Watch`: trends and P2/P3 changes;
5. `Spend`: model usage, cost anomalies, and cheaper routes that passed evaluation.

The brief must say what is confirmed, what is inferred, what changed, and what evidence would close each item. The supervisor cannot lower deterministic severity, close a finding, merge a pull request, deploy, rotate secrets, change access policy, or query raw tender documents.

## Initial job catalogue

| Job | Trigger/cadence | Implementation now | Agent role | Automatic action |
| --- | --- | --- | --- | --- |
| Pull-request assurance | Every pull request | Typecheck, production build, tenant isolation test, migration/schema checks | None initially | Block merge on failure |
| Code and workflow security | Push/PR plus GitHub's scheduled scan | CodeQL default setup; least-privilege workflow permissions; pinned actions | Reasoning review only for non-obvious alerts | Create finding; no auto-dismissal |
| Dependency security | Advisory event | Dependabot security updates and lockfile CI | Explain impact when change is non-trivial | Open PR; never auto-merge |
| Dependency freshness | Weekly, off the hour | Grouped Dependabot version PRs with cooldown for ordinary upgrades | Summarize changelog and risk | Open bounded PRs |
| Public site health | Every 15 minutes initially | External probe of `/`, `/demo`, and a non-sensitive readiness route | None | Alert after repeat/region confirmation |
| Post-deploy smoke | Every production deployment | Golden public journey and protected-route fail-closed checks | Diagnose only after deterministic failure | Mark deployment finding |
| Runtime error and latency digest | Daily; hourly during a pilot | Vercel runtime/observability aggregates, scrubbed of sensitive payloads | Fast classification, reasoning only for correlated failures | Update findings |
| Workflow reconciliation | Daily after Sprint 2 | Compare durable workflow state with canonical Postgres job state | Diagnose stuck/retry patterns | Retry only idempotent pre-approved steps |
| Backup evidence | Daily backup signal; monthly restore exercise after Sprint 2 | Provider backup status plus recorded restore test | Summarize evidence | P1 if objective is missed |
| Security posture brief | Weekly now; daily during pilots | Normalize CodeQL, Dependabot, auth denials, deployment and workflow findings | Supervisory synthesis | Owner brief only |
| Public-source intelligence | Weekly after the core controls | Fetch official procurement/regulatory/funding sources with source hash and freshness | Fast extraction; reasoning synthesis | Draft watchlist, never alter product policy |

No model is needed for most initial jobs. That is a feature: use models where interpretation creates leverage, not where a test or threshold can answer reliably.

## CI and change-control gate

Required before an agent-authored change can merge:

1. a narrowly scoped issue or finding with an evidence link;
2. a disposable branch/worktree and no production credentials;
3. strict typecheck, production build, tenant-denial tests, and relevant domain/security tests;
4. machine-readable result matching the current schema;
5. diff-size, file-scope, dependency, and migration policy checks;
6. human review for every dependency, workflow, authorization, database, document, model-routing, or infrastructure change;
7. a Vercel preview smoke test; production promotion remains separate and human-controlled.

GitHub workflows should default `GITHUB_TOKEN` to read-only, elevate permissions per job, avoid privileged execution of untrusted pull-request code, and pin third-party actions to reviewed full commit SHAs. Prefer GitHub-hosted ephemeral runners at this stage.

## Phased implementation

### O0 — deterministic baseline, parallel with Sprint 1

- Add pull-request CI for `pnpm typecheck`, `pnpm build`, and `pnpm test:tenant`.
- Enable branch protection, CodeQL default setup, dependency graph, Dependabot alerts/security updates, secret scanning where the repository plan permits it, and grouped weekly version updates.
- Add an external public-site probe and a post-deploy smoke check.
- Write the versioned `ops_run` and `ops_finding` schemas plus example fixtures; validate them in CI.
- Produce one manual weekly brief from those outputs before adding a model.

Exit gate: a broken build, tenant test failure, vulnerable dependency alert, failed deployment journey, or confirmed public outage becomes a traceable finding with an owner and evidence.

### O1 — findings ledger and supervisor, before sensitive pilot data

- Add Postgres `ops_runs`, `ops_findings`, and `ops_artifacts` records outside the procurement decision-event chain.
- Normalize Vercel deployment/runtime signals and GitHub security/CI results.
- Add a read-only weekly supervisor using only normalized metadata.
- Add per-job token and cost budgets, prompt/task versions, structured output validation, and a kill switch.

Exit gate: the weekly brief can be regenerated from stored findings and never hides or downgrades a P0/P1.

### O2 — durable autonomous work, alongside Sprints 2–3

- Use authenticated Vercel Cron triggers to dispatch Vercel Workflows for reconciliation, backup evidence, ingestion health, and public-source refresh.
- Add idempotency leases, checkpoints, retries, dead-letter review, and run replay from canonical state.
- Introduce the evaluated model registry and specialist task workers.
- Permit agents to open tightly scoped remediation PRs; retain human merge and deployment.

Exit gate: killing a run mid-step and replaying it produces one correct result, one auditable run chain, and no duplicate domain mutation.

### O3 — pilot operations and enterprise evidence

- Define service objectives and error budgets from pilot commitments.
- Add multi-region external probes, on-call routing, incident timeline, backup/restore evidence, SIEM delivery, and customer-specific data-routing policy.
- Exercise P0/P1 runbooks and a provider/model outage before a consequential live pilot.
- Add narrow pre-authorized containment only where a test proves it safer than waiting.

Exit gate: Traceli can show a buyer not only that the product is secure by design, but that failures, access risks, model use, recovery, and corrective changes are continuously evidenced.

## Build/no-build rules

Build now: CI, deterministic monitors, normalized contracts, evidence retention, external health checks, safe alerts, and a weekly brief.

Do not build yet:

- a permanently running general-purpose agent;
- recursive agent organizations or a shared unbounded conversation history;
- a custom scheduler, queue, workflow engine, SIEM, or observability backend;
- autonomous merging, production deployment, secret rotation, data repair, or customer communications;
- model-based severity assignment when a deterministic detector can decide;
- sending raw buyer documents or supplier submissions into operations prompts;
- self-hosting open models before utilization, security policy, or customer constraints justify the operational burden.

## Primary implementation references

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) and [Cron management/security](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- [Vercel Workflow](https://vercel.com/docs/workflow) for durable steps, retries, and resumable work.
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway), [models and providers](https://vercel.com/docs/ai-gateway/models-and-providers), and [provider routing options](https://vercel.com/docs/ai-gateway/models-and-providers/provider-options).
- [Vercel Observability](https://vercel.com/docs/observability).
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use), [scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [CodeQL setup types](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types), and [Dependabot configuration](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file).
