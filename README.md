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
- A signed-in Knowledge hub at `/hub`. The path is one tender: start from a Trace-li seeded pack, name the work, and freeze a citeable golden thread on the award desk. The four packs are public-control synthesis, not official donor manuals. Organisation manuals are optional labels in the browser. One seeded pack still drives the desk freeze. Uploads are not compiled into pack rules.
- Global Fund, FCDO-prime, UNFPA, and OCHA CBPF packs include restrictive-measures evidence controls. There is no in-desk live sanctions-list API: Trace-li checks that screening evidence was recorded and dispositioned. The CBPF pack records that no Secretariat partner-sanctions list is in force.
- A non-production Lakebase Postgres control graph with tenant-scoped reads, a restricted application role, and row-level isolation.
- Source-linked requirements, submissions, clarifications, approvals, and audit chronology using fictional demo data.
- A SHA-256 event chain that makes an edited or missing audit snapshot visibly detectable, with the first authenticated human determination persisted as a server audit/outbox transaction.
- Strict TypeScript and production-build checks.
- Automated CI against an isolated Postgres service, including row-level tenant and append-only audit tests.
- Production security headers, environment-contract validation, dependency and secret scanning, and a daily public smoke check.

The signed-in upload desk and the older synthetic Trace workflow have different storage boundaries. `/desk` processes one packet and keeps the assessment and human freeze in browser session storage; it has no durable server record store. `/hub` keeps manual labels and hashes in browser storage without compiling them into rules. The separate `/workspace/trace` path has tenant-scoped synthetic persistence, decisions and exports in Postgres. Their records have not been unified.

Customer-file readiness still depends on verified document custody, scanning, retention, reviewer authority and durable authorized records. A verified snapshot hash is not a server signature or proof that a pack is complete. The [extraction benchmark](./eval/extraction/reports/ground-truth-comparison.md) records the current offline mapping limitation; it is not a live Talonic measurement. See [the implementation plan](./docs/IMPLEMENTATION_PLAN.md) for the wider roadmap.

The canonical public-message, visual-identity, iconography, affiliation, and demonstration rules live in [the Traceli brand system](./docs/BRAND_SYSTEM.md). Reusable category, campaign and call language lives in [the GTM messaging guide](./docs/GTM_MESSAGING.md). Economic-value logic, pilot measurement, and ROI claim boundaries live in [the ROI and value-case framework](./docs/ROI_VALUE_CASE.md). Public consequence claims and the recommended ten-day case-study sprint live in [the evidence register](./docs/PUBLIC_CASE_STUDY_REGISTER.md).

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

WorkOS and database variables are required for the protected workspace. Without them, the app fails closed and keeps the clearly labelled fictional demo separate and portable.

Extraction defaults to the offline mock. To call Talonic locally under an agreed data and spending scope, set `TRACE_EXTRACTION_PROVIDER=talonic`, `TRACE_TALONIC_API_KEY`, and optionally `TRACE_TALONIC_BASE_URL` (`https://api.talonic.com/v1` when empty). Setting `talonic` sends the uploaded file to that provider. Local and routine CI checks should use the mock. Production has its own provider setting: the presence of a key or this documented default does not establish which provider is selected. See [the extraction adapter](./docs/eng/extraction-adapter.md) and [current-state evidence](./docs/CURRENT_STATE.md).

## Verification

```bash
pnpm validate:env
pnpm typecheck
pnpm db:migrate
pnpm db:seed
pnpm test:tenant
pnpm test:award-desk
pnpm test:case-cards
pnpm test:upload-desk
pnpm test:rule-library
pnpm build
pnpm smoke:production
npx workos doctor --json --skip-ai
npx workos verify-login --json
```

Real secrets belong only in `.env.local` or the deployment environment. `.env.local` is ignored by Git.

The default production smoke check targets `https://www.trace-li.com`. Set `TRACELI_BASE_URL` to check another deployment without changing the script.

The [read-only evidence contract](./docs/AGENT_READ_CONTRACT.md) has a local fictional-data demonstration and PostgreSQL boundary tests (`pnpm test:agent`). It is not a deployed MCP endpoint or a verified integration with a buyer's agent. Follow the isolated-fixture setup in that document; these tests never load `.env.local`.
