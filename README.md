# Traceli

Traceli is the award-assurance layer for donor-funded procurement. It keeps the rules, tender criteria, supplier evidence, reviewer judgment, clarifications, approvals, and decision chronology connected so an accountable buyer can **prove the award before signing it**.

## Current pilot baseline

Start with [the dated current-state register](./docs/CURRENT_STATE.md) for deployment evidence, open work and operating status. Older HQ handoffs retain their historical dates.

- A public award-assurance story at `/` and a 52-second illustrative film.
- The public Award desk at `/demo`: a fictional award under reconstruction, overnight agent prep, a human disposition and a shareable decision record.
- Public Case Cards at `/cases`. A card cites a frozen Field Registry record, with the same facts at `/cases/[slug].json`. Global Fund OIG GF-OIG-25-005 publishes founder Freeze #1. OIOS 2025/098 publishes founder Freeze #2. UNFPA IA/2025-29 publishes founder Freeze #3. Two UNFPA cards and OIOS 2020/005 remain labeled fixtures awaiting a founder freeze. See [the phase 0 definition of done](./docs/case-card-phase0.md) and [the UNFPA / OCHA case factory](./docs/case-factory-unfpa-ocha.md).
- A workspace **Rule library** at `/workspace/library`: switchboard of governing packs the desk may cite. Public `/demo` stays Award desk.
- How Trace reasons remains at `/method` (the previous interactive sandbox). `/demo/classic` redirects to Award desk; the earlier walkthrough is at `/method/classic`.
- A protected workspace boundary at `/workspace` using WorkOS AuthKit.
- A signed-in upload desk at `/login` and `/desk`: extraction, a Global Fund, FCDO-prime, UNFPA, or OCHA CBPF pack, and a frozen record. Accounts are invitation-only. Password reset and invite links return through AuthKit to `/desk`. Extraction stays on the offline mock until `TRACE_EXTRACTION_PROVIDER=talonic`. Public `/demo` stays the scripted walkthrough. Setup is in [the upload desk brief](./docs/eng/workos-upload-desk.md) and [the extraction adapter](./docs/eng/extraction-adapter.md).
- Saved tender work at `/work` (My work) when `TRACELI_TENDER_WORKSPACES=1` and the signed-in organization is explicitly admitted. Each tender at `/work/[id]` follows Details → Evidence → Review → Decision → Record: the server saves review revisions, issues assessment and human-judgment records, and renders the PDF from those retained records. With the flag unset, `/work` redirects to `/hub` and the legacy browser-local desk below remains. See [the managed tender production flow](./docs/eng/TENDER_PRODUCTION_FLOW.md).
- A signed-in Knowledge hub at `/hub`. The path is one tender: start from a Trace-li seeded pack, name the work, and freeze a citeable golden thread on the award desk. The four packs are public-control synthesis, not official donor manuals. Organisation manuals are optional labels in the browser. One seeded pack still drives the desk freeze. Uploads are not compiled into pack rules.
- Global Fund, FCDO-prime, UNFPA, and OCHA CBPF packs include restrictive-measures evidence controls. There is no in-desk live sanctions-list API: Trace-li checks that screening evidence was recorded and dispositioned. The CBPF pack records that no Secretariat partner-sanctions list is in force.
- A non-production Lakebase Postgres control graph with tenant-scoped reads, a restricted application role, and row-level isolation.
- Source-linked requirements, submissions, clarifications, approvals, and audit chronology using fictional demo data.
- A SHA-256 event chain that makes an edited or missing audit snapshot visibly detectable, with the first authenticated human determination persisted as a server audit/outbox transaction.
- Strict TypeScript and production-build checks.
- Automated CI against an isolated Postgres service, including row-level tenant and append-only audit tests.
- Production security headers, environment-contract validation, dependency and secret scanning, and a daily public smoke check.

### Storage and access boundaries

Three signed-in paths keep records differently. Their records have not been unified.

- **Saved tender work (`/work`, rollout flag on).** Tenant-scoped Postgres records. Identity and current organization come from verified WorkOS membership; the browser never supplies an organization, actor, source hash, pack version or issued record. Every list, read, write, export and deletion is authorized on the server against the current role and the tender grant (table below). Assessments and human judgments are issued by the server from the retained review revision and packet receipt, and PDFs are rendered from the issued record with an export receipt.
- **Legacy browser-local (`/desk`, `/hub`, rollout flag unset).** `/desk` processes one packet and keeps the assessment and human freeze in browser session storage, with no durable server record. `/hub` keeps manual labels and hashes in browser storage without compiling them into rules.
- **Synthetic `/workspace/trace`.** A separate tenant-scoped Postgres workflow with synthetic source versions, decisions and exports.

| Saved tender action | Procurement Officer | Panel Member | Director / Workspace Admin | Auditor |
| --- | --- | --- | --- | --- |
| List/read tender, record, PDF | Own tender or explicit grant | Explicit grant | Any tender in the organization | Explicit grant |
| Create tender | Yes | No | Yes | No |
| Save review revision | `review` grant | `review` grant | Yes | No |
| Issue assessment; record Request evidence / Escalate | `review` grant | No | Yes | No |
| Record a proposed exception (not approval) | No | No | Yes | No |
| Grant/revoke tender access; delete a managed tender | No | No | Yes | No |

Saved-work intake is limited to fictional fixtures or, for an organization in the separate customer allowlist with the exact 30-day policy, a versioned provider disclosure and the Talonic route, **irreversibly sanitized** material only. Sensitive customer files are outside this rollout. Source file bytes are not retained. Each new tender pins its classification, pack, processing notice and an expiry 30 days after creation; at expiry application reads, writes and exports close, and the next successful daily job removes the tender graph. Earlier (legacy) tenders receive no expiry. This 30-day policy covers Traceli application records only; hosting backups, Talonic retention and downloads already taken are separate and not established by it.

### Readiness limits

Customer-file readiness is not established. Document custody and scanning, provider retention, hosting backups, formal exception approval authority and broader customer use remain outside the implemented saved-work boundary. A verified snapshot hash is not a server signature or proof that a pack is complete. Restrictive-measures controls check that screening evidence was recorded; they are not sanctions screening.

The [checked-in extraction benchmark](./eval/extraction/reports/ground-truth-comparison.md) is a local-text replay over ten synthetic packets with Talonic **not called**; it is not a live accuracy measurement. The 28 September 2026 live acceptance on a genuine public UNFPA solicitation verified the saved workflow end to end, not extraction accuracy on completed bid or award evidence. Dated deployment evidence and open unknowns are in [the current-state register](./docs/CURRENT_STATE.md). See [the implementation plan](./docs/IMPLEMENTATION_PLAN.md) for the wider roadmap.

The canonical public-message, visual-identity, iconography, affiliation, and demonstration rules live in [the Traceli brand system](./docs/BRAND_SYSTEM.md). Reusable category, campaign and call language lives in [the GTM messaging guide](./docs/GTM_MESSAGING.md). Economic-value logic, pilot measurement, and ROI claim boundaries live in [the ROI and value-case framework](./docs/ROI_VALUE_CASE.md). Public consequence claims and the recommended ten-day case-study sprint live in [the evidence register](./docs/PUBLIC_CASE_STUDY_REGISTER.md).

## Local development

Use Node 24 and the pinned pnpm 11.19.0 through Corepack. No secrets, `.env.local` or database are needed for the public site, demo and offline checks.

```bash
corepack enable          # once per machine; may need elevated permissions
corepack pnpm install --frozen-lockfile
corepack pnpm dev        # http://localhost:3000
```

WorkOS and database variables are required for the protected workspace. Without them, the app fails closed and keeps the clearly labelled fictional demo separate and portable. Create `.env.local` from `.env.example` only when deliberately configuring a non-production workspace. Keep `TRACE_EXTRACTION_PROVIDER` unset (offline mock) and the `TRACELI_TENDER_*` rollout variables unset unless a task explicitly requires them.

Extraction defaults to the offline mock. To call Talonic locally under an agreed data and spending scope, set `TRACE_EXTRACTION_PROVIDER=talonic`, `TRACE_TALONIC_API_KEY`, and optionally `TRACE_TALONIC_BASE_URL` (`https://api.talonic.com/v1` when empty). Setting `talonic` sends the uploaded file to that provider. Local and routine CI checks should use the mock. Production has its own provider setting: the presence of a key or this documented default does not establish which provider is selected. See [the extraction adapter](./docs/eng/extraction-adapter.md) and [current-state evidence](./docs/CURRENT_STATE.md).

## Verification

There is no generic `test` or `lint` script. These checks need no secrets, network provider or database:

```bash
corepack pnpm validate:env
corepack pnpm typecheck
corepack pnpm build
node --test .cursor/test-startup.mjs
corepack pnpm test:tenders
corepack pnpm test:award-desk
corepack pnpm test:case-cards
corepack pnpm test:upload-desk
corepack pnpm test:rule-library
corepack pnpm test:hub
```

Database checks (`db:migrate`, `db:seed`, `test:tenant`, `test:tenders:postgres` and the other Postgres suites in `package.json`) run only against an explicitly disposable local PostgreSQL 16 database, with `DATABASE_URL` and `DATABASE_URL_UNPOOLED` both pointing at that same isolated loopback database, as CI does. Never point them at hosted, staging or customer data. Development startup never migrates, seeds or alters database roles.

Operator checks reach external services and are not part of local onboarding:

```bash
corepack pnpm smoke:production
npx workos doctor --json --skip-ai
npx workos verify-login --json
```

Real secrets belong only in `.env.local` or the deployment environment. `.env.local` is ignored by Git.

The default production smoke check targets `https://www.trace-li.com`. Set `TRACELI_BASE_URL` to check another deployment without changing the script.

The [read-only evidence contract](./docs/AGENT_READ_CONTRACT.md) has a local fictional-data demonstration and PostgreSQL boundary tests (`pnpm test:agent`). It is not a deployed MCP endpoint or a verified integration with a buyer's agent. Follow the isolated-fixture setup in that document; these tests never load `.env.local`.
