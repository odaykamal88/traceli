# Global Fund donor pack v1

Status: thin hardcoded pack. 23 September 2026.
Code: `lib/field-registry/packs/global-fund.ts`, fixtures in `packs/fixtures.ts`.
Index: [donor-packs-v1.md](./donor-packs-v1.md).

Audience: Global Fund Principal Recipients and high-capacity Sub-Recipients running award desks. Trace-li encodes Grant Regulations–aligned concepts, including a Restrictive Measures / integrity due diligence evidence gate, as deterministic Field Registry checks. This is **not** official Global Fund legal advice and **not** a verbatim regulation dump.

## Changelog

### 2026.2 — Restrictive Measures / IDD evidence gate

Controls inside this pack require evidence that screening happened and was dispositioned. There is **no in-desk live OFAC API**, and no UN, US State, Swiss, or debarment list client. Trace-li does not screen names. Scope checks are exact tokens (`un`, `ofac`, `us-state`, `switzerland`, `debarment`, `ineligibility`), not fuzzy name matching. A prose phrase such as "United Nations" does not satisfy `un`.

The Guidelines' US$5 million implementation-period threshold is not recomputed from `award.contract_value_usd`. When this pack is in force, the recorded subject needs screening evidence before judgment can go green. Re-run scheduling is an attested `idd.screen_timing` value (`before_engagement` or `grant_cycle_rerun`), not a clock inside Trace-li.

## Public sources (eng citations)

Prefer these public Global Fund instruments when extending checks:

| Source | Use in this pack |
| --- | --- |
| [Grant Regulations (Version 2)](https://resources.theglobalfund.org/media/13957/cr_grant-version-two_regulations_en.pdf) §5.1 Contracts for Goods and Services | Competition / transparency, solicitation notice, contractor capability, documentation of award practices |
| [Code of Conduct for Suppliers](https://www.theglobalfund.org/media/3275/corporate_codeofconductforsuppliers_policy_en.pdf) | Conflict of interest disclosure; ethical bidding |
| [Policy on Conflict of Interest](https://www.theglobalfund.org/media/6016/core_ethicsandconflictofinterest_policy_en.pdf) | Disclose / mitigate / recuse themes for implementers and counterparties |
| [PR Handbook for Grant-making (GC7)](https://resources.theglobalfund.org/media/13953/cr_pr-grant-making_handbook_en.pdf) | Sub-recipient selection against ToR, capacity, capture in arrangements / agreements |
| [PSM procurement guide](https://www.theglobalfund.org/media/5873/psm_procurementsupplymanagement_guidelines_en.pdf) | Competitive procedures and value-for-money themes (health products context; used lightly here) |
| [Guidelines on SR and Supplier Integrity Due Diligence](https://resources.theglobalfund.org/media/13707/cr_supplier-integrity-due-diligence_guidelines_en.pdf) (26 March 2024, updated 22 May 2024) | Restrictive Measures issuers (UN, OFAC, US State Department, and/or Switzerland); screen before substantive engagement and again each grant cycle / next implementation period; subjects include SR/supplier organizations, agreement signatories, and defined key personnel; modality including Global Fund pre-approved vendors; select / continue decision; notify the Global Fund of Restrictive Measures or Prohibited Practices findings; debarment and ineligibility lists appear in the screening description |

**Approximation note:** Grant Regulations §5.1 speaks to policies the Principal Recipient must keep and follow. Trace v1 does not re-host the full policy text. It checks whether the **award registry** already carries the facts an award desk would need before signature (competition or exemption documented, COI disclosed, SR agreement on file, and so on). Threshold alignment (`threshold.method_aligned`) assumes a prior mapping step decided whether the chosen method matches the org/donor value band; the pack verifies that decision field, it does not recompute currency bands from PDF tables.

## Checks → registry keys → finding codes

| Theme | Rule id | Kind | Field key(s) | Finding code |
| --- | --- | --- | --- | --- |
| Eligibility / capability | `gf_eligibility_contractor_capable` | `value_must_equal` → `true` | `eligibility.contractor_capable` | `gf_eligibility_not_met` |
| Conflict of interest | `gf_integrity_coi_disclosed` | `value_must_equal` → `true` | `integrity.coi_disclosed` | `gf_coi_not_disclosed` |
| Competition or exemption | `gf_procurement_competitive_or_exempt` | `value_must_equal` → `true` | `procurement.competitive_or_exempt` | `gf_competition_not_satisfied` |
| Competition / sole-source docs | `gf_procurement_competition_docs` | `required_present` | `procurement.competition_or_exemption_documented` | `gf_competition_docs_missing` |
| Solicitation notice | `gf_procurement_solicitation_notified` | `required_present` | `procurement.solicitation_notified` | `gf_solicitation_notice_missing` (warning) |
| Documentation completeness | `gf_documentation_award_rationale` | `required_present` | `documentation.award_rationale_on_file` | `gf_award_rationale_missing` |
| Key value on file | `gf_award_contract_value` | `required_present` | `award.contract_value_usd` | `gf_contract_value_missing` |
| Key thresholds | `gf_threshold_method_aligned` | `value_must_equal` → `true` | `threshold.method_aligned` | `gf_threshold_method_misaligned` |
| SR selection | `gf_sr_selection_documented` | `required_present` | `sr.selection_documented` | `gf_sr_selection_missing` |
| SR capacity | `gf_sr_capacity_assessed` | `required_present` | `sr.capacity_assessed` | `gf_sr_capacity_missing` |
| SR written agreement | `gf_sr_written_agreement` | `required_present` | `sr.written_agreement_on_file` | `gf_sr_agreement_missing` |
| IDD subject | `gf_idd_subject` | `required_present` | `idd.subject` | `gf_idd_subject_missing` |
| Subject kind | `gf_idd_subject_kind` | `value_must_be_one_of` `organization` \| `individual` | `idd.subject_kind` | `gf_idd_subject_kind_invalid` |
| Subject role | `gf_idd_subject_role` | `value_must_be_one_of` `sr` \| `supplier` \| `signatory` \| `key_personnel` | `idd.subject_role` | `gf_idd_subject_role_invalid` |
| Affiliated / key persons | `gf_idd_affiliated_persons` | `required_present` | `idd.affiliated_persons` | `gf_idd_affiliated_persons_missing` |
| List-family scope | `gf_idd_screen_scope` | `text_must_include` tokens `un`, `ofac`, `us-state`, `switzerland`, `debarment`, `ineligibility` | `idd.screen_scope` | `gf_idd_screen_scope_incomplete` |
| Screen date | `gf_idd_screen_date` | `required_present` | `idd.screen_date` | `gf_idd_screen_date_missing` |
| List vintage | `gf_idd_list_vintage` | `required_present` | `idd.list_vintage` | `gf_idd_list_vintage_missing` |
| Modality | `gf_idd_screen_modality` | `value_must_be_one_of` `in_house` \| `gf_preapproved_vendor` \| `other` | `idd.screen_modality` | `gf_idd_modality_invalid` |
| Result | `gf_idd_screen_result` | `value_must_be_one_of` `clear` \| `potential_match` \| `confirmed_hit` \| `unresolved` | `idd.screen_result` | `gf_idd_result_invalid` |
| Timing attestation | `gf_idd_screen_timing` | `value_must_be_one_of` `before_engagement` \| `grant_cycle_rerun` | `idd.screen_timing` | `gf_idd_screen_timing_invalid` |
| Evidence reference | `gf_idd_evidence_ref` | `required_present` | `idd.evidence_ref` | `gf_idd_evidence_missing` |
| Hit → owner | `gf_idd_hit_disposition_owner` | `required_when_value_in` when result is `potential_match`, `confirmed_hit`, or `unresolved` | `idd.disposition_owner` | `gf_idd_hit_needs_owner` |
| Hit → decision | `gf_idd_hit_disposition_decision` | same trigger; decision `select` \| `continue` \| `terminate` | `idd.disposition_decision` | `gf_idd_hit_needs_decision` |
| Hit → rationale | `gf_idd_hit_disposition_rationale` | same trigger | `idd.disposition_rationale` | `gf_idd_hit_needs_rationale` |
| Hit → communicable to GF | `gf_idd_hit_communicable` | same trigger | `idd.gf_notification` | `gf_idd_hit_not_communicable` |

A `clear` result does not require disposition fields. Any other allowed result blocks signature until owner, decision, rationale, and a Global Fund notification note are on the registry. Modality `in_house` covers PR-run screening; `gf_preapproved_vendor` is a Global Fund pre-approved IDD vendor; `other` is any other modality the desk records.

All rules run through `evaluateJudgment` / `evaluateDonorPack(snapshot, 'global-fund')`. Findings carry provenance pointers only (`sourceFileHash` + `sourceRef`). Gaps are Award desk findings and freeze with `pipelineStatus`.

## Fixtures

| Fixture | Function | Expected readiness |
| --- | --- | --- |
| Pass | `globalFundPassSnapshot()` | `green` (includes a clear IDD record) |
| Fail | `globalFundFailSnapshot()` | `red` (COI false, competition not satisfied, competition docs missing, threshold false, SR capacity missing; IDD evidence still clear) |
| IDD missing | `globalFundIddMissingSnapshot()` | `red` (screening evidence missing; no hit-disposition finding) |
| IDD hit | `globalFundIddHitSnapshot()` | `red` (confirmed hit needs disposition) |
| IDD hit dispositioned | `globalFundIddHitDispositionedSnapshot()` | `green` |

## How to run

```ts
import { evaluateDonorPack, globalFundPassSnapshot } from '@/lib/field-registry'

const result = evaluateDonorPack(globalFundPassSnapshot(), 'global-fund')
// result.pipelineStatus → freezeAtJudgment
```
