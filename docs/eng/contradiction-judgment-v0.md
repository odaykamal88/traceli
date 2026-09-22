# Contradiction / judgment v0

Status: P4 scaffold. 22 September 2026.
Code: `lib/field-registry/judgment.ts`.
Upstream contracts: [field-registry-v1.md](./field-registry-v1.md), [spine-p0-p1-p3.md](./spine-p0-p1-p3.md), [extraction-adapter.md](./extraction-adapter.md).

Contradiction and judgment read **Field Registry fields only**. They never open file bytes, never call a vendor extractor, and never ask a model to decide an award. Donor guideline interpretation stays Trace-owned rule content expressed against registry keys. Extraction remains rented; this loop stays Trace IP.

Award desk UX disposition now calls `freezeAwardDeskDisposition` (see [award-desk-freeze.md](./award-desk-freeze.md)). This judgment slice still owns only the evaluator and fixtures.

## Place in the spine

```text
P2  extract → Fragment[]                         (rented)
P1  map → AwardRegistrySnapshot                  (owned)
P3  PlaybookEvaluate → PipelineStatus            (later; packs + fields)
P4  evaluateJudgment(snapshot, rules) → JudgmentResult   (this slice)
        │
        ├─ findings[]           structured contradictions / gaps
        └─ pipelineStatus       ready for freezeAtJudgment
P4  human Disposition                            (stub; Award desk today)
P1  freezeAtJudgment(snapshot, packs)            packs.pipelineStatus ← judgment
P0  persist + verifyFrozenRecord
P6  audit export of the frozen record            (later)
```

v0 proves the contract with a deterministic evaluator and synthetic fixtures. It does not ship donor rule packs or chat personas.

## Inputs

| Input | Role |
| --- | --- |
| `AwardRegistrySnapshot` | Typed field values with provenance (`present` / `missing` / `negative`). |
| `JudgmentRule[]` | Donor-agnostic (or later donor-scoped) checks expressed against **registry field keys**, not NLP over PDFs. |

Optional playbook / rule-library outcomes may already appear as registry-facing findings or as field values. v0 does not pull live Rule library board state. Pack toggles remain P3's concern; judgment here reads the snapshot the freeze will hash.

The evaluator never accepts:

- `RawFile`, `Uint8Array`, or a file path
- A Talonic / vendor extraction payload
- Free-form chat turns or agent personas

## Outputs

### Finding

`Finding` (`registry-finding-v0`) is one structured outcome:

| Field | Meaning |
| --- | --- |
| `findingId` | Stable id for this evaluation (deterministic from rule + involved fields). |
| `kind` | `required_missing`, `values_disagree`, or `contradiction`. |
| `severity` | `info`, `warning`, or `blocker`. |
| `code` | Short machine code such as `required_field_missing`. |
| `ruleId` | Which judgment rule fired. |
| `title`, `summary` | Human-readable; no file body. |
| `involvedFieldKeys` | Registry keys the rule compared. |
| `involvedFieldIds` | Field ids when those keys were present on the snapshot. |
| `evidence` | Pointers into **registry provenance** only: `fieldId`, `fieldKey`, `sourceFileHash`, `sourceRef`. Not blobs. |

A `Contradiction` is the same schema with `kind: 'contradiction'` (or `values_disagree` for the pairwise agreement rule). Callers may filter by kind; there is no separate third-party rules API.

### JudgmentResult

`JudgmentResult` (`judgment-result-v0`) carries:

- `evaluatedAt`
- `snapshotHash` — `sha256:sorted-json-v1` of the snapshot (same method as freeze), so a later case study can attach findings to a frozen record without re-reading source files
- `findings[]` — at most 64
- `pipelineStatus` — `pipeline-status-v1` ready to pass into `freezeAtJudgment`

`pipelineStatus` mapping:

| Source | Pipeline field |
| --- | --- |
| Every rule | `deterministicFlags[]` with `flagId`, `code`, `passed` |
| Failures with kind `contradiction` or `values_disagree` | ids also listed in `semanticAnomalyIds` |
| No blocker findings, no warning findings | `readiness: green` |
| Warnings only | `amber` |
| Any blocker | `red` |

`unknown` remains the freeze default when judgment has not run. A green/amber/red status means this evaluator ran.

## How this feeds `freezeAtJudgment`

```ts
const judgment = evaluateJudgment(snapshot, SYNTHETIC_SHELTER_RULES)
const record = freezeAtJudgment(snapshot, {
  recordId,
  supersedesRecordId: null,
  frozenAt,
  frozenBy,
  packs,
  disposition,
  pipelineStatus: judgment.pipelineStatus,
})
```

The frozen record already stores `pipelineStatus`. Findings themselves are not yet a separate column on `frozen-decision-record-v1`. For a public case study or audit export:

1. Recompute or store `JudgmentResult` beside the record (P5/P6).
2. Match on `snapshotHash` — identical to `FrozenDecisionRecord.snapshotHash`.
3. Follow each finding's `evidence[].sourceFileHash` + `sourceRef` into the frozen snapshot's field provenance. Do **not** open the original PDF to explain the finding.

Batch B can persist findings onto the record schema or an adjacent append-only table. v0 does not change the freeze helper shape beyond consuming the existing optional `pipelineStatus`.

## Deterministic scaffold

`evaluateJudgment(snapshot, rules)` in `lib/field-registry/judgment.ts`:

- Parses the snapshot with `awardRegistrySnapshotSchema`.
- Runs each rule against field keys only.
- Emits stable finding ids (`finding_<ruleId>_<keys…>` clipped to the id pattern).
- Builds `pipelineStatus` and returns a parsed `JudgmentResult`.

Built-in rule kinds:

| Kind | Fail when |
| --- | --- |
| `required_present` | No field with that key, or value state is `missing`. |
| `values_must_agree` | Both keys are `present` (or `negative`) and scalar values differ; or exactly one side is present while the other is missing. |
| `value_must_equal` | Field missing, or `present`/`negative` scalar differs from the rule's `expected`. Wrong value emits kind `contradiction`; missing emits `required_missing`. |

`SYNTHETIC_SHELTER_RULES` is a fixture pack for `RFP-2026-041`-shaped snapshots. It is not official donor text. Live v1 donor packs (`global-fund`, `fcdo-prime`) live under `lib/field-registry/packs/` and are documented in [donor-packs-v1.md](./donor-packs-v1.md).

## Non-goals (v0)

- No LLM-as-judge over PDFs, annexes, or mail bodies
- No multi-agent or chat UI
- No Talonic credentials, network calls, or vendor payload types
- No audit export packaging (P6)
- No homepage / film / demo marketing changes
- PlaybookEvaluate is implemented thinly as `evaluatePlaybook` over donor pack ids; it still calls `evaluateJudgment` rather than a parallel engine

Donor-specific hard rule packs for Global Fund and FCDO primes are in [donor-packs-v1.md](./donor-packs-v1.md).
Award desk freeze wiring: [award-desk-freeze.md](./award-desk-freeze.md).

## Ownership

| Keep | Refuse |
| --- | --- |
| Finding / Contradiction / JudgmentResult schemas | Reading raw files inside judgment |
| Deterministic rules over registry keys | Outsourcing donor interpretation to a model or vendor “rules API” |
| Mapping into `PipelineStatus` for freeze | Treating a model output as the award decision |
| Evidence pointers via provenance hashes and `sourceRef` | Storing file bytes on findings |

## Tests

```sh
pnpm test:contradiction
pnpm test:donor-packs
pnpm test:award-desk-freeze
pnpm test:field-registry
pnpm test:extraction
pnpm test:rule-library
pnpm test:award-desk
```

The contradiction suite covers at least one pass fixture (required fields present and agreeing) and one fail fixture (required missing and/or disagreeing values), and proves a failing judgment's `pipelineStatus` can ride into `freezeAtJudgment`. Award desk disposition freeze is covered by `pnpm test:award-desk-freeze`. Donor pack suites add GF and FCDO-prime pass/fail fixtures on the same evaluator.
