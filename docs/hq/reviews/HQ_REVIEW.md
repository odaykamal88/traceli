# Independent Trace-li HQ review

Job: HQ-G03 · Reviewer: Risk / Auditor · 2026-09-14T20:57:26.157150+00:00.

**Disposition: pass for the local, read-only bootstrap package after the corrections recorded below.** No production or autonomous-runner approval is given. Supervisor must finish its recorded technical verification and acceptance; this report does not assert that the reviewer ran build, database, browser or deployment tests.

## Coverage

Read the Constitution, all eight charters, job/decision/output schemas, current job/decision/approval/event/memory records, all A–G work queues, backlog, dashboard and dispatch contracts, repository reconciliation, Trace/sharing and development sequence specs, and `app/hq/page.tsx` / `hq.module.css`. Account-source and explainer reviews are separate linked packets. Data is a preparation snapshot that the Supervisor continues updating as actual outputs arrive. The final loop-register, formatted event-time and clickable document-link additions were also inspected. Links admit only HTTP(S) destinations or normalized Markdown targets in the enumerated HQ document list; arbitrary protocols and unknown paths remain text. No guard or execution boundary was relaxed.

| Area | Independent finding |
|---|---|
| Authority and staffing | Mandate-first hierarchy and replaceable personas are explicit. Charters restrict tools, scope, costs, review and stops. Oday retains consequential actions; the Supervisor can accept internal work. Temporary workers differ from persistent processes, and all recurring HQ loops remain disabled. No spawn/execution/approval-writing endpoint exists in the inspected page. |
| Privacy boundary | Server-only page checks development mode before reading HQ records; production takes the notFound branch. It reads curated local files, not customer tables. `doc` must match an enumerated Markdown path before read; model/user text is rendered as escaped text. This is appropriate only for the specified loopback development preview, not an authenticated production boundary. |
| Memory | Four layers and reviewed canonical promotion are explicit. Drafts do not become company facts; sensitive customer records are excluded from Git/client payloads. Initial mandate history is honestly empty. Logical memory scopes require concrete host resolution before a runner is enabled. |
| Job and review lifecycle | Written/submitted and accepted prerequisites are distinct; review jobs need producer submission, preventing a review/acceptance deadlock. Worker submission does not accept its own job. The JSON schema controls shape; a future authenticated runner must enforce transitions and permissions. |
| Decisions and approvals | Founder brief decisions and Supervisor allocation proposals are distinguishable. Execution authority is separate from general policy. Initial Red packets are incomplete and non-executable; the interface does not expose an active approval control. Hash/target/expiry/single-use enforcement is correctly a later server-side gate. |
| Status truth | Mandates and active queues do not count as running workers. The page derives job counts from saved statuses and shows disabled recurring loops. Customer metrics and unavailable cost are not fabricated. Supervisor must close the actual dispatched jobs in the final snapshot; a static record is not durable runtime telemetry. |
| Product/discovery priority | A fictional Trace and the recipient question precede integrations. Explicit fictional-source, custody and planned-sharing labels avoid implying live document verification or secure sharing. The current Operating Room remains a blocked import, with no invented sends, replies or conversion. |
| Complexity | Reuses the existing Next.js project and future WorkOS/Postgres boundaries. No new agent framework, scheduler, permanent employee fleet or public communication integration is introduced. NOW/NEXT/LATER phases protect discovery and defer production control enforcement. |
| Failure handling | Written caps, two-revision stop, unavailable evidence, denied access and ambiguous external-result handling are present. Lease recovery, dedupe, checkpoint, budget enforcement, pause/revoke and exact approval semantics are explicitly required before unattended operation. |

## Findings and correction checks

1. **Medium, fixed — bootstrap prerequisite contradicted recorded execution.** HQ-G01 was submitted while requiring accepted HQ-G02, which remained under review. Supervisor changed the dependency gate to `submitted`, matching the actual user instruction to write visible charters before execution, and documented the reason. Rechecked the saved record with an assertion. No prior acceptance was invented.
2. **Medium, fixed — output roots were inconsistent.** Most paths were HQ-relative while `app/hq` and `docs/hq` were repository-relative. Supervisor normalized every expected-output and result-artifact path to repository root and documented logical memory-scope resolution. Independent assertions checked every current job's output roots and artifact roots.
3. **Low, fixed — accepted-history corrections.** Rechecked the Constitution after Supervisor clarification: corrections now create linked jobs for accepted work and preserve original acceptance history. This agrees with JOB_CONTRACT and does not authorize replaying stale approval.

No unresolved material blocker was found for local review use. The three principal limitations are intentional: no authenticated HQ service, no persistent job runner, and no secure recipient sharing. They remain release gates, not capabilities granted by this review.

## Technical evidence boundary and retest

Supervisor separately reports earlier type/build success; desktop/mobile browser checks; seven queues, filtering and the fictional Trace; no observed error overlay, console errors or overflow; production `/hq` and document query returning 404; public `/` returning 200; and unknown/traversal document requests returning 404. Those are **Supervisor-reported results**, not tests run by this reviewer. Supervisor is rerunning type/build after the final presentation edits; do not assume those reruns passed from this review. Preserve the actual verification artifacts with the implementation handoff before accepting HQ-G01.

My executable checks were limited to the saved prerequisite and repository-relative output-path assertions; both passed. I made no product/code/data edits and performed no production actions. I did not independently test source-file symlink behavior, concurrency, authentication, live credentials, complete site regressions, real customer ingestion or future server enforcement. The current design expressly does not offer the latter capabilities.

Retest any change that removes development-only access, adds client-side record imports, expands document roots, introduces writes/tools, changes acceptance semantics, ingests real customer data or enables a timer. Require the dashboard spec's production role/tenant, forged identity, approval expiry/change/reuse, budget, recovery and pause tests before those features go live.

Next owner: Supervisor for final status reconciliation and acceptance; Librarian for a separately approved canonical promotion proposal. There is no consequential action ready for approval in this report.

## Reviewed core versions

| File | SHA-256 |
|---|---|
| `app/hq/page.tsx` | `00bcc42ac04f2035409956e5865c8cf9e6f046a4f97e0c62804954727dfa3034` |
| `app/hq/hq.module.css` | `2ee2b19a1ab29e19c5504ab8f853ef70f3ddde70d880490652847724f1193465` |
| `docs/hq/AGENT_CONSTITUTION.md` | `6c546e6ef9041ec834027de239dc3dd7d92abbc1905a90107e547941f4ef5594` |
| `docs/hq/JOB_CONTRACT.md` | `0b8294ea47e74138ee5dde4d777acbe6e1228282c2019b86d6e4e36b1a6faf86` |
| `docs/hq/SPAWN_PACKETS.md` | `c447547b5d157dec13d8b31dc03aa45ea11299617465076247557c6fce060454` |
| `docs/hq/HQ_DASHBOARD_SPEC.md` | `aef56d7c7c62c133844553539617630eb3310157dd295e4787c47f1b622be558` |
| `docs/hq/IMPLEMENTATION_BACKLOG.md` | `6401d28f2bc84d0212dcf92b2a2191154ae32d026c26fed08ef2a52b00e06c92` |

The submitted Constitution is v1.0. Charters are v1.0. Job/queue data are mutable local snapshots; later acceptance events and exact artifact hashes must identify the final submitted state. Measured session cost is unavailable, and no new spend was made.
