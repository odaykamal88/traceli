import { patternTicketSchema, type PatternTicket } from '@/lib/field-registry/case-card'
import { ngoPatternTickets } from '@/lib/case-cards/ngo-pattern-tickets'

/**
 * Pattern ticket store. Stable ids are the contract for pack, registry,
 * and judgment changes. Status `stub` means the ticket is seeded from a
 * public case. A non-null ruleId means that thin pack already checks the
 * field. The id does not change if status later moves to `accepted`.
 * `accepted` is a human step. It is not implied by shipping the rule.
 */
const patternTickets = patternTicketSchema.array().parse([
  ...ngoPatternTickets,
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:gf-oig-25-005:competition-exception-docs',
    title: 'Competition or exemption must be on the file',
    statement:
      'When a restricted or single-source method is used, the file needs the exemption and the authorization before signature. GF-OIG-25-005 §4.4 found three such awards were not consistently documented, including files that lacked the justifying authorization.',
    status: 'stub',
    packId: 'global-fund',
    ruleId: 'gf_procurement_competition_docs',
    fieldKey: 'procurement.competition_or_exemption_documented',
    sourceCaseSlugs: ['gf-oig-25-005'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:gf-oig-25-005:procurement-file-completeness',
    title: 'Execution file: delivery, reception, validation',
    statement:
      'A non-health procurement file should show delivery to the final user, reception, and validation of works. The Global Fund pack checks award rationale, not this execution file. Seeded from the €2.7 million incomplete-file sample in GF-OIG-25-005 §4.4.',
    status: 'stub',
    packId: 'global-fund',
    ruleId: null,
    fieldKey: 'procurement.file_completeness',
    sourceCaseSlugs: ['gf-oig-25-005'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:gf-oig-25-005:extension-authority',
    title: 'Contract extension needs a named authorizer',
    statement:
      'An extension needs a named authorizing authority and a record of that authorization, not only a manual clause on duration and cost. Seeded from GF-OIG-25-005 §4.4, where 30% of extensions ran for as long as 18 months.',
    status: 'stub',
    packId: 'global-fund',
    ruleId: null,
    fieldKey: 'procurement.extension_authority_documented',
    sourceCaseSlugs: ['gf-oig-25-005'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:unfpa-annex4-13:ip-vendor-coi',
    title: 'IP and vendor conflict of interest on the file',
    statement:
      'An implementing-partner award file needs a conflict-of-interest declaration covering the partner and the vendors it procures, before signature. OAIS Annex 4 entry 13, East and Southern Africa, states that an IP procured vendor services in violation of conflict-of-interest procurement rules. The annex does not name a country or a person.',
    status: 'stub',
    packId: 'unfpa',
    ruleId: 'unfpa_integrity_coi',
    fieldKey: 'integrity.coi_declared',
    sourceCaseSlugs: ['unfpa-annex4-13-esa-ip'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:unfpa-annex4-13:iprc-unpp-vrc',
    title: 'IPRC, UNPP flag, and VRC status',
    statement:
      'The restrictive-measures record should show IP review status, any UNPP flag, and vendor-review status. Annex 4 entry 13 states the IP was debarred, the IPRC raised a UNPP flag, and the vendor list was referred to the VRC with review still ongoing. Debarment and a referral are not a completed recovery.',
    status: 'stub',
    packId: 'unfpa',
    ruleId: 'unfpa_idd_vrc_iprc',
    fieldKey: 'idd.vrc_iprc_status',
    sourceCaseSlugs: ['unfpa-annex4-13-esa-ip'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:unfpa-annex4-21:related-party-ties',
    title: 'Competing vendors need a related-party check',
    statement:
      'A solicitation file should show whether competing vendors share undisclosed ties, contacts, or beneficial ownership. Annex 4 entry 21, Arab States, states a vendor had undisclosed ties with competing vendors. The annex does not name a country or a person. The reported loss is not the same thing as recovery.',
    status: 'stub',
    packId: 'unfpa',
    ruleId: 'unfpa_integrity_related_party',
    fieldKey: 'integrity.related_party_checked',
    sourceCaseSlugs: ['unfpa-annex4-21-arab-vendor'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:unfpa-annex4-21:vendor-regulation-gap',
    title: 'Vendor competition against the value threshold',
    statement:
      'The pack asks whether the solicitation method matches the value threshold. Annex 4 entry 21 states the procurements violated several elements of UNFPA procurement regulations and does not itemize which element. This ticket keeps that gap on the competition control instead of inventing the missing clause.',
    status: 'stub',
    packId: 'unfpa',
    ruleId: 'unfpa_procurement_method_threshold',
    fieldKey: 'procurement.method_vs_threshold',
    sourceCaseSlugs: ['unfpa-annex4-21-arab-vendor'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:unfpa-ia-2025-29:threshold-approver',
    title: 'Cumulative workplan threshold needs the stated approver',
    statement:
      'Non-competitive IP selection above the cumulative workplan threshold needs the approver the policy names. IA/2025-29 says Regional Director approval is required when cumulative IP workplan amounts for the programme cycle are expected to exceed US$0.5 million. Three NGO IPs were engaged non-competitively with Representative approval only.',
    status: 'stub',
    packId: 'unfpa',
    ruleId: 'unfpa_ip_threshold_approver',
    fieldKey: 'ip.threshold_approver',
    sourceCaseSlugs: ['unfpa-ia-2025-29-sudan'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:unfpa-ia-2025-29:rfq-criteria-scores',
    title: 'RFQ criteria and individual scores',
    statement:
      'An RFQ file needs the evaluation criteria in the solicitation and the individual scores on the evaluation. IA/2025-29 found all four reviewed RFQ solicitations omitted evaluation criteria, and the technical evaluations listed criteria with no individual scores.',
    status: 'stub',
    packId: 'unfpa',
    ruleId: 'unfpa_procurement_rfq_scores',
    fieldKey: 'procurement.rfq_criteria_and_scores',
    sourceCaseSlugs: ['unfpa-ia-2025-29-sudan'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:unfpa-ia-2025-29:po-before-delivery',
    title: 'Purchase order or contract before delivery',
    statement:
      'A procurement file needs an approved purchase order or contract. IA/2025-29 found no approved purchase order on 3 of 10 reviewed transactions. A missing purchase order is a file gap. It is not, by itself, a finding that goods were diverted.',
    status: 'stub',
    packId: 'unfpa',
    ruleId: 'unfpa_procurement_po',
    fieldKey: 'procurement.po_or_contract',
    sourceCaseSlugs: ['unfpa-ia-2025-29-sudan'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:unfpa-ia-2025-29:rir-on-file',
    title: 'Receiving and inspection report on the file',
    statement:
      'The award file should name the receiving and inspection report, including when that control is completed after delivery. IA/2025-29 found policy-mandated RIRs unavailable for 2 of 10 transactions and incomplete RIRs on three others. An incomplete receipt file is not proof the goods were not delivered.',
    status: 'stub',
    packId: 'unfpa',
    ruleId: 'unfpa_procurement_rir',
    fieldKey: 'procurement.rir',
    sourceCaseSlugs: ['unfpa-ia-2025-29-sudan'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:oios-2025-098:reserve-preselection-justification',
    title: 'Reserve pre-selection needs a written justification',
    statement:
      'A reserve allocation, especially a single-source pre-selection, needs the justification on the file before signature. OIOS 2025/098 reviewed 15 reserve allocations, of which 10 were single-sourced, and the justification was not documented for 5. Undocumented pre-selection is a file gap. It is not a finding that the partner was ineligible.',
    status: 'stub',
    packId: 'ocha-cbpf',
    ruleId: 'ocha_allocation_reserve_justification',
    fieldKey: 'allocation.preselection_justification',
    sourceCaseSlugs: ['oios-2025-098-cbpf-reserve'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:oios-2025-098:scorecard-before-recommend',
    title: 'Scorecard or selection document before recommendation',
    statement:
      'A project selection file needs a scorecard or an alternative selection document before the project is recommended for funding. OIOS 2025/098 found those documents missing for 2 standard-allocation projects and 11 reserve-allocation projects. OCHA accepted a OneGMS upload of scorecards before recommendation. Accepted is not the same as in force.',
    status: 'stub',
    packId: 'ocha-cbpf',
    ruleId: 'ocha_selection_scorecard',
    fieldKey: 'selection.scorecard_or_alternative',
    sourceCaseSlugs: ['oios-2025-098-cbpf-reserve'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:oios-2025-098:onegms-selection-record',
    title: 'OneGMS selection record',
    statement:
      'Project status and the selection record are intake keys for the CBPF pack. OIOS 2025/098 found selection documents missing, and OCHA accepted a OneGMS feature to upload scorecards before recommendation. This ticket is that system field. It does not say the feature was already live.',
    status: 'stub',
    packId: 'ocha-cbpf',
    ruleId: 'ocha_onegms_selection',
    fieldKey: 'onegms.selection_record',
    sourceCaseSlugs: ['oios-2025-098-cbpf-reserve'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:oios-2025-098:no-secretariat-sanctions-list',
    title: 'No Secretariat partner-sanctions list to invent',
    statement:
      'OIOS 2025/098 paragraph 37 states the Secretariat, including OCHA, did not have a formal procedure for sanctioning partners or for sharing non-compliance information across the UN system. The pack requires misconduct.secretariat_sanctions_regime to read none. It does not invent a partner-sanctions list.',
    status: 'stub',
    packId: 'ocha-cbpf',
    ruleId: 'ocha_misconduct_no_secretariat_list',
    fieldKey: 'misconduct.secretariat_sanctions_regime',
    sourceCaseSlugs: ['oios-2025-098-cbpf-reserve'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:oios-2020-005:forensic-backlog-not-presignature',
    title: 'A forensic backlog is not pre-signature proof',
    statement:
      'Finishing a forensic audit after payment is not the pre-signature eligibility or selection file. OIOS 2020/005 says only 2 of 35 suspected fraud cases under forensic audit from 2015 to 2019 were completed, in 382 and 586 days, and both reported no evidence of fraud or wrongdoing. That conclusion covers those two files. It does not clear the other cases, and it does not satisfy the CBPF pack’s reserve pre-selection or scorecard gates.',
    status: 'stub',
    packId: 'ocha-cbpf',
    ruleId: null,
    fieldKey: 'assurance.forensic_is_not_presignature_proof',
    sourceCaseSlugs: ['oios-2020-005-iraq-forensic'],
  },
])

const byId = new Map(patternTickets.map(ticket => [ticket.ticketId, ticket]))

export function listPatternTickets(): readonly PatternTicket[] {
  return patternTickets
}

export function getPatternTicket(ticketId: string): PatternTicket | undefined {
  return byId.get(ticketId)
}

/** Resolve ids in the caller’s order. Throws if any id is missing. */
export function patternTicketsFor(ticketIds: readonly string[]): PatternTicket[] {
  return ticketIds.map(ticketId => {
    const ticket = byId.get(ticketId)
    if (!ticket) throw new Error(`Unknown pattern ticket: ${ticketId}`)
    return ticket
  })
}
