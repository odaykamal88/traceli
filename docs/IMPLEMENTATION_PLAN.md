# Traceli pilot implementation plan

Updated: 30 August 2026

Architecture maturity, external-dependency decisions, environment boundaries, and customer-onboarding gates are detailed in [ARCHITECTURE_ROADMAP.md](./ARCHITECTURE_ROADMAP.md). The current solution, technology stack, trust boundaries, security posture, and provider-evidence requirements are documented in [SOLUTION_ARCHITECTURE.md](./SOLUTION_ARCHITECTURE.md). Scheduled monitoring, model routing, bounded agents, CI gates, and supervisory reporting are detailed in [AUTONOMOUS_OPERATIONS.md](./AUTONOMOUS_OPERATIONS.md). Public messaging, visual identity, iconography, affiliation treatment, and demonstration release gates are governed by [BRAND_SYSTEM.md](./BRAND_SYSTEM.md). Reusable campaign and call language lives in [GTM_MESSAGING.md](./GTM_MESSAGING.md). Public consequence claims and the case-study authority sprint are governed by [PUBLIC_CASE_STUDY_REGISTER.md](./PUBLIC_CASE_STUDY_REGISTER.md). Economic-value logic, pilot measurement, and ROI claim boundaries are governed by [ROI_VALUE_CASE.md](./ROI_VALUE_CASE.md). The ICP, first commercial offer, twelve-call qualification method, and contract path are defined in [FIRST_PAID_PILOT.md](./FIRST_PAID_PILOT.md).

## The product we are building

Traceli is not another tender portal and not an AI scoring feature. It is the award-assurance layer for donor-funded procurement: a pre-award control gate that preserves the governing rules, criteria, evidence, human decisions, exceptions, approvals, and chronology behind an award.

The initial product promise is deliberately narrow:

> Prove the award before you sign it—with every material claim linked to the exact source, actor, and event that supports it.

That answer is the hook. The durable product is the procurement control graph and decision record that accumulate while work happens.

## Commercial focus through the first paid pilot

The immediate target is not every procurement team and not every DIHAD exhibitor. It is a buyer-side humanitarian or development organization that manages donor-restricted, grant-funded, public, or otherwise ring-fenced procurement; applies overlapping donor, institutional, and local rules; and reconstructs material award evidence across an ERP or portal, shared files, and email.

DIHAD conversations provide first-party evidence that this problem is recognizable, and twelve follow-up calls are scheduled for the week of 31 August 2026. They do not yet prove that every contact is a buyer, has authority, or can fund a pilot. Relief-aid suppliers seeking help to submit bids are outside the current direct-customer ICP unless they also operate accountable restricted-funded procurement.

The current offer is a **paid six-week Award Assurance Pilot**:

> Bring one completed tender. Traceli reconstructs the rules-to-award evidence chain, exposes missing proof, and tests whether an independent reviewer can defend the award without rebuilding it from folders and email.

The pilot is retrospective, bounded, and human-owned. It does not replace the customer's system of record, certify compliance, or alter the original award. Contracting may begin immediately, but no sensitive document enters Traceli until the NDA, classification, processing terms, approved transfer route, and technical security gate pass.

## The deeper 90-second workspace journey

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
| Public story | Core promise complete; conversion refinement queued | Static, fictional DIHAD scenario; no customer or endorsement claims |
| Fictional interactive demo | Complete | Explicit `/demo`; state remains browser-local |
| Protected workspace route | Complete | Fails closed without WorkOS, a Traceli role, and a provisioned tenant; production credentials not provisioned |
| Identity roles | Configured in WorkOS staging | First finding command is role-enforced on the server; remaining commands follow in Sprint 1 |
| Tenant-safe data spine | First vertical slice complete | Non-production Postgres only; one fictional award is persisted |
| Decision workflow | Partially persistent | Authenticated clarification determination persists; approvals and lock remain browser-local |
| Source and actor chronology | Partially persistent | One source version, requirement, finding and server chronology are durable; broader fixtures remain static |
| Event integrity | Server event chain begun | Finding determination writes hash-linked audit and outbox events transactionally; managed signing remains outstanding |
| Type/build safety | Complete | Strict type-check and Next.js production build pass |
| Autonomous operations | Strategy defined; automation not yet implemented | Begin with deterministic CI, security scanning, external probes, and normalized findings; agents remain advisory or pull-request-only |

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

The immediate commercial sequence is twelve qualified follow-up calls → named retrospective tender and sponsor → written paid-pilot proposal → signed scope and data gate. The minimum delivery path is Sprint 1 → Sprint 2 → Pilot Slice A → Pilot Slice B. It deliberately pulls only the retrospective ingestion, evidence-mapping, review, and export behavior needed from later workflow sprints before building source-grounded tender drafting or a complete live-tender workflow.

The operations track runs in parallel: O0 continues during Sprint 1; O1 must pass before sensitive pilot data; O2 arrives with durable document and extraction workflows; O3 arrives before a consequential live pilot. Sprint 3 expands into tender drafting only when the paid pilot or next live procurement validates it. Sprint 4 (MCP) and Sprint 7 (ERP connectors) remain deferred distribution tracks and must not delay the first paid assurance outcome.

### Paid-pilot conversion track — immediate

Outcome: at least one of the twelve DIHAD follow-ups signs a paid retrospective pilot, and the implementation backlog becomes accountable to that contract's acceptance criteria.

- Classify every follow-up as buyer/implementer, potential channel, or supplier-only before pitching.
- Qualify one completed procurement, governing rule sets, evidence locations, consequence, accountable sponsor, secure data route, budget owner, buying process, and at least one customer-owned value baseline.
- Demonstrate only the rule → evidence → human judgment → approval → decision-record journey relevant to that account.
- Ask directly for the six-week paid pilot; do not substitute an unpaid innovation workshop for willingness-to-pay validation.
- Send a short proposal/SOW within 24 hours of a qualified call and maintain a mutual action plan through sponsor, security/legal, procurement, and signature.
- Keep the founding commercial hypothesis, qualification score, discovery questions, objection posture, and contract contents in [FIRST_PAID_PILOT.md](./FIRST_PAID_PILOT.md).
- Keep operating value, cycle value, and customer-modelled risk visibly separate; do not use public-case amounts as expected loss or promise a generic risk-reduction percentage.

Commercial gate: all twelve accounts are classified; at least four buyer-side accounts name a completed tender, consequence and material proof gap; at least two name a baseline owner and one quantifiable operating measure; at least two proposals reach a sponsor or economic buyer; and at least one paid pilot is signed or has a documented contracting path with named approvers and dates. The control moment, accountable owner and material proof gap remain hard activation conditions regardless of score.

### Commercial-readiness sprint — twelve-follow-up conversion (active; positioning only)

Outcome: use the current ICP, positioning, discovery, public-evidence and value-case assets to convert the twelve DIHAD follow-ups into at least one paid six-week Award Assurance Pilot. This sprint does not add product capability, widen the pilot scope, change the data boundary or pull forward a deferred connector, MCP or live-tender feature.

The commercial source of truth remains split deliberately:

- [FIRST_PAID_PILOT.md](./FIRST_PAID_PILOT.md) owns ICP activation, qualification, next-call language, the account tracker and the contract path.
- [GTM_MESSAGING.md](./GTM_MESSAGING.md) owns landing-page and outreach language.
- [CALCOM_OUTREACH.md](./CALCOM_OUTREACH.md) owns the approved scheduling route, intake, reminder and channel copy; the direct 30-minute event is the canonical booking destination.
- [DISCOVERY_CALL_STORY_CAPTURE.md](./DISCOVERY_CALL_STORY_CAPTURE.md) owns tender-story prompts, publication permission and the separate story record.
- [PUBLIC_CASE_STUDY_REGISTER.md](./PUBLIC_CASE_STUDY_REGISTER.md) owns approved public-case wording, procedural status and the case-study authority sprint.
- [ROI_VALUE_CASE.md](./ROI_VALUE_CASE.md) owns customer baselines, pilot measurement and economic-claim boundaries.
- [PUBLICATION_PR_STRATEGY.md](./PUBLICATION_PR_STRATEGY.md) owns publication sequencing, distribution and the route from public evidence to a completed-tender conversation.

#### Done — available for the follow-up calls

| Work item | Completed state and acceptance evidence |
| --- | --- |
| ICP activation filter | The active-sales threshold is defined as a named control moment, a named accountable owner and a named proof gap. Firmographic fit or positive interest alone no longer qualifies an account. |
| Positioning-only next-call script | The call opening, control-moment diagnosis, current-state questions, five-minute proof path, pilot bridge and mutual-action close are defined in [FIRST_PAID_PILOT.md](./FIRST_PAID_PILOT.md). |
| Cal.com scheduling route | The approved `https://cal.com/oqemal/30min` route supports a 30-minute Google Meet booking. The landing-page pilot actions and controlled outreach copy use this direct event rather than the generic profile chooser. Cal.com-side event naming and intake configuration remain a separate account setting. |
| Landing-page narrative | The first viewport identifies the accountable procurement and assurance audience, the control moment and the completed-tender action. `How Traceli supports your award process`, governed public-case positioning and the buyer FAQ explain the service without adding a product claim. |
| Discovery capture method | Commercial facts stay in the twelve-account tracker; tender stories, corroboration and publication permission use the separate capture in [DISCOVERY_CALL_STORY_CAPTURE.md](./DISCOVERY_CALL_STORY_CAPTURE.md). Silence is not permission. |
| Initial public-case evidence | Four controlled short-form institutional records cover auditability, financial eligibility, funding continuity and integrity exposure. Their source-linked short wording is approved for the landing surface. Expanded, long-form or derivative claims remain behind the register's factual and legal/comms gates. They remain public evidence, not customer stories or prevention claims. |
| Conversion and value measures | The account score, conversion gate, customer-owned baseline measures and proposal target are defined. Public-case amounts are not used as expected loss or generic ROI. |

#### Pending — execute through the twelve-call cycle

| Work item | Owner | Execution requirement | Done when |
| --- | --- | --- | --- |
| Apply the activation filter and next-call script | Founder / commercial lead | Diagnose one completed tender and control moment before demonstrating; show only the matching rule-to-evidence-to-approval path; close on the tender, sponsor, data owner, budget route and dated next action. | All twelve accounts are classified and scored from stated evidence, with no score inflated to preserve an opportunity. |
| Validate the landing-page positioning in conversation | Founder / commercial lead | Record whether the first-viewport language, `How Traceli supports you`, matched public case, FAQ answer and completed-tender CTA help the intended role name a real buying situation. Treat page views and positive reactions as supporting signals only. | Call notes identify the language that did or did not produce a named tender, consequence, sponsor or proposal step; any copy revision remains positioning-only. |
| Capture discovery evidence | Founder / commercial lead | Record the named gate and date, proof gap, accountable owner, systems involved, reconstruction effort, budget route and next action in the account tracker immediately after each call. Use two or three tender-story prompts only when a real story emerges, and store permission separately. | Every completed call has an evidence-backed tracker row; useful stories have a permission status and are never mistaken for an approved case study. |
| Run the case-study authority sprint | Founder / evidence owner; factual and legal/comms reviewers required | Expand the 25-record official-source backlog, approve twelve register entries, produce four reviewed one-page cases and test one matched consequence hypothesis in each relevant call. | Twelve entries meet the source standard, four long-form cases pass review, and at least six relevant conversations record the resonant consequence, objection, owner and next action. |
| Convert qualified calls to proposals | Founder / commercial lead | Send the short pilot proposal/SOW within 24 hours of a qualified call and maintain the contracting path through sponsor, security/legal, procurement and signature. | At least two sponsor or economic-buyer meetings and two written paid-pilot proposals are reached. |
| Measure the twelve-call outcome | Founder / commercial lead | Maintain one denominator of twelve and report buying movement, not impressions: classification, completed tender, consequence, baseline owner, sponsor, budget route, proposal and decision date. | At least four buyer-side accounts name a completed tender and consequence; at least two name a baseline owner and quantifiable operating measure; and at least one paid pilot is signed or has a documented contracting path with named approvers and dates. |

#### Blocked by required input — do not invent or publish around the gap

| Blocked item | Required input | Action after the input exists |
| --- | --- | --- |
| Account-specific deal facts | Statements from the twelve contacts about organization type, role, named tender, trigger/date, material proof gap, sponsor, baseline, data route, budget and purchasing process. | Replace `TBD` values in the account tracker, apply the qualification score and advance only accounts that pass the activation filter or have one clearly closable condition. |
| Customer ROI inputs | Customer-confirmed people, hours, review loops, external spend, award volume, labour rates and any documented delay linkage. | Calculate measured operating and break-even views under [ROI_VALUE_CASE.md](./ROI_VALUE_CASE.md); keep customer-modelled risk as a separate labelled scenario. |
| Story and case publication approval | Explicit contact permission for discovery stories plus factual and legal/comms approval for public institutional case wording. | Publish only the approved attribution level and controlled claim. Until then, keep discovery material private and long-form cases in review. |

Sprint review rule: do not answer weak conversion by adding product scope. First inspect which activation condition, accountable stakeholder, evidence baseline, case narrative, budget route or contracting step was absent. A useful result is one signed paid pilot; a secondary useful result is a documented account-by-account reason the current segment or offer did not convert.

### Operations track — autonomous assurance without autonomous control

Outcome: Traceli continuously detects failures, security risks, dependency drift, performance regressions, workflow stalls, and model-cost anomalies while every claim remains machine-verifiable and every consequential change remains controlled.

- Use GitHub Actions, CodeQL, Dependabot, and branch protection for repository assurance.
- Use an independent synthetic monitor for outside-in availability; a scheduler inside Vercel cannot prove that Vercel itself is reachable.
- Use authenticated Vercel Cron only as a trigger and Vercel Workflow for durable multi-step jobs; store canonical run and finding state in Postgres.
- Route model-backed tasks by evaluated capability tier, data policy, latency, and cost—not a hard-coded vendor or model name.
- Give every job versioned structured inputs/outputs, idempotency, budgets, evidence hashes, test gates, and a kill switch.
- Keep the supervisory agent read-only. Deterministic policy assigns P0–P3; the agent explains, correlates, and recommends.
- Let coding agents open bounded pull requests from disposable worktrees; never let them merge, deploy production, rotate secrets, alter access, or repair customer data autonomously.

Immediate O0 gate: pull-request type/build/tenant tests, CodeQL and dependency monitoring, external site health, post-deploy smoke tests, versioned run/finding schemas, and a human-reviewed weekly brief are working. See [AUTONOMOUS_OPERATIONS.md](./AUTONOMOUS_OPERATIONS.md) for the job catalogue and phased gates.

### Sprint 0 — credible conversation baseline (complete)

Outcome: a prospect can understand the promise in ten seconds and interrogate the core claim in ninety.

- Keep the public page free of login friction.
- Put the operational workspace behind WorkOS.
- Preserve a portable fictional scenario for meetings without connectivity or credentials.
- Demonstrate the golden thread from rule to evidence to human decision to audit event.
- Demonstrate a tamper-evident event chain.

Exit gate: public story, protected route, audit interaction, strict types, and production build all pass.

### Sprint 0.5 — conversation-to-pilot conversion surface (implemented; interview validation pending)

Outcome: a procurement or assurance owner understands the promise in ten seconds, can see the proof path in a 44-second film, and has one obvious pilot action. A deeper guided workspace journey remains available after discovery establishes relevance.

This is a public-story refinement before the next product iteration. It does not widen the production data boundary or delay the tenant-safe data spine.

**Landing hierarchy**

- Replace the centered hero with a WorkOS-style split: left-aligned promise and actions; a restrained product/video surface on the right.
- Use the category `Award assurance for donor-funded procurement` and the headline `Prove the award before you sign it.`
- Remove `See the proof`. Use `Test one completed tender` as the dominant action, `See the 44-second proof path` as the secondary action, and keep `Open demo workspace` as a lower-emphasis path.
- Remove duplicate or competing above-the-fold explanations. The product visual should demonstrate the claim rather than restate it.

**Credibility strip**

- Use `Built by the people from`, never `Trusted by` and never a bare `Built by` beside organization marks.
- Candidate marks are WFP, UNFCCC, Oxfam, Google, and Careem only after verifying that a named team member genuinely worked with or at each organization and that the mark may be used in this context.
- Treat the strip as biography, not customer proof, partnership, UN endorsement, or product adoption. Use monochrome marks and a short non-endorsement note where required.
- If any affiliation or logo permission is uncertain, use a plain-text credibility line without the affected mark until it is cleared.

Brand gate: maintain [AFFILIATION_REGISTER.md](./AFFILIATION_REGISTER.md) with the mark owner, the named person's verified relationship, the permission-policy source, written approval status where required, approved asset, and review date. Passing code review does not clear a mark for public use.

**Three service outcomes**

- Show three icon-led modules, not a feature catalogue:
  1. `Map the award controls` — connect donor, institutional and local rules to the criteria, evidence and approvals that govern the award.
  2. `Surface the evidence gaps` — keep supplier proof, reviewer judgment, clarifications and exceptions visible for human disposition before sign-off.
  3. `Issue the assurance pack` — preserve the source-linked rules, evidence, human decisions, exceptions and approvals behind the award.
- Use the existing icon library and one visual grammar. Each module gets one sentence and one destination at most.

**Tender-to-proof video**

- Embed the 44-second muted proof film in the first viewport. Keep sound off by default and preserve reduced-motion behavior. Use the interactive workspace for the deeper guided journey.
- Use a public, completed tender from an authoritative portal, or a buyer-approved irreversibly sanitized tender. Cache the demonstration pack so DIHAD playback does not depend on portal availability.
- Until secure ingestion and the shown workflow are live, label the asset `Illustrative product walkthrough`; never present a staged import as a live customer integration.
- Script the sequence as: fetch or upload tender pack → infer cited requirements and matrix → confirm the human-controlled draft → track submissions and Q&A → surface an evidence or integrity concern for human review → record approvals → ask `Why did this supplier win?` → open the audit-ready record.
- Make the final frame invite one low-friction pilot action: `Bring one completed tender`.

**Documentation surface**

- Add a lightweight public documentation entry point modelled on WorkOS's progressive disclosure: `How Traceli works`, `Security and data handling`, `Procurement workflows`, `Integrations`, and `MCP`.
- Publish workflow and security documentation as soon as it is accurate. Label unshipped interfaces `Planned` or `Private alpha`; do not imply that MCP, ERP connectors, or live tender fetching are already available.
- Design the MCP documentation structure now—authorization, scopes, tool catalogue, citations, human confirmation, client setup, and audit semantics—but publish usable setup instructions only when the Sprint 4 read-only alpha passes its isolation and exfiltration tests.

Recommended page order:

1. Left-aligned promise, `Test one completed tender` action and 44-second proof film.
2. Verified team-experience strip.
3. Governed public consequence evidence with primary-source links.
4. Three icon-led assurance outcomes.
5. Buyer FAQ covering ERP overlap, audit independence, certification, data handling, pilot scope and budget route.
6. Documentation/security entry point.
7. `Test one completed tender` call to action.

Exit gate: five procurement or audit professionals can explain Traceli as `the proof behind the award` after one scroll; at least three choose the walkthrough or pilot action without prompting; every affiliation and availability claim has an owner and evidence.

Implementation status: the left-led landing composition, category and must-have promise, primary completed-tender action, secondary 44-second proof film, three assurance outcome modules, buyer FAQ, public control-model documentation, availability labels, responsive layouts, and retrospective-pilot call to action are complete in the current checkout. Four source-linked consequence examples use controlled short wording on the landing surface; expanded, long-form or derivative claims remain behind factual and legal/comms review. The film and demo content are visibly labelled fictional or illustrative. The organization strip uses a monochrome, equal-block treatment and explicit non-endorsement language. Relationship verification, mark permission and long-form consequence-claim review remain separate release gates under [BRAND_SYSTEM.md](./BRAND_SYSTEM.md). The remaining gate is interview conversion evidence, case-study authority and logo clearance—not another UI feature.

### Sprint 0.6 — public trust surface and controlled documentation (queued)

Outcome: a serious prospect or IT/security reviewer can understand Traceli's current data boundary and request deeper evidence without turning the website into an internal engineering repository.

This work is queued, not a reason to delay the twelve follow-up calls. Implement it before the first formal customer security review, or after two relevant prospects independently ask the same security or data-handling question—whichever comes first.

**Publish on the website**

- Add one concise `/trust` page; do not add another broad documentation hub.
- Explain hosting and material provider categories, organization isolation, server-side role checks, human-owned decisions, audit evidence, and the separation between the fictional public demo and protected workspace.
- State the current boundary plainly: Traceli does not yet accept real procurement documents, and no runtime AI model processes customer data.
- Show `Implemented`, `Provider evidence required`, and `Planned` labels wherever readers could otherwise mistake a target control for a live capability.
- Summarize the security gates that must pass before sensitive documents or consequential live decisions enter Traceli.
- Link to the existing six-week retrospective pilot explanation and use one contact action: `Request the security architecture` or `Discuss a paid pilot`.
- Keep the existing public workflow, control-model, availability, and primary-source evidence pages as the progressive-disclosure layer; avoid duplicating them on `/trust`.

**Share selectively during a qualified deal**

- Provide a reviewed, date-stamped copy of [SOLUTION_ARCHITECTURE.md](./SOLUTION_ARCHITECTURE.md), or a sanitized customer edition, when a named IT/security stakeholder enters the pilot process.
- Attach provider-console and contractual evidence only after it is captured and reviewed; repository code alone does not prove region, encryption at rest, backup window, MFA, WAF, retention, or subprocessor terms.
- Keep the detailed threat model, unresolved gaps, implementation roadmap, model economics, autonomous-operations plan, SOW/pricing logic, GTM language, and internal evidence registers out of the public website. Share only the parts required for a scoped diligence process.

**Publish later only when evidence supports it**

- Publish a short ROI/value summary only after customer-owned baselines validate the assumptions; never expose the internal modelling framework as a generic savings claim.
- Publish model-provider or open-model details only after an approved runtime path exists and its data, retention, evaluation, and cost controls are evidenced.
- Publish MCP setup instructions only after the read-only alpha passes tenant-isolation and exfiltration tests.

Exit gate: an external reviewer can distinguish current controls from roadmap claims, no secret or exploitable operational detail is exposed, every provider claim has current evidence, and the page gives qualified buyers one obvious path to request the deeper security pack.

### Sprint 0.75 — must-have evidence and case-study authority (recommended)

Outcome: Traceli can explain the cost of weak award proof with a balanced, primary-source evidence library, and the twelve DIHAD follow-up calls reveal which consequence is urgent enough to fund.

- Build a 25-record official-source backlog across UN oversight, multilateral development banks, EU/OLAF and national development-aid auditors.
- Approve twelve short-form cases across auditability, ineligible spend, funding continuity and integrity sanctions.
- Produce four reviewed one-page case studies and one reusable four-slide sales proof module.
- Keep the official finding, institutional consequence, Traceli inference and product boundary visibly separate.
- Never say Traceli would have prevented a case, never turn a recommendation into an implemented suspension, and never imply the source institution is a customer.
- Test one consequence hypothesis on every qualified follow-up call and record whether it creates a named tender, sponsor, budget route or proposal step.
- Run the detailed ten-day plan and claim register in [PUBLIC_CASE_STUDY_REGISTER.md](./PUBLIC_CASE_STUDY_REGISTER.md).

Exit gate: twelve entries pass source review; four one-page cases pass factual and legal/comms review; and at least six relevant calls produce evidence about the consequence, owner and budget route that move—or fail to move—the opportunity.

### Sprint 1 — tenant-safe data spine (in progress)

Outcome: the demo becomes a persistent multi-tenant pilot without yet ingesting sensitive bid files.

- Add Postgres with organization-scoped tables and row-level tenant assertions.
- Store `organization_id` on every procurement, source, requirement, submission, decision, and event.
- Enforce WorkOS permissions in server actions and route handlers—not only in the UI.
- Replace mutable browser state with server-owned commands and append-only audit events.
- Calculate event hashes on the server; sign locked decision roots with a managed key.
- Add idempotency keys, optimistic concurrency, and a transactional outbox.
- Add request, authorization, and audit-log tests for cross-tenant denial.

Exit gate: two seeded organizations cannot read, mutate, search, or export each other’s data, including by guessed IDs.

Implemented first slice: a free non-production Postgres sandbox, organization-scoped control-graph tables, a restricted application role plus row-level policies, server-only DTO reads, optimistic finding updates, transactional audit/outbox writes, and automated cross-tenant denial checks. Remaining Sprint 1 work is to move approvals and decision locking to the same command boundary, add idempotency keys, and broaden denial tests across every resource and export.

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

### Pilot Slice A — retrospective award reconstruction

Outcome: the signed pilot's completed tender can be reconstructed in Traceli without first building a new-tender drafting workflow.

- Import the customer-approved policy/donor pack, final tender and matrix versions, submissions, evaluation artifacts, clarifications, approvals, and award record.
- Preserve source hashes, versions, actors, dates, and customer-system identifiers.
- Allow assisted and manual mapping from governing obligations to criteria, supplier evidence, reviewer judgments, exceptions, and approvals.
- Keep `supported`, `not found`, `ambiguous`, `customer confirmed`, and `not available` visibly distinct.
- Record the customer's current reconstruction workflow and baseline time before presenting Traceli's result.
- Record the people involved, staff hours, review loops, external support where documented, and relevant cycle-time baseline before presenting Traceli's result.
- Require named customer confirmation for every consequential interpretation; Traceli may organize and challenge the record but may not rewrite the historical decision.

Exit gate: one completed procurement has a navigable rules-to-award chain, every sampled material claim opens an accepted source or explicit gap, and no uncontrolled file path exists.

### Pilot Slice B — independent review and minimum export

Outcome: the customer can judge the paid pilot against an assurance result rather than a product demonstration.

- Provide a reviewer view that starts with “why did this supplier win?” and opens the supporting rule, evidence, judgment, clarification, exception, and approval.
- Run a structured review with a customer-selected person who did not assemble the record.
- Capture review time, unsupported claims, missing controls, and questions that still require institutional judgment.
- Calculate operating-value and break-even views only from customer-confirmed inputs; keep any risk-adjusted scenario separate and labelled.
- Produce a minimum human-readable decision pack plus a machine-readable manifest when the export boundary passes security and integrity checks.
- Deliver a results brief comparing the baseline with the reconstructed record and recommend either stop, repeat on another completed tender, or accompany one live tender.

Exit gate: the independent reviewer can explain the recommendation from the record, the customer accepts or rejects each reported gap, and a named buyer makes an explicit expansion decision.

### Sprint 3 — source-grounded tender drafting

Outcome: after retrospective value is proven, Traceli helps a live-pilot team infer a first tender structure from approved institutional knowledge without inventing policy.

- Connect an approved knowledge pack: policy, donor conditions, templates, and selected precedents.
- Extract obligations with page/section citations and version metadata.
- Generate requirements, criteria, and matrix drafts as structured data.
- Require named human confirmation before publishing criteria or changing a locked matrix.
- Route tasks through a model gateway so models remain replaceable.
- Persist prompt version, model route, cited inputs, structured result, evaluation score, cost, and reviewer resolution.
- Add a second-model challenge only for high-risk policy interpretation or unsupported claims.

Exit gate: every generated clause opens its approved sources; unsupported claims are blocked or visibly unresolved.

### Sprint 4 — permissioned MCP alpha

Outcome: approved AI clients can interrogate Traceli's control graph without bypassing tenant, document, or human-decision boundaries.

- Expose a remote MCP server as a thin adapter over the same domain services and authorization policies used by the Traceli application; do not create a second business-logic layer.
- Authenticate through an OAuth 2.1-compatible flow and bind every request to one user, organization, role, and intended Traceli resource.
- Start with a small allowlist of read-only tools: `list_procurements`, `get_procurement_status`, `get_requirement`, `search_approved_sources`, `get_evidence_gap`, `get_audit_events`, and `verify_decision_record`.
- Return permission-checked citations, metadata, and minimal redacted excerpts by default—not raw document bodies or unrestricted signed URLs.
- Add draft-only tools such as `draft_tender_structure`, `prepare_clarification`, and `preview_audit_pack` only after the read boundary passes testing.
- Require explicit in-product confirmation for any mutation; never permit an MCP client to publish criteria, alter a locked matrix, resolve a finding, approve, exclude a supplier, or award a contract autonomously.
- Record client, tool, arguments digest, actor, tenant, sources accessed, result classification, denial reason, and timestamp as append-only audit events.
- Add per-tool scopes, rate limits, token revocation, prompt-injection tests, client conformance tests, and a kill switch by organization and client.
- Validate the private alpha with Codex and at least one second client among Claude Code, Cursor, or GitHub Copilot before publishing setup instructions.

Exit gate: two seeded organizations remain isolated through MCP; every invocation is traceable; raw restricted documents cannot be exfiltrated through tool output; and the read-only golden journey works in two supported clients.

### Sprint 5 — submissions and clarification loop

Outcome: evaluators can see who is coming through, where evidence is missing, and how a gap was resolved.

- Ingest supplier submissions from the secure room and selected portal exports.
- Map passages and attachments to pre-locked requirements.
- Keep “not found,” “ambiguous,” and “human confirmed” distinct.
- Provide reviewer comments, assignments, conflicts, and supplier Q&A in one trace.
- Capture business-identity and potential-collusion signals as review leads, never autonomous exclusion decisions.
- Record every clarification request, response, attachment, determination, and timestamp.

Exit gate: a reviewer can resolve one evidence gap end to end, and an auditor can reconstruct both the original gap and the human resolution.

### Sprint 6 — approvals, locked record, and audit export

Outcome: the complete decision can be defended without rebuilding it from email and folders.

- Gate lock on required evidence, declarations, reviewer sign-offs, and approved exceptions.
- Seal a canonical decision manifest and event-chain root.
- Produce a human-readable PDF and machine-readable JSON package.
- Include source versions, criteria lock time, findings, reviewer identities, conflicts, clarifications, approvals, and integrity verification.
- Stream administrative events to WorkOS Audit Logs or the buyer’s SIEM.
- Add break-glass access with explicit reason, expiry, and audit visibility.

Exit gate: an independent reviewer can answer why the supplier won using only the export and its linked evidence package.

### Sprint 7 — ERP and tender-portal boundary

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
- MCP is another Traceli access channel, not a privileged bypass: every tool call uses the same server-side tenant, role, source, and retention policies as the product UI.
- MCP tools are read-only by default; consequential actions require a named human to confirm them inside Traceli.
- Supplier documents are untrusted inputs and cannot issue tool instructions or alter policy.
- Traceli surfaces evidence and risk signals; named humans retain compliance and award decisions.
- Locked records are append-only. Corrections create a linked superseding event rather than rewriting history.
- No production buyer data enters a staging environment.
- Operations agents receive minimized metadata and evidence references, not raw tender or supplier content; their structured outputs cannot mutate procurement decisions.
- Runtime health and security findings are operational records, separate from the procurement decision-event chain.
- No model may lower a deterministic severity, suppress a P0/P1, or bypass a failing CI or isolation gate.

## First paid pilot definition

Choose one buyer-side humanitarian or development organization, one procurement category, and one completed tender. Limit scope to:

- one approved policy pack;
- one tender and matrix;
- three to five submissions;
- two to four reviewers;
- the material clarification, exception, conflict, approval and award history available for the selected case;
- one decision record and customer export.

The contract starts with a data gate. NDA, classification, processing/subprocessor terms, region, approved transfer route, retention, deletion, and exit/export must be agreed before sensitive files move. The customer's original award remains authoritative throughout.

Success measures:

- one accountable sponsor, one procurement champion, and one independent reviewer participate through readout;
- time to locate evidence for a sampled requirement;
- proportion of sampled material claims supported by an accepted source or explicit unresolved status;
- time to produce the Award Assurance Pack and remaining manual work;
- missing approvals, declarations, source versions or clarifications surfaced in the historical record and dispositioned by the customer;
- independent reviewer can explain the recommendation from the reconstructed record;
- customer makes an explicit decision to stop, repeat, or accompany one live tender.
- results brief separates measured operating value, measured or pending cycle value, external-cost evidence, and any customer-owned risk scenario.

## What we deliberately defer

- Autonomous bid scoring or award recommendation.
- A general-purpose supplier marketplace.
- Broad ERP coverage before the first paid pilot.
- A public, anonymous, or unrestricted MCP server and generic tools such as `search_everything`, `download_document`, or direct database access.
- Autonomous award, exclusion, approval, criteria publishing, or locked-record mutation through MCP.
- Custom model training on buyer documents.
- Continuous web investigations presented as facts without human verification.
- Replacing the buyer’s tender portal, ERP, document repository, or SIEM.

This sequencing protects the moat: MCP distributes access to Traceli, but the accumulating control graph, source permissions, verified evidence links, human resolutions, and decision chronology remain inside Traceli—not inside any client or single frontier model.
