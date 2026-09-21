# First official-source cloud collection — 21 September 2026

**Verified milestone: two real source-collection jobs ran on Railway, saved immutable review artifacts in the private database, and appeared in authenticated HQ.** Two of four selected PDFs were successfully retrieved and matched the independently reviewed original bytes. The other two outcomes remain missing evidence, not successful retrievals or negative procurement findings.

| Original task | Cloud result | Saved artifact SHA-256 |
|---|---|---|
| #49 World Bank / ADB | World Bank retained: 1,315,218 bytes. ADB HTTP error; no bytes retained. | `f42bcab1f42cf94719753cf9fcf6b3fb4c63e4ba9f30a1209bf06af74c4c0d58` |
| #50 Saudi / UAE | Saudi Arabic law retained: 893,363 bytes. UAE deadline reached; no bytes retained. | `1e8af1dbe4e4a2b48b389747622b4f93c8abab8f2a6fe49249dce11eb46cc931` |

Read the two expanded jobs in [HQ → Systems](https://traceli-new-git-codex-trace-li-hq-odaykamal-9099s-projects.vercel.app/hq?view=systems). Owner authentication, connected restricted reader, source URLs, exact sizes/digests, partial counts, review states and saved artifact hashes were visibly checked at 08:04 UTC. Raw PDF bytes are not exposed by the dashboard.

Both invocations were **manual verification**, at 08:01 and 08:02 UTC. Deployment `2630a3eb-918b-4e52-93ec-ebf724a88278` is built from the minimal reviewed worker bundle. Its actual deployment manifest retains one replica, restart policy NEVER and the existing daily 06:00 UTC schedule: 09:00 Cairo, next due 22 September. The first scheduled source-worker occurrence has not yet happened. Completed review bundles are not silently fetched again; interrupted attempts may recover within their two-attempt/authorization bounds. This is a bounded collector, not migration of the six desktop desks or general autonomous development.

Model calls: **0**. Input/output tokens: **0**. Model charges for these jobs: **0**. Hosting cost is unavailable and remains separate within the existing preview pilot; no higher allowance was created. No customer data, provider activation, rule admission or production website change occurred.

A third manual invocation at 08:05:59 UTC found no new source job and returned the already saved customer memo with `already_submitted`, `model_called=false` and `model_eligible=false`. Both source artifacts remain unchanged at review; there was no additional source retrieval. This confirms the idle path preserves the existing worker behavior.

## Inventories and supervisor disposition

The [M04 inventory](../moat/HQ-M04/drafts/INVENTORY.md) retains five PDFs and four metadata snapshots locally; [M05](../moat/HQ-M05/INVENTORY.md) retains eight PDFs and four metadata snapshots, with one Arabic regulation explicitly unretained. Both independent artifact audits passed against exact producer hashes. The original room saved both tasks at **review**, with self-contained packets and confirmed receipts `source-inventory-49-20260921` / `source-inventory-50-20260921`. The larger obligation/constraint deliverables remain incomplete.

Supervisor disposition: accept the bounded inventories and honest cloud run records as reviewable evidence of retrieval/provenance. Keep source applicability, complete amendments, translation/reuse permissions and qualified domain review open. The failed cloud sources are available in the reviewed local inventories but have no successful cloud-custody claim. The two successfully stored originals do not establish durable custody for the entire 21-object local inventory.

Task #48's expired claim was reconciled with a fresh per-task claim and read back as **blocked**, preserving the prior UN official PDF403 and zero retained source bytes. Receipt `source-un-reconcile-20260921` was confirmed. No source research was repeated or fabricated to repair the status.

## Verification

- Independent technical review: [PASS](SOURCE_COLLECTION_REVIEW_20260921.md), with exact runtime/migration/test hashes. All four initial findings fixed.
- Runtime/worker tests: 19 passed, covering endpoint/DNS/TLS-host/redirect/encoding/size/deadline boundaries and existing provider limits.
- Isolated PostgreSQL: nine groups passed, including direct null constraints, concurrent revocation, exhausted/near-expiry recovery, wrong lease/manifest, immutable bytes, rollback, replay and restricted summary access.
- Actual cloud job metadata, source digests and deployment details: [run record](SOURCE_COLLECTION_RUN_20260921.json).
- Separate operator review covers safe credential errors and atomic migration journaling. Preview migration0011 was verified; Trace migration0010 was not promoted by this work.

The next retrieval step is a separately versioned, bounded recovery job for the failed ADB/UAE downloads after inspecting the permitted official access path. A partial artifact must remain immutable. The next product milestone is an explicitly scoped hosted synthetic Trace verification, with the gaps in [pilot readiness](../../trace/PILOT_READINESS_2026-09-21.md) resolved before customer-document intake.
