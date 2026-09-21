# Independent source-collector review — 21 September 2026

Reviewer: `hq_overnight_audit`; runtime and migration author: coordinating agent. Scope: `workers/hq/source-collector.mjs`, worker entry point, staging/Dockerfile, migration 0011 and the [source contract](SOURCE_COLLECTION_CONTRACT_20260921.md), against the existing identity/lease/snapshot migrations. The reviewer authored this record and three targeted SQL regression additions, not the runtime or migration.

**Final disposition: PASS for the exact bounded preview implementation below. No unresolved material finding remains in this scope.** The initial review required the four corrections below; their fixes and targeted regressions passed. This is technical acceptance for the authorized preview rollout, not evidence that deployment or a scheduled retrieval has occurred. Source retrieval/domain acceptance remains a separate review. The reviewer performed fixture database writes for tests, but no live retrieval, database migration or provider call.

## Material findings

1. **P2 — expired terminal jobs can block the whole mandate.** `hq_source_claim()` excludes jobs at `max_attempts`, but its subsequent running-job check includes expired jobs. A source job whose second attempt dies remains `running` forever and prevents the next source job from being claimed. The same issue arises when a running job's authorization expires or is disabled. Terminalize source jobs that cannot recover, preserving prior runs as expired; prove another authorized job can then run. Do not clear an unexpired valid lease.
2. **P2 — the executable deadline can kill submission after valid bounded retrieval.** `main()` starts a 110-second hard stop before connecting. `runSourceCycle()` can then spend time on the claim, 100 seconds collecting, and up to 12 seconds submitting, beyond that process deadline. Pass an outer deadline through the collection budget and reserve time for connection/claim/submission, or explicitly align the process ceiling and contract. Exercise the boundary with injected time so a valid bundle can reach atomic submission before hard stop.
3. **P2 — null lease tokens and retained-byte CHECK need fail-closed comparisons.** Submission's `r.lease_token <> tok` and `j.lease_token <> tok` evaluate to SQL NULL when `tok` is NULL. Later mutation guards prevent a fresh null-token write, but the earlier replay branch can return a prior result without the token. Use `IS DISTINCT FROM` or reject null inputs before reading results. The retained-evidence CHECK also accepts NULL bytes/hash because a CHECK accepts unknown; require its whole condition `IS TRUE`, with explicit positive retained bytes/hash conditions. Test direct table constraints with a trusted fixture and null-token submission/replay using the restricted runner.
4. **P2 — revalidate revocation after serialization.** Both entry points resolve identity before locking the binding, so they can cache an enabled row and resume after a concurrent disabling transaction. Recheck current identity after obtaining the lock. Lock the applicable policy/authorization rows before evaluating active flags, using a consistent order, so source submission cannot race a committed revocation. The replay branch currently occurs before authorization/policy/expiry checks; align this with the contract's promise that revoked or paused submission stops, or explicitly define replay as a separate permitted read. Test a queued claim/submission against a disabling transaction.

## Correction recheck

All four corrections are present on code reinspection: terminal cleanup includes revoked/expired/exhausted jobs and expired leases with insufficient authorization time for another attempt; source authorizations are locked before cleanup; identity is reread after the binding lock and policy/authorization locks protect active checks; token comparisons and retained-byte constraints fail closed; replay follows authorization checks; collection receives the executable deadline and reserves 15 seconds before it for submission. The shared binding lock serializes source claim and submission despite their inner row-lock ordering.

The reviewer independently reran the frozen source/legacy worker tests: **19/19 passed**, with no network/provider calls. They cover fixed endpoints, public DNS, lookup pinning, credential-free requests, redirect/MIME/encoding/size/signature/hash failures, DNS/body abort and stream errors, the executable deadline's submission reserve, no-job idle and legacy provider boundaries.

The reviewer independently executed the full PostgreSQL source test script on disposable loopback `127.0.0.1:55441/traceli_hq_test`: **9/9 groups passed, zero model calls**. Restricted logins, direct-table denials, concurrent claim, wrong/null token and manifest, byte mismatch, malformed/null/extra fields, invalid observation time, paused/revoked submission and replay, transaction rollback, exact retained bytes/hash, immutability, redacted snapshot, zero model charges, expired-attempt recovery and immutable partial review passed. The three added regressions directly prove that NULL retained bytes/hash fail the table CHECK, a claim waiting on a committed binding revocation is denied before consuming an attempt, and an expired lease with a retry left but only 124 seconds of authority releases the next job while its old run remains visibly expired.

CI wiring was sanity-checked: the existing Node 24 job runs both worker suites, creates a separate `traceli_hq_test` database, migrates it through `DATABASE_URL_UNPOOLED`, and runs the source SQL tests through `HQ_TEST_DATABASE_URL`. The fixture guard requires loopback and that exact database name; the source suite uses isolated random principals/organizations. Existing Trace tests remain in place. This review does not claim a future GitHub CI result. Syntax and `git diff --check` passed.

## Boundaries that look correct on inspection

- `session_user` supplies the remote login identity; caller GUCs cannot change the organization/mandate binding. Capability roles have no direct access to the new source tables. Security-definer functions use a fixed search path and restricted grants.
- Runtime source URL/digest pairs are fixed in code. DNS results must be public; the vetted address is supplied to the actual HTTPS lookup while hostname/SNI verification is retained. Redirect responses are rejected. No cookies, bearer headers, arbitrary filesystem path, shell or provider tool is used.
- The deadline includes DNS and streamed response consumption. HTTP status, PDF MIME/signature, identity content encoding, received bytes and SHA-256 are checked. Declared length alone is not trusted. The IPv6 global-prefix check rejects mapped/private addresses; the IPv4 blocklist rejects private/loopback/link-local/carrier-grade and other reserved ranges.
- Submission enumerates the complete authorized manifest, recalculates decoded byte hashes and constructs a narrow summary. Source evidence, artifact and run/job changes share one transaction. Successful and partial bundles stop at review; the artifact explicitly requires new authorization to fetch a changed/partial bundle again.
- The cloud reader snapshot includes fixed summary fields/artifact text, not raw `bytea`, lease tokens or credentials. Renaming the older snapshot preserves its previously granted reader capability, but it still rechecks reader identity and exposes only its prior redacted scope.
- Staging copies five named runtime/package files and a restrictive Docker context, not the application workspace or environment files. The container runs as `node`; dependency installation ignores lifecycle scripts. Existing scheduling remains separate from deployment and must be read back after rollout.

## Exact reviewed files

SHA-256 values at the coordinating agent's runtime/SQL freeze. Any substantive change to these files requires review of the changed content before reusing this disposition.

| File | SHA-256 |
|---|---|
| `workers/hq/source-collector.mjs` | `62270cb590559e75e499c047da56b93bebf1d37cfc4cf37ad65e898fdfcf839a` |
| `workers/hq/worker.mjs` | `3c81e14f661ce30f956a4ea74553f67c436346a13604fa3f9d81df23a693fb58` |
| `workers/hq/stage.mjs` | `6a03d9488a7e9fd0a80cc659e358d95e7a076069d5acc23e0b112a8a12a84d7e` |
| `workers/hq/Dockerfile` | `f49a5597ffb560815133f10d8f547e9b24caafba88156350f7d7be9233b495e9` |
| `workers/hq/source-collector.test.mjs` | `a8592383fac6726274bf14f9250b3d3462b47fc8d7a02c72fb434ea2fb5b07b7` |
| `workers/hq/worker.test.mjs` | `81ffde50a093ea9c1a85dc8c9e0b27f264870d302eaf07a9064835ac29adabf8` |
| `workers/hq/package.json` | `fa062a2331ca8a9c5eb502873ddd0899ffd8c9ade182c01d0344dc53cdaa9832` |
| `workers/hq/package-lock.json` | `d596681149eba7e2a5d3ffac25df04afc371ac76e1f621784ce6ecb380fdeb59` |
| `db/migrations/0011_hq_source_collection.sql` | `906b6304dee639fd2b8f7ec0e0ba5306eebefaa67b6067c9143f84a23943698b` |
| `scripts/db/test-hq-source-collection.mjs` | `77cb12e6246b7fb34dc27ad412d2a7e3967da323cd0af4139dca917f6d4f88a9` |
| `docs/hq/cloud/SOURCE_COLLECTION_CONTRACT_20260921.md` | `ded48a99145720dab41e8620fec67497a99d6a3b67ec50cf5563580bd0b9800d` |
| `.github/workflows/ci.yml` | `11fd699ad0cc1c2fb81087f60c38271f739546f2c98fbd33d858a25cdc895ab1` |
| `package.json` | `5a99129dd915ef9a29443888792dc182bc0e578bab50769e9ee2648703712e41` |

## Rollout evidence still required

The positive raw-byte SQL path used a fictional PDF. The worker tests use injected network transports and do not establish reachability of the approved public hosts or the current official documents. A real bounded preview invocation must match the approved digests, retain bytes atomically, stop at review and read back its exact artifact through the restricted HQ reader. Verify the deployed runtime hash, migration checksum, role ownership/forced-RLS behavior and current schedule on the actual preview.

Keep immutable initial attempts visible as expired. A success receipt must identify the exact reviewed migration/runtime and source hashes and distinguish a manual first run from the first actual scheduled occurrence. Passing tests alone do not establish deployment, current official applicability or real-rule admission.
