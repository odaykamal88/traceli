# Canonical job contract

The machine-readable contract is [job.schema.json](schemas/job.schema.json). Every registered job is in [jobs.json](data/jobs.json); output envelopes use [output.schema.json](schemas/output.schema.json), with a distinct payload for each mandate. Markdown is the initial human artifact; the runner must add an output envelope before automated ingestion. Do not claim Markdown alone is schema-validated.

The required fields are objective, owner/persona/charter version, trigger and dedupe key, input/context references, tool allowlist, memory read/write allowlists, expected output and schema, measurable acceptance criteria, deadline/SLA, action approval level and approval evidence, status, dependencies, reviewer, evidence, actual cost, hard limits, result and handoff. Due dates may be null until dispatch; active-minute caps and review SLA are mandatory. The earlier charter or job limit applies. Job cost null means unavailable; no new paid spending is authorized.

Transitions: intake → ready when scope, inputs and approval are satisfied. ready → running records an authenticated actor, timestamp and lease. running → review includes artifact and evidence. review → accepted requires a separate reviewer and acceptance result. review → changes_requested → running is capped at two revisions. Any nonterminal state can become blocked/failed/cancelled with reason. awaiting_approval cannot enter running without a matching unexpired action approval. Accepted jobs cannot be reopened in place; create a linked correction version.

At dispatch reject missing charter, inactive mandate, unknown tools, expired authorization, blocked dependencies, exceeded budget or an output path outside the assigned scope. Authorization is the highest consequence level; a self-declared Green label never overrides action policy. Jobs cannot accept themselves. JSON schema checks record shape; the authenticated runner must enforce semantic state transitions and permissions separately.

Next runner: transactionally claim with a lease and unique dedupe key; reserve budget before invocation; append event and checkpoint on tool completion; treat a stale lease as an exception rather than launch a duplicate. Prevent new dispatch on pause. Retries never reset the budget. Actual external attempts use a separate single-use idempotency record and exact approved artifact hash. The present shell executes none of these effects.

## Path roots and prerequisite semantics

`expected_output.path` and `result.artifact_refs` are repository-relative paths (for example `docs/hq/artifacts/HOW_TRACE_LI_WORKS.md` or `app/hq`). Human Markdown links remain relative to their containing document. Memory read/write entries name logical authorized scopes; a future runner must resolve them to approved paths and reject escapes. Source references may be registered source IDs, repository paths or exact external URLs.

`dependency_requirements` names the gate for each dependency: `submitted` means a written reviewable artifact exists; `accepted` means a separate review/acceptance record exists. Review jobs require producer submission, so review does not deadlock waiting for its own acceptance. HQ-G01 requires the written/submitted charter package under Oday’s charters-before-execution instruction; it does not claim G02 had already passed independent review.
