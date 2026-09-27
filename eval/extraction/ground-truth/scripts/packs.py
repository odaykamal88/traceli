"""Pack key lists and rule metadata, transcribed from odaykamal88/traceli (main):
  lib/field-registry/packs/global-fund.ts  (GLOBAL_FUND_FIELD_KEYS, GLOBAL_FUND_RULES, version 2026.2)
  lib/field-registry/packs/unfpa.ts        (UNFPA_FIELD_KEYS, UNFPA_RULES, version 2026.1)
  lib/field-registry/packs/ocha-cbpf.ts    (OCHA_CBPF_FIELD_KEYS, OCHA_CBPF_RULES, version 2026.1)
  lib/field-registry/packs/idd.ts          (allowed-value vocabularies)
"""
SUBJECT_KINDS = ['organization', 'individual']
SCREEN_RESULTS = ['clear', 'potential_match', 'confirmed_hit', 'unresolved']
HIT_RESULTS = ['potential_match', 'confirmed_hit', 'unresolved']
DECISIONS = ['select', 'continue', 'terminate']
GF_ROLES = ['sr', 'supplier', 'signatory', 'key_personnel']
GF_MODALITIES = ['in_house', 'gf_preapproved_vendor', 'other']
GF_TIMINGS = ['before_engagement', 'grant_cycle_rerun']
GF_SCOPE = ['un', 'ofac', 'us-state', 'switzerland', 'debarment', 'ineligibility']
UNFPA_SCOPE = ['un', 'ungm']
OCHA_SCOPE = ['designated-entity']
OCHA_ANNEX7 = ['accurate-info', 'compliance', 'coi', 'designated-entity', 'legal-process', 'disability', 'psea']


def R(kind, title, severity='blocker', **kw):
    d = {'kind': kind, 'title': title, 'severity': severity}
    d.update(kw)
    return d


GF = {
    'eligibility.contractor_capable': R('value_must_equal', 'Contractor ability to perform must be affirmed', expected=True),
    'integrity.coi_disclosed': R('value_must_equal', 'Conflict of interest disclosure required', expected=True),
    'procurement.competitive_or_exempt': R('value_must_equal', 'Award must be competitive or an established exemption', expected=True),
    'procurement.competition_or_exemption_documented': R('required_present', 'Competition or sole-source exemption documentation required'),
    'procurement.solicitation_notified': R('required_present', 'Bid solicitation notice to prospective bidders', 'warning'),
    'documentation.award_rationale_on_file': R('required_present', 'Award rationale documentation required'),
    'award.contract_value_usd': R('required_present', 'Contract value must be on the registry'),
    'threshold.method_aligned': R('value_must_equal', 'Procurement method must align with value threshold', expected=True),
    'sr.selection_documented': R('required_present', 'Sub-recipient selection process documented'),
    'sr.capacity_assessed': R('required_present', 'Sub-recipient capacity assessment on file'),
    'sr.written_agreement_on_file': R('required_present', 'Written sub-recipient agreement required'),
    'idd.subject': R('required_present', 'IDD subject organization or individual required before signature'),
    'idd.subject_kind': R('value_must_be_one_of', 'IDD subject must be recorded as an organization or an individual', allowed=SUBJECT_KINDS),
    'idd.subject_role': R('value_must_be_one_of', 'IDD subject role required (SR, supplier, signatory, or key personnel)', allowed=GF_ROLES),
    'idd.affiliated_persons': R('required_present', 'Affiliated and key persons, with roles, required on the IDD record'),
    'idd.screen_scope': R('text_must_include', 'Restrictive Measures scope must attest UN, OFAC, US State, Switzerland, and debarment', tokens=GF_SCOPE),
    'idd.screen_date': R('required_present', 'Restrictive Measures screen date required before signature'),
    'idd.list_vintage': R('required_present', 'List vintage cited by the screening evidence is required'),
    'idd.screen_modality': R('value_must_be_one_of', 'IDD modality must be in-house, a Global Fund pre-approved vendor, or other', allowed=GF_MODALITIES),
    'idd.screen_result': R('value_must_be_one_of', 'IDD result must be clear, potential match, confirmed hit, or unresolved', allowed=SCREEN_RESULTS),
    'idd.screen_timing': R('value_must_be_one_of', 'Screen must be attested before engagement or as the grant-cycle re-run', allowed=GF_TIMINGS),
    'idd.evidence_ref': R('required_present', 'Screening evidence reference required before signature'),
    'idd.disposition_owner': R('required_when_value_in', 'A non-clear Restrictive Measures result needs a disposition owner', whenFieldKey='idd.screen_result', whenValues=HIT_RESULTS),
    'idd.disposition_decision': R('required_when_value_in', 'A non-clear result needs a select, continue, or terminate decision', whenFieldKey='idd.screen_result', whenValues=HIT_RESULTS, allowedValues=DECISIONS),
    'idd.disposition_rationale': R('required_when_value_in', 'A non-clear Restrictive Measures result needs a disposition rationale', whenFieldKey='idd.screen_result', whenValues=HIT_RESULTS),
    'idd.gf_notification': R('required_when_value_in', 'Restrictive Measures findings must be communicable to the Global Fund', whenFieldKey='idd.screen_result', whenValues=HIT_RESULTS),
}

UNFPA = {
    'ip.competitive_or_waiver': R('value_must_equal', 'IP selection must be competitive or a documented non-competitive path', expected=True),
    'ip.waiver_or_competition_documented': R('required_present', 'Competition file or waiver template required'),
    'ip.threshold_approver': R('value_must_equal', 'Approver must match the cumulative workplan threshold', expected=True),
    'ip.unpp_profile': R('required_present', 'UNPP profile complete and validated'),
    'ip.hact_micro_assessment': R('required_present', 'HACT micro-assessment date and risk rating required'),
    'ip.psea_assessment': R('required_present', 'PSEA capacity assessment status on the IP file', 'warning'),
    'procurement.plan_line': R('required_present', 'Annual procurement plan line required'),
    'procurement.method_vs_threshold': R('value_must_equal', 'Solicitation method must align with the value threshold', expected=True),
    'procurement.crc_gate': R('required_present', 'Contracts Review Committee gate recorded'),
    'procurement.contract_split_checked': R('value_must_equal', 'Contract-split check recorded for the same vendor and object', expected=True),
    'procurement.rfq_criteria_and_scores': R('required_present', 'RFQ evaluation criteria and individual scores required'),
    'procurement.po_or_contract': R('required_present', 'Binding purchase order or contract required before delivery'),
    'procurement.rir': R('required_present', 'Receiving and inspection report named on the file', 'warning'),
    'procurement.lta_rate_reconciliation': R('required_present', 'LTA source and rate reconciliation on the file', 'warning'),
    'integrity.coi_declared': R('value_must_equal', 'Conflict of interest declared for staff, vendor, and IP', expected=True),
    'integrity.related_party_checked': R('required_present', 'Related-party, shared-contact, and beneficial-ownership check required'),
    'payment.face_workplan_link': R('required_present', 'FACE or workplan linkage named before payment', 'warning'),
    'payment.commodity_lines': R('required_present', 'Non-cash commodity lines named on the IP workplan', 'warning'),
    'idd.subject': R('required_present', 'Restrictive-measures subject required before signature'),
    'idd.subject_kind': R('value_must_be_one_of', 'Restrictive-measures subject must be an organization or an individual', allowed=SUBJECT_KINDS),
    'idd.screen_scope': R('text_must_include', 'Restrictive-measures scope must attest UN and UNGM', tokens=UNFPA_SCOPE),
    'idd.screen_date': R('required_present', 'Restrictive-measures screen date required before signature'),
    'idd.screen_result': R('value_must_be_one_of', 'Restrictive-measures result must be clear, potential match, confirmed hit, or unresolved', allowed=SCREEN_RESULTS),
    'idd.evidence_ref': R('required_present', 'Restrictive-measures evidence reference required'),
    'idd.vrc_iprc_status': R('required_present', 'VRC, IPRC, and UNPP flag status required'),
    'idd.clearcheck_where_personnel': R('required_present', 'ClearCheck status where personnel are in scope', 'warning'),
    'idd.disposition_decision': R('required_when_value_in', 'A non-clear restrictive-measures result needs a select, continue, or terminate decision', whenFieldKey='idd.screen_result', whenValues=HIT_RESULTS, allowedValues=DECISIONS),
}

OCHA = {
    'partner.due_diligence_passed': R('value_must_equal', 'Partner due diligence must be recorded as passed', expected=True),
    'partner.capacity_assessment': R('required_present', 'Partner capacity assessment required'),
    'partner.annex7_declarations': R('text_must_include', 'Annex 7 declarations required, including conflict of interest and designated entity', tokens=OCHA_ANNEX7),
    'allocation.modality': R('value_must_be_one_of', 'Allocation modality must be standard or reserve', allowed=['standard', 'reserve']),
    'allocation.preselection_justification': R('required_when_value_in', 'Reserve pre-selection needs a written justification for each invited partner', whenFieldKey='allocation.modality', whenValues=['reserve']),
    'allocation.strategy_on_file': R('required_present', 'Allocation strategy filed, including reserve pre-selection criteria'),
    'selection.scorecard_or_alternative': R('required_present', 'Scorecard or alternative selection document required before recommendation'),
    'selection.committee_decision': R('required_present', 'Review-committee decision recorded'),
    'selection.recommendation_differs': R('no_own_rule', '(no rule of its own; trigger for selection.mismatch_note when true)', 'n/a'),
    'selection.mismatch_note': R('required_when_value_in', 'A score and recommendation mismatch needs a disposition note', whenFieldKey='selection.recommendation_differs', whenValues=[True]),
    'grant.agreement_complete': R('required_present', 'Grant agreement completeness recorded'),
    'grant.budget_template': R('required_present', 'Budget template on the grant file', 'warning'),
    'grant.consortium_controls': R('required_present', 'Consortium or sub-grant pass-through controls named', 'warning'),
    'misconduct.annex8_path': R('required_present', 'Annex 8 non-compliance path recorded (suggested measures, not a fraud regime)', 'warning'),
    'misconduct.annex9_notification': R('required_present', 'Annex 9 fraud notification path recorded, including the 48-hour partner duty'),
    'misconduct.oios_notification_path': R('required_present', 'OIOS notification pathway named', 'warning'),
    'misconduct.secretariat_sanctions_regime': R('value_must_equal', 'Secretariat partner-sanctions regime must be recorded as none', expected='none'),
    'onegms.project_status': R('required_present', 'OneGMS project status required'),
    'onegms.selection_record': R('required_present', 'OneGMS selection record required'),
    'idd.subject': R('required_present', 'Designated-entity subject required before signature'),
    'idd.screen_scope': R('text_must_include', 'Annex 7 designated-entity scope must be attested', tokens=OCHA_SCOPE),
    'idd.screen_result': R('value_must_be_one_of', 'Designated-entity result must be clear, potential match, confirmed hit, or unresolved', allowed=SCREEN_RESULTS),
    'idd.evidence_ref': R('required_present', 'Designated-entity evidence reference required'),
    'idd.disposition_decision': R('required_when_value_in', 'A non-clear designated-entity result needs a select, continue, or terminate decision', whenFieldKey='idd.screen_result', whenValues=HIT_RESULTS, allowedValues=DECISIONS),
}

GF_KEYS = ['eligibility.contractor_capable', 'integrity.coi_disclosed', 'procurement.competitive_or_exempt',
           'procurement.competition_or_exemption_documented', 'procurement.solicitation_notified',
           'documentation.award_rationale_on_file', 'award.contract_value_usd', 'threshold.method_aligned',
           'sr.selection_documented', 'sr.capacity_assessed', 'sr.written_agreement_on_file', 'idd.subject',
           'idd.subject_kind', 'idd.subject_role', 'idd.affiliated_persons', 'idd.screen_scope', 'idd.screen_date',
           'idd.list_vintage', 'idd.screen_modality', 'idd.screen_result', 'idd.screen_timing', 'idd.evidence_ref',
           'idd.disposition_owner', 'idd.disposition_decision', 'idd.disposition_rationale', 'idd.gf_notification']
UNFPA_KEYS = ['ip.competitive_or_waiver', 'ip.waiver_or_competition_documented', 'ip.threshold_approver',
              'ip.unpp_profile', 'ip.hact_micro_assessment', 'ip.psea_assessment', 'procurement.plan_line',
              'procurement.method_vs_threshold', 'procurement.crc_gate', 'procurement.contract_split_checked',
              'procurement.rfq_criteria_and_scores', 'procurement.po_or_contract', 'procurement.rir',
              'procurement.lta_rate_reconciliation', 'integrity.coi_declared', 'integrity.related_party_checked',
              'payment.face_workplan_link', 'payment.commodity_lines', 'idd.subject', 'idd.subject_kind',
              'idd.screen_scope', 'idd.screen_date', 'idd.screen_result', 'idd.evidence_ref', 'idd.vrc_iprc_status',
              'idd.clearcheck_where_personnel', 'idd.disposition_decision']
OCHA_KEYS = ['partner.due_diligence_passed', 'partner.capacity_assessment', 'partner.annex7_declarations',
             'allocation.modality', 'allocation.preselection_justification', 'allocation.strategy_on_file',
             'selection.scorecard_or_alternative', 'selection.committee_decision', 'selection.recommendation_differs',
             'selection.mismatch_note', 'grant.agreement_complete', 'grant.budget_template',
             'grant.consortium_controls', 'misconduct.annex8_path', 'misconduct.annex9_notification',
             'misconduct.oios_notification_path', 'misconduct.secretariat_sanctions_regime', 'onegms.project_status',
             'onegms.selection_record', 'idd.subject', 'idd.screen_scope', 'idd.screen_result', 'idd.evidence_ref',
             'idd.disposition_decision']

assert GF_KEYS == list(GF) and UNFPA_KEYS == list(UNFPA) and OCHA_KEYS == list(OCHA)
assert (len(GF_KEYS), len(UNFPA_KEYS), len(OCHA_KEYS)) == (26, 27, 24)

PACKS = {
    'global-fund': {'version': '2026.2', 'name': 'Global Fund Grant Regulations v1', 'keys': GF_KEYS, 'rules': GF,
                    'source': 'lib/field-registry/packs/global-fund.ts'},
    'unfpa': {'version': '2026.1', 'name': 'UNFPA OAIS-shaped award desk v0', 'keys': UNFPA_KEYS, 'rules': UNFPA,
              'source': 'lib/field-registry/packs/unfpa.ts'},
    'ocha-cbpf': {'version': '2026.1', 'name': 'OCHA CBPF Global Guidelines-shaped award desk v0', 'keys': OCHA_KEYS,
                  'rules': OCHA, 'source': 'lib/field-registry/packs/ocha-cbpf.ts'},
}
