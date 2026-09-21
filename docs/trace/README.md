# Trace: synthetic workflow

The public `/demo` presents this evidence and review path using fixed fictional sources, tab-local simulated reviews and a distinct demonstration download. The earlier procurement walkthrough is at `/demo/classic`. Neither public route activates the protected persistence path described below. See [website reconciliation](WEBSITE_RECONCILIATION_2026-09-21.md).

A working local vertical slice at `/workspace/trace`: retained source bytes → frozen evidence → deterministic policy checks → human decision/override → authorized JSON export. The eight fictional scenarios cover missing evidence, supported and failed requirements, explicit exclusion, conflicting instruments, unknown effective dates, model timeout and invalid model output. There are no external provider calls.

## Run locally

Use Node 24, the project's pnpm version and a **disposable, loopback PostgreSQL database**. Do not point these commands at a live database. Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in your process environment to that disposable database. No credentials belong in Git or task receipts.

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm trace:seed
TRACELI_TRACE_MODE=local pnpm dev --hostname 127.0.0.1
```

Open `/workspace/trace`. Local mode requires development, an explicit flag, a loopback database URL without query overrides, no hosted-runtime flag and a loopback request host. The seed creates only `org_trace_local`; the server supplies a fictional director identity. Bind the dev server to loopback. The feature is disabled by default. `TRACELI_TRACE_MODE=workos` is an opt-in integration path using current active WorkOS membership on every operation; live WorkOS browser verification and hosted promotion were not performed.

Start with “Missing note · U.” Inspect the source, record a request for evidence if desired, then select “Add fictional signed note.” That creates a new version in the same fictional U context and retains the exact rule/profile. Save a reasoned human decision, prepare a redacted or full export and download its JSON pack. Try the failed-note case to record an authorized fictional override while retaining the adverse policy result.

## Boundaries and data model

All intake is from server-owned fictional fixtures; no uploads, arbitrary URLs, real rules or customer records are accepted. Text is rendered as data. Model assessment, deterministic policy and human disposition are separate. Missing evidence is unknown; missing effective-date facts request rule review. All-satisfied checks stop at readiness for human review. Every unit is excluded from real decisions and benchmarks.

`lib/trace/contract.ts` holds strict bounded schemas; `fixtures.ts` builds and validates source bytes, scoped references and canonical hashes; `store.ts` uses existing tenant transactions, restricted role/RLS, same-procurement FKs, serialized writes and atomic audit events. Migration 0010 also prevents locked legacy-source mutations and cross-procurement legacy links. It aborts on pre-existing incompatible links. Existing effective dates and metadata hashes remain unverified; no legal-date or byte-custody claim is backfilled.

Evidence-only revisions preserve the original rule and case context. An API revision with `revisionKind: source_correction` explicitly appends corrected source/rule versions; it is covered by integration tests. Previous units remain readable by ID, while new human decisions/exports against superseded versions are denied. The UI lists the latest 40 records; it does not claim unlimited history pagination.

Reviewer actions require exact unit/input/policy hashes, expected decision sequence, rationale and an actor-bound idempotency key. Overrides additionally require director/admin access, cited evidence and the fixed fictional exception authority. Mutations return generic actionable errors. A conflict keeps the review draft; reload fetches the new version. An uncertain same-command network retry reuses its idempotency key in the current page session.

Exports bind the authenticated recipient, unit hash, review sequence, purpose, redaction mode and 15-minute expiry. They require a saved human decision. Full export is director/admin-only; other permitted readers receive a redacted projection. Every download rechecks current access, expiry, revocation and version. Redacted output omits creator/reviewer identity and free-text rationale. The pack carries source-byte hashes, a materialized redaction manifest, disclosed record references and a canonical payload hash. It reconstructs the current unit and its human history; earlier units are referenced, not embedded. Original hashes identify withheld originals, not reconstructed redacted bytes. No export publishes or grants underlying source access.

## Verification

```sh
pnpm test:trace
pnpm test:trace:postgres
pnpm typecheck
pnpm build
```

The PostgreSQL suite creates random synthetic test tenants in the configured disposable loopback database and leaves them for inspection. Never run it against production. CI runs these contracts/access and PostgreSQL checks after migration and the existing tenant/evidence suites. Browser automation is in `scripts/trace/test-browser.mjs`; with Playwright installed and the local dev server running:

```sh
node scripts/trace/test-browser.mjs
```

Optional environment variables: `PLAYWRIGHT_MODULE` selects an existing Playwright module, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an installed Chromium/Chrome executable, `TRACE_TEST_URL` selects the loopback server and `TRACE_BROWSER_OUTPUT` selects the screenshot/report directory. Browser tests use temporary browser profiles and fixed synthetic records only. The checked-in verification report records what was actually exercised.

## Remaining gates

Real-source recovery, retained official bytes, source/domain acceptance and real rule admission remain M07/M09 dependencies. The consumed provider allowance is unchanged. Customer purpose/access/retention/provider permissions, sensitive-payload deletion and backup restoration, human comprehension testing, benchmark protocol/scoring and production migration/deployment require their own evidence and authorization. This local synthetic slice claims none of them. Stop and remove the disposable database when finished; no customer payload was processed.
