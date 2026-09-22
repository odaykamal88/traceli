import type { JudgmentRule } from '@/lib/field-registry/judgment'
import type { DonorPack } from '@/lib/field-registry/packs/types'

/**
 * Global Fund v1 thin pack.
 * Checks are Trace-authored deterministic mappings onto Grant Regulations–
 * aligned concepts. They are not a verbatim regulation encyclopedia.
 * See docs/eng/donor-pack-global-fund-v1.md.
 */
export const GLOBAL_FUND_FIELD_KEYS = [
  'eligibility.contractor_capable',
  'integrity.coi_disclosed',
  'procurement.competitive_or_exempt',
  'procurement.competition_or_exemption_documented',
  'procurement.solicitation_notified',
  'documentation.award_rationale_on_file',
  'award.contract_value_usd',
  'threshold.method_aligned',
  'sr.selection_documented',
  'sr.capacity_assessed',
  'sr.written_agreement_on_file',
] as const

export const GLOBAL_FUND_RULES: readonly JudgmentRule[] = [
  {
    ruleId: 'gf_eligibility_contractor_capable',
    kind: 'value_must_equal',
    fieldKey: 'eligibility.contractor_capable',
    expected: true,
    severity: 'blocker',
    code: 'gf_eligibility_not_met',
    title: 'Contractor ability to perform must be affirmed',
  },
  {
    ruleId: 'gf_integrity_coi_disclosed',
    kind: 'value_must_equal',
    fieldKey: 'integrity.coi_disclosed',
    expected: true,
    severity: 'blocker',
    code: 'gf_coi_not_disclosed',
    title: 'Conflict of interest disclosure required',
  },
  {
    ruleId: 'gf_procurement_competitive_or_exempt',
    kind: 'value_must_equal',
    fieldKey: 'procurement.competitive_or_exempt',
    expected: true,
    severity: 'blocker',
    code: 'gf_competition_not_satisfied',
    title: 'Award must be competitive or an established exemption',
  },
  {
    ruleId: 'gf_procurement_competition_docs',
    kind: 'required_present',
    fieldKey: 'procurement.competition_or_exemption_documented',
    severity: 'blocker',
    code: 'gf_competition_docs_missing',
    title: 'Competition or sole-source exemption documentation required',
  },
  {
    ruleId: 'gf_procurement_solicitation_notified',
    kind: 'required_present',
    fieldKey: 'procurement.solicitation_notified',
    severity: 'warning',
    code: 'gf_solicitation_notice_missing',
    title: 'Bid solicitation notice to prospective bidders',
  },
  {
    ruleId: 'gf_documentation_award_rationale',
    kind: 'required_present',
    fieldKey: 'documentation.award_rationale_on_file',
    severity: 'blocker',
    code: 'gf_award_rationale_missing',
    title: 'Award rationale documentation required',
  },
  {
    ruleId: 'gf_award_contract_value',
    kind: 'required_present',
    fieldKey: 'award.contract_value_usd',
    severity: 'blocker',
    code: 'gf_contract_value_missing',
    title: 'Contract value must be on the registry',
  },
  {
    ruleId: 'gf_threshold_method_aligned',
    kind: 'value_must_equal',
    fieldKey: 'threshold.method_aligned',
    expected: true,
    severity: 'blocker',
    code: 'gf_threshold_method_misaligned',
    title: 'Procurement method must align with value threshold',
  },
  {
    ruleId: 'gf_sr_selection_documented',
    kind: 'required_present',
    fieldKey: 'sr.selection_documented',
    severity: 'blocker',
    code: 'gf_sr_selection_missing',
    title: 'Sub-recipient selection process documented',
  },
  {
    ruleId: 'gf_sr_capacity_assessed',
    kind: 'required_present',
    fieldKey: 'sr.capacity_assessed',
    severity: 'blocker',
    code: 'gf_sr_capacity_missing',
    title: 'Sub-recipient capacity assessment on file',
  },
  {
    ruleId: 'gf_sr_written_agreement',
    kind: 'required_present',
    fieldKey: 'sr.written_agreement_on_file',
    severity: 'blocker',
    code: 'gf_sr_agreement_missing',
    title: 'Written sub-recipient agreement required',
  },
]

export const GLOBAL_FUND_PACK: DonorPack = {
  packId: 'global-fund',
  version: '2026.1',
  name: 'Global Fund Grant Regulations v1',
  audience: 'global-fund-pr-sr',
  category: 'donor',
  rules: GLOBAL_FUND_RULES,
}
