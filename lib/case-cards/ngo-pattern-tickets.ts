import type { PatternTicket } from '@/lib/field-registry/case-card'

/** Proposed research prompts, not institutional policies or accepted rules. */
export const ngoPatternTickets: PatternTicket[] = [
  {
    "schemaVersion": "pattern-ticket-v1",
    "ticketId": "pt:ifrc-ebola-supplier-payments:payment-basis",
    "title": "Supplier payment basis and supporting documents",
    "statement": "Proposed review question: can the reviewer follow a supplier payment to its approved service, price, supporting documents, and authorization? An unpublished document is distinct from evidence that it never existed.",
    "status": "stub",
    "packId": "ifrc-public-source-review",
    "ruleId": null,
    "fieldKey": "procurement.supplier_payment_basis",
    "sourceCaseSlugs": [
      "ifrc-ebola-supplier-payments"
    ]
  },
  {
    "schemaVersion": "pattern-ticket-v1",
    "ticketId": "pt:ifrc-ebola-supplier-payments:service-acceptance",
    "title": "Service completion and acceptance record",
    "statement": "Proposed review question: who confirmed the service was delivered, and where is the dated acceptance evidence? The financial note does not identify a particular missing acceptance form.",
    "status": "stub",
    "packId": "ifrc-public-source-review",
    "ruleId": null,
    "fieldKey": "procurement.service_acceptance",
    "sourceCaseSlugs": [
      "ifrc-ebola-supplier-payments"
    ]
  },
  {
    "schemaVersion": "pattern-ticket-v1",
    "ticketId": "pt:hrw-sldp-syria-procurement:rights-diligence",
    "title": "Country, sector, and supplier human-rights assessment",
    "statement": "Proposed review question informed by the HRW/SLDP guide: what evidence supports the assessment of this supplier in this operating context, beyond a sanctions-list check?",
    "status": "stub",
    "packId": "hrw-sldp-public-source-review",
    "ruleId": null,
    "fieldKey": "integrity.human_rights_assessment",
    "sourceCaseSlugs": [
      "hrw-sldp-syria-procurement"
    ]
  },
  {
    "schemaVersion": "pattern-ticket-v1",
    "ticketId": "pt:hrw-sldp-syria-procurement:risk-disposition",
    "title": "Human review, alternatives, and risk decision",
    "statement": "Proposed review question: which reviewer assessed the concern, what alternatives were considered, and what decision followed? No actual supplier clearance or award decision is reconstructed from this guide.",
    "status": "stub",
    "packId": "hrw-sldp-public-source-review",
    "ruleId": null,
    "fieldKey": "integrity.human_rights_disposition",
    "sourceCaseSlugs": [
      "hrw-sldp-syria-procurement"
    ]
  },
  {
    "schemaVersion": "pattern-ticket-v1",
    "ticketId": "pt:irc-syria-procurement-settlement:bid-independence",
    "title": "Bid independence and staff–vendor conflicts review",
    "statement": "Proposed review question: what independent checks support the competing bids and staff–vendor relationships? A declaration alone cannot establish the absence of collusion.",
    "status": "stub",
    "packId": "irc-public-source-review",
    "ruleId": null,
    "fieldKey": "integrity.bid_independence_review",
    "sourceCaseSlugs": [
      "irc-syria-procurement-settlement"
    ]
  },
  {
    "schemaVersion": "pattern-ticket-v1",
    "ticketId": "pt:irc-syria-procurement-settlement:price-basis",
    "title": "Independent price comparison and approval",
    "statement": "Proposed review question: can the reviewer inspect the independent price basis, the exceptions, and the decision authorizing the purchase? Documentary checks alone cannot guarantee prevention of bid rigging.",
    "status": "stub",
    "packId": "irc-public-source-review",
    "ruleId": null,
    "fieldKey": "procurement.independent_price_basis",
    "sourceCaseSlugs": [
      "irc-syria-procurement-settlement"
    ]
  }
]
