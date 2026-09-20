# Trace-li HQ operating package

## 20 September: Jev connectivity verified

[Live result and remaining scope](moat/M09_CONNECTIVITY_RUN_2026-09-20.md): the owner-authorized synthetic TypeSafe test succeeded in the private preview (jev-1.13.0, 334 ms, 338 reported tokens). The full #54/M09 workflow remains incomplete behind reviewed input/policy definitions; no further calls or production rollout were enabled.

## 20 September: three-lane moat program

[Live queue mapping and baseline](moat/DISPATCH_2026-09-20.md) · [Program](MOAT_PROGRAM_2026-09-20.md) · [Actions](MOAT_ACTIONS_2026-09-20.md) · [Jev API integration](JEV_INTEGRATION_2026-09-20.md).

M01–M12 are registered against the original Operating Room; M11 reuses discovery-guide task #31. NOW: M01 review, M02 shared contract, one source inventory bundle in EACH of UN/donor, MDB and Gulf procurement, and M09a route/access readiness. NEXT: structured case/rule extraction, independently reviewed benchmark/policy definitions and authorized Jev connection. LATER: score benchmarks and publish exact reviewed assets. Existing customer tasks remain primary. These are bounded work packages, not new timers or completed results. See the dispatch receipt for phase gates and actual IDs.

Updated 20 September 2026. Eight mandate charters and all seven A–G workstreams are written and visible. Eleven bootstrap jobs have accepted internal outputs. The six existing desktop schedules now read the HQ handoff and current charters; the original Operating Room remains the authority for its tasks, reviews and receipts.

[Open local HQ](http://127.0.0.1:3014/hq) · [Current Supervisor handover](SUPERVISOR_BRIEF.md) · [Runtime and A–G mapping](RUNTIME_HANDOFF.md)

## Operating Room overview

The HQ landing page now leads with business and cloud milestones, the two most useful owner inputs, blockers, recent activity, A–G handoffs, channel feedback and evidence-backed lessons. Business metrics come from a dated, read-only snapshot of the original Operating Room; missing social analytics remain explicit. [Evidence and limits](operations/OPERATING_EVIDENCE.md) · [Update procedure](operations/DASHBOARD_MAINTENANCE.md).

The first scheduled cloud check returned idle on 18 September at 09:02 Cairo without a model call. [Scheduled receipt](cloud/SCHEDULED_CHECK_20260918.md).

## Current delivery state

**17 September cloud increment:** the Vercel connection blocker is resolved through the authenticated CLI. An owner-only WorkOS gate and dedicated staging identity are prepared for the private preview. [Cloud access setup](CLOUD_ACCESS_SETUP.md) and [access verification](reviews/access-verification.md) record the exact boundary. Oday’s real hosted sign-in is verified. The first bounded Railway worker completed a real model call, saved its draft in Neon and appeared in authenticated hosted HQ. Funding and provider controls are verified. Oday approved the exact first-draft review exception and a daily cloud check; unchanged inputs make no model call.

- **Operating package:** constitution, charters, queues, schemas, decisions, memory policy and first reviewed artifacts are prepared.
- **Existing desks:** connected without new timers or widened permissions. A schedule being enabled is different from a recorded run or an accepted result; HQ displays saved evidence and its age.
- **Postgres:** scoped jobs, runs, decisions and reviewed memory promotion are implemented and tested; the HQ migrations are now applied to the existing pre-production database. [Foundation](POSTGRES_FOUNDATION.md) and [verification](reviews/postgres-verification.md) describe exact scope and remaining gates.
- **Cloud execution:** the private owner-only preview is deployed and real owner sign-in verified. A bounded draft worker, narrow Postgres capabilities and a read-only cloud panel are implemented and tested locally. [Pilot factsheet](CLOUD_WORKER_PILOT.md) and [verification](reviews/cloud-worker-verification.md) distinguish preparation from live operation. A real cloud run and hosted draft readback are verified. The first draft was accepted under Oday’s one-time review exception and a bounded daily check is configured. Broader desk cutover remains outstanding; existing desks still depend on the desktop.
- **Customer progress:** room metadata is connected, but sends, replies, completed interviews and commercial dates must come from actual records. Drafts and silence establish none of these outcomes.

## Operating rules and contracts

[Constitution](AGENT_CONSTITUTION.md) · [Eight charters](CHARTERS.md) · [Dashboard specification](HQ_DASHBOARD_SPEC.md) · [Job contract](JOB_CONTRACT.md) · [Decision Ledger](DECISION_LEDGER.md) · [Backlog](IMPLEMENTATION_BACKLOG.md) · [Dispatch packets](SPAWN_PACKETS.md)

Current charters are v1.1. Bootstrap v1.0 bytes are retained under `history/bootstrap-2026-09-14`; these historical documents are not current execution instructions. Canonical memory changes require exact-content review and Librarian promotion.

## All seven conversation threads

| Workstream | Owner and current output | Next evidence |
|---|---|---|
| [A · Sharing](queues/A.md) | Product → Builder → Listener; atomic Trace, fixture and recipient test specified | Observe an actual buyer's recipient task |
| [B · Explainer](queues/B.md) | Editor → Auditor; reviewed ERP-boundary explainer | Select an exact use/asset packet |
| [C · Organic content](queues/C.md) | Editor; reviewed evidence-led playbook | Test one useful case asset with real readers |
| [D · Account pieces](queues/D.md) | Investigator → Auditor → Editor; four reviewed internal drafts | Exact external review, including fresh OCHA source check |
| [E · Development sequence](queues/E.md) | Product → Builder; Trace/sharing before broad integrations | Secure recipient implementation and discovery evidence |
| [F · Operating Room](queues/F.md) | Listener; existing Week 4 tasks preserved | Actual send/reply/conversation records and dated next step |
| [G · HQ](queues/G.md) | Builder + Librarian + Auditor; private hosted HQ, scoped Postgres, one accepted cloud draft and bounded daily check | Migrate a selected desktop desk with equivalent inputs and receipts; first scheduled check is verified |

The queue files retain initial job-registration details; [jobs](data/jobs.json) and [runs](data/runs.json) record bootstrap progress. Current room task #44 tracks the connection and #45 tracks storage; they are not duplicate bootstrap completions. Active workstreams do not imply seven simultaneous workers.

## First artifacts

[How Trace-li works](artifacts/HOW_TRACE_LI_WORKS.md) · [Content playbook](artifacts/CONTENT_PLAYBOOK.md) · [Four account pieces](artifacts/ACCOUNT_PIECES.md) · [Source packet](research/ACCOUNT_EVIDENCE.md) · [Atomic Trace and sharing](specs/TRACE_AND_SHARING.md) · [Development sequence](specs/DEVELOPMENT_SEQUENCE.md)

Reviewed artifact bodies retain their submitted bytes. Separate reviews establish internal acceptance; no named account is represented as a customer or partner. Publication and consequential sends remain subject to Oday's exact approval.

## Implementation handoff

Source is in the existing `traceli` repository on `codex/trace-li-hq`, based on `0130366`. Changes cover `app/hq`, `docs/hq`, new HQ database models/migration/broker, runtime and database tests, and one test script entry in `package.json`. No application dependency was added. Unrelated local changes remain intact.

The supplied patch can be reviewed and applied to a clean checkout of that base, or reconciled with newer work. The feature branch is now saved in the existing private GitHub repository for preview deployment. Use the existing lockfile; run type checking and the production build. The fixture test requires its dedicated local database. Production HQ remains unavailable until internal identity and storage access are integrated and reviewed. Do not apply the production migration as part of merely opening the preview.

[QM runtime assessment](QM_ASSESSMENT.md) · [Latest reference extract](REFERENCE_EXTRACT.md) · [Repository reconciliation](REPOSITORY_RECONCILIATION.md)
