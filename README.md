# Traceli

Traceli is a continuous procurement-assurance workspace. It keeps the rules, tender criteria, supplier evidence, reviewer judgment, clarifications, approvals, and decision chronology connected so a buyer can answer one question quickly: **why did this supplier win?**

## Current pilot baseline

- A public 90-second DIHAD story at `/`.
- A protected workspace boundary at `/workspace` using WorkOS AuthKit.
- Source-linked requirements, submissions, clarifications, approvals, and audit chronology using fictional demo data.
- A SHA-256 event chain that makes an edited or missing audit snapshot visibly detectable.
- Strict TypeScript and production-build checks.

This is a demonstration baseline, not yet a production document system. Workspace state is currently fictional and browser-local. Server-side persistence, tenant isolation, document encryption, malware scanning, retention controls, and signed event seals are sequenced in [the implementation plan](./docs/IMPLEMENTATION_PLAN.md).

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

WorkOS variables are required for the real login boundary. Without them, the app intentionally falls back to a clearly labelled fictional workspace so the public demo remains portable.

## Verification

```bash
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm build
npx workos doctor --json --skip-ai
npx workos verify-login --json
```

Real secrets belong only in `.env.local` or the deployment environment. `.env.local` is ignored by Git.
