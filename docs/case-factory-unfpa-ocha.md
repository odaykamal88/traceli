# UNFPA and OCHA case factory

Status: thin packs, fixture Case Cards, and Pattern tickets. 24 September 2026.
Code: `lib/field-registry/packs/unfpa.ts`, `lib/field-registry/packs/ocha-cbpf.ts`, `lib/case-cards/`, `lib/case-cards/pattern-tickets.ts`.
Upstream: [case-card-phase0.md](./case-card-phase0.md), [donor-packs-v1.md](./eng/donor-packs-v1.md).

This slice closes the research-to-factory gap for the public UNFPA and OCHA notes. The notes stay the GTM layer. The packs, cards, and tickets are the compounding layer.

## What shipped

| Piece | Id | Honesty |
| --- | --- | --- |
| UNFPA pack | `unfpa` `2026.1` | OAIS-shaped public-control synthesis. Not a UNFPA manual and not a live UN desk run. |
| OCHA CBPF pack | `ocha-cbpf` `2026.1` | Global Guidelines–shaped. Not OneGMS and not a live OCHA desk run. |
| Case Cards | five fixtures under `/cases` | `recordKind: fixture`, `publicationState: awaiting_founder_freeze`. Snapshot and packs hashes are null. |
| Pattern tickets | `lib/case-cards/pattern-tickets.ts` | Status `stub`. A non-null `ruleId` is a rule the thin pack already runs. |

The signed-in desk pack picker reads `listDonorPacks()`. Choosing `unfpa` or `ocha-cbpf` uses the same upload, judgment, and `freezeAtJudgment` path as `global-fund` and `fcdo-prime`.

Judgment accepts at most 64 rules in one evaluation. Each of these packs is under that cap. Do not stamp every donor pack on one freeze. The upload desk sends one `packId`.

Trace-li does not fetch UNGM, VRC, IPRC, or a Secretariat partner-sanctions list. `misconduct.secretariat_sanctions_regime` must read `none` because OIOS 2025/098 ¶37 says that procedure did not exist. A completed forensic audit is not a CBPF signature gate. That non-equivalence is the ticket `pt:oios-2020-005:forensic-backlog-not-presignature`, which has no pack rule yet.

## Public cards

| Slug | Primary | Pack fields the fixture maps |
| --- | --- | --- |
| `unfpa-annex4-13-esa-ip` | OAIS Annex 4 entry 13 | `integrity.coi_declared`, `idd.vrc_iprc_status` |
| `unfpa-annex4-21-arab-vendor` | OAIS Annex 4 entry 21 | `integrity.related_party_checked`, `procurement.method_vs_threshold` |
| `unfpa-ia-2025-29-sudan` | IA/2025-29 | threshold approver, RFQ criteria and scores, purchase order, RIR |
| `oios-2025-098-cbpf-reserve` | OIOS 2025/098 | reserve justification, scorecard, OneGMS selection record, sanctions regime `none` |
| `oios-2020-005-iraq-forensic` | OIOS 2020/005 | forensic timing is not a pre-signature field |

Annex 4 stays region-banded. The cards do not add a country or a personal name for entries 13 and 21. The sha256 on each card is the public PDF retrieved 24 September 2026. It is not a freeze hash.

Pattern ticket ids are stable. Later pack edits keep the id and may set `ruleId` or move `status` from `stub` to `accepted`. `accepted` is a human step. Shipping the rule does not flip the status.

## How a founder freeze promotes a fixture

1. On the signed-in desk, select `unfpa` or `ocha-cbpf` and freeze a real packet. `freezeAtJudgment` produces `snapshotHash` and `packsHash` with `sha256:sorted-json-v1`. Do not type those hashes by hand.
2. Confirm redaction. The public card still withholds supplier names, staff names, file bytes, and bid prices that the primary source did not already print.
3. In the card draft (`frozenRecord: null` today), set `frozenRecord` to that verified record. `publishCaseCard` runs `verifyFrozenRecord` before it shows a hash.
4. The export switches to `recordKind: frozen` and `publicationState: published`, copies the verified hashes, and drops `fixtureSnapshot` so the page does not show two records.
5. Re-read the narrative. A freeze does not change the oversight finding into a Trace-li prevention claim, a criminal verdict, a recovered loss, or a completed management action.

Until step 3, the public page keeps the label **Fixture · awaiting founder freeze**. This repository does not claim a UN office has ingested a packet.

## Tests

```sh
pnpm test:donor-packs
pnpm test:case-cards
pnpm test:upload-desk
pnpm test:rule-library
pnpm typecheck
```
