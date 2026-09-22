# Award desk → freezeAtJudgment wire

Status: demo disposition freeze. 22 September 2026.
Code: `lib/field-registry/award-desk-freeze.ts`, `app/demo/actions.ts`, `app/demo/award-desk.tsx`.
Upstream: [field-registry-v1.md](./field-registry-v1.md), [contradiction-judgment-v0.md](./contradiction-judgment-v0.md), [donor-packs-v1.md](./donor-packs-v1.md), [spine-p0-p1-p3.md](./spine-p0-p1-p3.md).

## Why

Disposition on the public Award desk used to be browser-only (`sessionStorage` packs + reason). A published case needs a real Trace freeze: registry fields + provenance + packs in force + human disposition + pipeline status. This wire calls the existing `freezeAtJudgment` / `verifyFrozenRecord` helpers. It does **not** invent a parallel freeze format, call Talonic, or open a login desk.

## When freeze runs

```text
/demo disposition Confirm
        │
        ▼
sanitizeDisposition (client)          reason + decision + governing packs
        │
        ▼
freezeAwardDeskDispositionAction      server action (demo only)
        │
        ▼
freezeAwardDeskDisposition
        ├─ awardDeskShelterSnapshot()     RFP-2026-041 fields (present | missing | negative)
        ├─ packToggleFromRulePack(...)    orgDefault true for each governing pack
        ├─ judgeAwardDeskPacks
        │     donor packs in force? → evaluateDonorPacks(global-fund | fcdo-prime)
        │     else                  → evaluateJudgment(SYNTHETIC_SHELTER_RULES)
        ├─ dispositionFromAwardDeskDecision
        └─ freezeAtJudgment → verifyFrozenRecord
        │
        ▼
AwardDeskFrozenRecordView             recordId, snapshotHash, packsHash, readiness…
        │
        ▼
sessionStorage                        disposition + frozen view (demo souvenir)
        │
        ▼
/demo/.../record                      “Record frozen · verified” + short hashes
```

Fixed demo clock: `AWARD_DESK_FREEZE_AT` / `AWARD_DESK_FREEZE_BY` (`user_leila`). Exception dispositions auto-attach `AWARD_DESK_DEMO_WAIVER` so the registry waiver rule stays satisfied without a new form.

## What is snapshotted

| Layer | Contents |
| --- | --- |
| Snapshot | Synthetic `AwardRegistrySnapshot` for `rfp-2026-041`: Kenya capacity present, Ethiopia missing, coverage declared vs supported disagree, plus a negative Ethiopia-denial sentinel. Every field carries provenance hashes and `sourceRef` — never file bytes. |
| Packs | Rule library packs marked in force at confirm, stamped with freeze actor/time. Donor catalog ids `global-fund` and `fcdo-prime` map 1:1 via `packToggleFromRulePack`. |
| Judgment | `PipelineStatus` from donor packs when those ids are in force; otherwise synthetic shelter rules (Ethiopia gap → red readiness on the default desk). Findings themselves stay off `frozen-decision-record-v1`; they match later via `snapshotHash`. |
| Disposition | Mapped Award desk id → registry decision (`request` → `request_evidence`, etc.). |

`verifyFrozenRecord` runs inside `freezeAtJudgment` and again before the view is returned. A rewritten clone fails hash checks in tests the same way as the Field Registry suite.

## Demo surface

Confirming disposition on `/demo/rfp-2026-041/disposition` freezes and navigates to the decision record. The record shows record id, truncated snapshot/packs hashes (full hash in `title`), pipeline readiness, and finding count. The public demo still does not persist a tenant row or export an audit pack — the freeze is a session souvenir that proves the spine.

## Non-goals

- WorkOS login / tenant upload desk
- Live Talonic HTTP
- Audit export packaging (P6)
- Homepage / film changes
- Encoding new donor packs

## Tests

```sh
pnpm test:award-desk-freeze
pnpm test:award-desk
pnpm test:field-registry
pnpm test:contradiction
pnpm test:donor-packs
pnpm test:extraction
pnpm test:rule-library
pnpm typecheck
```
