# Cloud worker verification

Updated 17 September 2026. Local boundary checks and one actual paid cloud response verified. The exact first draft was accepted by Supervisor under Oday’s one-time specialist-review exception; no general quality baseline is claimed.

## Tested boundaries

- Nine worker request tests: fixed provider/model and no tools; reserve before API call; no calls when idle or over budget; no retries after timeout/HTTP failure; invalid, refused, incomplete, unmetered or unsourced output rejected; bounded request/response size; short replacement lease refused; reservation latency deducted from remaining runtime.
- Seven Postgres behavior groups using real restricted LOGIN connections and a non-superuser function owner under forced tenant policies: direct/inherited privilege denial; caller identity spoofing; concurrent claims; token-redacted reader and cross-tenant isolation; concurrent/replayed reservation denial; exact template matching; immutable database hash; atomic review submission; stale/replaced leases; pause/revocation; cumulative runtime and attempt caps; unknown cost retention; UTC budget rollover; D1 and native-contract collisions denied; full fixed-runner → mocked provider → persisted draft → independent reader path verified.
- Existing eleven HQ foundation checks still pass, including scoped memory, independent reviews/promotions and Operating Room dispatch denial. The broker's job list now excludes lease tokens and private contracts.
- Fresh local migrations 0001–0004 applied successfully. TypeScript checks and production build pass.

All fixture provider calls are mocked. No OpenAI request was billed. No cloud schema, remote service credential or recurring timer was enabled by these tests.

## Independent Auditor review

The chartered Auditor reviewed the migration, fixed runner, reader and fixtures. Two actionable findings were resolved: a replacement's model timeout now follows the remaining lease, and existing job contracts require a NULL-safe exact match. Auditor independently reran all nine worker tests and found no further blocking issue in the assigned source scope. Auditor did not independently run the mutating database fixtures or access cloud accounts.

## Remaining live acceptance

Completed live checks: Railway Docker build and disabled process execution; checksum-recorded managed-database migrations; actual reader and runner direct-table denial; disabled runner claim denial; separate secrets installed in their intended services; actual Railway restart `NEVER`, zero retries, one replica; daily recurrence was subsequently explicitly authorized and read back at 06:00 UTC. OpenAI project hard limit is $8; available organization credit is $8 and automatic recharge is OFF.

Now verified: API key handoff, one real model response, immutable persisted draft and token accounting, and owner-visible live status. Oday waived the additional specialist review for this one exact draft and authorized a bounded daily check. Broader desk cutover remains outstanding. The existing six desktop schedules remain unchanged. Railway remains on a bounded trial; paid hosting limit is not yet configured. See [dated live record](../cloud/LIVE_SETUP_RECORD.md).

The real hosted owner login is verified in [access verification](access-verification.md). A separate real non-owner login denial check remains outstanding. No production promotion is implied.

[Pilot factsheet and activation packet](../CLOUD_WORKER_PILOT.md)

## First funded cloud execution

17 September: one actual Railway run completed, saving an immutable draft and usage to Neon and stopping at review. Owner-authenticated hosted HQ displayed it. Pause/revocation was applied and proved; Oday then authorized the exact one-time review exception and bounded daily recurrence. Source audit passed. No separate specialist output-audit acceptance is claimed. Migration 0005 and the updated seven-group database test verify that independent acceptance appears in the cloud snapshot while the original attempt history is retained. [Exact live evidence](../cloud/LIVE_RUN_20260917.md).

## Deployment and handover check

The final scheduled deployment `2d50f299-7fa7-4f24-bddc-73077f867518` reports SUCCESS, Dockerfile build and the approved recurrence in its actual manifest. Service readback agrees: one replica, restart NEVER, next check 18 September at 06:00 UTC. An unchanged approved snapshot was separately claimed through the restricted runner and returned idle without a provider call. The first scheduled occurrence is still pending at this check.

The staging helper copies only four reviewed runtime files, a root Dockerfile and an ignore file. Its generated manifest matches the deployed worker hash. The earlier failed scheduled deployment stopped during build; the replacement used explicit service settings and a fresh isolated upload. See the [activation receipt](../cloud/ACTIVATION_RECEIPT_20260917.json). A final authenticated hosted-browser check also passed after connectivity recovered: private owner access, database connected, pilot permitted, the exact draft marked accepted, $0.0022 estimated token cost and $0.05 held against the $8 monthly allowance were visible. Expanding the draft showed its recorded artifact hash and dated-source qualification.
