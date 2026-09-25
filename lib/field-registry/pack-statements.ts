/**
 * Phrase-level statements that may fill a donor-pack field.
 * A match is a full phrase, not a shared word. A later present sentence
 * wins over an earlier one, so a correction can replace a cover line.
 * `\bcompetitive\b` also matches the tail of "non-competitive", so that word
 * is not used as a present signal for ip.competitive_or_waiver.
 * Requirement boilerplate ("must be", "is prohibited") is not a present signal.
 */

export type PackStatement = {
  key: string
  absent?: readonly RegExp[]
  present?: readonly RegExp[]
}

export const PACK_STATEMENTS: readonly PackStatement[] = [
  {
    key: 'ip.threshold_approver',
    absent: [
      /no regional director approval/i,
      /approver must match the cumulative workplan threshold:\s*not met/i,
    ],
    present: [
      /regional director approval is on file/i,
      /approved by the regional director/i,
    ],
  },
  {
    key: 'ip.unpp_profile',
    absent: [
      /no unpp profile\b/i,
      /unpp profile\b[^.]{0,60}\b(?:not validated|not on file|incomplete)\b/i,
    ],
    present: [
      /unpp profile\b[^.]{0,80}\bvalidated\b/i,
    ],
  },
  {
    key: 'ip.hact_micro_assessment',
    absent: [
      /no hact micro-assessment/i,
      /hact micro-assessment\b[^.]{0,40}\bnot on file\b/i,
    ],
    present: [
      /final micro-assessment report issued on/i,
      /micro-assessment report\b[^.]{0,120}\brates\b[^.]{0,40}\brisk\b/i,
    ],
  },
  {
    key: 'procurement.rfq_criteria_and_scores',
    absent: [
      /evaluation criteria[^.]{0,80}none listed/i,
      /no evaluation criteria/i,
      /individual score cells are blank/i,
      /records no individual scores/i,
      /no criteria in the rfq/i,
      /individual scores blank/i,
    ],
    present: [
      /criteria in the rfq[^.]{0,80}individual scores (?:are )?recorded/i,
    ],
  },
  {
    key: 'procurement.po_or_contract',
    absent: [
      /no approved purchase order/i,
      /binding purchase order or contract before delivery:\s*none\b/i,
      /no signed contract is on file/i,
    ],
    present: [
      /approved purchase order\b[^.]{0,80}\bissued before delivery/i,
    ],
  },
  {
    key: 'procurement.rir',
    absent: [
      /no policy-compliant rir/i,
      /does not certify acceptance or rejection/i,
      /acceptance or rejection not certified/i,
    ],
    present: [
      /policy-compliant receiving and inspection report\b[^.]{0,60}\b(?:signed|on file)\b/i,
    ],
  },
  {
    key: 'eligibility.contractor_capable',
    absent: [
      /contractor is not able to perform/i,
      /ability to perform is not affirmed/i,
    ],
    present: [
      /contractor is able to perform/i,
      /ability to perform is affirmed/i,
    ],
  },
  {
    key: 'integrity.coi_disclosed',
    absent: [
      /conflict of interest was not disclosed/i,
      /no conflict of interest disclosure on file/i,
    ],
    present: [
      /conflict of interest disclosure is on file/i,
      /conflict of interest is disclosed/i,
    ],
  },
  {
    key: 'procurement.competitive_or_exempt',
    absent: [
      /neither competitive nor an established exemption/i,
    ],
    present: [
      /competitive award or an established exemption is on file/i,
    ],
  },
  {
    key: 'partner.due_diligence_passed',
    absent: [
      /due diligence (?:is |was )?not passed/i,
      /due diligence was not recorded as passed/i,
    ],
    present: [
      /due diligence (?:is |was )?recorded as passed/i,
      /partner due diligence passed\b/i,
    ],
  },
  {
    key: 'allocation.modality',
    present: [
      /allocation modality:\s*(standard|reserve)\b/i,
    ],
  },
  {
    key: 'procurement.fair_open_or_documented_direct',
    absent: [
      /neither fair open competition nor a documented direct award/i,
    ],
    present: [
      /fair open competition or a documented direct award is on file/i,
    ],
  },
  {
    key: 'idd.screen_result',
    absent: [
      /restrictive-measures result:\s*not (?:on file|recorded)/i,
    ],
    present: [
      /restrictive-measures result:\s*(clear|potential_match|confirmed_hit|unresolved)\b/i,
    ],
  },
  {
    key: 'misconduct.secretariat_sanctions_regime',
    present: [
      /secretariat partner-sanctions regime is none\b/i,
      /secretariat partner-sanctions regime:\s*none\b/i,
      /secretariat-wide partner-sanctions regime\b[^.]{0,80}\bnone\b/i,
    ],
  },
  {
    key: 'eligibility.contractor_capable',
    present: [
      /ability to implement/i,
      /post-qualification confirmed/i,
      /is able to complete the repairs/i,
    ],
  },
  {
    key: 'integrity.coi_disclosed',
    absent: [
      /did not sign the conflict-of-interest declaration/i,
      /coi declarations\b[^.]{0,80}\bare pending/i,
    ],
    present: [
      /signed conflict-of-interest declarations/i,
    ],
  },
  {
    key: 'integrity.coi_declared',
    absent: [
      /conflict-of-interest declaration\b[\s\S]{0,180}?returned\s+unsigned/i,
    ],
    present: [
      /signed a declaration of no conflict of interest/i,
    ],
  },
  {
    key: 'procurement.competitive_or_exempt',
    absent: [
      /no exemption from competitive procurement was approved/i,
    ],
    present: [
      /selection was competitive/i,
      /open competitive tendering/i,
    ],
  },
  {
    key: 'procurement.competition_or_exemption_documented',
    absent: [
      /is not included in this file/i,
      /no other exemption document is on file/i,
    ],
    present: [
      /(?:call text|tender dossier)\b[^.]{0,160}\bare filed/i,
    ],
  },
  {
    key: 'procurement.solicitation_notified',
    absent: [
      /no solicitation notice was issued/i,
    ],
    present: [
      /(?:the call|invitation to bid) was published on/i,
    ],
  },
  {
    key: 'documentation.award_rationale_on_file',
    absent: [
      /award recommendation memorandum\b[^.]{0,120}\bis not on file/i,
    ],
    present: [
      /committee recommends\b[^.]{0,80}\bbecause\b/i,
      /justification memorandum\b[^.]{0,80}\brecords the reasons/i,
    ],
  },
  {
    key: 'award.contract_value_usd',
    present: [
      /(?:budget ceiling|contract amount|equivalent to)\b[^.]{0,80}US\$\s*[0-9]/i,
      /US\$\s*[0-9][0-9,]*(?:\.\d+)?\s*\(Lot/i,
    ],
  },
  {
    key: 'threshold.method_aligned',
    absent: [
      /not the\s+method required for this value/i,
      /falls outside the single-source ceiling/i,
    ],
  },
  {
    key: 'procurement.method_vs_threshold',
    absent: [
      /method did not match the value/i,
    ],
  },
  {
    key: 'sr.selection_documented',
    absent: [
      /no sub-recipient is involved/i,
    ],
    present: [
      /selection committee of\b[^.]{0,80}\bevaluated/i,
    ],
  },
  {
    key: 'sr.written_agreement_on_file',
    absent: [
      /sub-recipient agreement has not yet been signed/i,
    ],
  },
  {
    key: 'ip.competitive_or_waiver',
    present: [
      /selected competitively/i,
    ],
  },
  {
    key: 'ip.waiver_or_competition_documented',
    present: [
      /panel scoring sheets and the selection memorandum/i,
    ],
  },
  {
    key: 'ip.threshold_approver',
    present: [
      /regional director, who approved/i,
    ],
  },
  {
    key: 'ip.unpp_profile',
    absent: [
      /unpp registration is not applicable/i,
    ],
    present: [
      /on unpp\b[^.]{0,120}\bverified\b/i,
    ],
  },
  {
    key: 'ip.psea_assessment',
    absent: [
      /psea capacity assessment\b[^.]{0,100}\bhas not been completed/i,
    ],
  },
  {
    key: 'integrity.related_party_checked',
    present: [
      /related-party and beneficial-ownership check completed/i,
    ],
  },
  {
    key: 'procurement.contract_split_checked',
    present: [
      /checked cumulative orders/i,
    ],
  },
  {
    key: 'procurement.crc_gate',
    present: [
      /contracts review committee reviewed the submission/i,
    ],
  },
  {
    key: 'procurement.lta_rate_reconciliation',
    present: [
      /reconciled against the\b[^.]{0,80}\blta reference price/i,
    ],
  },
  {
    key: 'procurement.po_or_contract',
    present: [
      /purchase order\b[^.]{0,100}\bwas approved\b[^.]{0,80}\bbefore\b/i,
    ],
  },
  {
    key: 'procurement.rfq_criteria_and_scores',
    present: [
      /evaluation criteria were stated in the rfq/i,
    ],
  },
  {
    key: 'procurement.rir',
    absent: [
      /receiving and inspection report will be completed/i,
      /is not part of this file at award/i,
    ],
  },
  {
    key: 'procurement.plan_line',
    absent: [
      /does not contain a procurement line/i,
    ],
    present: [
      /of the \d{4}\b[^.]{0,40}\bprocurement plan/i,
    ],
  },
  {
    key: 'payment.face_workplan_link',
    absent: [
      /no face form applies/i,
    ],
    present: [
      /face forms that reference workplan/i,
    ],
  },
  {
    key: 'payment.commodity_lines',
    absent: [
      /no implementing-partner workplan is linked/i,
    ],
    present: [
      /workplan includes non-cash lines/i,
    ],
  },
  {
    key: 'idd.clearcheck_where_personnel',
    absent: [
      /clearcheck was not run/i,
      /clearcheck does not apply/i,
    ],
  },
  {
    key: 'idd.vrc_iprc_status',
    present: [
      /not subject to any vrc sanction/i,
      /does not appear on the vendor review committee sanctions list/i,
    ],
  },
  {
    key: 'partner.due_diligence_passed',
    absent: [
      /had not completed due diligence/i,
    ],
    present: [
      /passed the due diligence stage/i,
    ],
  },
  {
    key: 'partner.capacity_assessment',
    absent: [
      /no capacity assessment is available/i,
      /capacity assessment\b[^.]{0,60}\bwas pending/i,
    ],
    present: [
      /capacity assessment was completed on/i,
    ],
  },
  {
    key: 'allocation.modality',
    present: [
      /\bstandard allocation\b/i,
      /\breserve allocation\b/i,
    ],
  },
  {
    key: 'allocation.strategy_on_file',
    present: [
      /allocation strategy paper, approved by the humanitarian coordinator/i,
      /reserve allocation strategy note of/i,
    ],
  },
  {
    key: 'allocation.preselection_justification',
    absent: [
      /no written justification is recorded for inviting/i,
    ],
  },
  {
    key: 'grant.agreement_complete',
    absent: [
      /grant agreement has not been issued/i,
    ],
    present: [
      /grant agreement\b[^.]{0,80}\bwas signed\b/i,
    ],
  },
  {
    key: 'grant.budget_template',
    absent: [
      /budget on the standard fund template has not yet been\s+submitted/i,
    ],
    present: [
      /uses the standard fund budget template/i,
    ],
  },
  {
    key: 'selection.scorecard_or_alternative',
    absent: [
      /no scorecard or alternative selection document was completed/i,
    ],
    present: [
      /completed the standard scorecard/i,
    ],
  },
  {
    key: 'selection.committee_decision',
    present: [
      /review committee met on/i,
    ],
  },
  {
    key: 'selection.recommendation_differs',
    present: [
      /follows the scorecard ranking/i,
      /no project was recommended out of rank/i,
      /recommendation differs/i,
      /differs from the score/i,
    ],
  },
  {
    key: 'misconduct.annex9_notification',
    present: [
      /within 48 hours of becoming aware/i,
      /annex 9 duty is to notify\b[^.]{0,40}\bwithin 48 hours/i,
    ],
  },
  {
    key: 'misconduct.oios_notification_path',
    absent: [
      /does not name the channel for reporting to oios/i,
    ],
    present: [
      /reported by the hfu to oios/i,
    ],
  },
  {
    key: 'onegms.project_status',
    present: [
      /status of the project in onegms/i,
      /onegms project status as of/i,
    ],
  },
  {
    key: 'onegms.selection_record',
    absent: [
      /selection decision of the review committee was not recorded in onegms/i,
    ],
  },
  {
    key: 'partner.annex7_declarations',
    present: [
      /signed annex 7 declarations/i,
      /annex 7 declarations of\b/i,
      /declarations attested on the annex 7/i,
    ],
  },
  {
    key: 'idd.subject',
    present: [
      /subject screened\s+\S/i,
      /(?:^|\n)subject\s*\n+\s*[A-Z][\s\S]{0,90}?\b(?:Ltd|SARL|Lda|Organisation|Organization)\b/i,
      /entity screened\s+\S/i,
      /vendor\s+[A-Z][\s\S]{0,70}?\bLtd\b/i,
      /screening covers\s+[A-Z0-9]/i,
    ],
  },
  {
    key: 'idd.subject_kind',
    present: [
      /subject type\s+(?:organisation|organization|company)\b/i,
      /entity type\s+non-governmental/i,
      /type\s+organisation\b/i,
      /type\s+private limited company/i,
    ],
  },
  {
    key: 'idd.subject_role',
    present: [
      /role in the grant\s+proposed sub-recipient/i,
      /relationship\s+supplier\b/i,
      /role\s+supplier\b/i,
    ],
  },
  {
    key: 'idd.affiliated_persons',
    absent: [
      /were not screened individually/i,
    ],
    present: [
      /persons screened with the company/i,
    ],
  },
  {
    key: 'idd.screen_scope',
    present: [
      /lists covered:/i,
      /scope codes attested/i,
      /screened the names against/i,
      /were screened against the/i,
      /scope\s+un\s*\/\s*ungm/i,
      /designated-entity check:/i,
      /declaration type\s+designated-entity/i,
    ],
  },
  {
    key: 'idd.screen_date',
    present: [
      /(?:screen|screened|screening)\b[^.]{0,80}\b(?:on )?\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4}/i,
    ],
  },
  {
    key: 'idd.list_vintage',
    present: [
      /lists were downloaded on/i,
    ],
  },
  {
    key: 'idd.screen_modality',
    present: [
      /screen was run in-house/i,
      /pre-approved providers/i,
      /not a global fund pre-approved provider/i,
    ],
  },
  {
    key: 'idd.screen_result',
    present: [
      /recorded as clear/i,
      /potential match/i,
      /recorded as unresolved/i,
      /outcome\s+clear\b/i,
      /\bclear \(no match\)/i,
    ],
  },
  {
    key: 'idd.screen_timing',
    present: [
      /after the contract had been signed/i,
      /not before engagement/i,
    ],
  },
  {
    key: 'idd.evidence_ref',
    present: [
      /screening record\s+[A-Z]{2,}[-/][A-Z0-9-]{4,}/i,
      /provider report\s+[A-Z0-9-]{4,}/i,
      /legal memorandum\s+[A-Z]{2,}\/[0-9]{4}\/[0-9]{2,}/i,
      /screening note is filed as\s+[A-Z0-9/-]{6,}/i,
      /printout\s+[A-Z]{2,}[-/][A-Z0-9-]{4,}/i,
      /screen log\s+[A-Z]{2,}[-/][A-Z0-9-]{4,}/i,
    ],
  },
  {
    key: 'idd.disposition_decision',
    absent: [
      /no disposition decision was taken or recorded/i,
    ],
    present: [
      /decision:\s*(?:select|continue|terminate)\b/i,
    ],
  },
  {
    key: 'idd.disposition_owner',
    present: [
      /was designated to handle the potential match/i,
    ],
  },
  {
    key: 'idd.disposition_rationale',
    absent: [
      /no rationale for continuing/i,
    ],
    present: [
      /rationale recorded is that/i,
    ],
  },
  {
    key: 'idd.gf_notification',
    absent: [
      /have not been communicated to the global fund/i,
    ],
    present: [
      /country team was informed of the potential match/i,
    ],
  },
]
