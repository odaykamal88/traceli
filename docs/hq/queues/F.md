# F · Customer-development Operating Room

State: active queue (does not imply running workers). Owner: Listener / customer-evidence.

## Objective

Keep actual commercial progress, evidence and next steps visible.

## Handoffs and review

Oday supplies/authorizes scoped records → Listener reconciles IDs → Supervisor reviews → Product receives redacted evidence.

## Constraints

Original room task metadata and receipts are connected; see [current handoff](../RUNTIME_HANDOFF.md). Actual send/reply/conversation evidence is still needed for buyer metrics. Preserve the existing Week 4 task IDs and do not fabricate or duplicate records.

## Work queue

### HQ-F01 · Reconcile the existing customer-development Operating Room

Owner: Listener. Initial status: blocked. Authority: Red. Output: `artifacts/OPERATING_ROOM_IMPORT.md`.

Dependencies: none. SLA: 45 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Import existing IDs with source timestamps and no duplicate events
- Separate actual sends/replies/conversations from unknowns
- Every active commercial next step has owner, date and observable done
- Do not import customer records without scope authorization

### HQ-F02 · Prepare the next evidenced commercial action for each active opportunity

Owner: Listener. Initial status: blocked. Authority: Red. Output: `artifacts/commercial-next-steps`.

Dependencies: HQ-F01. SLA: 45 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Use only actual records
- Unknown or silence is not validation
- Exact action/recipient/date and supporting evidence for Oday approval

Runtime status and evidence live in [jobs.json](../data/jobs.json). Charter limits override broader job defaults.
