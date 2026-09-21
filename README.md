# Traceli

Traceli is the award-assurance layer for donor-funded procurement. It keeps the rules, tender criteria, supplier evidence, reviewer judgment, clarifications, approvals, and decision chronology connected so an accountable buyer can **prove the award before signing it**.

## Current pilot baseline

- A public award-assurance story at `/` and a 44-second illustrative film.
- The current public Trace simulation at `/demo`: fictional evidence, deterministic checks, browser-only human review and a demonstration JSON download.
- The earlier procurement walkthrough remains at `/demo/classic`.
- A protected workspace boundary at `/workspace` using WorkOS AuthKit.
- A non-production Lakebase Postgres control graph with tenant-scoped reads, a restricted application role, and row-level isolation.
- Source-linked requirements, submissions, clarifications, approvals, and audit chronology using fictional demo data.
- A SHA-256 event chain that makes an edited or missing audit snapshot visibly detectable, with the first authenticated human determination persisted as a server audit/outbox transaction.
- Strict TypeScript and production-build checks.
- Automated CI against an isolated Postgres service, including row-level tenant and append-only audit tests.
- Production security headers, environment-contract validation, dependency and secret scanning, and a daily public smoke check.

This is a demonstration baseline, not yet a production document system. One fictional award and clarification finding now persist in a non-production tenant-safe sandbox; the remaining workflow is still browser-local. Document encryption, malware scanning, retention controls, broader command persistence, and signed event seals are sequenced in [the implementation plan](./docs/IMPLEMENTATION_PLAN.md).

The canonical public-message, visual-identity, iconography, affiliation, and demonstration rules live in [the Traceli brand system](./docs/BRAND_SYSTEM.md). Reusable category, campaign and call language lives in [the GTM messaging guide](./docs/GTM_MESSAGING.md). Economic-value logic, pilot measurement, and ROI claim boundaries live in [the ROI and value-case framework](./docs/ROI_VALUE_CASE.md). Public consequence claims and the recommended ten-day case-study sprint live in [the evidence register](./docs/PUBLIC_CASE_STUDY_REGISTER.md).

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

WorkOS and database variables are required for the protected workspace. Without them, the app fails closed and keeps the clearly labelled fictional demo separate and portable.

## Verification

```bash
pnpm validate:env
pnpm typecheck
pnpm db:migrate
pnpm db:seed
pnpm test:tenant
pnpm build
pnpm smoke:production
npx workos doctor --json --skip-ai
npx workos verify-login --json
```

Real secrets belong only in `.env.local` or the deployment environment. `.env.local` is ignored by Git.

The default production smoke check targets `https://www.trace-li.com`. Set `TRACELI_BASE_URL` to check another deployment without changing the script.

The [read-only evidence contract](./docs/AGENT_READ_CONTRACT.md) has a local fictional-data demonstration and PostgreSQL boundary tests (`pnpm test:agent`). It is not a deployed MCP endpoint or a verified integration with a buyer's agent. Follow the isolated-fixture setup in that document; these tests never load `.env.local`.
