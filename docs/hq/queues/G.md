# G · Trace-li HQ operating system

State: active queue (does not imply running workers). Owner: Builder / build.

## Objective

A visible portfolio of mandates, bounded jobs, review and durable memory contracts.

## Handoffs and review

Librarian writes contracts → Builder adds shell → Auditor challenges → Supervisor accepts local package.

## Constraints

Current execution uses the six existing bounded desktop desks; see [runtime handoff](../RUNTIME_HANDOFF.md). No new cloud worker, framework, spend or consequential capability is enabled.

## Current increments

16 September: owner-only access gate and staging identity are prepared under G04. [Cloud handoff](../CLOUD_ACCESS_SETUP.md) and [verification](../reviews/access-verification.md). Hosted owner login, Postgres read binding and the worker adapter remain separate gates; G04 is not complete.

Original bootstrap G01–G03 have accepted internal outputs in the job register. Original room task #44 records the tested schedule connection. Task #45 implements and tests the storage portion of G04; internal identity binding, approval capabilities and a worker adapter remain outstanding. Read the [Postgres foundation](../POSTGRES_FOUNDATION.md) and [verification](../reviews/postgres-verification.md). Initial registration fields below are historical, not current dispatch status.

## Work queue

### HQ-G01 · Create HQ control-plane shell in existing application

Owner: Builder. Initial status: blocked. Authority: Green. Output: `app/hq`.

Dependencies: HQ-G02. SLA: 60 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Eight charter drilldowns and seven separate queues
- Jobs, approvals, decisions, memory proposals, feed and Supervisor brief
- No live execution or approval mutation; development-only access
- Typecheck, build and desktop/mobile checks

### HQ-G02 · Write constitution, charters and canonical operating contracts

Owner: Librarian. Initial status: ready. Authority: Green. Output: `docs/hq`.

Dependencies: none. SLA: 45 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Eight explicit charters before dispatch
- Decision ledger separates user decisions from proposals
- Memory promotion requires Librarian/Supervisor review

### HQ-G03 · Review HQ package, authority boundaries and implementation

Owner: Auditor. Initial status: blocked. Authority: Green. Output: `reviews/HQ_REVIEW.md`.

Dependencies: HQ-G01. SLA: 45 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- No unauthorized runner, sends or production changes
- No exposed private records or fake running metrics
- Schemas, records and job lifecycle agree
- Find material gaps and required next steps

### HQ-G04 · Add durable authenticated HQ state only when manual use warrants it

Owner: Builder. Initial status: blocked. Authority: Green. Output: `artifacts/durable-hq-spec`.

Dependencies: HQ-G03. SLA: 60 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Reuse selected app identity and storage
- Server-enforced actor/role, approval hashes and append-only events
- Cost, lease, dedupe, retry and stop controls tested before timers

Runtime status and evidence live in [jobs.json](../data/jobs.json). Charter limits override broader job defaults.
