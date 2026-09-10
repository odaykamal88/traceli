# Read-only evidence contract — local fictional-data proof

10 September 2026. Week 3 actions 15 and 16.

The local contract retrieves a persisted procurement record, the recorded requirement/source references, findings and human decision state. It uses the same `withTenant` transaction boundary and workspace role vocabulary as the application. The adapter has two allowed operations and no mutation capability. It adds no production route or new dependency.

**Availability:** local fixture proof. A buyer's agent client and identity binding have not been recorded. This is not an MCP server, a completed buyer-client integration, a document-upload pipeline or a sealed evidence-pack generator. Choosing a real client, binding its authenticated viewer and checking its handling of tool output are the next integration steps. Do not configure this fixture launcher against customer data.

## Contract

The host supplies the trusted `WorkspaceViewer` separately to `callEvidenceTool(viewer, request)`. A remote host would need to derive it from verified authentication and authorization, not from model arguments. The local fixture launcher binds a fixed fictional organization and reviewer. It accepts only an explicitly enabled loopback database named `traceli_agent_demo`; it never loads `.env.local`.

| Operation | Arguments | Result |
| --- | --- | --- |
| `get_evidence_record` | `procurementId` | A record with `requirements`, `findings`, `citations`, and the current `decision` |
| `verify_evidence_citation` | `procurementId`, `citation` | Whether the supplied reference exactly matches a reference currently available to that viewer |

All objects are strict: extra fields are rejected. Identifiers accept only letters, numbers, underscores and hyphens, up to 160 characters. A citation must supply exactly `id`, `requirementId`, `documentId`, `sourceVersionId`, `recordedContentHash` and `anchor`. The anchor must also match; merely naming an existing document is insufficient.

Successful reads use `{ "ok": true, "result": ... }`. Failures return one of `invalid_or_denied_tool_request`, `evidence_unavailable`, or `read_failed`. Missing and inaccessible records have identical responses. Database details are not returned. A failed read has no automatic retry; a host may retry a read after the problem is resolved. Repeated successful reads do not change findings, decisions, audit events or outbox rows.

The source reference is joined through the requirement and source version to a document in the same organization **and procurement**. Unknown source-access labels, unauthorized source access, unlocked sources, malformed hashes and unresolvable relationships fail closed. This proof recognizes only the existing `Panel and procurement team` and `All staff · read only` labels. It is a conservative boundary for the fixture, not a substitute for the planned machine-readable document ACLs, assignment policy or retention controls.

The domain read runs in a PostgreSQL read-only, repeatable-read transaction under `traceli_app` and existing row-level security. Queries have a five-second statement timeout and a one-second lock timeout. Results allow up to 50 requirements and 50 findings, with a 64 KB serialized result cap; excess size fails rather than silently returning an incomplete record. The CLI accepts at most 8 KB of request input. A future remote transport still needs its own request deadline, authentication, rate limits and cancellation.

Every returned record text field is untrusted evidence. Its contents cannot change the operation allowlist or supply a tenant, URL, file path, SQL query or approval. This deterministic property does **not** prove that a future language model will ignore malicious text; that model and its complete tool set must be tested in the chosen client.

## What the record establishes

The saved fictional response shows RFP-2026-041 in evaluation, REQ-07 requiring clarification, a `missing_evidence` finding with no recorded reviewer determination, and a draft, unlocked decision. Its reference points to the stored RFP source version and `RFP §4.2 · page 14`.

Source bytes and supplier submissions are not persisted in this baseline. The returned hash is seed metadata and the citation carries `verification: stored_reference_only`. No excerpt, independent source-content verification, supplier compliance determination or audit outcome is inferred. The current decision state is reported; the agent cannot approve, lock, award or resolve it.

## Reproduce locally

Requires Node 24, pnpm and an isolated PostgreSQL 16 fixture. The example password below is only for the disposable local database. Use an unused loopback port; do not point the migration or seed scripts at an existing database.

```bash
docker run -d --rm --name traceli-agent-demo \
  -p 127.0.0.1:15439:5432 \
  -e POSTGRES_DB=traceli_agent_demo -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres postgres:16
export DATABASE_URL='postgres://postgres:postgres@127.0.0.1:15439/traceli_agent_demo'
export DATABASE_URL_UNPOOLED="$DATABASE_URL"
export TRACELI_SEED_ORGANIZATION_ID=org_traceli_relief
export TRACELI_AGENT_FIXTURE=1
pnpm install --frozen-lockfile
# Wait for pg_isready before migrating.
docker exec traceli-agent-demo pg_isready -U postgres -d traceli_agent_demo
node scripts/db/migrate.mjs
node scripts/db/seed.mjs
pnpm test:agent
pnpm demo:agent < docs/verification/week3-agent/request.json
docker stop traceli-agent-demo
```

The native Node loader only resolves this application's TypeScript aliases. The `react-server` condition respects the existing `server-only` package. Node may report a module-type performance warning; the application package type is unchanged.

## Verification and outstanding gates

The [saved request](verification/week3-agent/request.json), [fictional response](verification/week3-agent/response.json), [boundary results](verification/week3-agent/boundary-tests.txt) and [existing tenant results](verification/week3-agent/tenant-tests.txt) are reproducible artifacts. CI runs the same boundary test after migrating and seeding its disposable database.

Fourteen checks cover authorized retrieval; two-tenant isolation; identity, role and source denials; strict tool arguments; invented citations; malicious evidence text; unknown and unlocked sources; cross-procurement references; output bounds; repeated reads without writes; SQL read-only enforcement; query timeout/recovery; CLI execution; fixture isolation; and a failed connection followed by a healthy retry. Some checks contain multiple cases.

| Remaining gate | Owner / next action |
| --- | --- |
| Actual agent/client selection | Oday or the buyer identifies the existing client and accountable sponsor; no preference is inferred from imported leads |
| Authenticated integration and transport | Codex binds the chosen client's verified identity to the existing tenant policy and runs client conformance tests |
| Real uploaded-file and model behavior | Codex tests the ingestion path and actual model/tool environment once present; this run injects text directly into an isolated fixture record |
| Verifiable source bytes and portable sealed pack | Codex implements document custody/provenance before claiming byte integrity or an audit-ready pack |
| Production use | Requires review of this exact candidate and applicable deployment authorization; this local proof does not enable public access |

Action 15 remains incomplete as an existing-buyer-agent demonstration. The client-independent contract and tests are delivered for review; their success must not be counted as a live integration or commercial traction.
