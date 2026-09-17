# Cloud worker verification

Updated 17 September 2026. Local implementation and disabled cloud execution verified; paid model quality remains unverified.

## Tested boundaries

- Nine worker request tests: fixed provider/model and no tools; reserve before API call; no calls when idle or over budget; no retries after timeout/HTTP failure; invalid, refused, incomplete, unmetered or unsourced output rejected; bounded request/response size; short replacement lease refused; reservation latency deducted from remaining runtime.
- Seven Postgres behavior groups using real restricted LOGIN connections and a non-superuser function owner under forced tenant policies: direct/inherited privilege denial; caller identity spoofing; concurrent claims; token-redacted reader and cross-tenant isolation; concurrent/replayed reservation denial; exact template matching; immutable database hash; atomic review submission; stale/replaced leases; pause/revocation; cumulative runtime and attempt caps; unknown cost retention; UTC budget rollover; D1 and native-contract collisions denied; full fixed-runner → mocked provider → persisted draft → independent reader path verified.
- Existing eleven HQ foundation checks still pass, including scoped memory, independent reviews/promotions and Operating Room dispatch denial. The broker's job list now excludes lease tokens and private contracts.
- Fresh local migrations 0001–0004 applied successfully. TypeScript checks and production build pass.

All fixture provider calls are mocked. No OpenAI request was billed. No cloud schema, remote service credential or recurring timer was enabled by these tests.

## Independent Auditor review

The chartered Auditor reviewed the migration, fixed runner, reader and fixtures. Two actionable findings were resolved: a replacement's model timeout now follows the remaining lease, and existing job contracts require a NULL-safe exact match. Auditor independently reran all nine worker tests and found no further blocking issue in the assigned source scope. Auditor did not independently run the mutating database fixtures or access cloud accounts.

## Remaining live acceptance

Completed live checks: Railway Docker build and disabled process execution; checksum-recorded managed-database migrations; actual reader and runner direct-table denial; disabled runner claim denial; separate secrets installed in their intended services; actual Railway restart `NEVER`, zero retries, one replica and no cron. OpenAI project hard limit is $8; available organization credit is $8 and automatic recharge is OFF.

Remaining: API key handoff, one real model response, immutable persisted draft and token accounting, owner-visible live status on a refreshed Vercel deployment, independent output review, and any scheduler cutover. The existing six desktop schedules remain unchanged. Railway remains on a bounded trial; paid hosting limit is not yet configured. See [dated live record](../cloud/LIVE_SETUP_RECORD.md).

The real hosted owner login is verified in [access verification](access-verification.md). A separate real non-owner login denial check remains outstanding. No production promotion is implied.

[Pilot factsheet and activation packet](../CLOUD_WORKER_PILOT.md)
