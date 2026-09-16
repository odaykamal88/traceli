# B · How Trace-li works

State: active queue (does not imply running workers). Owner: Editor / distribution.

## Objective

Make the ERP boundary and source-linked value easy to understand.

## Handoffs and review

Editor drafts; Auditor checks product truth; Supervisor accepts canonical internal copy; Oday approves publication.

## Constraints

Use the exact core line while labeling intended versus available functionality.

## Work queue

### HQ-B01 · Draft the canonical How Trace-li works explainer

Owner: Editor. Initial status: ready. Authority: Green. Output: `artifacts/HOW_TRACE_LI_WORKS.md`.

Dependencies: none. SLA: 45 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Use exact core message and ERP boundary
- Distinguish current prototype from intended capability
- No invented customer or compliance outcomes

### HQ-B02 · Review the canonical explainer against product truth

Owner: Auditor. Initial status: blocked. Authority: Green. Output: `reviews/explainer-review.md`.

Dependencies: HQ-B01. SLA: 45 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- All capability claims have scope and evidence
- Reject unsupported claims
- Return pass/revise/reject with actionable findings

Runtime status and evidence live in [jobs.json](../data/jobs.json). Charter limits override broader job defaults.
