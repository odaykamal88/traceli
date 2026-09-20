# Independent technical specification review

20 September 2026 · reviewer: `technical_review` subagent, independent of specification author.

**PASS for implementation of the bounded synthetic/local slice.** This disposition binds `SYNTHETIC_IMPLEMENTATION_SPEC.md` SHA-256 `e344d967da129a6c6ace8a396ccdd4ab9437854ac9bc7f328913bab07cd100ef`. No unresolved material design findings remain. Acceptance authorizes work already requested by the owner; it does not assert that any control is implemented, tested or safe for production.

## Basis

Read repository `AGENTS.md`, the accepted M02 decision contract, field map, UX acceptance, independent audit and Supervisor disposition, and the continuation handoff. Independently recomputed the core M02 hashes: contract `31d52b12a0bd095c0c498612c5f85e9261abacb5aa21217d628efd96f048c044`, field map `9befe268de76aa72f01aff0b90c64ff30401c2dd366702d3a638564344e81c4e`, UX `dc2a87c3a93c224d9ac78fc79b88af68d11bd8e981be04314351829ba264bd15`; these match the accepted audit.

Inspected the existing tenant transaction, DB client, migrations 0001/0002, workspace identity and role helpers, finding command, evidence reader, audit writer, HQ current-membership check, existing negative evidence tests, and installed Next.js route/server-function guidance. Existing source-date, mutable-source, same-procurement and stale-session shortcomings are real in the inspected baseline. The specification names rather than conceals them and includes concrete repairs.

## Findings and implementation conditions

| Concern | Review result |
|---|---|
| Scope and dependencies | Pass. Fixed fictional sources and offline model receipts allow a usable path without admitting real instruments, processing customer data, spending a provider allowance or claiming benchmark outcomes. M07/M09 real-source and domain dependencies remain separate. |
| Architecture | Pass. Reuses PostgreSQL tenant transactions, application role/RLS, procurement links and atomic audit events. A frozen schema-validated unit bundle is a reasonable bounded implementation of the logical contract; one table per logical object is unnecessary. |
| Source/evidence integrity | Pass. Separate retained-byte and canonical artifact/snapshot hashes, unknown date provenance, version-bound references, append-only records and read-time verification meet the bounded design need. Legacy metadata hashes stay explicitly unverified as source bytes. |
| Same-procurement safety | Pass. Composite foreign keys for new records and parent-aware legacy guards cover the existing same-tenant reference gap. Migration preflight must fail on existing inconsistencies; do not silently reassign them. |
| Identity and authority | Pass. The design requires current active membership per operation, fixed local identity only under explicit nonproduction/loopback conditions, resource/action checks and stronger override/full-export roles. No caller-selected tenant or actor is accepted. |
| Decisions, revisions and replay | Pass. Expected unit/assessment/input hashes plus decision sequence, transaction serialization, immutable history and revision invalidation preserve the reviewed state. Implementation must bind idempotency to the authenticated actor and complete command/scope as part of its input hash, so the same key cannot return another actor's receipt or accept changed content. |
| Export | Pass. Exact unit/hash/decision sequence, recipient, purpose, mode and expiry are bound; current membership, revocation and revision are checked again at download. Allowlisted materialized redaction preserves original policy outcomes while removing identities/free text. Reconstructibility is limited honestly to disclosed bytes. |
| Verification and UX | Pass as requirements. The negative DB/authorization/concurrency checks and complete browser flow include the material failure modes, mobile, keyboard, draft preservation and unknown states. Actual test results and independent final review are still required; human comprehension testing is not fabricated. |

Two nonblocking implementation cautions: enforce local-mode URL validation with the parsed hostname/database protocol rather than substring matching, and do not let a redacted export embed full unit payloads or audit payloads indirectly through provenance. The specified denial/leakage tests should demonstrate both.

## Limits

This review performed no provider request, live DB write, migration, browser verification, source admission, queue claim, release approval or production action. No implementation acceptance follows until the delivered code and relevant positive/negative results are independently reviewed. Sensitive-data retention, deletion and backup restoration remain outside the enabled synthetic-only scope.
