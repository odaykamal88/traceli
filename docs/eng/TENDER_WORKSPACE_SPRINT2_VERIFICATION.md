# Tender workspace Sprint 2 verification

This suite is intended for a disposable local PostgreSQL database after all migrations, including `0012_tender_workspaces.sql`, have been applied. It must reject non-loopback URLs, production mode, and Vercel before opening connections. It writes synthetic fixtures under unique organization, user, tender, and idempotency identifiers. Never point it at shared, staging, or production data.

## Required verification matrix

| Boundary | Expected result |
| --- | --- |
| Director/admin tenant-wide access; officer/reviewer assigned `review`; auditor, unassigned member, removed membership, and `read` grant attempting writes | Capability and every operation agree with the action matrix; inaccessible tender IDs are indistinguishable |
| Two organizations and two tenders in one organization | No cross-tenant reads; composite foreign keys reject every cross-tender receipt, manual, draft, issued-record, and cursor link |
| Forged organization, actor, source, pack, provenance, record, or PDF fields | Strict input rejects them or service rebuilds the value from authenticated server state; forged identity never becomes persisted authority |
| Draft `missing` and explicit `negative` decisions | Both survive persisted save and read with distinct states and hashes |
| Old expected revision and two parallel writes at the same revision | One write wins; the other receives conflict with current revision and does not overwrite the winner |
| Idempotency replay | Same actor/action/key/input returns the original result; changed input or actor conflicts |
| Append-only manual, packet, draft, issued record, command, export receipt | SQL UPDATE and DELETE fail under the application role |
| Injected failure after a write/audit stage | Cursor, child rows, audit event, and command receipt all roll back; retry with the same command succeeds |
| Packet source and sanitized receipt | Customer persistence is refused until the retention gate exists; allowed synthetic fixture stores a server hash and bounded fields only, never source bytes or secret sentinel text |
| Assessment, judgment, and PDF | Judgment references the exact persisted assessment; PDF uses the authorized persisted record and verified lineage even if browser state differs; mismatched or tampered records fail integrity checks |

The executable integration script records only gates that it actually exercises. A requirement absent from the current exported interface or untestable without an unsupported production policy is marked **not covered** below instead of inferred from source inspection.

## Run and current evidence

Run `scripts/tenders/test-postgres.mjs` with explicit `DATABASE_URL` and `DATABASE_URL_UNPOOLED` values pointing to a disposable loopback database, `TRACE_EXTRACTION_PROVIDER=mock`, Node's React Server condition and TypeScript stripping, and the repository's `scripts/field-registry/register.mjs` import hook. Run `scripts/tenders/test-access.mjs` with those database variables, the same condition and import hook, plus `--experimental-test-module-mocks --test`. Both scripts have a hard loopback/nonproduction guard and do not load `.env` files.

The final-schema run passed all 21 PostgreSQL boundary checks; the mocked WorkOS grant/revoke test also passed. Together they cover the matrix above, including rollback after command insertion, source/pack/actor tampering, pagination around newer unassigned tenders, and keeping a current draft's packet/manual visible beyond the 50-row summary windows. Fixtures use unique organization and user IDs; scripts retain them for inspection and perform no global cleanup.

## Not covered

No customer-data retention policy, formal exception approval authority, or source-file custody/viewer exists in Sprint 2. Tests preserve the synthetic-only receipt boundary and treat exception as a proposal. The main integration suite seeds tender access rows directly; a separate mocked WorkOS test exercises grant and revoke with inactive, duplicate-active, wrong-organization, and disallowed-role target memberships. Route request body, origin, authenticated actor freshness, and error-response checks are maintained separately by the task owner.

## Integration and browser evidence

- Request/client suite: 6 passing tests for feature gating, same-origin/body bounds, customer classification refusal, error hygiene and semantic draft comparison across JSON property order.
- Existing Hub (12), Desk/reviewer (22), pilot PDF (8) and Field Registry (6) tests pass. Type checking and the optimized production build pass. CI repeats the required checks.
- Local fixture browser: created a server tender, selected a fictional text packet using the mock provider, saved an incomplete correction, reloaded it, completed its page/quote/value, reopened revision 3 in a fresh tab, issued an assessment and a request-evidence disposition, returned via Hub/header, and reopened both retained records. At 375 px the checklist had no horizontal overflow. The refreshed test tab recorded no browser warnings/errors.
- PDF: the browser button caused a successful server export. The browser automation download event timed out, so OS download completion is not asserted. A direct request to the same local record endpoint returned HTTP 200, a valid 3-page PDF (6,692 bytes), and the database retained both export receipts. No browser-supplied record body was accepted.
- A final Hub/header navigation guard warns when edits are dirty or saving. The final build and type check pass. Browser automation stalled on the native confirmation dialog and could not verify dismissal; manual confirmation/cancellation remains a review check. The earlier full workflow evidence above predates this guard.
- A false UI save-conflict caused by JSON key order was found and fixed during this run. The regression test compares the editable field values and protects edits made during an in-flight save.

## Activation and rollback

Default production behavior stays unchanged. `TRACELI_TENDER_WORKSPACES=1` opts the signed-in Hub/Desk into the new API; complete database configuration and the additive migration are prerequisites. A missing database or a failed server call shows an error, never a browser-save fallback. Disabling the flag rolls back the new UI path while preserving server records. Do not delete tables or rewrite earlier migrations.

Only local fixture identity plus mock extraction may ingest packets/manuals. Customer policy, retention enforcement, data deletion and real-file custody are not implemented by this sprint, and no environment toggle enables customer ingestion. WorkOS users may access authorized saved records if the rollout is enabled; real invited-session testing remains a release gate. Access management has verified grant/revoke APIs, not a new administration screen.

Both database runs used explicitly created disposable loopback PostgreSQL databases. No shared/staging/production migration, external extraction-provider call, production rollout, merge or automation resumption was performed. The PR is stacked on Sprint 1 (#63) and should be reviewed in that order.
