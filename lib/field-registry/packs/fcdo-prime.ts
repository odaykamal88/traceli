import type { JudgmentRule } from '@/lib/field-registry/judgment'
import type { DonorPack } from '@/lib/field-registry/packs/types'

/**
 * FCDO commercial-prime v1 thin pack.
 * For primes' award desks awarding under FCDO-funded contracts — not a pack
 * sold to FCDO HQ. UK Procurement Act 2023 is out of scope beyond thin
 * supplier-code / competition hygiene. See docs/eng/donor-pack-fcdo-prime-v1.md.
 */
export const FCDO_PRIME_FIELD_KEYS = [
  'eligibility.supplier_screened',
  'integrity.coi_declared',
  'integrity.business_appointment_checked',
  'procurement.fair_open_or_documented_direct',
  'procurement.competition_or_direct_award_documented',
  'documentation.evaluation_notes_on_file',
  'documentation.compliance_declaration_on_file',
  'award.contract_value_gbp',
  'threshold.method_aligned',
  'delivery_chain.partners_identified',
] as const

export const FCDO_PRIME_RULES: readonly JudgmentRule[] = [
  {
    ruleId: 'fcdo_eligibility_supplier_screened',
    kind: 'value_must_equal',
    fieldKey: 'eligibility.supplier_screened',
    expected: true,
    severity: 'blocker',
    code: 'fcdo_eligibility_not_screened',
    title: 'Supplier eligibility / reputation screen required',
  },
  {
    ruleId: 'fcdo_integrity_coi_declared',
    kind: 'value_must_equal',
    fieldKey: 'integrity.coi_declared',
    expected: true,
    severity: 'blocker',
    code: 'fcdo_coi_not_declared',
    title: 'Conflict of interest declaration required',
  },
  {
    ruleId: 'fcdo_integrity_business_appointment',
    kind: 'required_present',
    fieldKey: 'integrity.business_appointment_checked',
    severity: 'warning',
    code: 'fcdo_business_appointment_unchecked',
    title: 'Business Appointment Rules check for ex-Crown staff',
  },
  {
    ruleId: 'fcdo_procurement_fair_open_or_direct',
    kind: 'value_must_equal',
    fieldKey: 'procurement.fair_open_or_documented_direct',
    expected: true,
    severity: 'blocker',
    code: 'fcdo_competition_not_satisfied',
    title: 'Fair open competition or documented direct award',
  },
  {
    ruleId: 'fcdo_procurement_competition_docs',
    kind: 'required_present',
    fieldKey: 'procurement.competition_or_direct_award_documented',
    severity: 'blocker',
    code: 'fcdo_competition_docs_missing',
    title: 'Competition or direct-award documentation required',
  },
  {
    ruleId: 'fcdo_documentation_evaluation_notes',
    kind: 'required_present',
    fieldKey: 'documentation.evaluation_notes_on_file',
    severity: 'blocker',
    code: 'fcdo_evaluation_notes_missing',
    title: 'Evaluation notes must be on the award file',
  },
  {
    ruleId: 'fcdo_documentation_compliance_declaration',
    kind: 'required_present',
    fieldKey: 'documentation.compliance_declaration_on_file',
    severity: 'blocker',
    code: 'fcdo_compliance_declaration_missing',
    title: 'Supply Partner Code compliance declaration on file',
  },
  {
    ruleId: 'fcdo_award_contract_value',
    kind: 'required_present',
    fieldKey: 'award.contract_value_gbp',
    severity: 'blocker',
    code: 'fcdo_contract_value_missing',
    title: 'Contract value (GBP) must be on the registry',
  },
  {
    ruleId: 'fcdo_threshold_method_aligned',
    kind: 'value_must_equal',
    fieldKey: 'threshold.method_aligned',
    expected: true,
    severity: 'blocker',
    code: 'fcdo_threshold_method_misaligned',
    title: 'Procurement method must align with value threshold',
  },
  {
    ruleId: 'fcdo_delivery_chain_partners',
    kind: 'required_present',
    fieldKey: 'delivery_chain.partners_identified',
    severity: 'warning',
    code: 'fcdo_delivery_chain_unidentified',
    title: 'Delivery-chain partners identified pre-signature',
  },
]

export const FCDO_PRIME_PACK: DonorPack = {
  packId: 'fcdo-prime',
  version: '2026.1',
  name: 'FCDO commercial prime award desk v1',
  audience: 'fcdo-commercial-prime',
  category: 'donor',
  rules: FCDO_PRIME_RULES,
}
