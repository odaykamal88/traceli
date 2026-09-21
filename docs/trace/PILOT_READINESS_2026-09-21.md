# Trace pilot readiness — 21 September 2026

**Ready for a controlled synthetic demonstration; not ready for customer-document intake.** Read-only assessment of merged main `88d1ab1c2242884fd4cc882fbf65d1eb3b445dd4`, including Trace implementation `d8dcdd0`. This assessment changed documentation only. It performed the signed-out public GET checks recorded below; it did not execute a live sign-in, migration, WorkOS/model-provider request or positive pilot.

## What the evidence establishes

| Area | Implemented boundary | Verification and remaining limit |
|---|---|---|
| Identity | Every Trace API operation resolves the session server-side, rejects impersonation/unverified users and rechecks the current WorkOS user and active membership. Ambiguous memberships and provider failure deny access. | Eleven mocked access tests passed in the [saved verification](VERIFICATION.md). Three hosted signed-out GET checks below returned the exact generic Trace denial. A live authenticated Trace WorkOS browser result is still missing. See [access](../../lib/trace/access.ts) and [role policy](../../lib/trace/access-policy.ts). |
| Tenant and actions | Transactions use restricted `traceli_app` and forced tenant RLS; composite foreign keys bind procurement relationships. Officer/director/admin can create/review; director/admin alone can override or create a full export. | Seventeen saved PostgreSQL test groups cover tenant, role and relationship negatives. Authorization is organization-wide by role, not a per-procurement assignment/ACL model. All recognized read roles can read the complete in-tenant unit through the record API. |
| Intake and provenance | Creation accepts an enumerated server-owned fictional scenario, never an uploaded document, arbitrary URL or caller-supplied source body. Retained UTF-8 source bytes, version relationships and canonical hashes are validated. Evidence revisions preserve governing source/profile; explicit source corrections append versions. | No real official source, legal applicability, customer evidence or benchmark admission follows. Source/date/domain acceptance remains separate. [Contract](../../lib/trace/contract.ts), [fixtures](../../lib/trace/fixtures.ts), [store](../../lib/trace/store.ts). |
| Decision and export | Decisions bind unit/input/policy hashes, expected sequence, rationale and actor-bound idempotency. Export requires a saved decision; grants bind the authenticated recipient, mode, purpose, version and 15-minute expiry. Downloads recheck membership, expiry, revocation and revision. | Saved browser/DB tests cover full/redacted output, stale writes and replay. This is authenticated self-download, not recipient invitation/sharing. A downloaded file cannot be recalled. |
| Redaction | An explicit allowlist omits creator/reviewer identity and free-text rationale/purpose from redacted exports and records a materialized redaction manifest. | Source content, excerpts and evidence text remain disclosed; this is not a general PII/supplier-document scrubber. Redacted export does not reduce the same user's record-read authority. [Projection](../../lib/trace/export.ts). |
| Retention and deletion | Trace units, decisions, grants, revocations, receipts and command records are append-only; UPDATE/DELETE triggers reject mutation. Local disposal means destroying the disposable fixture database. | No customer retention schedule, legal hold, sensitive-payload deletion, backup expiry or tested restoration procedure is implemented. A 15-minute grant expiry is access expiry, not deletion. [Migration 0010](../../db/migrations/0010_trace_workflow.sql). |
| Usability | Eight synthetic states, preserved stale drafts, progressive history, keyboard navigation and narrow layouts are delivered. | Fifteen saved browser checks passed. No buyer comprehension study has established that users correctly distinguish unknown, failure, policy result and human override. |

The prior [independent final review](FINAL_REVIEW.md) accepted the bounded local slice. PR #24's passing CI separately exercises the Trace contract/access, persistence and migration checks on its dependency candidate; it does not establish hosted authentication or browser behavior.

## Hosted signed-out verification — completed

At **2026-09-21 10:36:44–45 UTC**, made three public HTTPS GET requests to `https://www.trace-li.com`, the production base recorded in `scripts/smoke-production.mjs`. Requests sent no session, authorization, cookies or bypass token, used nonexistent test identifiers, and did not follow redirects. Only response status, selected headers, byte count and equality to the generic access error were recorded; no source or customer response content was retained.

| Request | HTTP / matched route | Result |
|---|---|---|
| `/api/trace` | 403 / `/api/trace` | Exact generic Trace access-denied JSON |
| `/api/trace?unitId=00000000-0000-4000-8000-000000000000&sourceId=fictional-unavailable` | 403 / `/api/trace` | Same denial before any record/source lookup |
| `/api/trace/export?grantId=00000000-0000-4000-8000-000000000000` | 403 / `/api/trace/export` | Same denial before any export lookup |

All three responses had `Cache-Control: private, no-store, max-age=0`, `X-Robots-Tag: noindex, nofollow`, `Content-Type: application/json`, `X-Vercel-Cache: MISS`, no `Location`, and the same 89-byte JSON object containing only the known generic access error from `lib/trace/access.ts`. The matching route headers plus exact application error distinguish these results from a missing-route 404 or platform protection page. They establish the public signed-out denial and cache boundary only; they do not distinguish disabled Trace mode from enabled mode with no session, establish database readiness, or exercise signed-in membership/role enforcement.

**Deployment identity remains unverified.** The inspected source is main `88d1ab1…`; no claim is made that the public alias serves that exact commit. The connected Vercel deployment listing returned 403 insufficient permission, project metadata returned a connector argument-schema error, and a CLI fallback was unavailable in this shell. No protection settings, roles, environment variables, migrations or deployments were changed. The older HQ preview was not substituted for current Trace evidence.

## Remaining safe hosted verification

Use the existing private preview and staging identity without expanding its permissions:

1. Record the actual deployed commit and check that it contains `/api/trace`; the historical HQ branch deployment predates Trace. A missing route/404 on an old deployment proves neither current authorization nor a successful pilot.
2. On the identified preview, request the record API signed out and from the existing HQ-owner session. Expect no Trace data and private/no-store responses. Record status, configured Trace mode and deployment identity, not cookies/tokens or response data. The public signed-out checks above already establish their narrower boundary.
3. If `workos` mode is enabled on an explicitly prepared synthetic preview, the existing `org-hq-owner` role must still be denied by Trace. [HQ setup](../hq/CLOUD_ACCESS_SETUP.md) grants that role no procurement privileges, and Trace's accepted role list excludes it. Do not make the owner a workspace administrator merely to make a demonstration pass.

The preview identity and authenticated HQ-owner checks remain **not run in this assessment**. Denial checks cannot prove the positive workflow.

## Positive synthetic pilot packet

Before enabling the positive path, prepare an exact preview-only packet: deployment/rollback, reviewed migration 0010 preflight, isolated database organization matching a dedicated staging organization, narrowly assigned test roles, fixed fictional scenarios and the test window. The local seed intentionally refuses hosted databases and is not a hosted provisioning command. The fixture contract currently records `Local synthetic workflow verification` / `synthetic-local-v1`; reconcile the purpose/version for a hosted test rather than silently reusing a local authorization claim.

Verify current membership, removed membership, wrong organization, wrong recipient, role downgrade, expired/revoked grant, stale version and provider outage alongside the positive create → evidence revision → decision → redacted/full export flow. Use dedicated test memberships for destructive access tests; preserve Oday's working HQ access. Keep original policy failure visible after an override. Confirm origin/Host behavior on the actual Vercel route, not only loopback.

Although source fixtures are fictional, WorkOS actor identifiers, review rationale and export purpose are retained in hosted records. Do not call the hosted test anonymous or assume fixture-only intake prevents a person typing private information. Set a reviewed retention/disposal approach for this limited test before retaining real identities beyond the test window.

For a customer pilot, additionally implement and negatively test permitted intake, purpose/retention/deletion/backup handling, agreed organization/record visibility and source-domain admission. Obtain the actual buyer task, owner, deadline and permission record. Keep benchmark scoring and paid provider processing behind their respective accepted protocol and allowance. These are concrete remaining delivery requirements, not controls already demonstrated by the synthetic slice.
