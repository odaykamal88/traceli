# Field Registry v1

Status: schema and freeze helper. 22 September 2026.
Code: `lib/field-registry/`.
Ownership and sequencing: [spine-p0-p1-p3.md](./spine-p0-p1-p3.md).

The registry is the award-shaped snapshot that rules, judgment, and the frozen record share. Award desk, the Rule library, and the synthetic Trace unit stay in place. This module sits beside them. It is not wired into the public demo, and it does not persist rows.

Import it from server and test code:

```ts
import { freezeAtJudgment, verifyFrozenRecord } from '@/lib/field-registry'
```

The entry module is `server-only` because freeze hashing uses `node:crypto`. Client components keep using `lib/award-desk.ts` and `lib/rule-library.ts`.

## Snapshot

`AwardRegistrySnapshot` (`award-registry-snapshot-v1`) carries:

| Field | Role |
| --- | --- |
| `registryVersion` | Monotonic version for this award's snapshot. A correction is a new version, then a new frozen record. |
| `classification` | `synthetic` or `customer`. The public demo stays synthetic. A `customer` value is not permission to store buyer files. |
| `organizationId`, `projectId`, `awardId` | Tenant and award identity. Platform compares `organizationId` to the server session. |
| `procurementReference` | Human reference such as `RFP-2026-041`. |
| `donor`, `framework` | Donor id and name, framework id, name, and version. Illustrative fixtures are not official donor text. |
| `fields` | Typed values with provenance. At most 256. Field ids are unique. One value per entity id plus key. |
| `asOf` | When this snapshot was assembled. |

Entity kinds: `award`, `supplier`, `requirement`, `criterion`, `evidence`, `finding`. Field keys are lowercase dotted names such as `capacity.ethiopia`.

## Provenance

Every field value includes:

| Field | Meaning |
| --- | --- |
| `sourceFileHash` | SHA-256 of the source bytes, 64 hex characters. The snapshot stores the hash, not the bytes. |
| `sourceRef` | `kind` of `page`, `node`, `cell`, or `message`, plus that location's id. `message` is the mail or chat message id. Optional `label` is a display locator such as `Annex B`. |
| `extractedAt` | When the value was taken from the source. This can be earlier than judgment. |
| `confidence` | Number from 0 to 1, produced by the extractor or a reviewer. |
| `verificationMethod` | `unverified`, `adapter_extract`, `human_confirmed`, or `deterministic_check`. |

A field that omits provenance fails validation.

## Value states

`present`, `missing`, and `negative` are different states.

| State | Use on the fictional shelter award |
| --- | --- |
| `present` | Kenya hub letter is on file. `value` is the normalized scalar (string, finite number, or boolean). |
| `missing` | Ethiopia is named in Annex B and no capacity letter is linked. `reason` says what was looked for. This is not a finding that capacity is absent in the world. |
| `negative` | A source supports an adverse fact, for example a letter that denies an Ethiopia warehouse. `value` holds that fact. |

A boolean `false` inside `present` or `negative` is a real value. It is not the missing state.

## Packs in force

A pack enters freeze only while its toggled scope has `orgDefault: true`, matching the Rule library in-force switch (`onBoard && orgDefault` in `isPackInForce`). `showOnRecord` may still be false: the pack applied, and the donor-facing table may hide it, which is the same split as `packsShownOnRecord`.

Each frozen pack stores:

- `packId`, `version`, `name`
- `toggledScope` (`orgDefault`, `showOnRecord`, `category`)
- `frozenAt`, `frozenBy`, stamped from the judgment

`freezeAtJudgment` sorts packs by `packId` so two boards with the same packs freeze to the same `packsHash`.

`packToggleFromRulePack` copies a `RuleLibraryPack`. Pass `orgDefault: false` through and the schema rejects it. Omit `orgDefault` only for a pack that `freezeGoverningPacks` already selected as in force; the bridge then records `true`.

## Disposition stub

`Disposition` is the human judgment. It does not run the judgment.

| Award desk id | Registry decision |
| --- | --- |
| `request` | `request_evidence` |
| `exception` | `accept_with_exception` |
| `escalate` | `escalate` |

`dispositionFromAwardDeskDecision` performs that map. `accept_with_exception` and `override_assessment` require at least one waiver ref (`waiverId`, `authorityRef`). Other decisions reject waiver refs. Rationale is 20 to 2,000 characters, the same bounds as `sanitizeDisposition` and the Trace decision input.

The actor id and role are recorded on the disposition. Allowed roles match `workspaceRoleLabels` in `lib/workspace-policy.ts`. Which roles may actually freeze is a Platform command policy, not this schema. The demo's named reviewer remains on the Award desk record until P5 persists a server actor.

Trace decisions that are not on the Award desk (`accept_assessment`, `request_rule_review`, `override_assessment`, `decline_decision`) are in the same enum so the later server record has one vocabulary.

The disposition actor must equal `frozenBy`, and the disposition timestamp must equal `frozenAt`.

## Pipeline status stub

`PipelineStatus` (`pipeline-status-v1`) holds:

- `deterministicFlags`: `{ flagId, code, passed }[]`
- `semanticAnomalyIds`: string ids
- `readiness`: `unknown`, `red`, `amber`, or `green`

Omitted status becomes empty flags and readiness `unknown`. `unknown` means the loop has not run. It is not an amber judgment and not a negative finding. P4's deterministic evaluator in [contradiction-judgment-v0.md](./contradiction-judgment-v0.md) fills flags, anomaly ids, and readiness from registry fields only.

`PlaybookEvaluate` in `lib/field-registry/playbook.ts` is the later function type. Its input is the snapshot and the pack toggles. It has no file parameter.

## Freeze contract

```ts
freezeAtJudgment(snapshot, packs) -> FrozenDecisionRecord
```

`packs` is the bundle:

```ts
{
  recordId,
  supersedesRecordId, // null on the first record; a correction points at the prior record id
  frozenAt,
  frozenBy,
  packs: PackToggle[],
  disposition,
  pipelineStatus?, // optional
}
```

The record (`frozen-decision-record-v1`) contains the parsed snapshot, `snapshotHash`, `packsHash`, `hashMethod` (`sha256:sorted-json-v1`), the stamped `packsInForce`, the disposition, and the pipeline status.

`snapshotHash` covers the snapshot only. Changing packs changes `packsHash` and leaves `snapshotHash` the same. That split is what makes a later pack toggle unable to move the snapshot hash, and unable to move the frozen pack list either: the list is a copy stamped at judgment, then frozen.

`verifyFrozenRecord` reparses a stored record, recomputes both hashes, and checks that every pack still carries the judgment actor, time, and in-force scope. Platform runs it on read. A clone with an edited pack version or an edited field fails.

The helper is pure. It clones inputs before hashing, so a later edit to the caller's snapshot or pack array does not change the record. It does not authenticate the actor. Platform passes the server-derived id.

### Immutability

Three layers hold the freeze:

1. **Types.** `FrozenDecisionRecord` is a deep readonly object. TypeScript callers cannot assign to `snapshotHash` or push onto `packsInForce` without a cast.
2. **Runtime.** `freezeAtJudgment` deep-freezes the record. In strict code, assignment and `push` throw `TypeError`.
3. **Hashes.** `verifyFrozenRecord` rejects a copy whose snapshot or pack list no longer matches `snapshotHash` and `packsHash`. Object freeze stops casual mutation. The hashes stop a rewritten JSON body at the persistence boundary.

A new judgment after someone turns a pack off is a new record. The previous record id stays as it was. Link corrections with `supersedesRecordId`. Do not update the old row.

## Extraction adapter

P2 now has a provider interface, an offline mock, and a Talonic skeleton. The contract, environment variables, and the buy-versus-build line are in [extraction-adapter.md](./extraction-adapter.md).

`ExtractionProvider.extract` returns `ExtractionResult`: a file hash plus `Fragment` values. The fragment schema is still the registry's. A fragment has an id, `sourceFileHash`, `sourceRef`, text, `extractedAt`, `confidence`, and `extractorId`. Optional `kind`, `tags`, and `spans` are closed hints for later alignment (`pricing_table`, `waiver`, `email_header`, and the other names in `fragmentKindHints`). The schema rejects unknown keys, including `bytes` and any vendor payload.

`fragmentsTowardRegistryDraft` turns hinted fragments into a partial draft. That draft is not an `AwardRegistrySnapshot`. `freezeAtJudgment` will not accept it. Rules and freeze do not import a provider.

## Limits

- 256 fields, 64 packs, 64 flags, 64 anomaly ids, 16 waiver refs.
- Field text up to 4,000 characters. Fragment text up to 16,000. Rationale 20 to 2,000.
- Identifiers match the Trace id pattern: they start with a letter or digit and then allow letters, digits, `.`, `_`, `:`, and `-`, up to 160 characters.
- Hashes are 64 lowercase hex characters.

These bounds are v1 payload limits so a snapshot cannot grow without a schema change.

## Tests

```sh
pnpm test:field-registry
```

The suite uses the fictional `RFP-2026-041` shelter award and the seeded Rule library packs. It checks provenance, the three value states, pack-order stability of the hashes, runtime freeze, Award desk decision mapping, waiver rules, fragment shape, and this acceptance case: `toggleOrgDefault` after `freezeAtJudgment` leaves the frozen pack list and the snapshot hash unchanged, while a second freeze of the live board gets a different `packsHash` and the same `snapshotHash`.

`pnpm test:rule-library` and `pnpm test:award-desk` cover the demo freeze that this schema does not replace.
