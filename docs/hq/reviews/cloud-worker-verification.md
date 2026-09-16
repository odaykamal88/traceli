# Cloud worker verification

16 September 2026. Local implementation verification; no claim of cloud execution or paid model quality.

## Tested boundaries

- Nine worker request tests: fixed provider/model and no tools; reserve before API call; no calls when idle or over budget; no retries after timeout/HTTP failure; invalid, refused, incomplete, unmetered or unsourced output rejected; bounded request/response size; short replacement lease refused; reservation latency deducted from remaining runtime.
- Seven Postgres behavior groups using real restricted LOGIN connections and a non-superuser function owner under forced tenant policies: direct/inherited privilege denial; caller identity spoofing; concurrent claims; token-redacted reader and cross-tenant isolation; concurrent/replayed reservation denial; exact template matching; immutable database hash; atomic review submission; stale/replaced leases; pause/revocation; cumulative runtime and attempt caps; unknown cost retention; UTC budget rollover; D1 and native-contract collisions denied; full fixed-runner → mocked provider → persisted draft → independent reader path verified.
- Existing eleven HQ foundation checks still pass, including scoped memory, independent reviews/promotions and Operating Room dispatch denial. The broker's job list now excludes lease tokens and private contracts.
- Fresh local migrations 0001–0004 applied successfully. TypeScript checks and production build pass.

All fixture provider calls are mocked. No OpenAI request was billed. No cloud schema, remote service credential or recurring timer was enabled by these tests.

## Independent Auditor review

The chartered Auditor reviewed the migration, fixed runner, reader and fixtures. Two actionable findings were resolved: a replacement's model timeout now follows the remaining lease, and existing job contracts require a NULL-safe exact match. Auditor independently reran all nine worker tests and found no further blocking issue in the assigned source scope. Auditor did not independently run the mutating database fixtures or access cloud accounts.

## Remaining live acceptance

Railway container build/execution, actual managed-database grants, least-privilege credential readback, provider credit/key availability, one real model response, owner-visible persisted draft after local disconnection, and scheduler cutover are not yet verified. Docker packaging could not be built locally because the Docker daemon is not running; runtime request tests and the app build are separate evidence.

The real hosted owner login is verified in [access verification](access-verification.md). A separate real non-owner login denial check remains outstanding. No production promotion is implied.

[Pilot factsheet and activation packet](../CLOUD_WORKER_PILOT.md)
