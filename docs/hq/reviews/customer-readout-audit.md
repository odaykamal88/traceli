# Independent Auditor review — customer readout

20 September 2026. Reviewer: independently delegated Auditor (`audit_readout`), explicitly authorized by Oday. Baseline commit: `643dc47641ff9086c8dff0f5b0a1c2f8972bace5`. Review covers the working files below and the exact exported cloud artifact; it does not independently attest live infrastructure, authoritative task claims, receipt synchronization or human acceptance.

**Decision: PASS for the corrected implementation and exact internal missing-input memo.** One timeout-contract finding was identified and corrected in additive migration 0008 and the operating documentation. Supervisor reports a tenant-scoped hosted correction and exact job readback; I did not access the live database. Oday's task disposition remains separate; this review authorizes no send, publication, production promotion, additional inference or memory promotion.

## Exact reviewed versions

SHA-256 file hashes:

| File | Hash |
| --- | --- |
| `db/migrations/0007_hq_customer_readout.sql` | `af31728d58cbb8cb66558a65690efd7de4a041e9502295ecb7f58e4afedc16dd` |
| `db/migrations/0008_hq_readout_timeout_contract.sql` | `224662b2c71be56cc02976e27c7b1417474720dca0d3da52eaf77d098aff80e3` |
| `scripts/db/test-hq-customer-readout.mjs` | `d8de833bf31df26995bd21280064a7e831608d9c3734bc6ecf8b5a02054221b4` |
| `docs/hq/operations/CUSTOMER_READOUT.md` | `cc37907e629abe2be5be6ffc6683b2f3ea7270330b06103000364592164e4437` |
| `app/hq/cloud-panel.tsx` | `809121c123acb1d33730940c4208039f00b353fff33fc4572efe8e156900314f` |
| `lib/hq/cloud-reader.ts` | `2c82b95558d53980d87a87cdf0772f66369cd59de224c5915b54c709f097ad78` |
| `workers/hq/worker.mjs` | `b9dfd56e5b9bc126dd9e894094bfcbdcfc1aad03959c840ff4b05f446352a900` |
| `docs/hq/cloud/CUSTOMER_READOUT_RUN_20260920.json` (initial export before timeout correction) | `01386e24de45f731a25d2500ff01f778d6fbcc52c39fd8e2a8cbb6e5583e78f0` |
| `docs/hq/cloud/CUSTOMER_READOUT_SOURCE_20260920.json` | `49b7eb2923c7b1798040dc4527963f47d602e6f2e338e7fe8cdc750de3a6d059` |

Governing originals read under `/Users/odaykamal/Documents/ChatGPT/Traceli/internal-ops/docs/`: `EXECUTION_PROTOCOL.md` hash `8ed2cdfac89593b1058f4061b40eee5bf88fe331aba82ede51fb3e067d56a627`; `WEEK_4_ACTION_PLAN.md` hash `19fb7ca157f75d1090c6d150a2e003589e3e40b68374cbca2f70d9343ff8c6bc`. Existing ledger, identity, artifact immutability and source-ingestion constraints in migrations 0003–0006 were also inspected.

The reviewed artifact body has PostgreSQL JSONB SHA-256 `0ac8620b8797830920a3317edabf3beb92d2d801086ee8b8a8ff83550f465a7d`, run `873e4799-4d11-44b2-b79e-d055c1e79178`. Its source reference is `2fb393ee3ed404368425f0289fdd3c2f90f58957cdcc02daee2b1bf63d8af90a`, captured at `2026-09-20T17:16:21.656Z`. I independently recomputed the body hash using PostgreSQL's JSONB text canonicalization in the disposable local database and obtained an exact match.

## Finding and correction

**P2 — original eight-second bound was not enforced by the function-local setting.** Setting `statement_timeout` on a SQL function does not shorten the timeout of the already-running outer SELECT. A dedicated local reproduction using a 50ms function setting and a 200ms sleep completed in 203ms, despite that inner setting. The unchanged Railway worker already establishes a real ten-second outer statement timeout, twelve-second client query timeout and 110-second process cap, so this was an inaccurate bound/contract rather than unbounded production execution.

Migration 0008 removes the ineffective function setting and records ten seconds; the documentation now names the actual outer worker bound. Comparing function bodies confirmed that only the timeout setting and limit metadata changed. Artifact body and review gates remain unchanged. The initial export retains the historical `active_seconds: 8`; it must not be cited as proof of an enforced eight-second bound. A supervisor readback must confirm existing-job contract correction because the migration UPDATE is subject to the deployment session's tenant/RLS context.

## Verification and judgment

I independently ran `scripts/db/test-hq-customer-readout.mjs` against the dedicated disposable local `traceli_hq_test` database. It passed authorization, restricted login and direct-table denial, source absence/staleness/hash mismatch, policy pause, changed counters/targets, task-claim display check, rollback recovery, concurrent deduplication, immutable artifact, HQ reader visibility and zero model charges. No live database or credentials were used by this review. The test's rollback verifies atomic recovery before commit; concurrent/replay checks verify the same saved hash after commit. These checks are not an observed hosted scheduled run.

The exact output matches the pinned four zero counters and twelve task statuses. It explicitly separates recorded zeros from independently verified events, leaves actual denominators and conversation evidence unavailable, avoids fabricated demand and response rates, preserves recipient-business-day follow-up timing and conditional commercial qualification, and assigns the existing handoff/send/priority tasks to their proper owners. Its access experiment is a recommendation under missing inputs, not a claim that the access route has been proven faulty. The lack of buyer language supports deferring new major content; no buyer-derived content angle is invented. The proposed lesson stays a proposal, and the learning gate is explicitly unmet.

The separate source export now retains the complete metadata mirror. I independently recomputed its records hash with PostgreSQL JSONB canonicalization and obtained `2fb393ee3ed404368425f0289fdd3c2f90f58957cdcc02daee2b1bf63d8af90a`, matching the artifact reference. It contains the distinct legacy `touches` counter at seven alongside the Week 3 and Week 4 counters. That legacy value is properly excluded from Week 4 denominators. No actual outreach event denominator is independently attested by this review.

Supervisor reported applying 0008, then explicitly setting the tenant and Supervisor actor to correct the existing job contract, and reading back `model_calls: 0`, `active_seconds: 10` with the same artifact hash. This addresses the forced-RLS update concern. The initial receipt remains historical; deployment/readback evidence belongs in the separate correction receipt.

The recorded run reports zero input/output model tokens and zero model cost, consistent with the deterministic code path and absence of model reservations in local verification. Hosting cost remains unavailable. The exported trigger says manual Railway restart; this audit does not relabel it scheduled. Supervisor review, authoritative task/receipt readback and Oday disposition must remain separately evidenced.

## HQ presentation addendum

20 September 2026. **PASS; no actionable finding.** Independently reviewed the presentation changes below against the exact memo and `CUSTOMER_READOUT_REVIEW_READBACK_20260920.json`. The saved readback reports internal Supervisor acceptance at `2026-09-20T17:21:12.345Z`, corrected ten-second contract, unchanged artifact hash and manual replay. This is file evidence reviewed by the Auditor, not independent access to the live service.

| File | SHA-256 |
| --- | --- |
| `docs/hq/data/control-room.json` | `ed2444244ff1f83501d51615c60b050c374cbd7e62db9213087ce4c631888474` |
| `docs/hq/data/events.json` | `efac5a73d242fb6f56a7c64dfca603258f091c7465340d990668300925d9c98a` |
| `docs/hq/SUPERVISOR_BRIEF.md` | `5c4a28b6576745e40014edece108e628be09185010fe5f28a900da102c297ef9` |
| `app/hq/control-room.tsx` | `fc0e50d3c39f7ea9c4ea3a3465f75f451f78b234d83bb3c640d560910b425106` |

The task 38/39 request preserves Oday's unrecorded disposition and priority choice. Workstreams F/G distinguish the completed bounded memo from full specialist-desk migration and identify the missing send evidence. The checkpoint and new event distinguish internal acceptance from human acceptance and manual execution from scheduled execution; the older readiness draft and desktop pauses remain explicit. L-05 is marked Proposed, repeats that canonical memory has not changed, and retains the unmet learning gate. Its conditional UI label now says “Proposed change,” accurately matching that state. Existing historical events retain their prior meaning; the Unicode serialization changes do not alter their text.

The addendum changes this report's file hash after its original acceptance reference was recorded. The original acceptance hash is a historical reference to the earlier review, not the hash of this expanded report. This addendum changes neither the artifact decision nor its exact body hash. Supervisor-reported four passing tests and TypeScript verification were not rerun for this text/presentation addendum.
