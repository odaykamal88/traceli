# Atomic Trace and recipient sharing experiment

## Artifact boundary

A Trace is a versioned, scoped explanation of one transaction or decision against a stated obligation, supported by inspectable evidence and honest gaps. It is not a generic chat transcript, a compliance certificate, or an ERP replacement.

Required fields:

| Group | Fields and constraints |
|---|---|
| Identity | trace_id, version, organization_id, case/procurement_id, transaction external system + reference, title, classification, fictional/sanitized flag |
| Conclusion | claim_id, text, finding/inference/unknown label, status, evidence_link_ids, author/reviewer; unresolved evidence never becomes a compliant conclusion |
| Obligation/rule | source document/version, exact paragraph/page, applicable dates, jurisdiction/context where relevant; human confirms applicability |
| Approval | named role/person where authorized, decision, timestamp, evidence reference; distinguish absent record from absent approval |
| Supporting evidence | source_id, immutable version/hash, custody status, exact locator, redacted excerpt, link to authorized source; stored reference is not byte verification |
| Missing evidence | requested item, why needed, responsible owner, due date or unknown, status; request does not prove misconduct |
| Exceptions | unresolved question/conflict, impact, owner, resolution criteria, decision/event reference |
| Provenance | prepared_at, evidence_as_of, reviewed_at, source_checked_at, content hash/version, creator, method/version and limitations |
| Sharing envelope | recipient scope, allowed actions, expires_at, revocation, redaction version, access-log reference; server enforced before real sharing |

States: draft → review → approved_for_scoped_share → expired/revoked/superseded. Approval does not make evidence true forever. Source correction reopens the Trace and invalidates affected sharing approvals. Frozen exported versions carry as-of time and limitations.

## Recipient experience

Open with the source-linked conclusion and evidence-as-of date, then obligation → approval → supporting evidence → missing evidence → unresolved exceptions. Show who reviewed what and what is still unknown. A recipient can inspect a permitted source, ask for missing evidence, comment on a claim, see resolution history and initiate “Trace another transaction.” Never imply an invitation exposes the whole case room or organization.

For real sharing: authenticated named recipient by default; deny any recipient not in the grant scope. If a token link is later allowed, bind it to recipient/resource/version/action and expiry, store a token hash, enforce revocation on every request and prohibit indexable public buckets. Redaction must be materialized in the returned payload, search snippets, previews and exports—not hidden by CSS. Every evidence fetch/export is authorized separately. Log access attempts and redacted event metadata. Revoke downstream signed URLs quickly. Downloaded files cannot be recalled; disclose this when granting export.

Comments and evidence requests have author, claim/gap ID, text/classification, timestamp and status. Suggested resolution attaches new evidence and named reviewer determination. Agents cannot close a missing item merely because a comment arrived. Preserve the old state/event and link the superseding evidence. Export includes version, source manifest, gaps, approvals, provenance and redactions; include source bytes only if custody and recipient permission allow them.

## First test in existing discovery

Use fictional FIC-TRACE-001, explicitly labeled on screen and export. No customer files needed. Ask: “If Trace-li gave you this after every procurement review, who would you send it to next?” Follow with why that role needs it, what must be removed, what they would check, what channel is acceptable and whether they will take a concrete next step.

Capture: conversation reference/consent, buyer role, recent real task, recipient role, reason, exact objection, requested redaction, stated intent, observed action and dated next step. Unknown remains unknown. Supervisor may accept a narrower test result; production work requires relevant evidence, not a fixed arbitrary conversion threshold. Initial learning target: three authorized discovery observations across at least two roles; use existing calls, do not postpone commercial next steps to fill a sample quota.

Falsification: buyer cannot name a downstream user, evidence view does not answer their task, or acceptable sharing boundaries make forwarding impractical. On that evidence, revise the artifact/workflow before integrations. A named recipient is useful learning; it is not an observed share or willingness to pay.

## Minimal build sequence and acceptance

Trace schema and fictional fixture → readable artifact → recipient view → sharing threat model/authorization → request/comment/review resolution → recipient starts new Trace → export → customer-selected integrations → reusable institutional rules/evidence. Secure sharing must pass denied/expired/revoked/wrong-recipient/redaction-leak checks before real content enters it. Do not build every production feature before testing the fictional view.
