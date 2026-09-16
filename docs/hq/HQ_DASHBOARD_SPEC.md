# Trace-li HQ: information architecture and implementation contract

## Primary task

Oday opens HQ and can see what matters, who owns it, what evidence exists and which decisions are ready. Supervisor sees workload, blockers, reviews and handoffs. Workers receive one scoped job packet. Personas are internal role labels, never invented human employees or public credentials.

## Navigation and views

| View | Content | Main action / guard |
|---|---|---|
| Company Feed | Brief, recent accepted outputs, activity blotter, exceptions, live-count truth | Open source/job; refresh snapshot |
| Mandates | Objective, thesis, universe, charter, tools, budget, status, memory, KPIs, performance | Inspect charter and scoped queue; no spawn button until runner exists |
| Workstreams | Seven distinct A–G queues and dependencies | Open job and handoff; active queue differs from running job |
| Jobs | Status, owner, deadline/SLA, evidence, cost, result and review | Filter/read; durable claim/dispatch later |
| Approvals | Ready decisions separated from packets not yet ready | Read exact action packet; current shell cannot approve or execute |
| Decisions | Accepted/proposed/superseded entries, authority, rationale and evidence | Inspect provenance; later authenticated append-only decision |
| Memory | Four layers, proposal inbox, diff, classification, conflicts and reviewer | Inspect proposal; only reviewed promotion later |
| Library | Constitution, charters, schemas, backlog, sources and artifacts | Open versioned local document |
| Sample Trace | Fictional discovery artifact and evidence chain | Open evidence, review gap and recipient CTA; no secure share implied |

## Feed event contract

Event fields: id, schema_version, occurred_at, recorded_at, actor, mandate_id, job_id, event_type, subject_ref, summary, evidence_refs, classification, correlation_id, idempotency_key and prior_event_ref. Initial local events are minimal preparation receipts, not runtime telemetry. Future events include dispatched, checkpoint, output_submitted, review_rejected, accepted, blocked, approval_requested/decided/expired, memory_proposed/promoted, limit_reached, paused and recovered. Store append-only in HQ tables, separate from procurement award/audit events. Editing a job snapshot must not rewrite history.

## Metrics and honest empty states

Running = jobs actually marked running by a confirmed dispatch; a prepared loop never counts. Ready = all dependencies satisfied and authority present. Accepted output = separate reviewer accepted with evidence. Historical imports are identified as imports. Cost is null when runtime does not expose it; never display $0.00 as inferred spend. Customer sends/replies/conversations/paid commitments remain unknown until actual records are imported. KPI cards show denominator, window, baseline and source; never fabricated sample performance.

Show snapshot time, last confirmed event and enabled/disabled/unverified loop state. Stale running lease is an exception, not a green light. Disabled controls must explain what is missing. No fake chat messages, typing indicators, employee activity or live animations. Daily/weekly briefs are prepared routines until a verified scheduler is connected. Existing CI and health jobs are shown as repository-defined, live status unverified.

Supervisor brief schema: as_of; evidence_window; confirmed_changes[]; important_decisions[]; commercial_next_steps[]; risks[]; next_assignments[]; allocation_proposal; unknowns[]; evidence_refs[]. Maximum five important decisions; an empty decision list is a valid result. Operational P0/P1 signals from existing AUTONOMOUS_OPERATIONS.md cannot be suppressed or downgraded by a model.

## Current shell

Route `/hq` in the existing Next.js app. Server reads only curated docs/hq records after checking development mode. No customer database query, mutation API, scheduler, tool execution, external call or approval persistence. Native navigation, search, filters and detail disclosures support review. Files are the source of this local bootstrap snapshot; they are not claimed as the future durable multi-worker database. Production returns 404. Bind preview to loopback. Do not put internal data in public/ or import it into a client bundle.

## Next authenticated increment

Reuse WorkOS verified identity and existing Postgres/tenant transaction patterns, but define separate HQ roles: founder, supervisor_service, worker_service, auditor and librarian. Procurement reviewer is not an HQ administrator. Use a dedicated internal organization and explicit HQ membership; deny supplier identities. The host supplies worker identity and allowed job scope, never model arguments. Read/write authorization is checked in every route/action/DAL function. The existing local evidence contract remains read-only and fixture-scoped; HQ must not upgrade it into customer access.

Minimum future tables: hq_mandates, hq_jobs, hq_runs (leases, attempts, checkpoints, prompt/model versions, budget), hq_artifacts (hash/classification), hq_reviews, hq_approvals (exact action hash, expiry, consumed_at), hq_events, hq_memory_proposals and hq_decisions. Keys carry internal organization and scope; use transactional transitions and unique dedupe keys. Reuse existing ops_run/ops_finding direction rather than create another monitoring engine. No migration is run by this work package.

## Acceptance for production enablement

Authenticated founder/supervisor/worker/auditor/librarian role tests, denied supplier/other-tenant access, actor spoofing rejection, atomic single dispatch, lease crash recovery, expired/changed/consumed approval denial, Red-action separation, malicious source text ignored as authority, budget stops, no plaintext secrets/customer text in telemetry, backup restore and pause/revoke behavior. Review exact deployment and rollback with Oday only when complete.
