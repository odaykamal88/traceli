# How Trace-li works

Internal canonical-copy candidate · HQ-B01 · Distribution / Editor · v1 · 14 September 2026

**Review state:** submitted for independent Auditor and Supervisor review. External action is not authorized. This draft does not replace the approved brand or messaging documents until Librarian promotion is approved.

## Proposed explainer

**Your ERP records what happened. Trace-li makes it provable.**

Trace-li is being built to give procurement and assurance teams a source-linked explanation of a decision: what rule applied, which evidence supports the conclusion, who reviewed it, what was approved and what remains unresolved.

Your SAP, Oracle or other ERP remains the system of record for the transactions it holds. Your procurement system continues to run its part of the process. Trace-li is designed to connect the transaction to the rules, procurement records, approvals and supporting documents that explain it. Where relevant, the record would also link evidence of delivery or other outcomes. A transaction entry alone does not establish that every required obligation was met.

The immediate focus is donor-funded procurement. Start with one completed tender and one question: can someone follow why this award was made from the evidence available?

### One decision, one Trace

A **Trace** is the proposed reviewable record of one transaction or consequential decision. It carries a source-linked conclusion together with the evidence and limits behind that conclusion. A useful Trace lets another authorized person inspect the reasoning without treating missing information as settled.

The intended record contains:

1. **The conclusion and its scope.** What question is being answered, which transaction or decision it concerns, and whether the answer is supported, partial, disputed or unresolved.
2. **The obligation or rule.** The requirement, applicable version and exact source location. Its applicability to this decision is recorded separately from the fact that the rule exists.
3. **The evidence.** Documents and records supporting each material claim, with exact locations and available provenance. A reference that has only been matched to stored metadata is labelled accordingly.
4. **The human decision.** Reviewer judgment, required approvals and the approval state. A draft approval is shown as a draft.
5. **The open work.** Missing evidence, unresolved exceptions, accountable owners and the next action. An unanswered question remains visible.
6. **The history.** Relevant event times, authors, source versions and the time of the latest review. A later correction should be traceable to the version it changes.

For a procurement award, this can form a unit within the existing **Traceli Award Assurance Pack**: the broader record of the rules, evidence, judgments, exceptions, approvals and chronology behind an award. This relationship is a proposed product definition. It preserves the current commercial offer while making the shareable unit explicit.

### The intended proof path

An authorized team selects a completed transaction and its supporting records. The review establishes the governing obligations, connects each material conclusion to its evidence, and records where a source or approval is missing. The responsible people assess the gaps and make any decision within their own authority.

The resulting Trace is designed to travel with that work. A procurement reviewer could use it to ask a budget owner for a missing approval, or provide an assurance colleague with the explanation behind a decision. These are intended use cases, not observed customer results.

The planned recipient view would show only the approved scope, including the conclusion, relevant evidence and unresolved questions. Access, expiry, redaction and access records must be enforced before this experience handles real procurement data. Recipients would be able to request missing evidence, comment or ask for an exception to be resolved within their permissions. The proposed follow-on action is **“Trace another transaction.”** Sharing the first Trace would never itself grant permission to see another transaction.

### What can be demonstrated now

The current local proof can read one fictional procurement record with its requirements, findings, stored citation references and human decision state. It can check whether a supplied citation exactly matches a reference available to the authorized viewer in that fixture. It cannot approve, award, lock a decision or resolve a finding.

The fixture does not persist the original source-file bytes or supplier submissions. Its citation check confirms a stored reference, not the truth of a claim or the integrity of an original document. The saved example still has missing evidence and an unlocked draft decision.

The complete Trace and secure recipient experience described above remain intended capability. This draft does not establish a live SAP or Oracle connector, a production document-ingestion path, a buyer-agent integration or a portable sealed evidence pack. Demonstrations should use fictional or approved sanitized material and identify staged behavior visibly. No sensitive files should move before the agreed data and security gates.

Trace-li supports the people responsible for the decision. It does not certify legal or donor compliance, replace independent audit, decide the award or guarantee an audit outcome.

### The first useful test

Use a fictional or properly sanitized Trace to ask a procurement or assurance practitioner:

> If Trace-li gave you this after every procurement review, who would you send it to next?

Record the recipient role, the work that sending it would accomplish, what must be removed, what is still missing and the actual next step. A person saying they would forward it is a hypothesis about distribution. An observed, authorized forward is a different event.

For a qualified commercial conversation, retain the existing action: **Test one completed tender.** The scoped paid pilot remains subject to Oday's approval of the actual offer, terms and data route. “Trace another transaction” is a proposed recipient action, not a change to the existing sales CTA.

## Reusable short copy

**Thirty seconds, with availability boundary:**

> Your ERP records what happened. Trace-li makes it provable. We are building a source-linked record of the rule, evidence, human judgment and approval behind a procurement decision, including what is still missing. SAP, Oracle or your existing ERP stays the transaction system of record. Our current demonstration uses fictional records. The next step is to test one completed tender within an agreed scope and data boundary.

**Product example label:**

> Illustrative Trace. Fictional data. Sharing, document ingestion and recipient actions shown here are proposed behavior unless explicitly marked as verified in this demonstration.

**Recipient concept CTA:**

> Trace another transaction

Supporting concept text: “Start a separate request. Access to this Trace does not grant access to other records.” Do not display a working upload or sharing promise until the actual path and controls have been verified.

## Editorial packet and provenance

| Field | Value |
|---|---|
| Job / mandate / artifact | HQ-B01 / distribution / HQ-B01-EXPLAINER |
| Version / classification / produced | 1 / internal / 2026-09-14 |
| Audience | Procurement, assurance, finance and programme owners reviewing donor-funded awards |
| Hook | Your ERP records what happened. Trace-li makes it provable. |
| Broken chain | A transaction, the rule governing it and the evidence supporting the decision may be recorded separately. This is the product problem being tested, not a prevalence estimate. |
| Reconstruction | Proposed Trace fields connect conclusion, obligation, source evidence, judgment, approvals and open questions. |
| Consequence | A reviewer needs enough evidence to assess the decision. No case-specific loss, delay or avoided harm is claimed. |
| Takeaway | Test whether one useful record helps the next authorized person inspect and advance the work. |
| Primary CTA | Test one completed tender. The distinct recipient concept CTA is Trace another transaction. |
| Claim IDs | B-01 through B-08 below |
| Assumptions | A Trace can be a unit within the Award Assurance Pack. Sharing through useful work is an untested distribution hypothesis. |
| Known gaps | No live capability verification was performed in this editorial job. Sharing behavior, customer response and commercial conversion evidence are unavailable. |
| Review status / next owner | review / Risk Auditor, then Supervisor; Librarian receives only the accepted promotion proposal |
| External action | not_authorized |
| Body | Proposed explainer and reusable short copy above |

### Claim-to-source map

All local sources below were read on 14 September 2026. Documentation is evidence of the recorded scope and boundaries, not independent proof of a live deployment.

| Claim ID | Claim and kind | Source and exact location | Limitation / review requirement |
|---|---|---|---|
| B-01 | Exact core line and ERP boundary. Requirement. | Oday's current HQ brief, workstream B, supplied in the active conversation. | Use the core line with the adjacent development-stage explanation. It is a positioning promise, not a completeness guarantee. |
| B-02 | Current category, human-review boundary and Award Assurance Pack. Artifact. | [BRAND_SYSTEM.md](../../BRAND_SYSTEM.md), “Category and promise”; [GTM_MESSAGING.md](../../GTM_MESSAGING.md), “FAQ copy”. | Preserve category and current offer. Do not convert desired outcomes into measured benefits. |
| B-03 | Trace contents, recipient controls and next-Trace CTA. Requirement. | Oday's HQ brief, workstreams A and E. | Intended capability. Field definition requires Product Steward review. |
| B-04 | Trace as a unit within the existing pack. Editorial proposal. | B-02 plus B-03. | Inference proposed by this draft. Supervisor/Product Steward must approve the relationship before canonical promotion. |
| B-05 | Local read-only fictional-record proof and exact reference check. Artifact. | [AGENT_READ_CONTRACT.md](../../AGENT_READ_CONTRACT.md), “Availability”, “Contract” and “What the record establishes”. | Docs describe a fixture, not a remote integration. No tests were rerun for this writing job. |
| B-06 | Source bytes absent, stored-reference-only verification, draft decision and no mutation. Artifact. | [AGENT_READ_CONTRACT.md](../../AGENT_READ_CONTRACT.md), “What the record establishes” and “Verification and outstanding gates”. | Cannot establish source-content integrity, compliance, buyer adoption or an audit outcome. |
| B-07 | Staged demo, ingestion and export boundaries. Artifact. | [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md), “Tender-to-proof video”, public-security boundary, “Pilot Slice B”; [BRAND_SYSTEM.md](../../BRAND_SYSTEM.md), “Demonstration and evidence rules”. | Recheck against an exact candidate before any public product claim. No claim about live production readiness. |
| B-08 | Preserve completed-tender CTA and company publishing. Artifact / requirement. | [GTM_MESSAGING.md](../../GTM_MESSAGING.md), “Follow-up email for DIHAD contacts”; [COMPANY_LED_GTM_OPERATING_MODEL.md](../../COMPANY_LED_GTM_OPERATING_MODEL.md), “Channel decision”; [Agent Constitution](../AGENT_CONSTITUTION.md), “Evidence and commercial discipline”. | No offer, send, publication, customer-data processing or founder-profile activity is authorized by this draft. |

## Review and handoff

Auditor should check the short versions independently of the full explainer, because they must carry their own availability caveat. Check B-05/B-06 against the read contract and reject any edit that turns a stored-reference check into document or claim verification. Product Steward should confirm the Trace/Pack relationship and intended recipient behavior. Supervisor accepts or returns a specific revision. Librarian may then propose a controlled change to canonical messaging.

Publication requires a separate Oday-approved exact version, channel, audience and timing, plus the applicable product and claim gates. Nothing in this file records approval to publish. Stop the draft if product truth becomes disputed or evidence needed for a stronger claim is absent. Remove the unsupported claim or send it back to its source owner.
