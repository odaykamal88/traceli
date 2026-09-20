# Trace synthetic slice — verification record

20 September 2026. Baseline: merged M02 contract `041b4b8b607f1f41f851b2b8d29e3f5e14589cb9`; implementation branch `codex/trace-workflow`. The specification received independent technical PASS before application code. The accepted M02 core files are unchanged.

## Working behavior

The local Next.js interface persists fixed fictional evidence in PostgreSQL, displays source-linked deterministic checks separately from offline model assessment, records version-bound human decisions and overrides, and downloads full or redacted JSON packs under recipient/version/expiry permissions. Evidence revisions retain the prior source/profile/lane; explicit source corrections append versions. History remains immutable. No external provider request was made.

## Actual checks

| Check | Result | Evidence |
|---|---|---|
| Strict fixture schemas, source/snapshot/policy hashes, scope, unknown dates, model error states, overrides, export projection | 9 contract tests passed | [Contract and access output](verification-contract-access.txt) |
| Current membership, removed roles, missing session, local mode remote-URL denial, oversized/cross-origin commands, generic errors | 11 access tests passed | [Contract and access output](verification-contract-access.txt) |
| Real PostgreSQL RLS, cross-tenant/same-procurement relationships, immutable history, concurrent/stale writes, idempotency, rollback/retry, expiry/revocation, full/redacted exports | 17 groups passed | [PostgreSQL output](verification-postgres.txt) |
| Fresh migrations 0001–0010 | Passed on a disposable loopback database | [Migration output](verification-migrations.txt) |
| Inconsistent old links abort before changing history/schema; valid upgrade preserves unverified legacy dates/hashes | 3 migration checks passed | [Migration preflight](verification-migration-preflight.txt) |
| Existing evidence reader | 14 tests passed, including adjusted expectations for stronger storage guards | [Legacy output](verification-legacy-evidence.txt) |
| Existing tenant isolation and audit append-only behavior | Passed | [Tenant output](verification-tenant.txt) |
| Complete browser journey, keyboard skip/disclosures, 320/375px widths, stale draft recovery, export downloads, negative origin/source checks, lost-response replay | 15 checks passed; no page errors | [Browser report](verification-browser.json) |
| TypeScript and optimized production build | Passed | [Build output](verification-build.txt) |

The browser used installed Chrome in a temporary profile, Next.js 16.3.3 in development on loopback, Node 24 and a disposable PostgreSQL 18 instance. The production build ran with Trace disabled and no WorkOS/database configuration. CI additionally runs the new contract/access, PostgreSQL and migration-preflight suites on its existing PostgreSQL 16 service. Local execution used installed dependency binaries because the desktop pnpm wrapper attempted to replace the shared dependency directory; no lockfile or dependency versions were changed.

Browser captures: [desktop](evidence/desktop.png), [320px](evidence/mobile-320.png), [375px](evidence/mobile-375.png). These contain only synthetic fixtures. The final mobile interface collapses record history to keep the result and next action close to the top. The browser suite also verifies that an uncertain successful create followed by a lost response can be retried without a duplicate unit.

## Findings fixed during verification

SQL nullable CHECK expressions initially admitted null provenance/scope fields; predicates now require a true result. An evidence-only revision initially changed fictional lane and rule bytes; revisions now preserve exact original rule/profile/pack and distinguish explicit source correction. The first browser action exposed Next's local request-URL host normalization; mutation origin validation now compares the browser Origin to the actual Host and protocol, never forwarded host. A stale-alert test initially selected Next's blank announcer; the corrected test waits for the actual conflict message, and confirms the draft remains present. Early fixture formats were tested in separate disposable databases; immutable rows were not silently rewritten.

## Explicit limits

This verifies a fixed synthetic/local slice, not a real legal rule or procurement outcome. No official source was recovered or admitted, customer data processed, paid provider activated, benchmark scored, production migration applied or production deployment made. Live WorkOS behavior is covered with mocked current-membership tests, not a live authenticated browser session. No human comprehension study was performed. Sensitive-data retention/deletion and backup restoration remain unimplemented and outside enabled intake. History listing is bounded to 40 recent units; historical IDs remain readable with authorization. Exports reconstruct the current disclosed unit and its human history; prior units are references rather than embedded payloads. A downloaded copy cannot be recalled.

Private queue coordination uses existing #52/M07 and #54/M09 with separate claim IDs and preserves their remaining real-source/domain dependencies. M02 internal artifact acceptance does not change original task #47's separate human disposition; task #48 bookkeeping/source recovery was not repeated.
