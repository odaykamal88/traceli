# Traceli staged architecture and pilot roadmap

Updated: 27 August 2026

For the current deployed-state architecture, technology stack, trust boundaries, and IT security review, see [SOLUTION_ARCHITECTURE.md](./SOLUTION_ARCHITECTURE.md).

The September 2026 engineering spine for Platform Core, Field Registry, and the Rule Library is [eng/spine-p0-p1-p3.md](./eng/spine-p0-p1-p3.md). Field Registry v1, including freeze-at-judgment, is [eng/field-registry-v1.md](./eng/field-registry-v1.md).

## Executive decision

Traceli should remain a **modular monolith through its first paid pilots**: one Next.js application, one relational source of truth, one secure document boundary, and one shared domain-policy layer used by the UI, integrations, and eventually MCP.

The next milestone is not “more AI” or “more enterprise integrations.” It is a trustworthy data spine that can prove, for every award claim:

> which rule applied, which source supported it, who made the judgment, what changed, and who approved the outcome.

Build hard boundaries in this order:

1. Separate the fictional public demo from the fail-closed application.
2. Make organization, permission, resource assignment, and decision state enforceable on the server.
3. Persist the procurement control graph and audit events transactionally.
4. Add a quarantined, encrypted document pipeline before accepting buyer files.
5. Add grounded AI as an assistive worker with citations and human gates.
6. Add live submissions, clarifications, approvals, and export.
7. Add MCP and ERP adapters over the same domain services—not as parallel products.
8. Add autonomous operations as a bounded assurance plane—not as a privileged general agent.

This preserves the simple “proof behind the award” experience while the operational assurance grows underneath it.

## Current-state diagnostic

| Area | What exists now | Assessment | Required next boundary |
| --- | --- | --- | --- |
| Product promise | Clear public story, a 44-second proof film and a deeper guided workspace journey | Strong core, conversion hierarchy needs field validation | Keep the promise left, make the completed-tender pilot the dominant action, and validate that buyers repeat the promise back in their own language |
| Frontend | Next.js 16, React 19, Tailwind; polished public page and interactive workspace | Right platform, demo architecture | Refine the public composition without changing the promise; break the large client workbench into domain slices as each one gains real data |
| Public proof and docs | Fictional interactive demo; no structured public docs or recorded tender walkthrough | Safe but incomplete for self-serve evaluation | Add a truthful team-experience strip, three outcome modules, an illustrative public/sanitized tender walkthrough, and availability-labelled docs |
| Identity | WorkOS AuthKit integration; staging organization, roles, and permissions configured | Good foundation | Provision production separately; require an organization and a Traceli role for all real-data routes |
| Access control | `/workspace` now requires WorkOS, a Traceli role, a provisioned organization, and tenant-scoped server access | First resource boundary working | Apply the same organization/resource check to approvals, lock, export, files, and future tools |
| Data | Non-production Lakebase Postgres control graph; one fictional award and finding persist behind a server-only DAL | First vertical slice | Add idempotency and migrate the remaining visible workflow commands one at a time |
| Documents | No upload or storage pipeline | Correctly deferred | Private object storage, quarantine, malware scan, version/hash metadata, controlled download, retention and hold |
| Audit integrity | Browser demonstration plus server hash-linked events and transactional outbox for the first finding command | Durable chronology begun, not yet a sealed decision record | Move approvals/lock server-side and sign sealed decision roots with a managed key |
| AI | No production model path | Healthy at this stage | Task-specific model gateway, grounded inputs, structured outputs, invocation ledger, evaluations, and human confirmation |
| Background work | No queue or durable workflow | Missing before ingestion | Durable, idempotent upload/extraction/indexing jobs; keep canonical job and domain state in Postgres |
| Autonomous operations | Deterministic CI/security gates and a scheduled external production smoke probe; no normalized operations ledger or supervisory brief | Baseline signals are in place | Persist normalized findings next, then add bounded task workers and a read-only supervisor |
| Integrations | No ERP, tender portal, SIEM, or MCP implementation | Appropriate | Add adapters only after the core service boundary exists and a design partner identifies the first actual system |
| Testing and operations | Type/build, migration, secret, dependency, two-tenant denial, append-only audit, and scheduled production smoke checks | Adequate for the first sandbox slice, insufficient for buyer files | Expand command/invariant tests, add file threat tests, backup/restore exercise, E2E pilot journey, and dependency-aware production monitoring |
| Environments | Vercel production currently serves the marketing site and fictional demo; it has no WorkOS variables, and WorkOS production is empty | Safe for interviews, not buyer data | Provision isolated staging/production data and credentials before onboarding; never silently downgrade a protected environment to demo mode |

### What is already strategically correct

- The product is an assurance layer, not another supplier marketplace or procurement portal.
- The visible hook is an answer, not a dashboard: “Why did this supplier win?”
- The durable asset is the linked control graph—rules, versions, criteria, evidence, judgments, exceptions, approvals, and chronology—not any one model’s prose.
- WorkOS is a sensible identity and enterprise-onboarding dependency, while Traceli retains responsibility for resource-level authorization and procurement decisions.
- Model independence is useful leverage, provided every invocation remains reproducible and reviewable.

## Target architecture through paid pilots

```text
 Public demo          Buyer workspace       Supplier/auditor views       MCP clients later
     |                       |                         |                         |
     +-----------------------+-------------------------+-------------------------+
                                     |
                      Next.js application / BFF on Vercel
               Server Components | Actions | Route Handlers | Webhooks
                                     |
                  Server-only domain services and policy engine
                tenant + permission + assignment + workflow-state checks
                  /                  |                   \
         Managed Postgres       Secure object store      Durable workflows
       control graph + audit    originals + versions    scan/extract/index/export
          + outbox state         quarantine + KMS             |
                  \                  |                   AI/OCR adapters
                   +-----------------+-------------------AI Gateway/providers
                                     |
                        Outbox adapters and observability
                    ERP/portals | SIEM | email | webhooks
```

### Application boundary

Keep one deployable application, but enforce internal modules:

- `identity`: WorkOS session, organization, membership, role, permission;
- `policy`: tenant, permission, resource assignment, supplier boundary, decision-state and break-glass rules;
- `procurement`: tender, requirement, criterion, matrix and lifecycle commands;
- `evidence`: source versions, submission passages, findings and citations;
- `collaboration`: clarification, comments, conflicts and reviewer assignments;
- `decision`: approvals, exceptions, award record, sealing and supersession;
- `audit`: append-only events, canonical manifests, signing and export;
- `documents`, `ai`, `workflows`, and `integrations`: replaceable infrastructure adapters.

The UI, route handlers, MCP tools, and ERP connectors must call these same modules. None should contain a second set of award or authorization rules.

### Frontend

- Continue with Next.js App Router and React. Server Components should load permission-filtered read models; small Client Components should handle interaction.
- Treat Server Actions and Route Handlers as public endpoints: validate input, re-authenticate, authorize, and verify object ownership inside each one.
- Keep the ten-second public page and 90-second workspace journey. Add complexity through progressive disclosure, not additional landing dashboards.
- Keep public marketing assets outside the sensitive-document boundary. A cached public or irreversibly sanitized tender pack and its recorded walkthrough may use public asset hosting; buyer tender files may not.
- Public documentation must distinguish `Available`, `Private alpha`, and `Planned`. Documentation is not permission to expose an unfinished MCP server, connector, or document route.
- Put the reusable fictional scenario at `/demo` or behind an explicit `DEMO_MODE`; the authenticated application must never fall back to it in production.

### Canonical data layer

Use managed Postgres as the source of truth. Neon is a practical first provider; standard Postgres, migration-controlled schemas, and an adapter-friendly data layer preserve an exit path to RDS/Aurora or a customer-specific deployment.

Minimum core records:

| Group | Records |
| --- | --- |
| Tenancy | organizations, users/membership mirrors, assignments, access exceptions |
| Procurement | procurements, source documents and versions, requirements, criteria and matrix versions |
| Evaluation | suppliers, submissions, submission versions, evidence findings, citations, reviewer judgments |
| Collaboration | clarifications, responses, comments, conflict declarations, tasks |
| Decision | exceptions, approvals, decisions, decision manifests and supersessions |
| Assurance | audit events, model invocations, exports, access events, outbox jobs, integration cursors |

Non-negotiable invariants:

- `organization_id` is present on every tenant-owned row and participates in resource constraints.
- The server derives the active organization from the verified session; a browser-supplied organization ID is never trusted.
- Postgres row-level security is defense in depth, not the only authorization layer.
- Published criteria and submission versions are immutable; corrections create linked versions.
- State change, audit event, and outbox message commit in one database transaction.
- Commands accept idempotency keys and version checks to prevent duplicate or overwritten decisions.
- Embeddings and extracted text are searchable derivatives, never the canonical record.

### Sensitive document boundary

Use private S3-compatible object storage for real procurement files, with AWS S3 preferred for early sensitive pilots because it provides a mature path to KMS keys, object-access events, malware protection, retention controls, and customer-specific regions. Vercel Blob remains acceptable for public/demo assets, but it should not be the default evidence vault merely because the frontend is on Vercel.

The upload state machine should be:

```text
requested -> quarantined -> malware scanned -> hashed -> extracted/OCR -> indexed -> approved for use
                         \-> rejected/isolated
```

- Generate opaque object keys; never expose bucket paths or permanent public URLs.
- Grant short-lived downloads only after a fresh server authorization check.
- Record file hash, size, detected and claimed MIME type, version, uploader, classification, access policy, scan result, retention class and legal-hold state.
- Do not send an unscanned document to OCR, an LLM, a browser previewer, or another integration.
- Apply immutable retention/Object Lock to sealed evidence packages only when policy requires it; working documents still need controlled correction and deletion.

### AI and retrieval

Use AI as an untrusted, replaceable worker inside deterministic procurement controls:

- Define tasks such as `extract_policy_obligations`, `draft_tender_structure`, `map_submission_evidence`, and `challenge_unsupported_finding` with versioned input/output schemas.
- Route through Vercel AI Gateway initially for model/provider choice, failover, usage visibility, allowlists, and zero-data-retention controls; retain a direct-provider adapter for buyers with contractual or regional requirements.
- Persist task version, prompt version, model/provider/route, source IDs and hashes, structured result, latency, token/cost metadata, evaluation result, and human disposition.
- Retrieve only from sources the current user and procurement are allowed to access. Every material claim opens the exact source version, page/section, and passage.
- Treat policy packs and supplier submissions as untrusted content that can contain prompt-injection instructions. They cannot grant tools, alter criteria, resolve findings, or approve an award.
- Never use a model output as the sole basis for exclusion, compliance, scoring, or award. A named human owns consequential judgment.

Use Postgres full-text search plus `pgvector` first. A separate vector database is premature until measured corpus size or latency proves the need.

### Durable workflows and integrations

Use a durable workflow runner for upload processing, OCR/extraction, indexing, bulk submission ingestion and export generation. Vercel Workflow is a reasonable first adapter because it supports durable steps, retries and pause/resume, but Traceli should keep workflow state and business invariants in Postgres. That makes the runner replaceable if a later buyer requires a different cloud or Temporal-class orchestration.

Use a transactional outbox for ERP, portal, SIEM and notification delivery. Start with CSV/SFTP or the first design partner’s actual API. Every adapter needs idempotency, retry, reconciliation and a visible failure state.

### Audit and observability

Operational logs and the procurement decision record are different products:

- Operational telemetry diagnoses failures and performance; redact document contents, prompts, tokens, signed URLs and secrets.
- Domain audit events explain actor, action, tenant, resource, previous/current version, reason, source references and time.
- Seal a canonical decision manifest and hash-chain root on lock; sign that root with a managed key such as AWS KMS.
- WorkOS Audit Logs or the buyer’s SIEM may receive administrative events, but neither replaces Traceli’s procurement-specific record.

### Autonomous operations control plane

Operations automation is a separate assurance plane over the application, not another actor inside the procurement decision workflow.

- GitHub owns code events, pull-request gates, static analysis, dependency alerts, and scheduled repository maintenance.
- Independent synthetic probes own outside-in availability. Vercel Cron may trigger authenticated reconciliation work, but it cannot detect a total failure of the platform that invokes it.
- Vercel Workflow is the initial durable executor for multi-step operational and product jobs; Postgres owns canonical run, finding, and domain state.
- Collectors normalize signals into versioned `ops_run` and `ops_finding` records. Deterministic policy assigns severity and notification behavior.
- Specialist agents receive bounded evidence packets and may classify, synthesize, diagnose, or open a pull request. They do not inherit unrestricted production or document access.
- A read-only supervisory agent produces an owner brief from verified findings. It cannot downgrade severity, close incidents, merge, deploy, rotate secrets, change authorization, or alter buyer data.
- Model selection is an evaluated registry of task capability, data policy, price, latency, and reliability. Long conversations and persistent worktrees are not memory; checkpoints, artifact hashes, tests, and stored records are.

The staged design, job catalogue, severity policy, model tiers, CI gates, and rollout are specified in [AUTONOMOUS_OPERATIONS.md](./AUTONOMOUS_OPERATIONS.md).

## Maturity stages and positioning

Recommended gates are commercial and risk gates, not calendar promises.

| Stage | Buyer-facing position | Data allowed | Architecture increment | Exit evidence | Deliberately defer |
| --- | --- | --- | --- | --- | --- |
| **0. Conversation prototype** | “Open an award and see the proof behind it.” | Fictional only | Current frontend; explicit demo boundary | 10–15 buyer/auditor conversations, three credible design-partner candidates, and at least one offer of a completed tender for a shadow exercise | Real uploads, integrations, autonomous scoring |
| **1. Persistent design-partner sandbox** | “Reconstruct an award without rebuilding the story from folders and email.” | Fictional, synthetic, or irreversibly sanitized | Server-only DAL, Postgres schema, organization isolation, server commands/events, authorization and E2E tests | Two seeded organizations remain isolated; one full golden journey survives refresh/export; schema supports a historical tender | Raw buyer documents, supplier access, live award use |
| **2. Secure retrospective pilot** | “A controlled evidence room that produces an audit-ready award explanation.” | A completed tender under NDA and agreed classification | Production WorkOS, secure S3/KMS room, scan/quarantine pipeline, retention and access logs, backups, incident process | Buyer security review passes; historical tender is ingested; sampled claims open accepted source evidence; restore and deletion/hold tests pass | Live procurement, automated award recommendation, broad ERP |
| **3. Assisted live pilot** | “Continuous procurement assurance alongside your existing portal.” | One low-risk live tender | Grounded drafting, locked matrix versions, submissions, clarifications, human approvals, sealed export, durable workflows | Named procurement owner completes one tender; independent reviewer can defend the award from the export; no critical authorization or evidence-custody defects | High-risk categories, autonomous consequential actions, portfolio analytics |
| **4. Repeatable enterprise onboarding** | “The assurance layer across your procurement systems.” | Multiple teams/procurements under tenant policy | SSO/SCIM/Admin Portal, customer security controls, SIEM, connector framework, service objectives; add resource-scoped authorization only if needed | Second organization onboards without bespoke core changes; first production connector reconciles reliably; support and incident runbooks exercised | Connector catalogue built without demand, microservices, multi-region active-active |
| **5. Assurance platform** | “A procurement control graph available wherever teams work.” | Portfolio-wide within explicit policy | Permissioned MCP, ERP/portal adapters, cross-tender controls, continuous exception monitoring, optional dedicated tenancy/keys/region | MCP and connectors increase usage without bypassing controls; recurring portfolio use and expansion revenue | Generic AI agent, unrestricted document search, a replacement for every source system |

### The first pilot should be retrospective before it is live

A completed tender gives Traceli real complexity—documents, evaluation, clarifications, decisions and audit questions—without becoming part of an active award decision on day one. The first live pilot should then run on one low-risk tender, with Traceli assisting and recording while the organization’s existing process remains authoritative.

This is both a safer architecture ramp and a sharper sales progression:

1. **Show:** fictional proof in 90 seconds.
2. **Prove:** reconstruct one completed award under NDA.
3. **Pilot:** accompany one live tender without making the award.
4. **Expand:** integrate into the buyer’s identity and procurement systems.

## External dependency strategy

| Dependency | Use it for | Traceli must still own | Adoption point | Exit or containment |
| --- | --- | --- | --- | --- |
| Vercel / Next.js | Web application, BFF, deployment, edge protection, observability | Domain logic, data, evidence and audit semantics | Now | Keep a standard Next standalone/container path; do not put canonical evidence only in platform-specific state |
| WorkOS | Authentication, organizations, roles, MFA; later SSO, SCIM/Admin Portal and MCP OAuth | Resource ownership, procurement assignments, decision-state rules, break glass and domain audit | Staging now; production at Stage 2 | Mirror stable IDs, react to lifecycle webhooks, and enforce access server-side even if a session contains permissions |
| Managed Postgres | Canonical control graph, transactional audit/outbox, searchable metadata | Schema, invariants, migrations and backups | Stage 1 | Standard SQL and controlled migrations; portable backups; no browser-direct data API |
| AWS S3/KMS/GuardDuty/CloudTrail | Encrypted originals, quarantine, malware and access evidence, optional retention lock | File authorization, metadata, classification, signed-link policy and document lifecycle | Stage 2 | Object-storage adapter and opaque keys; customer-owned bucket or alternate region later |
| Vercel AI Gateway | Provider routing, failover, usage controls, provider allowlists and ZDR routing | Task schemas, source minimization, invocation ledger, evaluation, human resolution and direct-provider option | Stage 3 | Gateway adapter; per-tenant provider policy; no model-specific domain logic |
| Durable workflow runner | Retryable ingestion, extraction, indexing, export and human waits | Canonical job/domain state, idempotency and recovery semantics | Stage 2 | Runner adapter; Postgres remains authoritative |
| GitHub Actions / CodeQL / Dependabot | CI gates, code scanning, dependency monitoring and bounded update pull requests | Test meaning, merge policy, security triage, review and deployment authority | O0 during Stage 1 | Least-privilege workflows, pinned actions, portable scripts, no auto-merge |
| Vercel Cron / external synthetic monitor | Scheduled reconciliation and outside-in availability | Job policy, finding state, incident criteria and recovery evidence | O0 health probe; Cron with O2 | Cron dispatches idempotent work; external probes remain independent of the app host |
| WorkOS Audit Logs / buyer SIEM | Administrative event delivery and external monitoring | Procurement decision record and integrity manifest | Stage 4 or buyer requirement | Transactional outbox and replayable connector |
| MCP clients | Controlled distribution into Codex, Claude, Cursor and other approved clients | Identity binding, authorization, citations, tool policy, audit and human confirmation | Read-only private alpha after Stage 2; not first-pilot critical path | Thin adapter over domain services; client allowlist and kill switch |
| ERP/tender portals | IDs, statuses and metadata exchange | Evidence graph, decision assurance and reconciliation | After the first pilot names the target | CSV/SFTP first; one adapter interface; never speculative connector breadth |

## Pilot onboarding gate

Do not accept identifiable buyer or supplier files until all of the following are true:

### Product and data agreement

- Pilot scope names the organization, procurement, users, files, data classification, regions and authoritative source system.
- NDA, data-processing terms, subprocessors, model-provider policy, retention/deletion, incident notification and pilot exit/export are agreed.
- Buyer and Traceli responsibilities are explicit: Traceli assists and records; named humans remain accountable for compliance and award decisions.

### Technical boundary

- Demo, staging and production have separate credentials and data; production fails closed.
- WorkOS production organization, roles, MFA/SSO policy and offboarding route are configured.
- Tenant isolation is tested on reads, mutations, search, export, files, background jobs and integrations.
- Uploads are private, quarantined, scanned and logged before processing.
- Backups, point-in-time recovery, one restore exercise, retention, hold and deletion are working.
- Audit events and sealed decision exports are generated server-side and independently verifiable.

### Operational assurance

- Threat model covers cross-tenant access, guessed IDs/URLs, malicious files, prompt injection, compromised accounts, support access, model/provider failure and connector replay.
- Logs and analytics are verified not to contain document text, prompts, secrets or signed URLs.
- Incident response, break-glass, vulnerability handling and customer support ownership are documented and exercised.
- Automated tests cover the golden journey and denial paths; an external penetration test occurs before a consequential live pilot.

## Recommended execution from here

### Wave A — protect the prototype boundary (complete)

- Move fictional workspace behavior behind an explicit demo route/mode.
- Make every real application route fail closed when WorkOS or organization context is missing.
- Freeze the simple golden journey and map each visible interaction to a domain command/read model.
- Record database, secure object storage, workflow, model and environment decisions here; finalize provider-specific ADRs when each dependency is provisioned.

**Gate passed:** no route can accidentally serve a demo identity in a real-data environment. The live marketing page now enters `/demo`; `/workspace` is reserved for WorkOS-authenticated, role-assigned users.

### Wave A.5 — sharpen the conversation-to-pilot surface (implemented; validation pending)

- Recompose the hero as a left-aligned promise with one dominant completed-tender pilot action, a secondary 44-second proof film and one lower-emphasis demo-workspace path.
- Replace `See the proof` and the competing above-the-fold explanation with a product/video surface that shows the journey.
- Add three icon-led outcomes: draft from approved rules, run the evaluation, and defend the award.
- Add a team-experience strip only after affiliation and logo-use review; avoid customer, partnership, or endorsement implications.
- Record a deterministic walkthrough using a public completed tender or buyer-approved sanitized pack. Label it illustrative until every shown action is a working product behavior.
- Add a public docs shell for workflows and security, with MCP and integrations visibly labelled by availability.

**Gate:** procurement interviewees understand the category and select a walkthrough or retrospective-pilot action without explanation; every public claim, affiliation, and product-state label is defensible.

**Progress:** the new landing hierarchy, 44-second proof film, deeper interactive workspace journey, icon-led outcome modules, availability-labelled documentation and retrospective-pilot call to action are implemented in the current checkout. Official organization marks remain subject to affiliation and mark-use clearance; the current treatment makes no customer or endorsement claim.

### Wave B — build the tenant-safe data spine

- Provision a non-production Postgres database and migration path.
- Implement organizations, procurements, sources/versions, requirements, findings, decisions and audit events first.
- Add a server-only DAL, policy checks, typed commands, transactional event/outbox writing and seeded two-tenant tests.
- Replace browser state one vertical slice at a time: open award, open requirement/source, record finding, approve, inspect event.

**Gate:** the deeper guided workspace journey persists, and every cross-tenant attempt is denied and tested.

**Progress:** the non-production database, migration path, control-graph schema, restricted application role, row-level policies, server-only read model, first human-determination command, transactional event/outbox write, and two-tenant denial test are complete. The next vertical slice is server-owned approvals and decision locking with idempotency and version checks.

### Operations Wave O0 — establish deterministic assurance in parallel

- Add pull-request typecheck, production-build, tenant-isolation, migration, and schema-validation gates.
- Enable CodeQL default setup, dependency/secret alerts supported by the repository plan, and grouped Dependabot pull requests without automatic merge.
- Add independent health probes for the public and demo journeys plus a protected-route fail-closed smoke test after deployment.
- Define versioned operations run/finding contracts and produce a weekly human-reviewed brief before introducing a model.

**Gate:** a failed build, isolation regression, security/dependency alert, deploy-journey failure, or confirmed public outage produces a traceable finding with evidence and an owner.

### Wave C — onboard a retrospective design partner securely

- Provision production WorkOS and the secure document pipeline.
- Complete NDA/data terms, data map, subprocessors, retention and incident process.
- Ingest one completed tender, initially without AI; verify hashes, versions, access and source anchors.
- Add extraction/retrieval and task-specific AI only after the evidence custody works without it.

**Gate:** one historical decision can be reconstructed with accepted sources and no uncontrolled file path.

### Wave D — run an assisted live pilot

- Add drafting, locked criteria/matrix versions, submissions, clarification, approvals and sealed export in the order the pilot uses them.
- Integrate only the necessary identity or source-system boundary.
- Instrument evidence acceptance, gap-resolution time, export time, authorization denials and workflow failures.

**Gate:** an independent reviewer can explain the award from the sealed record, and the customer wants to repeat the process.

## Build/no-build rules

Build now when a capability protects tenant separation, evidence custody, auditability, or the next validated pilot journey.

Do not build yet:

- microservices, Kubernetes or event streaming infrastructure beyond a transactional outbox;
- a dedicated vector database before search measurements demand it;
- multi-region active-active or one database per tenant before a buyer contract requires it;
- a catalogue of ERP connectors without a named design partner;
- autonomous bid scoring, supplier exclusion or award recommendation;
- custom model training on buyer documents;
- an unrestricted MCP server or a second business-logic layer for AI clients;
- a permanently running general agent, recursive agent organization, or long conversation used as durable state;
- autonomous merge, production deployment, secret rotation, customer-data repair, or incident declaration;
- compliance badges as a substitute for the threat model, operating controls and evidence.

## Research basis

Primary documentation used for these decisions:

- [Next.js data security](https://nextjs.org/docs/app/guides/data-security): server-only data access, minimal data transfer, and authorization inside reachable server endpoints.
- [WorkOS roles and permissions](https://workos.com/docs/authkit/roles-and-permissions), [organizations](https://workos.com/docs/authkit/users-organizations), [organization authentication policies](https://workos.com/docs/authkit/organization-policies), [directory provisioning](https://workos.com/docs/authkit/directory-provisioning), and [MCP authorization](https://workos.com/docs/authkit/mcp).
- [Neon row-level security](https://neon.com/docs/guides/row-level-security) for a defense-in-depth tenant boundary.
- [AWS S3 server-side encryption with KMS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html), [Malware Protection for S3](https://docs.aws.amazon.com/guardduty/latest/ug/how-malware-protection-for-s3-gdu-works.html), [CloudTrail data events](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-events.html), and [S3 Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html).
- [Vercel AI Gateway](https://vercel.com/ai-gateway) for current provider routing, allowlists, no-training and zero-data-retention controls, and [Vercel Workflow](https://vercel.com/docs/workflow) for durable steps and retries.
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs) for authenticated production scheduling and [Vercel Observability](https://vercel.com/docs/observability) for operational telemetry.
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use), [CodeQL setup types](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types), and [Dependabot configuration](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file) for repository automation and supply-chain controls.
- [OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [file upload security](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), and [prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) guidance.
- [NIST AI Risk Management Framework](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) for documented task limits, human oversight, evaluation and third-party dependency mapping.
