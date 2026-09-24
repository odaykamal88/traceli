import type { AwardRegistrySnapshot, RegistryField } from '@/lib/field-registry/schema'
import { fcdoIddScopeAttestation, gfIddScopeAttestation } from '@/lib/field-registry/packs/idd'

export {
  ochaCbpfFailSnapshot,
  ochaCbpfPassSnapshot,
  unfpaFailSnapshot,
  unfpaPassSnapshot,
} from '@/lib/field-registry/packs/fixtures-un'

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

function retitle(
  snapshot: AwardRegistrySnapshot,
  awardId: string,
  procurementReference: string,
  fields: RegistryField[],
): AwardRegistrySnapshot {
  return { ...snapshot, awardId, procurementReference, fields }
}

function replaceValue(
  fields: readonly RegistryField[],
  key: string,
  value: RegistryField['value'],
): RegistryField[] {
  return fields.map(item => item.key === key ? { ...item, value } : item)
}

/** Clear Global Fund IDD evidence. A clear result does not require a hit disposition. */
function globalFundIddClearFields(): RegistryField[] {
  return [
    field('gf_idd_subject', 'supplier', 'supplier_sr_alpha', 'idd.subject', present('Alpha Health SR'), {
      kind: 'page', id: 'idd-memo', label: 'IDD memo',
    }),
    field('gf_idd_kind', 'supplier', 'supplier_sr_alpha', 'idd.subject_kind', present('organization'), {
      kind: 'page', id: 'idd-memo', label: 'IDD memo',
    }),
    field('gf_idd_role', 'supplier', 'supplier_sr_alpha', 'idd.subject_role', present('sr'), {
      kind: 'page', id: 'idd-memo', label: 'IDD memo',
    }),
    field('gf_idd_persons', 'evidence', 'evidence_idd_persons', 'idd.affiliated_persons', present('Signatory: A. Okonkwo, Director. Key personnel: Head of Finance; Head of Procurement.'), {
      kind: 'page', id: 'idd-persons', label: 'Key persons',
    }),
    field('gf_idd_scope', 'evidence', 'evidence_idd_scope', 'idd.screen_scope', present(gfIddScopeAttestation), {
      kind: 'page', id: 'idd-scope', label: 'Screen scope',
    }),
    field('gf_idd_date', 'evidence', 'evidence_idd_date', 'idd.screen_date', present('2026-08-15'), {
      kind: 'page', id: 'idd-memo', label: 'IDD memo',
    }),
    field('gf_idd_vintage', 'evidence', 'evidence_idd_vintage', 'idd.list_vintage', present('Lists cited as published 2026-08-01'), {
      kind: 'page', id: 'idd-scope', label: 'Screen scope',
    }),
    field('gf_idd_modality', 'evidence', 'evidence_idd_modality', 'idd.screen_modality', present('in_house'), {
      kind: 'page', id: 'idd-memo', label: 'IDD memo',
    }),
    field('gf_idd_result', 'evidence', 'evidence_idd_result', 'idd.screen_result', present('clear'), {
      kind: 'page', id: 'idd-memo', label: 'IDD memo',
    }),
    field('gf_idd_timing', 'evidence', 'evidence_idd_timing', 'idd.screen_timing', present('before_engagement'), {
      kind: 'page', id: 'idd-memo', label: 'IDD memo',
    }),
    field('gf_idd_evidence', 'evidence', 'evidence_idd_memo', 'idd.evidence_ref', present('IDD memo GF-PR-SR-2026-011-RM'), {
      kind: 'page', id: 'idd-memo', label: 'IDD memo',
    }),
  ]
}

function globalFundIddDispositionFields(): RegistryField[] {
  return [
    field('gf_idd_owner', 'evidence', 'evidence_idd_disposition', 'idd.disposition_owner', present('user_leila'), {
      kind: 'page', id: 'idd-disposition', label: 'IDD disposition',
    }),
    field('gf_idd_decision', 'evidence', 'evidence_idd_disposition', 'idd.disposition_decision', present('terminate'), {
      kind: 'page', id: 'idd-disposition', label: 'IDD disposition',
    }),
    field('gf_idd_rationale', 'evidence', 'evidence_idd_disposition', 'idd.disposition_rationale', present('Confirmed designation. Do not sign. Notify the Global Fund Country Team and Ethics.'), {
      kind: 'page', id: 'idd-disposition', label: 'IDD disposition',
    }),
    field('gf_idd_notify', 'evidence', 'evidence_idd_notify', 'idd.gf_notification', present('Country Team and Ethics notified with the screening result and the terminate decision.'), {
      kind: 'page', id: 'idd-notify', label: 'GF notification',
    }),
  ]
}

/** Clear FCDO sanctions evidence. Thinner than the Global Fund IDD block. */
function fcdoIddClearFields(): RegistryField[] {
  return [
    field('fcdo_idd_subject', 'supplier', 'supplier_beta', 'idd.subject', present('Beta Logistics Ltd'), {
      kind: 'page', id: 'sanctions-note', label: 'Sanctions note',
    }),
    field('fcdo_idd_kind', 'supplier', 'supplier_beta', 'idd.subject_kind', present('organization'), {
      kind: 'page', id: 'sanctions-note', label: 'Sanctions note',
    }),
    field('fcdo_idd_connected', 'evidence', 'evidence_idd_connected', 'idd.connected_persons', present('UBO: Beta Holdings 100%. Directors named. No designated connected person in the cited screen.'), {
      kind: 'page', id: 'ownership-note', label: 'Ownership note',
    }),
    field('fcdo_idd_scope', 'evidence', 'evidence_idd_scope', 'idd.screen_scope', present(fcdoIddScopeAttestation), {
      kind: 'page', id: 'sanctions-note', label: 'Sanctions note',
    }),
    field('fcdo_idd_date', 'evidence', 'evidence_idd_date', 'idd.screen_date', present('2026-08-20'), {
      kind: 'page', id: 'sanctions-note', label: 'Sanctions note',
    }),
    field('fcdo_idd_vintage', 'evidence', 'evidence_idd_vintage', 'idd.list_vintage', present('UK Sanctions List published 2026-08-18'), {
      kind: 'page', id: 'sanctions-note', label: 'Sanctions note',
    }),
    field('fcdo_idd_result', 'evidence', 'evidence_idd_result', 'idd.screen_result', present('clear'), {
      kind: 'page', id: 'sanctions-note', label: 'Sanctions note',
    }),
    field('fcdo_idd_evidence', 'evidence', 'evidence_idd_memo', 'idd.evidence_ref', present('Sanctions diligence note FCDO-PRIME-2026-044'), {
      kind: 'page', id: 'sanctions-note', label: 'Sanctions note',
    }),
    field('fcdo_idd_debarment', 'evidence', 'evidence_idd_debarment', 'idd.debarment_exclusion', present('Procurement Act debarment list checked 2026-08-20; supplier not excluded.'), {
      kind: 'page', id: 'debarment-note', label: 'Debarment check',
    }),
  ]
}

function fcdoIddDispositionFields(): RegistryField[] {
  return [
    field('fcdo_idd_owner', 'evidence', 'evidence_idd_disposition', 'idd.disposition_owner', present('user_leila'), {
      kind: 'page', id: 'idd-disposition', label: 'Sanctions disposition',
    }),
    field('fcdo_idd_decision', 'evidence', 'evidence_idd_disposition', 'idd.disposition_decision', present('terminate'), {
      kind: 'page', id: 'idd-disposition', label: 'Sanctions disposition',
    }),
    field('fcdo_idd_rationale', 'evidence', 'evidence_idd_disposition', 'idd.disposition_rationale', present('Confirmed UK Sanctions List hit on a connected person. Do not sign.'), {
      kind: 'page', id: 'idd-disposition', label: 'Sanctions disposition',
    }),
  ]
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
      version: '2026.2',
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
      ...globalFundIddClearFields(),
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
      ...globalFundIddClearFields(),
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
      version: '2026.2',
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
      ...fcdoIddClearFields(),
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
      ...fcdoIddClearFields(),
    ],
  }
}

const gfIddEvidenceGap = 'Restrictive Measures screening evidence is not on the award file.'
const fcdoIddEvidenceGap = 'UK sanctions screening evidence is not on the award file.'

/** Global Fund: screen evidence missing. A missing result is not a hit disposition. */
export function globalFundIddMissingSnapshot(): AwardRegistrySnapshot {
  const pass = globalFundPassSnapshot()
  const gapKeys = new Set([
    'idd.subject',
    'idd.affiliated_persons',
    'idd.screen_scope',
    'idd.screen_date',
    'idd.list_vintage',
    'idd.screen_modality',
    'idd.screen_result',
    'idd.evidence_ref',
  ])
  return retitle(
    pass,
    'gf-pr-sr-2026-011-idd-missing',
    'GF-PR-SR-2026-011-IDD-MISSING',
    pass.fields.map(item => gapKeys.has(item.key) ? { ...item, value: missing(gfIddEvidenceGap) } : item),
  )
}

/** Global Fund: confirmed hit with no disposition. Other IDD evidence stays present. */
export function globalFundIddHitSnapshot(): AwardRegistrySnapshot {
  const pass = globalFundPassSnapshot()
  return retitle(
    pass,
    'gf-pr-sr-2026-011-idd-hit',
    'GF-PR-SR-2026-011-IDD-HIT',
    replaceValue(pass.fields, 'idd.screen_result', present('confirmed_hit')),
  )
}

/** Global Fund: confirmed hit with select/continue/terminate evidence and a GF notification. */
export function globalFundIddHitDispositionedSnapshot(): AwardRegistrySnapshot {
  const hit = globalFundIddHitSnapshot()
  return retitle(
    hit,
    'gf-pr-sr-2026-011-idd-hit-dispositioned',
    'GF-PR-SR-2026-011-IDD-HIT-DISPOSITIONED',
    [...hit.fields, ...globalFundIddDispositionFields()],
  )
}

/** FCDO prime: sanctions evidence missing. A missing result is not a hit disposition. */
export function fcdoPrimeIddMissingSnapshot(): AwardRegistrySnapshot {
  const pass = fcdoPrimePassSnapshot()
  const gapKeys = new Set([
    'idd.subject',
    'idd.connected_persons',
    'idd.screen_scope',
    'idd.screen_date',
    'idd.screen_result',
    'idd.evidence_ref',
    'idd.debarment_exclusion',
  ])
  return retitle(
    pass,
    'fcdo-prime-2026-044-idd-missing',
    'FCDO-PRIME-2026-044-IDD-MISSING',
    pass.fields.map(item => gapKeys.has(item.key) ? { ...item, value: missing(fcdoIddEvidenceGap) } : item),
  )
}

/** FCDO prime: confirmed hit with no disposition decision. */
export function fcdoPrimeIddHitSnapshot(): AwardRegistrySnapshot {
  const pass = fcdoPrimePassSnapshot()
  return retitle(
    pass,
    'fcdo-prime-2026-044-idd-hit',
    'FCDO-PRIME-2026-044-IDD-HIT',
    replaceValue(pass.fields, 'idd.screen_result', present('confirmed_hit')),
  )
}

/** FCDO prime: confirmed hit with a recorded disposition. */
export function fcdoPrimeIddHitDispositionedSnapshot(): AwardRegistrySnapshot {
  const hit = fcdoPrimeIddHitSnapshot()
  return retitle(
    hit,
    'fcdo-prime-2026-044-idd-hit-dispositioned',
    'FCDO-PRIME-2026-044-IDD-HIT-DISPOSITIONED',
    [...hit.fields, ...fcdoIddDispositionFields()],
  )
}
