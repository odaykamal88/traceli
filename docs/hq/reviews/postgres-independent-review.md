# Independent HQ Postgres foundation review

Risk / Auditor · Charter v1.1 · Operating Room task #45 · 15 September 2026.

**Final disposition: pass for the local Postgres foundation after correction.** The initial P2 finding below is resolved and retained as review history. No tenant-isolation, exact-memory-review, canonical-promotion or lease-token overwrite defect was found within the documented trusted-server boundary. This review does not authorize a production migration or activate a cloud worker.

## Initial finding — resolved on retest

**P2 — A claim can outlive the job's own active-minute limit.** `lib/hq/store.ts:88–94` accepts any lease up to 2,700 seconds, and `traceli_hq_check_job` only guards the global 45-minute maximum. Neither uses `contract.deadline_sla.active_minutes`. A fictional job with a six-second limit was successfully granted a 900-second lease through the public broker method. The independent reproduction is saved in `work/hq/postgres-independent-probe.json`; it submitted a fictional output immediately afterward so no running probe claim remains.

Cap or reject the requested lease against the job-specific limit as well as the charter/global ceiling. Keep the trigger consistent with the broker and add a regression for a short-budget job. Storage fencing still cannot terminate a remote process; the future runner must enforce cumulative elapsed work and tool/revision budgets separately.

## Historical documentation correction

`runtime-activation-verification.md:7` still instructs finalization to acquire a fresh lease, while its disposition says task #44 is submitted. Preserve that original packet's bytes and record the later receipt/readback in the new verification handoff; Supervisor has selected this approach. The document correctly distinguishes configuration, manual bridge exercise and successful scheduled execution; keep those distinctions.

## Evidence and verified controls

- Independently reran `HQ_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55439/traceli_hq_test pnpm test:hq`: all 10 behavioral groups passed against PostgreSQL 18.4. Tests create only fictional tenants. The suite refreshed its own local test-evidence file.
- Inspected restricted role grants, tenant/mandate RLS, the two-field cross-mandate status view, claim and run triggers, transaction-local identity, append-only guards, content hashing and promotion locking.
- Checked worker denial for Amber/Red jobs and Operating Room mirrors, single-running-job claims, expired and replaced worker rejection, independent acceptance, exact independent memory review, Librarian promotion, stale/rejected proposal denial, version immutability and concurrent promotion serialization.
- Inspected typed database columns against migration columns. The SQL migration explicitly owns checks, role grants and RLS; the typed models do not substitute for applying that migration.
- Independently reran the seven runtime exporter tests: all passed. Read the earlier interim review and the current verification account. This confirms those isolated regression checks, not a new live credentialed refresh or a scheduled run.
- Existing Operating Room tasks remain in D1; the HQ reader has not been switched to this store. No new authentication adapter, model runtime, customer data ingestion or production migration is implied by these results.

## Scope and limitations

The caller of `createHQStore` is trusted and must obtain organization, role, mandate and actor from authenticated host grants. The supplied principal is not authentication, and the database connection remains privileged infrastructure. Agents must receive neither that credential nor unrestricted SQL. The test server's owner is a local PostgreSQL superuser; production owner capabilities, existing role attributes/membership, pooling and migration privileges need target-specific preflight before rollout. This reviewer did not connect to a hosted database, inspect secrets, mutate schedules, send messages externally or verify process termination.

Crash-recovery attempts and content revisions can be different budgets; no automatic mapping is assumed. A real worker adapter still needs enforcement and evidence for tools, cumulative active time, revisions and actual spend. Passing this backend review will not mean unattended cloud operation is finished.

## Reviewed bytes (initial review)

| Artifact | SHA-256 |
|---|---|
| `db/migrations/0003_hq_operating_memory.sql` | `3e58c9a969282bfe946c55d4bbfd76a9c5f5ce7e09a636f884d3a0723e6b6618` |
| `db/hq-schema.ts` | `b0e73bbb438d265e91f08916b73c37745eb09e57d34cf8c53031bc2284c73293` |
| `lib/hq/store.ts` | `3a42416b0d19d284daf1abda13f266ec0d15fe33479080d62a1155139b189ba8` |
| `scripts/db/test-hq-postgres.mjs` | `fbade40ee6aa2190c6b3dd3b72d178fd7627e685f25fd1506ac8e22d8fbfae4f` |
| `docs/hq/POSTGRES_FOUNDATION.md` | `5740bff93db14c962ad324d5cc6c59821f28dbbb22825026de0375927fcf47ea` |
| `docs/hq/reviews/runtime-activation-verification.md` | `be6224e2952cde81b42e6eebeaf2c657e8940b39ede7af7be6430aca4db2021b` |
| `scripts/hq/sync_runtime.py` | `d089d2f3f94ab9b3ed883f396c686042ee23a34156a1cb5e1eb14631e039294a` |
| `scripts/hq/test_runtime.py` | `8cd35339ab0cdf88eef96bce480654810f125cd326055d041615a592c71e8e0a` |

## Independent correction retest

Retested 2026-09-15T20:31:13.162522+00:00. The broker now caps a requested lease to the job's active-minute limit. The database trigger rejects a raw worker update exceeding that limit. Independently reran the complete real-PostgreSQL suite: **11 of 11 behavioral groups passed**, including a six-second contract with a requested 900-second lease and direct database rejection of an over-budget claim. Reviewed the changed broker expression, trigger and regression assertions; the P2 finding is closed.

The foundation document now states that aggregate active time across attempts, content revisions and tool limits still require runner accounting. These remain explicit integration prerequisites, not silently claimed database controls. No unresolved blocking code finding remains in the reviewed local foundation. Production permissions, authentication, deployment and a bounded worker trial remain outside this pass.

### Final reviewed bytes

| Artifact | SHA-256 |
|---|---|
| `db/migrations/0003_hq_operating_memory.sql` | `6072140ffe8ac3236b570ca17b4066c54eedeea126534aa838b37a94f6b9e326` |
| `db/hq-schema.ts` | `b0e73bbb438d265e91f08916b73c37745eb09e57d34cf8c53031bc2284c73293` |
| `lib/hq/store.ts` | `1e019769e12552ecc893c013fb20247d883d98afb8e025b509e2800f6e914320` |
| `scripts/db/test-hq-postgres.mjs` | `693c5a8a2bf1509d2cbd49f01038bdfac3a196bb4e6d620eefc51e6a0aa7d7be` |
| `docs/hq/POSTGRES_FOUNDATION.md` | `3fff19813825798208496faee308bea1276d146908a24bbce3c17de3ca66415e` |
