# Trace-li HQ activation and desk handoff

## 20 September: Jev connectivity verified

[Live result and remaining scope](moat/M09_CONNECTIVITY_RUN_2026-09-20.md): the owner-authorized synthetic TypeSafe test succeeded in the private preview (jev-1.13.0, 334 ms, 338 reported tokens). The full #54/M09 workflow remains incomplete behind reviewed input/policy definitions; no further calls or production rollout were enabled.

## 20 September: three-lane moat program

[Live queue mapping and baseline](moat/DISPATCH_2026-09-20.md) · [Program](MOAT_PROGRAM_2026-09-20.md) · [Actions](MOAT_ACTIONS_2026-09-20.md) · [Jev API integration](JEV_INTEGRATION_2026-09-20.md).

M01–M12 are registered against the original Operating Room; M11 reuses discovery-guide task #31. NOW: M01 review, M02 shared contract, one source inventory bundle in EACH of UN/donor, MDB and Gulf procurement, and M09a route/access readiness. NEXT: structured case/rule extraction, independently reviewed benchmark/policy definitions and authorized Jev connection. LATER: score benchmarks and publish exact reviewed assets. Existing customer tasks remain primary. These are bounded work packages, not new timers or completed results. See the dispatch receipt for phase gates and actual IDs.

Effective 15 September 2026. Supervisor amendment under Oday's request to connect and activate HQ. The reviewed 14 September package remains the historical bootstrap record. This handoff corrects its incomplete account of existing operations; it does not retrospectively change accepted artifacts.

## What is active

Six existing desktop schedules were found in the original Trace-li workspace. The owner-private [Operating Room](https://traceli-operating-room.odeyqemal.chatgpt.site) already holds tasks, claims, reviews and compact run receipts in its existing cloud database. Read-back on 15 September found 43 existing tasks, 110 receipts and three pending reviews before connection task #44 was added. Editorial ran that morning; execution's latest saved receipt was 13 September. A configured timer does not establish a successful run at every scheduled time.

HQ is a development-only view in the isolated `codex/trace-li-hq` checkout. It now reads a minimized runtime snapshot from the original workspace. It does not execute agents, grant permissions or copy customer records. The six existing schedules continue to be the execution mechanism; no new timer or agent framework is introduced. Local scheduled work needs the computer on and the desktop app running. Cloud storage alone does not supply a cloud worker.

## Mandates carried by existing desks

| Existing schedule | Mandates and scope | Existing cadence |
|---|---|---|
| Traceli Execution Desk | Supervisor coordinates; Product Steward and Builder deliver eligible Platform/Buyers work; Listener supplies evidence | Weekdays 10:00 and 16:00 |
| Traceli Editorial Desk | Editor, with bounded Investigator source checks and separate review | Weekdays 09:00 |
| Traceli Funding Watch | Scout, only material changes to the existing shortlist while broad research is closed | Monday 09:00 |
| Traceli Customer Learning Review | Listener; actual conversations/replies and missing-input reports | Friday 16:30 |
| Traceli Security Posture Review | Auditor; independent evidence and security review | Friday 15:00 |
| Traceli Learning-Loop Readiness | Librarian/Supervisor; verify the existing entry gate, then proposal-only work | Friday 17:15 |

Times are the existing local schedule times; use Scheduled in the app for next-run time and settings. The old one-off four-hour continuation remains paused. Investigator and Product Steward are roles within bounded work, not extra permanent scheduled processes. Librarian may prepare proposals; canonical promotion still requires the exact existing approval.

## A–G are work packages for the existing queue

Read the relevant charter in [CHARTERS](CHARTERS.md) before work. The original workspace's `internal-ops/docs/EXECUTION_PROTOCOL.md` controls claims, receipts and review. Read the newest weekly plan before selecting tasks. Preserve existing task IDs and dependencies; these mappings do not approve an external action or claim a task completed.

| Thread | Owner / material available | Existing work and next eligible handoff |
|---|---|---|
| A · Product sharing | Product Steward → Builder; [Trace contract and sharing test](specs/TRACE_AND_SHARING.md) | Reuse the existing evidence example (#25) and conversation packet (#31). When #31 is claimed, include the single who-would-you-send-it-to question as an optional discovery probe. Record the role, reason and redactions; actual external sharing stays gated. Secure recipient implementation is later approved product work. |
| B · How it works | Editor; [reviewed explainer candidate](artifacts/HOW_TRACE_LI_WORKS.md) | Reconcile the candidate against current approved service positioning before proposing an exact change. Use it as source material for relevant Publish tasks, including #26 if review feedback requests it. Do not rewrite or self-accept a waiting packet. |
| C · Organic content | Editor; [content playbook](artifacts/CONTENT_PLAYBOOK.md) | Extend the existing editorial review and Week 4 content answer in #38 when actual buyer language exists. Preserve calendar limits and current work. No new posting schedule. |
| D · Four account pieces | Investigator → Auditor → Editor; [four internal pieces](artifacts/ACCOUNT_PIECES.md), source and review records under `research/` and `reviews/` | Treat UNFPA, OCHA, Chemonics and DAI as reviewed historical candidates. Before choosing one for a new publication packet, recheck primary access/status and the distinct management-response qualifications. Oday approves exact publication. These are not four new buyers or four sent pieces. |
| E · Development sequence | Product Steward → Builder; [sequence](specs/DEVELOPMENT_SEQUENCE.md) | The sanitized sample and export/sharing test support #25/#31. Propose Trace model → recipient view → secure sharing → missing evidence/comment/resolve → new Trace → export → integrations. Existing customer discovery and blocked delivery task #15 retain priority and their real dependencies. |
| F · Customer Operating Room | Listener / Execution Desk | Use original Week 4 tasks #28–39: history #28 → baseline #29, cohort #30 → messages #31 → Oday sends #32 → reply analysis #33; conversations #35 → conditional scope #36 and commercial step #37 → evidence review #38. Actual private send history remains an input requirement; reading task counts does not satisfy it. Preserve owners, target-vs-actual distinctions and business-day follow-up windows. |
| G · HQ operating system | Supervisor / Builder / Auditor / Librarian | Connection task #44 covers this bridge and handoff. Keep the job and decision contracts in this package. Reuse claims and reviews in the original room. Prioritize useful work after this connection; technical enforcement for a separate cloud worker remains a scoped future task (#42), not permission to deploy one. |

The 18 bootstrap jobs and 11 accepted internal outputs describe the HQ package. Operating Room tasks describe ongoing company execution. These are separate records with explicit links, not totals to add together or competing boards to dispatch from. Do not create seven duplicate tasks merely because seven workstreams exist. Register a new bounded task only when a concrete deliverable is not already covered and the current work permits it.

## Run procedure and boundaries

1. Read this handoff, the relevant mandate charter, the newest weekly plan and `EXECUTION_PROTOCOL.md`. Work within the desk's existing tool scope. The charter is a further limit, not a credential or new permission.
2. Obtain the fresh Sites credential for the exact project in `internal-ops/.openai/hosting.json`. Keep it only in process memory/environment. Use the existing client to flush permitted receipts, inspect actual tasks and acquire a lease before edits. Re-read dependencies and existing claims.
3. Refresh the minimized HQ evidence with `python3 internal-ops/scripts/hq_status.py --workspace /Users/odaykamal/Documents/ChatGPT/Traceli`. It is read-only against the room, writes only the ignored local snapshot, and returns nonzero when the room cannot be read. Record the failure; do not infer empty queues. This status export is housekeeping, not a new agent job or completed customer deliverable.
4. Keep the desk's at-most-two-task / 45-minute cap and one bounded repair. One active task per mandate; source checking and drafting may be serial. Stop at absent buyer inputs, a current claim by another run, missing authority, unavailable sources, exceeded cap or exhausted repair. Save a checkpoint and partial evidence. A task lease prevents duplicate claims; the model must still observe tool/time limits.
5. Submit the exact artifact and relevant checks to review, then record and read back the actual receipt through `ops.py`. A worker cannot approve its own output. A receipt labelled Completed does not mean a pending review has been accepted. Auditor checks source/security boundaries independently; Supervisor reconciles proposed memory changes; Red stays with Oday. Refresh the HQ snapshot after the receipt.
6. Stay quiet when unchanged or non-actionable. Surface a completed useful output, material failure, or concrete decision. Existing review feedback and missing customer evidence take priority over more HQ infrastructure.

No new sending, publication, commercial commitment, spend, customer-data processing, production change or access expansion is authorized. Existing exact approvals retain their actual scope; do not infer approval from old labels. Mandate files are scoped working memory by policy, not a new physical sandbox. Desktop tool permissions remain those of the host. No claim is made that HQ provides a technical per-agent spending or tool enforcer.

## Pause, recovery and cloud path

Use Scheduled in the desktop app to pause the named existing desk; ask the Supervisor to pause all six when needed. Pausing prevents future scheduled starts, but a currently running task also needs to be stopped in its chat. Preserve its checkpoint and release/expire its task claim through the existing protocol. No pause button is simulated inside this read-only page. A denied credential or failed room read must not be bypassed; preserve the prior timestamp and mark the connection unavailable.

The status panel separates schedule configuration time, last room read, last actual receipt and pending review count. It marks status older than two hours as needing refresh. Browser refresh only rereads the saved snapshot; a scheduled or supervised run updates that snapshot. Lack of a receipt does not prove the timer failed or that work succeeded.

There is already cloud state for the Operating Room. Mandate charters, detailed local run envelopes and source artifacts are still files. Moving execution off this computer needs one bounded worker with appropriate authentication, scoped storage, retry/idempotency, measurable limits and tested recovery. Reuse existing storage where suitable; separate AWS memory databases per persona are unnecessary. Consult the existing tool backlog entry TB-03 / task #42 when a named job and authorized cost envelope justify a worker.

## Local setup

The source exporter is `scripts/hq/sync_runtime.py` in the HQ checkout and is installed as `internal-ops/scripts/hq_status.py` in the original workspace. The runtime file defaults to that workspace's ignored `internal-ops/outputs/hq/runtime-status.json`. Start the HQ preview with `TRACELI_HQ_RUNTIME_FILE` pointing to this file. It contains only schedule identifiers, generic role labels, counts, review task IDs and receipt dates/outcomes. No bearer tokens, lead rows, task descriptions, raw receipt summaries or review bodies are exported.

The reviewed docs are copied to `docs/hq` in the original workspace so existing schedules can read stable files. All subsequent schedule changes use the app's automation tool and preserve IDs, cadence, target, model and notification settings. No automatic source publishing or production deployment is part of activation.
