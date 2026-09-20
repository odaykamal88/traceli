# A · Product sharing / usage = sharing

State: active queue (does not imply running workers). Owner: Product Steward / product.

## Objective

Test an atomic Trace inside existing discovery.

## Handoffs and review

A01 → A02 → A03. Product scopes; Builder prototypes; Listener records observed feedback; Auditor checks evidence and permissions.

## Constraints

Do not build live sharing until the sanitized test has evidence. Secure access is a release gate, not an assumed prototype capability.

## Work queue

### HQ-A01 · Define the atomic Trace and a sanitized sharing test

Owner: Product Steward. Initial status: ready. Authority: Green. Output: `specs/TRACE_AND_SHARING.md`.

Dependencies: none. SLA: 45 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Explicit conclusion, rule, approvals, evidence, gaps, exceptions and provenance
- Recipient access/expiry/redaction/log requirements distinguish prototype from implementation
- Preserve discovery and define observable sharing test

### HQ-A02 · Build a fictional recipient Trace for discovery

Owner: Builder. Initial status: blocked. Authority: Green. Output: `artifacts/sanitized-trace`.

Dependencies: HQ-A01. SLA: 60 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Fictional label remains on view/export
- Each conclusion opens its exact supporting evidence or displays unknown
- CTA and missing-evidence interaction can be tested locally

### HQ-A03 · Run the sharing question during an authorized existing discovery conversation

Owner: Listener. Initial status: blocked. Authority: Red. Output: `artifacts/sharing-observation`.

Dependencies: HQ-A02, HQ-F01. SLA: 45 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Record recipient role, reason, redaction objection and next action
- Separate stated intent from observed forwarding
- Conversation access and contact explicitly authorized

Runtime status and evidence live in [jobs.json](../data/jobs.json). Charter limits override broader job defaults.

## 20 September moat increment

See [the mapped moat packages](../moat/DISPATCH_2026-09-20.md) for actual source task IDs, eligible phases, U/M/G batches and Jev readiness. Existing work and review states are preserved.
