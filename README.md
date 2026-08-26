# Traceli

Traceli is a continuous procurement-assurance workspace. It keeps the rules, tender criteria, supplier evidence, reviewer judgment, clarifications, approvals, and decision chronology connected so a buyer can answer one question quickly: **why did this supplier win?**

## Current pilot baseline

- A public 90-second DIHAD story at `/`.
- A protected workspace boundary at `/workspace` using WorkOS AuthKit.
- A non-production Lakebase Postgres control graph with tenant-scoped reads, a restricted application role, and row-level isolation.
- Source-linked requirements, submissions, clarifications, approvals, and audit chronology using fictional demo data.
- A SHA-256 event chain that makes an edited or missing audit snapshot visibly detectable, with the first authenticated human determination persisted as a server audit/outbox transaction.
- Strict TypeScript and production-build checks.

This is a demonstration baseline, not yet a production document system. One fictional award and clarification finding now persist in a non-production tenant-safe sandbox; the remaining workflow is still browser-local. Document encryption, malware scanning, retention controls, broader command persistence, and signed event seals are sequenced in [the implementation plan](./docs/IMPLEMENTATION_PLAN.md).

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

WorkOS and database variables are required for the protected workspace. Without them, the app fails closed and keeps the clearly labelled fictional demo separate and portable.

## Verification

```bash
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm db:migrate
pnpm db:seed
pnpm test:tenant
pnpm build
npx workos doctor --json --skip-ai
npx workos verify-login --json
```

Real secrets belong only in `.env.local` or the deployment environment. `.env.local` is ignored by Git.
