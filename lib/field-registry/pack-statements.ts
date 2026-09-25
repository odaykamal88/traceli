/**
 * Phrase-level statements that may fill a donor-pack field.
 * A match is a full phrase, not a shared word. Absence wins over presence.
 * `\bcompetitive\b` also matches the tail of "non-competitive", so that word
 * is not used as a present signal for ip.competitive_or_waiver.
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
      /hact micro-assessment\b[^.]{0,80}\brisk rating\b/i,
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
    ],
  },
]
