# Traceli pilot implementation plan

Updated: 24 August 2026

## The product we are building

Traceli is not another tender portal and not an AI scoring feature. It is the permissioned assurance layer that preserves the governing rules, criteria, evidence, human decisions, exceptions, approvals, and chronology behind an award.

The initial product promise is deliberately narrow:

> Open an award and answer “why did this supplier win?” with every claim linked to the exact source, actor, and event that supports it.

That answer is the hook. The durable product is the procurement control graph and decision record that accumulate while work happens.

## The 90-second pilot journey

1. Open an award and see the plain-language conclusion.
2. Open one requirement and the cited tender clause.
3. Inspect the supplier passage Traceli found—or the evidence it could not find.
4. Attach a clarification and watch readiness update without losing the original gap.
5. Record human approvals and lock the decision.
6. Open the audit event and inspect its source snapshot and integrity link.

If this journey is not obvious without explanation, we simplify it before adding another feature.

## What exists now

| Capability | Current state | Honest boundary |
| --- | --- | --- |
| Public story | Complete | Static, fictional DIHAD scenario |
| Protected workspace route | Complete | WorkOS staging AuthKit; production credentials not provisioned |
| Identity roles | Configured in WorkOS staging | App-level permission enforcement is Sprint 1 |
| Decision workflow | Interactive demo | State is browser-local, not persisted |
| Source and actor chronology | Interactive demo | Sources are fictional fixtures |
| Event integrity | SHA-256 chain calculated and verified | Browser demonstration; server-side signing and durable storage are Sprint 1 |
| Type/build safety | Complete | Strict type-check and Next.js production build pass |

### WorkOS staging access model

| Role | Permissions |
| --- | --- |
| Procurement Officer | Read and manage procurements; review submissions |
| Panel Member | Read procurements; review submissions |
| Procurement Director | Officer access; approve decisions; export audit records |
| Auditor | Read procurements; export audit records |
| Workspace Admin | All pilot permissions; administer workspace |

The default `Member` and `Admin` roles remain untouched. Pilot users must be assigned one of the Traceli roles before production authorization relies on them.

## Execution sequence

### Sprint 0 — credible conversation baseline (complete)

Outcome: a prospect can understand the promise in ten seconds and interrogate the core claim in ninety.

- Keep the public page free of login friction.
- Put the operational workspace behind WorkOS.
- Preserve a portable fictional scenario for meetings without connectivity or credentials.
- Demonstrate the golden thread from rule to evidence to human decision to audit event.
- Demonstrate a tamper-evident event chain.

Exit gate: public story, protected route, audit interaction, strict types, and production build all pass.

### Sprint 1 — tenant-safe data spine

Outcome: the demo becomes a persistent multi-tenant pilot without yet ingesting sensitive bid files.

- Add Postgres with organization-scoped tables and row-level tenant assertions.
- Store `organization_id` on every procurement, source, requirement, submission, decision, and event.
- Enforce WorkOS permissions in server actions and route handlers—not only in the UI.
- Replace mutable browser state with server-owned commands and append-only audit events.
- Calculate event hashes on the server; sign locked decision roots with a managed key.
- Add idempotency keys, optimistic concurrency, and a transactional outbox.
- Add request, authorization, and audit-log tests for cross-tenant denial.

Exit gate: two seeded organizations cannot read, mutate, search, or export each other’s data, including by guessed IDs.

### Sprint 2 — secure document room and NDA boundary

Outcome: a pilot team can share controlled procurement documents without weakening its confidentiality posture.

- Store files in private object storage with organization-prefixed keys and short-lived signed URLs.
- Encrypt in transit and at rest; support a tenant-specific key-encryption-key option for stricter buyers.
- Scan uploads for malware before extraction and quarantine failures.
- Preserve file hash, MIME type, uploader, access policy, version, and retention class.
- Add NDA/terms acceptance before external supplier access and record the accepted version and timestamp.
- Disable provider training and cross-tenant retrieval by contract and configuration.
- Add retention, legal hold, export, and defensible deletion workflows.
- Redact secrets and document contents from logs, traces, analytics, and error reporting.

Exit gate: threat-model review passes for unauthorized download, guessed URLs, malicious files, log leakage, and deletion/hold conflicts.

### Sprint 3 — source-grounded tender drafting

Outcome: Traceli infers a first tender structure from approved institutional knowledge without inventing policy.

- Connect an approved knowledge pack: policy, donor conditions, templates, and selected precedents.
- Extract obligations with page/section citations and version metadata.
- Generate requirements, criteria, and matrix drafts as structured data.
- Require named human confirmation before publishing criteria or changing a locked matrix.
- Route tasks through a model gateway so models remain replaceable.
- Persist prompt version, model route, cited inputs, structured result, evaluation score, cost, and reviewer resolution.
- Add a second-model challenge only for high-risk policy interpretation or unsupported claims.

Exit gate: every generated clause opens its approved sources; unsupported claims are blocked or visibly unresolved.

### Sprint 4 — submissions and clarification loop

Outcome: evaluators can see who is coming through, where evidence is missing, and how a gap was resolved.

- Ingest supplier submissions from the secure room and selected portal exports.
- Map passages and attachments to pre-locked requirements.
- Keep “not found,” “ambiguous,” and “human confirmed” distinct.
- Provide reviewer comments, assignments, conflicts, and supplier Q&A in one trace.
- Capture business-identity and potential-collusion signals as review leads, never autonomous exclusion decisions.
- Record every clarification request, response, attachment, determination, and timestamp.

Exit gate: a reviewer can resolve one evidence gap end to end, and an auditor can reconstruct both the original gap and the human resolution.

### Sprint 5 — approvals, locked record, and audit export

Outcome: the complete decision can be defended without rebuilding it from email and folders.

- Gate lock on required evidence, declarations, reviewer sign-offs, and approved exceptions.
- Seal a canonical decision manifest and event-chain root.
- Produce a human-readable PDF and machine-readable JSON package.
- Include source versions, criteria lock time, findings, reviewer identities, conflicts, clarifications, approvals, and integrity verification.
- Stream administrative events to WorkOS Audit Logs or the buyer’s SIEM.
- Add break-glass access with explicit reason, expiry, and audit visibility.

Exit gate: an independent reviewer can answer why the supplier won using only the export and its linked evidence package.

### Sprint 6 — ERP and tender-portal boundary

Outcome: Traceli complements systems of record rather than trying to replace them.

- Start with CSV/SFTP and a documented REST adapter for the first pilot’s actual system.
- Pull procurement header, supplier, budget, and status identifiers into Traceli.
- Push readiness, approval reference, award decision reference, and audit-package URI back out.
- Keep large documents in the secure document layer; synchronize metadata and durable identifiers.
- Add retries, idempotency, dead-letter review, reconciliation, and connector health.
- Build SAP Ariba, Oracle, Dynamics, Coupa, or UN portal adapters only after a signed pilot identifies the first real target.

Exit gate: one pilot procurement moves from source system to Traceli and back without duplicate awards or silent sync failure.

## Security rules that are product behavior

- Authorization is checked on the server for every read, write, search, export, and generated URL.
- A retrieved passage inherits the document’s access boundary; citations do not bypass permissions.
- Model providers receive the minimum required text, not the full workspace by default.
- Supplier documents are untrusted inputs and cannot issue tool instructions or alter policy.
- Traceli surfaces evidence and risk signals; named humans retain compliance and award decisions.
- Locked records are append-only. Corrections create a linked superseding event rather than rewriting history.
- No production buyer data enters a staging environment.

## First pilot definition

Choose one organization, one procurement category, and one completed or low-risk live tender. Limit scope to:

- one approved policy pack;
- one tender and matrix;
- three to five submissions;
- two to four reviewers;
- one clarification;
- one decision record and audit export.

Success measures:

- time to locate evidence for a sampled requirement;
- percentage of findings with an accepted citation;
- time to produce the audit pack;
- number of missing approvals or declarations caught before award;
- reviewer agreement after examining Traceli’s source link;
- prospect can explain the product back as “the proof behind the award.”

## What we deliberately defer

- Autonomous bid scoring or award recommendation.
- A general-purpose supplier marketplace.
- Broad ERP coverage before the first paid pilot.
- Custom model training on buyer documents.
- Continuous web investigations presented as facts without human verification.
- Replacing the buyer’s tender portal, ERP, document repository, or SIEM.

This sequencing protects the moat: the accumulating control graph, source permissions, verified evidence links, human resolutions, and decision chronology—not allegiance to any single frontier model.
