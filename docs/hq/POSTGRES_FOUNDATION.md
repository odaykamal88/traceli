# Durable HQ state on the existing Postgres foundation

15 September 2026 · Operating Room task #45 · Implemented in the isolated Trace-li checkout. Applied and tested only against a disposable local PostgreSQL database with fictional records. Production migration and worker deployment remain separate actions.

## What was added

Migration `db/migrations/0003_hq_operating_memory.sql`, typed models in `db/hq-schema.ts`, and the server-only broker in `lib/hq/store.ts` extend the existing organization model. They reuse Postgres, the connection pool and the transaction-local organization boundary. Ordinary `traceli_app` connections receive no HQ table access.

| Store | Purpose |
|---|---|
| `hq_scopes` | Company, mandate and case memory boundaries. Mandate definitions/charters live under stable IDs; worker names do not own history. |
| `hq_jobs` | Canonical job contract, owner, authority, prerequisites, state, attempts and current lease. An original Operating Room reference is explicitly marked as a mirror. |
| `hq_runs` | Each worker attempt, its lease, submitted output and nullable measured cost/tokens. An expired attempt remains in history. |
| `hq_memory_proposals` | Scoped draft content, source references, fact/inference/hypothesis label, author, exact content hash and expected current version. |
| `hq_memory_reviews` | Independent Supervisor disposition of the exact proposal bytes, with rationale. Rejections remain recorded. |
| `hq_memory_versions` | Immutable canonical versions written by the Librarian from an approved proposal. |
| `hq_decision_ledger` | Attributed decisions, evidence and linked supersession. Recording a decision grants no execution capability. |
| `hq_events` | Append-only evidence of job and memory transitions, committed in the same transaction as the change. |

One narrowly projected view, `hq_job_status`, exposes only job ID and state within the current organization. It lets a worker verify a handoff from another mandate without reading that mandate's contracts or memory.

## Implemented operations

The Supervisor registers scopes and complete job contracts. Identical registrations are idempotent; changed content cannot silently reuse a job ID. A worker may claim an eligible Green native HQ job after its prerequisites pass. One job can run per mandate; a claim lasts at most the smaller of the requested duration, the job's active-minute budget and 45 minutes and a job permits at most its configured attempt count. A replacement worker gets a new attempt and lease. Submissions require the current unexpired lease; old workers cannot overwrite a replacement's work.

Submitting an artifact moves it to review. Acceptance requires a separate Supervisor actor and review evidence. At the attempt limit, the Supervisor can stop an expired job and retain its history. Expired run rows are evidence of old attempts, not proof that a worker is currently running. Cost and tokens remain null when unmeasured.

Memory follows **worker proposal → independent exact-content review → Librarian promotion**. Workers cannot insert canonical versions or review their own proposals. Librarians cannot create approvals. A promotion must use the approved bytes and the expected current version. Conflicting concurrent promotions cannot overwrite or fork the accepted history. Rejected and stale proposals cannot be promoted. Corrections create new versions and linked decisions; historical rows reject update/delete.

The broker validates the core job contract before registration: objective/owner/authority consistency, charter version, trigger, inputs, allowed tools and memory, expected output, criteria, reviewer, timing, limits and zero new-spend authority. The default of two crash-recovery attempts is separate from the contract's content-revision budget. Total active time across attempts and content-revision counts require future runner accounting. Tool-call limits are stored requirements for the future runner; the storage broker does not execute tools or measure model spend. Lease fencing and attempt counts are database controls, not a mechanism for terminating a remote process.

## Identity and integration boundary

`createHQStore` accepts a principal resolved by a **trusted server host**. It is not an authentication function. Never accept role, organization, actor or mandate from a model, request body, persona, job JSON or an unverified QM scope label. No HTTP route or agent tool exposes this broker yet. A later adapter must bind authenticated internal membership/capabilities to this context before calling it. Agents receive no database credentials or unrestricted SQL tool. The service credential remains inside the trusted server, which selects the restricted database role and sets transaction-local context.

Company memory is readable across mandates; mandate/case content is scoped. Current storage accepts public/internal classifications only. No raw customer files, credentials, private transcripts or existing customer records were migrated. Source documents remain in their separately authorized store; memory stores references and reviewed knowledge.

The existing D1 Operating Room remains authoritative for its current tasks, claims, reviews and receipts. This implementation does not dual-write those tasks or start another dispatcher. Jobs marked `source_system=operating_room` are ineligible for worker claims. The live HQ page continues to read its current files and minimized room snapshot until an authenticated Postgres cutover is reviewed.

## Verification and rollout

Run the migration with the existing `scripts/db/migrate.mjs` against an approved database. For tests, `scripts/db/test-hq-postgres.mjs` requires a dedicated `HQ_TEST_DATABASE_URL` at `127.0.0.1` with database name `traceli_hq_test`; it rejects hosted targets. Invoke it with Node's `react-server` condition and the existing `scripts/agent/register.mjs` alias resolver. The suite tests the real migration and broker against PostgreSQL, including concurrent claims/promotions and denied operations.

Next: independently review migration and role grants; bind internal authenticated HQ identities; add read/propose/review operations through that binding; select one native HQ job for an explicit cutover; then evaluate one QM-backed worker. Before any production migration, verify the target/backup, role ownership, exact migration checksum and forward repair plan. Do not drop these history tables as a rollback: disable the new adapter and preserve the records.

No separate database per persona, vector database, backend migration or new agent framework is required for this increment. The [QM assessment](QM_ASSESSMENT.md) describes the optional worker integration.
