import type { AwardRegistrySnapshot, RegistryField } from '@/lib/field-registry/schema'
import { ochaAnnex7Attestation, ochaIddScopeAttestation, unfpaIddScopeAttestation } from '@/lib/field-registry/packs/idd'
import { OCHA_CBPF_PACK } from '@/lib/field-registry/packs/ocha-cbpf'
import { UNFPA_PACK } from '@/lib/field-registry/packs/unfpa'

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
  return { fieldId, entityKind, entityId, key, value, provenance: provenance(sourceRef) }
}

function present(value: string | number | boolean): RegistryField['value'] {
  return { state: 'present', value }
}

function missing(reason: string): RegistryField['value'] {
  return { state: 'missing', reason }
}

const page = (id: string, label: string): RegistryField['provenance']['sourceRef'] => ({ kind: 'page', id, label })

function unfpaClearanceFields(): RegistryField[] {
  return [
    field('unfpa_idd_subject', 'supplier', 'supplier_ip_demo', 'idd.subject', present('Demo IP Alpha'), page('rm-memo', 'Restrictive measures memo')),
    field('unfpa_idd_kind', 'supplier', 'supplier_ip_demo', 'idd.subject_kind', present('organization'), page('rm-memo', 'Restrictive measures memo')),
    field('unfpa_idd_scope', 'evidence', 'evidence_rm_scope', 'idd.screen_scope', present(unfpaIddScopeAttestation), page('rm-scope', 'Screen scope')),
    field('unfpa_idd_date', 'evidence', 'evidence_rm_date', 'idd.screen_date', present('2026-08-15'), page('rm-memo', 'Restrictive measures memo')),
    field('unfpa_idd_result', 'evidence', 'evidence_rm_result', 'idd.screen_result', present('clear'), page('rm-memo', 'Restrictive measures memo')),
    field('unfpa_idd_evidence', 'evidence', 'evidence_rm_memo', 'idd.evidence_ref', present('RM memo UNFPA-IP-2026-013'), page('rm-memo', 'Restrictive measures memo')),
    field('unfpa_idd_vrc', 'evidence', 'evidence_vrc', 'idd.vrc_iprc_status', present('No VRC referral. No IPRC debarment. No UNPP flag.'), page('vrc-note', 'VRC IPRC note')),
    field('unfpa_idd_clearcheck', 'evidence', 'evidence_clearcheck', 'idd.clearcheck_where_personnel', present('No personnel in scope for ClearCheck.'), page('clearcheck-note', 'ClearCheck note')),
  ]
}

/** Synthetic UNFPA pass. Not a public case and not a desk freeze. */
export function unfpaPassSnapshot(): AwardRegistrySnapshot {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'synthetic',
    organizationId: 'org_unfpa_demo',
    projectId: 'project_unfpa_ip_award',
    awardId: 'unfpa-ip-2026-013',
    procurementReference: 'UNFPA-IP-2026-013',
    donor: { donorId: 'donor_unfpa', name: 'UNFPA' },
    framework: {
      frameworkId: UNFPA_PACK.packId,
      name: UNFPA_PACK.name,
      version: UNFPA_PACK.version,
    },
    asOf,
    fields: [
      field('unfpa_ip_path', 'criterion', 'criterion_ip_path', 'ip.competitive_or_waiver', present(true), page('ip-method', 'IP method note')),
      field('unfpa_ip_docs', 'evidence', 'evidence_ip_docs', 'ip.waiver_or_competition_documented', present('Competitive IP selection minutes on file'), page('ip-minutes', 'IP selection minutes')),
      field('unfpa_ip_approver', 'criterion', 'criterion_ip_approver', 'ip.threshold_approver', present(true), page('ip-approval', 'Threshold approval')),
      field('unfpa_unpp', 'evidence', 'evidence_unpp', 'ip.unpp_profile', present('UNPP profile validated 2026-07-01'), page('unpp', 'UNPP profile')),
      field('unfpa_hact', 'evidence', 'evidence_hact', 'ip.hact_micro_assessment', present('Micro-assessment 2026-06-01, risk rating moderate'), page('hact', 'HACT assessment')),
      field('unfpa_psea', 'evidence', 'evidence_psea', 'ip.psea_assessment', present('PSEA capacity assessment current'), page('psea', 'PSEA assessment')),
      field('unfpa_plan', 'evidence', 'evidence_plan', 'procurement.plan_line', present('Annual plan line PL-013'), page('plan', 'Procurement plan')),
      field('unfpa_method', 'criterion', 'criterion_method', 'procurement.method_vs_threshold', present(true), page('method', 'Method check')),
      field('unfpa_crc', 'evidence', 'evidence_crc', 'procurement.crc_gate', present('Below CRC threshold; gate recorded as not required'), page('crc', 'CRC gate')),
      field('unfpa_split', 'criterion', 'criterion_split', 'procurement.contract_split_checked', present(true), page('split', 'Contract-split check')),
      field('unfpa_rfq', 'evidence', 'evidence_rfq', 'procurement.rfq_criteria_and_scores', present('Criteria in the RFQ. Individual scores on the matrix.'), page('rfq', 'RFQ matrix')),
      field('unfpa_po', 'evidence', 'evidence_po', 'procurement.po_or_contract', present('PO UNFPA-IP-2026-013 issued before delivery'), page('po', 'Purchase order')),
      field('unfpa_rir', 'evidence', 'evidence_rir', 'procurement.rir', present('RIR template named; acceptance not yet due'), page('rir', 'RIR')),
      field('unfpa_lta', 'evidence', 'evidence_lta', 'procurement.lta_rate_reconciliation', present('Not an LTA call-off'), page('lta', 'LTA note')),
      field('unfpa_coi', 'evidence', 'evidence_coi', 'integrity.coi_declared', present(true), page('coi', 'COI declarations')),
      field('unfpa_related', 'evidence', 'evidence_related', 'integrity.related_party_checked', present('No shared address or beneficial owner among bidders'), page('related', 'Related-party check')),
      field('unfpa_face', 'evidence', 'evidence_face', 'payment.face_workplan_link', present('Workplan WP-013 linked'), page('face', 'Workplan link')),
      field('unfpa_commodity', 'evidence', 'evidence_commodity', 'payment.commodity_lines', present('No non-cash commodity line on this workplan'), page('commodity', 'Commodity lines')),
      ...unfpaClearanceFields(),
    ],
  }
}

/** Synthetic UNFPA fail: threshold approver, RFQ scores, PO, and related-party gaps. */
export function unfpaFailSnapshot(): AwardRegistrySnapshot {
  const pass = unfpaPassSnapshot()
  return {
    ...pass,
    awardId: 'unfpa-ip-2026-013-fail',
    procurementReference: 'UNFPA-IP-2026-013-FAIL',
    fields: pass.fields.map(item => {
      if (item.key === 'ip.threshold_approver') return { ...item, value: present(false) }
      if (item.key === 'procurement.rfq_criteria_and_scores') {
        return { ...item, value: missing('RFQ has no evaluation criteria and the matrix has no individual scores.') }
      }
      if (item.key === 'procurement.po_or_contract') {
        return { ...item, value: missing('No approved purchase order or contract on the file.') }
      }
      if (item.key === 'integrity.related_party_checked') {
        return { ...item, value: missing('No related-party or beneficial-ownership check on the file.') }
      }
      return item
    }),
  }
}

function ochaClearanceFields(): RegistryField[] {
  return [
    field('ocha_idd_subject', 'supplier', 'partner_demo', 'idd.subject', present('Demo Partner Beta'), page('dd-memo', 'Due diligence memo')),
    field('ocha_idd_scope', 'evidence', 'evidence_dd_scope', 'idd.screen_scope', present(ochaIddScopeAttestation), page('dd-scope', 'Designated entity')),
    field('ocha_idd_result', 'evidence', 'evidence_dd_result', 'idd.screen_result', present('clear'), page('dd-memo', 'Due diligence memo')),
    field('ocha_idd_evidence', 'evidence', 'evidence_dd_memo', 'idd.evidence_ref', present('Annex 7 designated-entity declaration CBPF-2026-058'), page('dd-memo', 'Due diligence memo')),
  ]
}

/** Synthetic CBPF pass: a reserve file with justification and a scorecard. Not a public case. */
export function ochaCbpfPassSnapshot(): AwardRegistrySnapshot {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'synthetic',
    organizationId: 'org_ocha_demo',
    projectId: 'project_ocha_reserve',
    awardId: 'ocha-cbpf-2026-058',
    procurementReference: 'OCHA-CBPF-2026-058',
    donor: { donorId: 'donor_ocha_cbpf', name: 'OCHA CBPF' },
    framework: {
      frameworkId: OCHA_CBPF_PACK.packId,
      name: OCHA_CBPF_PACK.name,
      version: OCHA_CBPF_PACK.version,
    },
    asOf,
    fields: [
      field('ocha_dd', 'criterion', 'criterion_dd', 'partner.due_diligence_passed', present(true), page('dd', 'Due diligence')),
      field('ocha_capacity', 'evidence', 'evidence_capacity', 'partner.capacity_assessment', present('Capacity assessment passed 2026-05-12'), page('capacity', 'Capacity assessment')),
      field('ocha_annex7', 'evidence', 'evidence_annex7', 'partner.annex7_declarations', present(ochaAnnex7Attestation), page('annex7', 'Annex 7 declarations')),
      field('ocha_modality', 'criterion', 'criterion_modality', 'allocation.modality', present('reserve'), page('strategy', 'Allocation strategy')),
      field('ocha_justify', 'evidence', 'evidence_justify', 'allocation.preselection_justification', present('Single-source justification recorded against the reserve strategy criteria'), page('justify', 'Pre-selection justification')),
      field('ocha_strategy', 'evidence', 'evidence_strategy', 'allocation.strategy_on_file', present('Reserve strategy filed to the Data Hub'), page('strategy', 'Allocation strategy')),
      field('ocha_scorecard', 'evidence', 'evidence_scorecard', 'selection.scorecard_or_alternative', present('Scorecard uploaded before the funding recommendation'), page('scorecard', 'Scorecard')),
      field('ocha_committee', 'evidence', 'evidence_committee', 'selection.committee_decision', present('Review committee recommends funding'), page('committee', 'Committee note')),
      field('ocha_differs', 'criterion', 'criterion_differs', 'selection.recommendation_differs', present(false), page('committee', 'Committee note')),
      field('ocha_grant', 'evidence', 'evidence_grant', 'grant.agreement_complete', present('Grant agreement draft complete'), page('grant', 'Grant agreement')),
      field('ocha_budget', 'evidence', 'evidence_budget', 'grant.budget_template', present('Budget template on file'), page('budget', 'Budget')),
      field('ocha_consortium', 'evidence', 'evidence_consortium', 'grant.consortium_controls', present('Direct grant; no pass-through'), page('consortium', 'Consortium note')),
      field('ocha_annex8', 'evidence', 'evidence_annex8', 'misconduct.annex8_path', present('Annex 8 non-compliance measures noted as suggested, not a fraud regime'), page('annex8', 'Annex 8')),
      field('ocha_annex9', 'evidence', 'evidence_annex9', 'misconduct.annex9_notification', present('Partner duty to notify OCHA within 48 hours is in the grant file'), page('annex9', 'Annex 9')),
      field('ocha_oios', 'evidence', 'evidence_oios', 'misconduct.oios_notification_path', present('OIOS notification pathway named'), page('oios-path', 'OIOS path')),
      field('ocha_list', 'criterion', 'criterion_list', 'misconduct.secretariat_sanctions_regime', present('none'), page('sanctions-gap', 'Sanctions gap')),
      field('ocha_status', 'evidence', 'evidence_onegms_status', 'onegms.project_status', present('OneGMS project status: under review'), page('onegms', 'OneGMS')),
      field('ocha_selection', 'evidence', 'evidence_onegms_selection', 'onegms.selection_record', present('OneGMS selection record uploaded'), page('onegms', 'OneGMS')),
      ...ochaClearanceFields(),
    ],
  }
}

/** Synthetic CBPF fail: reserve file missing justification and scorecard, due diligence not passed. */
export function ochaCbpfFailSnapshot(): AwardRegistrySnapshot {
  const pass = ochaCbpfPassSnapshot()
  return {
    ...pass,
    awardId: 'ocha-cbpf-2026-058-fail',
    procurementReference: 'OCHA-CBPF-2026-058-FAIL',
    fields: pass.fields.map(item => {
      if (item.key === 'partner.due_diligence_passed') return { ...item, value: present(false) }
      if (item.key === 'allocation.preselection_justification') {
        return { ...item, value: missing('Reserve single-source justification is not on the file.') }
      }
      if (item.key === 'selection.scorecard_or_alternative') {
        return { ...item, value: missing('No scorecard or alternative selection document before recommendation.') }
      }
      return item
    }),
  }
}
