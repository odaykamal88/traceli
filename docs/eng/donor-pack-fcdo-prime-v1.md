# FCDO commercial-prime pack v1

Status: thin hardcoded pack. 23 September 2026.
Code: `lib/field-registry/packs/fcdo-prime.ts`, fixtures in `packs/fixtures.ts`.
Index: [donor-packs-v1.md](./donor-packs-v1.md).

Audience: **commercial primes’ award desks** awarding subcontractors / delivery-chain partners under FCDO-funded contracts. This pack is **not** “sell Trace-li to FCDO HQ.” It is an overlay with the same judgment spine as Global Fund. The sanctions controls are thinner than the Global Fund Restrictive Measures gate.

## Changelog

### 2026.2 — UK Sanctions List evidence overlay

Controls require attested screening evidence and a disposition when the result is not clear. There is **no in-desk live OFAC API**, no UK Sanctions List client, and no OpenSanctions client. Trace-li does not screen names. The scope token is exact: `uk-sanctions`. UN and OFAC tokens are not required on this pack; record them in `idd.screen_scope` when jurisdiction makes them relevant. List vintage is a warning. Disposition owner and rationale are warnings; the select / continue / terminate decision is the blocker.

## Public sources (eng citations)

| Source | Use in this pack |
| --- | --- |
| [FCDO Supply Partner Code of Conduct](https://assets.publishing.service.gov.uk/media/6343fb4fd3bf7f5877e5cca0/Code_of_Conduct.pdf) | Conflicts free from bias; declare COI; Business Appointment Rules for ex-FCDO/Crown staff in the preceding two years; compliance declaration themes |
| [Supply Partner Handbook](https://assets.publishing.service.gov.uk/media/6343fb8dd3bf7f586db4f1ff/Supply_Partner_Handbook.pdf) | COI governance; fair/transparent recruitment and competition hygiene for partners |
| [Supplier Code of Conduct (GOV.UK)](https://www.gov.uk/government/publications/supplier-code-of-conduct/supplier-code-of-conduct-html) | Reputation / eligibility screening themes; conflict mitigation; fair competition |
| FCDO standard terms / Annex 1b compliance declaration (referenced in Code FAQ) | Pre-award compliance declaration on file |
| [UK Sanctions List](https://www.gov.uk/government/publications/the-uk-sanctions-list) and [sanctions guidance for non-UK businesses](https://www.gov.uk/guidance/uk-sanctions-guidance-for-non-uk-businesses) | Attested UK Sanctions List scope; ownership / control and connected persons are separate diligence, not a second name search |
| [Ownership and control guidance](https://www.gov.uk/government/publications/ownership-and-control-public-officials-and-control-guidance/ownership-and-control-public-officials-and-control-guidance) | Connected-persons evidence on `idd.connected_persons` |
| Procurement Act 2023 debarment / exclusion (eligibility evidence only) | `idd.debarment_exclusion` must be present. This is not an implementation of the Act |

**Approximation note:** This pack does **not** encode the UK Procurement Act 2023 beyond debarment or exclusion eligibility evidence on the packet. Threshold alignment is a single registry boolean (`threshold.method_aligned`) produced by a prior mapping step against the prime’s own delegated thresholds — Trace-li checks the boolean, it does not re-implement public-contracting thresholds.

## Checks → registry keys → finding codes

| Theme | Rule id | Kind | Field key(s) | Finding code |
| --- | --- | --- | --- | --- |
| Eligibility / screening | `fcdo_eligibility_supplier_screened` | `value_must_equal` → `true` | `eligibility.supplier_screened` | `fcdo_eligibility_not_screened` |
| Conflict of interest | `fcdo_integrity_coi_declared` | `value_must_equal` → `true` | `integrity.coi_declared` | `fcdo_coi_not_declared` |
| Business Appointment Rules | `fcdo_integrity_business_appointment` | `required_present` | `integrity.business_appointment_checked` | `fcdo_business_appointment_unchecked` (warning) |
| Competition or documented direct award | `fcdo_procurement_fair_open_or_direct` | `value_must_equal` → `true` | `procurement.fair_open_or_documented_direct` | `fcdo_competition_not_satisfied` |
| Competition / direct-award docs | `fcdo_procurement_competition_docs` | `required_present` | `procurement.competition_or_direct_award_documented` | `fcdo_competition_docs_missing` |
| Evaluation notes | `fcdo_documentation_evaluation_notes` | `required_present` | `documentation.evaluation_notes_on_file` | `fcdo_evaluation_notes_missing` |
| Compliance declaration | `fcdo_documentation_compliance_declaration` | `required_present` | `documentation.compliance_declaration_on_file` | `fcdo_compliance_declaration_missing` |
| Key value on file | `fcdo_award_contract_value` | `required_present` | `award.contract_value_gbp` | `fcdo_contract_value_missing` |
| Key thresholds | `fcdo_threshold_method_aligned` | `value_must_equal` → `true` | `threshold.method_aligned` | `fcdo_threshold_method_misaligned` |
| Delivery chain | `fcdo_delivery_chain_partners` | `required_present` | `delivery_chain.partners_identified` | `fcdo_delivery_chain_unidentified` (warning) |
| Sanctions subject | `fcdo_idd_subject` | `required_present` | `idd.subject` | `fcdo_idd_subject_missing` |
| Subject kind | `fcdo_idd_subject_kind` | `value_must_be_one_of` `organization` \| `individual` | `idd.subject_kind` | `fcdo_idd_subject_kind_invalid` |
| Connected persons | `fcdo_idd_connected_persons` | `required_present` | `idd.connected_persons` | `fcdo_idd_connected_persons_missing` |
| UK Sanctions List scope | `fcdo_idd_uk_sanctions_scope` | `text_must_include` token `uk-sanctions` | `idd.screen_scope` | `fcdo_idd_uk_sanctions_scope_incomplete` |
| Screen date | `fcdo_idd_screen_date` | `required_present` | `idd.screen_date` | `fcdo_idd_screen_date_missing` |
| List vintage | `fcdo_idd_list_vintage` | `required_present` | `idd.list_vintage` | `fcdo_idd_list_vintage_missing` (warning) |
| Result | `fcdo_idd_screen_result` | `value_must_be_one_of` `clear` \| `potential_match` \| `confirmed_hit` \| `unresolved` | `idd.screen_result` | `fcdo_idd_result_invalid` |
| Evidence reference | `fcdo_idd_evidence_ref` | `required_present` | `idd.evidence_ref` | `fcdo_idd_evidence_missing` |
| Debarment / exclusion | `fcdo_idd_debarment_exclusion` | `required_present` | `idd.debarment_exclusion` | `fcdo_idd_debarment_missing` |
| Hit → decision | `fcdo_idd_hit_disposition_decision` | `required_when_value_in` when result is not `clear`; decision `select` \| `continue` \| `terminate` | `idd.disposition_decision` | `fcdo_idd_hit_needs_decision` |
| Hit → owner | `fcdo_idd_hit_disposition_owner` | same trigger | `idd.disposition_owner` | `fcdo_idd_hit_needs_owner` (warning) |
| Hit → rationale | `fcdo_idd_hit_disposition_rationale` | same trigger | `idd.disposition_rationale` | `fcdo_idd_hit_needs_rationale` (warning) |

A `clear` result does not require disposition fields. This overlay has no Global Fund modality, timing enum, or notification control.

Same pipeline: `evaluateDonorPack(snapshot, 'fcdo-prime')` → `JudgmentResult` → optional `freezeAtJudgment(..., { pipelineStatus })`. Gaps surface on the Award desk and freeze with `pipelineStatus`.

## Fixtures

| Fixture | Function | Expected readiness |
| --- | --- | --- |
| Pass | `fcdoPrimePassSnapshot()` | `green` (includes a clear UK sanctions record) |
| Fail | `fcdoPrimeFailSnapshot()` | `red` (eligibility false, competition docs missing, compliance declaration missing, threshold false; sanctions evidence still clear) |
| Sanctions missing | `fcdoPrimeIddMissingSnapshot()` | `red` (screening evidence missing; no hit-disposition finding) |
| Sanctions hit | `fcdoPrimeIddHitSnapshot()` | `red` (confirmed hit needs a decision; owner and rationale warn) |
| Sanctions hit dispositioned | `fcdoPrimeIddHitDispositionedSnapshot()` | `green` |

## How to run

```ts
import { evaluateDonorPack, fcdoPrimePassSnapshot } from '@/lib/field-registry'

const result = evaluateDonorPack(fcdoPrimePassSnapshot(), 'fcdo-prime')
```
