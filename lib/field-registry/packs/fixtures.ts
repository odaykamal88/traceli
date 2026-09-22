import type { AwardRegistrySnapshot, RegistryField } from '@/lib/field-registry/schema'

const hash = 'ab'.repeat(32)
const extractedAt = '2026-09-21T18:00:00.000Z'
const asOf = '2026-09-22T12:00:00.000Z'

function provenance(sourceRef: RegistryField['provenance']['sourceRef']) {
  return {
    sourceFileHash: hash,
    sourceRef,
    extractedAt,
    confidence: 0.9,
    verificationMethod: 'deterministic_check' as const,
  }
}

function field(
  fieldId: string,
  entityKind: RegistryField['entityKind'],
  entityId: string,
  key: string,
  value: RegistryField['value'],
  sourceRef: RegistryField['provenance']['sourceRef'],
): RegistryField {
  return {
    fieldId,
    entityKind,
    entityId,
    key,
    value,
    provenance: provenance(sourceRef),
  }
}

function present(value: string | number | boolean): RegistryField['value'] {
  return { state: 'present', value }
}

function missing(reason: string): RegistryField['value'] {
  return { state: 'missing', reason }
}

/** Global Fund pass: eligibility, COI, competition, docs, thresholds, SR completeness. */
export function globalFundPassSnapshot(): AwardRegistrySnapshot {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'synthetic',
    organizationId: 'org_gf_pr_demo',
    projectId: 'project_gf_hiv_sr_award',
    awardId: 'gf-pr-sr-2026-011',
    procurementReference: 'GF-PR-SR-2026-011',
    donor: { donorId: 'donor_global_fund', name: 'The Global Fund' },
    framework: {
      frameworkId: 'global-fund',
      name: 'Global Fund Grant Regulations v1',
      version: '2026.1',
    },
    asOf,
    fields: [
      field('gf_elig', 'supplier', 'supplier_sr_alpha', 'eligibility.contractor_capable', present(true), {
        kind: 'page', id: 'capacity-memo', label: 'SR capacity memo',
      }),
      field('gf_coi', 'evidence', 'evidence_coi', 'integrity.coi_disclosed', present(true), {
        kind: 'page', id: 'coi-form', label: 'COI disclosure',
      }),
      field('gf_comp', 'criterion', 'criterion_method', 'procurement.competitive_or_exempt', present(true), {
        kind: 'page', id: 'method-note', label: 'Method note',
      }),
      field('gf_comp_docs', 'evidence', 'evidence_comp', 'procurement.competition_or_exemption_documented', present('Open tender minutes on file'), {
        kind: 'page', id: 'tender-minutes', label: 'Tender minutes',
      }),
      field('gf_notice', 'evidence', 'evidence_notice', 'procurement.solicitation_notified', present('RFP posted 21 days'), {
        kind: 'page', id: 'rfp-notice', label: 'RFP notice',
      }),
      field('gf_rationale', 'evidence', 'evidence_rationale', 'documentation.award_rationale_on_file', present('Evaluation report signed'), {
        kind: 'page', id: 'eval-report', label: 'Evaluation report',
      }),
      field('gf_value', 'award', 'award_gf_011', 'award.contract_value_usd', present(185000), {
        kind: 'cell', id: 'budget-row-4', label: 'Budget row 4',
      }),
      field('gf_threshold', 'criterion', 'criterion_threshold', 'threshold.method_aligned', present(true), {
        kind: 'page', id: 'threshold-check', label: 'Threshold check',
      }),
      field('gf_sr_sel', 'evidence', 'evidence_sr_sel', 'sr.selection_documented', present('Competitive SR selection scored'), {
        kind: 'page', id: 'sr-selection', label: 'SR selection pack',
      }),
      field('gf_sr_cap', 'evidence', 'evidence_sr_cap', 'sr.capacity_assessed', present('Capacity assessment completed'), {
        kind: 'page', id: 'sr-capacity', label: 'SR capacity',
      }),
      field('gf_sr_agr', 'evidence', 'evidence_sr_agr', 'sr.written_agreement_on_file', present('SR agreement signed draft'), {
        kind: 'page', id: 'sr-agreement', label: 'SR agreement',
      }),
    ],
  }
}

/** Global Fund fail: COI undisclosed, competition docs missing, SR capacity missing, threshold misaligned. */
export function globalFundFailSnapshot(): AwardRegistrySnapshot {
  const pass = globalFundPassSnapshot()
  return {
    ...pass,
    awardId: 'gf-pr-sr-2026-011-fail',
    procurementReference: 'GF-PR-SR-2026-011-FAIL',
    fields: [
      field('gf_elig', 'supplier', 'supplier_sr_alpha', 'eligibility.contractor_capable', present(true), {
        kind: 'page', id: 'capacity-memo', label: 'SR capacity memo',
      }),
      field('gf_coi', 'evidence', 'evidence_coi', 'integrity.coi_disclosed', present(false), {
        kind: 'page', id: 'coi-form', label: 'COI disclosure blank',
      }),
      field('gf_comp', 'criterion', 'criterion_method', 'procurement.competitive_or_exempt', present(false), {
        kind: 'page', id: 'method-note', label: 'Method note',
      }),
      field('gf_comp_docs', 'evidence', 'evidence_comp', 'procurement.competition_or_exemption_documented', missing('No competition minutes or sole-source exemption memo linked.'), {
        kind: 'page', id: 'method-note', label: 'Method note',
      }),
      field('gf_notice', 'evidence', 'evidence_notice', 'procurement.solicitation_notified', present('RFP posted 21 days'), {
        kind: 'page', id: 'rfp-notice', label: 'RFP notice',
      }),
      field('gf_rationale', 'evidence', 'evidence_rationale', 'documentation.award_rationale_on_file', present('Evaluation report signed'), {
        kind: 'page', id: 'eval-report', label: 'Evaluation report',
      }),
      field('gf_value', 'award', 'award_gf_011', 'award.contract_value_usd', present(185000), {
        kind: 'cell', id: 'budget-row-4', label: 'Budget row 4',
      }),
      field('gf_threshold', 'criterion', 'criterion_threshold', 'threshold.method_aligned', present(false), {
        kind: 'page', id: 'threshold-check', label: 'Threshold check',
      }),
      field('gf_sr_sel', 'evidence', 'evidence_sr_sel', 'sr.selection_documented', present('Competitive SR selection scored'), {
        kind: 'page', id: 'sr-selection', label: 'SR selection pack',
      }),
      field('gf_sr_cap', 'evidence', 'evidence_sr_cap', 'sr.capacity_assessed', missing('No SR capacity assessment on the award file.'), {
        kind: 'page', id: 'sr-selection', label: 'SR selection pack',
      }),
      field('gf_sr_agr', 'evidence', 'evidence_sr_agr', 'sr.written_agreement_on_file', present('SR agreement signed draft'), {
        kind: 'page', id: 'sr-agreement', label: 'SR agreement',
      }),
    ],
  }
}

/** FCDO prime pass: eligibility, COI, competition, docs, thresholds, delivery chain. */
export function fcdoPrimePassSnapshot(): AwardRegistrySnapshot {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'synthetic',
    organizationId: 'org_fcdo_prime_demo',
    projectId: 'project_fcdo_prime_subaward',
    awardId: 'fcdo-prime-2026-044',
    procurementReference: 'FCDO-PRIME-2026-044',
    donor: { donorId: 'donor_fcdo', name: 'FCDO (via commercial prime)' },
    framework: {
      frameworkId: 'fcdo-prime',
      name: 'FCDO commercial prime award desk v1',
      version: '2026.1',
    },
    asOf,
    fields: [
      field('fcdo_elig', 'supplier', 'supplier_beta', 'eligibility.supplier_screened', present(true), {
        kind: 'page', id: 'screen-log', label: 'Eligibility screen',
      }),
      field('fcdo_coi', 'evidence', 'evidence_coi', 'integrity.coi_declared', present(true), {
        kind: 'page', id: 'coi-decl', label: 'COI declaration',
      }),
      field('fcdo_bar', 'evidence', 'evidence_bar', 'integrity.business_appointment_checked', present('No ex-Crown staff on team'), {
        kind: 'page', id: 'bar-check', label: 'Business Appointment check',
      }),
      field('fcdo_comp', 'criterion', 'criterion_method', 'procurement.fair_open_or_documented_direct', present(true), {
        kind: 'page', id: 'comp-note', label: 'Competition note',
      }),
      field('fcdo_comp_docs', 'evidence', 'evidence_comp', 'procurement.competition_or_direct_award_documented', present('Three quotes scored'), {
        kind: 'page', id: 'quote-pack', label: 'Quote pack',
      }),
      field('fcdo_eval', 'evidence', 'evidence_eval', 'documentation.evaluation_notes_on_file', present('Panel notes locked'), {
        kind: 'page', id: 'eval-notes', label: 'Evaluation notes',
      }),
      field('fcdo_decl', 'evidence', 'evidence_decl', 'documentation.compliance_declaration_on_file', present('Annex 1b compliance declaration'), {
        kind: 'page', id: 'annex-1b', label: 'Compliance declaration',
      }),
      field('fcdo_value', 'award', 'award_fcdo_044', 'award.contract_value_gbp', present(92000), {
        kind: 'cell', id: 'pricing-total', label: 'Pricing total',
      }),
      field('fcdo_threshold', 'criterion', 'criterion_threshold', 'threshold.method_aligned', present(true), {
        kind: 'page', id: 'threshold-check', label: 'Threshold check',
      }),
      field('fcdo_chain', 'evidence', 'evidence_chain', 'delivery_chain.partners_identified', present('Two delivery-chain partners named'), {
        kind: 'page', id: 'delivery-map', label: 'Delivery chain map',
      }),
    ],
  }
}

/** FCDO prime fail: eligibility false, competition docs missing, compliance declaration missing, threshold fail. */
export function fcdoPrimeFailSnapshot(): AwardRegistrySnapshot {
  return {
    ...fcdoPrimePassSnapshot(),
    awardId: 'fcdo-prime-2026-044-fail',
    procurementReference: 'FCDO-PRIME-2026-044-FAIL',
    fields: [
      field('fcdo_elig', 'supplier', 'supplier_beta', 'eligibility.supplier_screened', present(false), {
        kind: 'page', id: 'screen-log', label: 'Eligibility screen',
      }),
      field('fcdo_coi', 'evidence', 'evidence_coi', 'integrity.coi_declared', present(true), {
        kind: 'page', id: 'coi-decl', label: 'COI declaration',
      }),
      field('fcdo_bar', 'evidence', 'evidence_bar', 'integrity.business_appointment_checked', present('No ex-Crown staff on team'), {
        kind: 'page', id: 'bar-check', label: 'Business Appointment check',
      }),
      field('fcdo_comp', 'criterion', 'criterion_method', 'procurement.fair_open_or_documented_direct', present(true), {
        kind: 'page', id: 'comp-note', label: 'Competition note',
      }),
      field('fcdo_comp_docs', 'evidence', 'evidence_comp', 'procurement.competition_or_direct_award_documented', missing('No quote pack or direct-award rationale linked.'), {
        kind: 'page', id: 'comp-note', label: 'Competition note',
      }),
      field('fcdo_eval', 'evidence', 'evidence_eval', 'documentation.evaluation_notes_on_file', present('Panel notes locked'), {
        kind: 'page', id: 'eval-notes', label: 'Evaluation notes',
      }),
      field('fcdo_decl', 'evidence', 'evidence_decl', 'documentation.compliance_declaration_on_file', missing('No Supply Partner Code compliance declaration on file.'), {
        kind: 'page', id: 'cover-sheet', label: 'Cover sheet',
      }),
      field('fcdo_value', 'award', 'award_fcdo_044', 'award.contract_value_gbp', present(92000), {
        kind: 'cell', id: 'pricing-total', label: 'Pricing total',
      }),
      field('fcdo_threshold', 'criterion', 'criterion_threshold', 'threshold.method_aligned', present(false), {
        kind: 'page', id: 'threshold-check', label: 'Threshold check',
      }),
      field('fcdo_chain', 'evidence', 'evidence_chain', 'delivery_chain.partners_identified', present('Two delivery-chain partners named'), {
        kind: 'page', id: 'delivery-map', label: 'Delivery chain map',
      }),
    ],
  }
}
