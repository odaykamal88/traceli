# Global Fund donor pack v1

Status: thin hardcoded pack. 22 September 2026.
Code: `lib/field-registry/packs/global-fund.ts`, fixtures in `packs/fixtures.ts`.
Index: [donor-packs-v1.md](./donor-packs-v1.md).

Audience: Global Fund Principal Recipients and high-capacity Sub-Recipients running award desks. Trace encodes Grant Regulations–aligned concepts as deterministic Field Registry checks. This is **not** official Global Fund legal advice and **not** a verbatim regulation dump.

## Public sources (eng citations)

Prefer these public Global Fund instruments when extending checks:

| Source | Use in this pack |
| --- | --- |
| [Grant Regulations (Version 2)](https://resources.theglobalfund.org/media/13957/cr_grant-version-two_regulations_en.pdf) §5.1 Contracts for Goods and Services | Competition / transparency, solicitation notice, contractor capability, documentation of award practices |
| [Code of Conduct for Suppliers](https://www.theglobalfund.org/media/3275/corporate_codeofconductforsuppliers_policy_en.pdf) | Conflict of interest disclosure; ethical bidding |
| [Policy on Conflict of Interest](https://www.theglobalfund.org/media/6016/core_ethicsandconflictofinterest_policy_en.pdf) | Disclose / mitigate / recuse themes for implementers and counterparties |
| [PR Handbook for Grant-making (GC7)](https://resources.theglobalfund.org/media/13953/cr_pr-grant-making_handbook_en.pdf) | Sub-recipient selection against ToR, capacity, capture in arrangements / agreements |
| [PSM procurement guide](https://www.theglobalfund.org/media/5873/psm_procurementsupplymanagement_guidelines_en.pdf) | Competitive procedures and value-for-money themes (health products context; used lightly here) |

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

All rules run through `evaluateJudgment` / `evaluateDonorPack(snapshot, 'global-fund')`. Findings carry provenance pointers only (`sourceFileHash` + `sourceRef`).

## Fixtures

| Fixture | Function | Expected readiness |
| --- | --- | --- |
| Pass | `globalFundPassSnapshot()` | `green` |
| Fail | `globalFundFailSnapshot()` | `red` (COI false, competition not satisfied, competition docs missing, threshold false, SR capacity missing) |

## How to run

```ts
import { evaluateDonorPack, globalFundPassSnapshot } from '@/lib/field-registry'

const result = evaluateDonorPack(globalFundPassSnapshot(), 'global-fund')
// result.pipelineStatus → freezeAtJudgment
```
