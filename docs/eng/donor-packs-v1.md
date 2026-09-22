# Donor packs v1 (Global Fund + FCDO prime)

Status: thin hardcoded packs. 22 September 2026.
Code: `lib/field-registry/packs/`.
Upstream: [field-registry-v1.md](./field-registry-v1.md), [contradiction-judgment-v0.md](./contradiction-judgment-v0.md), [spine-p0-p1-p3.md](./spine-p0-p1-p3.md).
Pack briefs: [donor-pack-global-fund-v1.md](./donor-pack-global-fund-v1.md), [donor-pack-fcdo-prime-v1.md](./donor-pack-fcdo-prime-v1.md).

## Why these two

V1 buyers are:

1. **Global Fund** NGO / high-capacity Principal Recipients and Sub-Recipients (primary).
2. **FCDO commercial primes** running award desks under FCDO-funded work (secondary / overlay).

Trace is not an AI chatbot wrapper. Extraction is rented; Field Registry, playbooks/rules, judgment, and freeze stay Trace-owned. Donor guideline interpretation is core IP — encoded here as deterministic checks against registry keys, never against raw file bytes or vendor extraction payloads.

## Case-factory loop

```text
public / customer packet
        │
        ▼
P2 extract → Fragment[]                 (rented)
        │
        ▼
P1 map → AwardRegistrySnapshot          (owned; present | missing | negative)
        │
        ▼
P3/P4 pack select → JudgmentRule[]
        │   packId: global-fund | fcdo-prime
        ▼
evaluateJudgment(snapshot, rules) → JudgmentResult
        │   Finding[] + PipelineStatus
        ▼
human Disposition → freezeAtJudgment
        │
        ▼
frozen record (snapshotHash + packsHash + pipelineStatus)
        │
        ▼
published case / audit export (later P5/P6)
```

Hardcoding these packs makes the loop runnable without a marketing site or an LLM trainer. Fixtures under `lib/field-registry/packs/fixtures.ts` are the synthetic packets that prove pass and fail for each pack.

## Selectable packs (one spine)

| `packId` | Audience | Module |
| --- | --- | --- |
| `global-fund` | GF PR / high-capacity SR award desks | `packs/global-fund.ts` |
| `fcdo-prime` | Commercial primes awarding under FCDO | `packs/fcdo-prime.ts` |

API:

```ts
import {
  evaluateDonorPack,
  evaluatePlaybook,
  packToggleForId,
  getDonorPack,
} from '@/lib/field-registry'

const judgment = evaluateDonorPack(snapshot, 'global-fund')
const status = evaluatePlaybook({
  snapshot,
  packs: [packToggleForId('global-fund')],
})
// freezeAtJudgment(..., { packs, disposition, pipelineStatus: judgment.pipelineStatus })
```

Both packs emit the same `Finding` / `JudgmentResult` / `PipelineStatus` shapes. Freeze does not fork.

Rule library catalog entries use the same ids (`global-fund`, `fcdo-prime`) so a later Award-desk toggle can become a `PackToggle` via `packToggleFromRulePack` without a second vocabulary.

## Parked (not v1 pack sources)

Do **not** encode as live packs in this slice:

| Parked | Why |
| --- | --- |
| USAID | Not a live v1 pack; keep illustrative ECHO-style fixture only if needed for demo. |
| UN agencies | Out of v1 buyer set. |
| EU / PRAG | Not a pack source for v1. |
| KOICA | Parked. |
| GIZ (as pack source) | Parked — may appear later as a buyer context, not this PR. |
| World Bank | Later. |
| MoH-first national systems | Not the v1 wedge. |

## Non-goals (this PR)

- Wiring freeze into Award desk UI (batch B)
- Real Talonic credentials / network calls
- Audit export packaging
- Homepage / film / GTM surfaces
- Full GF or FCDO regulation encyclopedias

## Tests

```sh
pnpm test:donor-packs
pnpm test:contradiction
pnpm test:field-registry
pnpm test:extraction
pnpm test:rule-library
pnpm test:award-desk
pnpm typecheck
```
