# FCDO commercial-prime pack v1

Status: thin hardcoded pack. 22 September 2026.
Code: `lib/field-registry/packs/fcdo-prime.ts`, fixtures in `packs/fixtures.ts`.
Index: [donor-packs-v1.md](./donor-packs-v1.md).

Audience: **commercial primes’ award desks** awarding subcontractors / delivery-chain partners under FCDO-funded contracts. This pack is **not** “sell Trace to FCDO HQ.” It is an overlay with the same judgment spine as Global Fund.

## Public sources (eng citations)

| Source | Use in this pack |
| --- | --- |
| [FCDO Supply Partner Code of Conduct](https://assets.publishing.service.gov.uk/media/6343fb4fd3bf7f5877e5cca0/Code_of_Conduct.pdf) | Conflicts free from bias; declare COI; Business Appointment Rules for ex-FCDO/Crown staff in the preceding two years; compliance declaration themes |
| [Supply Partner Handbook](https://assets.publishing.service.gov.uk/media/6343fb8dd3bf7f586db4f1ff/Supply_Partner_Handbook.pdf) | COI governance; fair/transparent recruitment and competition hygiene for partners |
| [Supplier Code of Conduct (GOV.UK)](https://www.gov.uk/government/publications/supplier-code-of-conduct/supplier-code-of-conduct-html) | Reputation / eligibility screening themes; conflict mitigation; fair competition |
| FCDO standard terms / Annex 1b compliance declaration (referenced in Code FAQ) | Pre-award compliance declaration on file |

**Approximation note:** This pack does **not** encode the UK Procurement Act 2023. Threshold alignment is a single registry boolean (`threshold.method_aligned`) produced by a prior mapping step against the prime’s own delegated thresholds — Trace checks the boolean, it does not re-implement public-contracting thresholds.

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

Same pipeline: `evaluateDonorPack(snapshot, 'fcdo-prime')` → `JudgmentResult` → optional `freezeAtJudgment(..., { pipelineStatus })`.

## Fixtures

| Fixture | Function | Expected readiness |
| --- | --- | --- |
| Pass | `fcdoPrimePassSnapshot()` | `green` |
| Fail | `fcdoPrimeFailSnapshot()` | `red` (eligibility false, competition docs missing, compliance declaration missing, threshold false) |

## How to run

```ts
import { evaluateDonorPack, fcdoPrimePassSnapshot } from '@/lib/field-registry'

const result = evaluateDonorPack(fcdoPrimePassSnapshot(), 'fcdo-prime')
```
