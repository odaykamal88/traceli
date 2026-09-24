# Case Card Phase 0 — publishable public case

Status: rails in place. Global Fund case #1 publishes founder Freeze #1 (24 September 2026). Other cards remain fixtures.
Code: `lib/field-registry/case-card.ts`, `lib/case-cards/`, `app/cases/`, `app/api/cases/[slug]/route.ts`.
Upstream: [award-desk-freeze.md](./eng/award-desk-freeze.md), [field-registry-v1.md](./eng/field-registry-v1.md), [donor-pack-global-fund-v1.md](./eng/donor-pack-global-fund-v1.md).

Trace-li Case Cards are the public cite path for a frozen Field Registry record. The page and the JSON export show the same facts. A card that does not yet have a founder-confirmed freeze says so, and it does not invent snapshot or packs hashes.

## Definition of done

A public case is publishable when all of the following are true:

1. **Real desk freeze.** The card’s `frozenRecord` is a `frozen-decision-record-v1` body that `verifyFrozenRecord` accepts. `snapshotHash` and `packsHash` come from `freezeAtJudgment` (`sha256:sorted-json-v1`). A fixture of the registry shape is allowed only while `recordKind` is `fixture` and `publicationState` is `awaiting_founder_freeze`. Fixture hashes stay `null`.
2. **Redaction.** The card states what is public and what is withheld (`case-card-redaction-v1`). No supplier names, staff names, file bytes, bid prices, or customer packets are added beyond the primary source.
3. **Primary sources.** At least one issuing-institution URL, with publisher, date, and locator. The public file’s sha256, when recorded, is labeled as a source-file hash, not a freeze hash.
4. **Founder-in-loop.** A person confirms the freeze, the redaction, and the wording before `publicationState` becomes `published`. This check is not a substitute for the OIG’s own findings.
5. **JSON export.** `/cases/[slug].json` and `/api/cases/[slug]` return `case-card-export-v1` with the same facts as the HTML page.
6. **Pattern tickets.** One or more stable ticket ids from the Pattern ticket store are attached. Stubs may ship before a pack rule exists. The id does not change when the rule later lands.

Claim boundary: pre-signature award assurance and a missing-evidence surface. Do not write that Trace-li prevents fraud, certifies a principal recipient, or implies the issuing institution is a customer or endorser.

## Case #1 — GF-OIG-25-005

Slug: `gf-oig-25-005`.
Route: `/cases/gf-oig-25-005`.
Export: `/cases/gf-oig-25-005.json`.

This is the Global Fund Office of the Inspector General audit *Global Fund Grants to the Togolese Republic*, 4 June 2025. Finding 4.4 is the procurement-file slice: incomplete non-health files, competition exceptions that were not consistently documented, and contract extensions without a recorded authorizing authority. The OIG rated the Principal Recipient’s procurement and financial controls **Partially Effective**.

The card publishes founder Freeze #1, a thin rehearsal: 0 pack fields mapped from the packet, readiness red, 22 findings, disposition evidence requested. `publicationState` is `published`. The OIG narrative is still the public finding. The freeze does not say Trace-li prevented it. A stronger finding-slice packet can re-freeze later.

Public PDF: <https://www.theglobalfund.org/media/gbqltprg/oig_gf-oig-25-005_report_en.pdf>
Retrieved: 23 September 2026.
PDF sha256: `fb54a35e9d7a71cbbe893d0fa2108113283ade43d2b99bb81a6f471fa68a12a8`

That digest is the source file. It is stored on field provenance as `sourceFileHash` and on `primarySourceFile.sha256`. It is not `snapshotHash` or `packsHash`.

`gfOig25005FixtureSnapshot()` remains the public-source reading of finding 4.4 (objective rating and sample size included). It does not invent integrity-due-diligence results the audit did not publish. The published export drops that fixture and shows the synthetic rehearsal snapshot inside the verified frozen record. `packScope` stays `finding-slice`. The Global Fund pack `2026.2` is stamped in force on the freeze.

Pattern tickets on the card:

| Id | Pack rule | Field key |
| --- | --- | --- |
| `pt:gf-oig-25-005:competition-exception-docs` | `gf_procurement_competition_docs` | `procurement.competition_or_exemption_documented` |
| `pt:gf-oig-25-005:procurement-file-completeness` | none yet | `procurement.file_completeness` |
| `pt:gf-oig-25-005:extension-authority` | none yet | `procurement.extension_authority_documented` |

Store: `lib/case-cards/pattern-tickets.ts`. Schema: `pattern-ticket-v1`. Status on these three is `stub`.

### Drop-in

Set `frozenRecord` on the draft in `lib/case-cards/gf-oig-25-005.ts` to a record already accepted by `verifyFrozenRecord`. `publishCaseCard` then switches the export to `recordKind: frozen`, copies the verified hashes, and drops the fixture snapshot so the page does not show two records. Re-check redaction and the founder gate before calling the result published. The HTML and JSON both read that export.

## Export shape (`case-card-export-v1`)

| Field | Fixture | Published freeze |
| --- | --- | --- |
| `product` | `Trace-li` | `Trace-li` |
| `recordKind` | `fixture` | `frozen` |
| `publicationState` | `awaiting_founder_freeze` | `published` |
| `frozenRecordSchemaVersion` | `frozen-decision-record-v1` | `frozen-decision-record-v1` |
| `packsStamped` | `false` | `true` |
| `readiness`, `snapshotHash`, `packsHash`, `hashMethod`, `frozenRecordId` | `null` | taken from the verified record |
| `fixtureSnapshot` | `award-registry-snapshot-v1` | `null` |
| `frozenRecord` | `null` | the verified body |
| `patternTicketIds` / `patternTickets` | stable ids and the ticket bodies | same |
| `primarySources` / `primarySourceFile` | issuing URL and optional file sha256 | same |
| `redaction` | public vs withheld | same |
| `narrative` / `findings` | the wording the page shows | same |

`confidence` on a fixture field is not a fraud probability. On the public-source helper for GF-OIG-25-005 it is `1` because the value is a direct statement from the public report, and `verificationMethod` stays `unverified`. The published freeze uses the rehearsal snapshot (`adapter_extract`, confidence `0` on unmapped fields).

## Later public fixtures

UNFPA and OCHA cards use the same fixture contract and the same drop-in. Their packs, ticket ids, and the founder-freeze promotion steps are in [case-factory-unfpa-ocha.md](./case-factory-unfpa-ocha.md). Those cards also leave `snapshotHash` and `packsHash` null until a real desk freeze is checked in.

## Tests

```sh
pnpm test:case-cards
pnpm typecheck
pnpm build
```
