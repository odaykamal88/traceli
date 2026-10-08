import { researchFixture } from '@/lib/case-cards/research-fixture'

export function ifrcEbolaDraft() {
  return researchFixture({
  "slug": "ifrc-ebola-supplier-payments",
  "title": "IFRC Ebola response: the payment needs an explanation",
  "lede": "IFRC disclosed CHF 354,500 in undocumented and unjustified supplier payments in its Guinea Ebola response. This research fixture asks what would let a reviewer explain a payment; it is not a frozen desk record.",
  "caseId": "case:ifrc-ebola-supplier-payments",
  "packScope": "finding-slice",
  "frameworkId": "ifrc-public-source-review",
  "frameworkName": "Trace-li IFRC case review questions (proposed)",
  "donor": {
    "donorId": "donor:not-established",
    "name": "Individual donor not established for these payments"
  },
  "retrievedAt": "2026-10-08T12:31:32.758Z",
  "fields": [
    {
      "key": "research.source_status",
      "value": {
        "state": "present",
        "value": "IFRC financial disclosure; auditor report dated 3 September 2019. Historical record, not a current finding."
      },
      "locator": "Printed p. 12 (PDF p. 13), note 9a: Guinea"
    },
    {
      "key": "research.payment_finding",
      "value": {
        "state": "present",
        "value": "CHF 354,500 in supplier payments lacked documentation and justification; included within approximately CHF 1.5 million of confirmed and at-risk losses in Guinea."
      },
      "locator": "Printed p. 12 (PDF p. 13), note 9a: Guinea"
    },
    {
      "key": "procurement.supplier_payment_basis",
      "value": {
        "state": "missing",
        "reason": "The financial note reports the payment deficiency but does not supply transaction-level supporting documents or authorizations. Missing from this public-source packet; no reconstructed finding about a particular approval."
      },
      "locator": "Printed p. 12 (PDF p. 13), note 9a: Guinea"
    },
    {
      "key": "procurement.service_acceptance",
      "value": {
        "state": "missing",
        "reason": "Service completion and acceptance evidence is not included in the reviewed note. This is a proposed review question, not an additional IFRC finding."
      },
      "locator": "Printed p. 12 (PDF p. 13), note 9a: Guinea"
    }
  ],
  "findings": [
    {
      "findingId": "finding:ifrc-ebola-supplier-payments:1",
      "title": "The explanation behind the payment",
      "summary": "Note 9a describes a review triggered by a 2016 fraud allegation involving vehicle hire, volunteer payments, and customs clearance. It distinguishes confirmed and at-risk losses rather than presenting every amount as proven theft.",
      "sourceLabel": "Printed p. 12 (PDF p. 13), note 9a: Guinea"
    }
  ],
  "narrative": {
    "officialRecord": "The Guinea Ebola response needed operational services; IFRC later had to account for the payments behind them. This card follows the financial disclosure, not an imagined procurement officer or a reconstructed tender.",
    "whatWasMissing": "IFRC reported supplier payments without documentation or justification, leaving a concrete question about what supported payment. The public note does not identify which approval or acceptance document was absent for each transaction.",
    "whatFollowed": "The disclosed amount was recorded as a loss in the 2016 statements; the Guinea case remained with local investigators at the date of the 2019 report. A later recovery or final legal outcome was not established in the sources reviewed for this card.",
    "assuranceQuestion": "Can a reviewer open the approved service, price basis, supporting evidence, and payment authorization without asking the original team to reconstruct them?",
    "whereTraceLiFits": "This fixture proposes a small review trail from the payment back to its supporting decision. The questions are Trace-li analysis, not an IFRC-approved policy pack or an assessment of a live award. A complete document trail still needs substantive human review."
  },
  "patternTicketIds": [
    "pt:ifrc-ebola-supplier-payments:payment-basis",
    "pt:ifrc-ebola-supplier-payments:service-acceptance"
  ],
  "primarySources": [
    {
      "sourceId": "src:ifrc-ebola-supplier-payments:1",
      "title": "Combined Ebola appeal financial statements, 1 January 2017–31 October 2018",
      "publisher": "IFRC; independent auditor report by KPMG",
      "url": "https://adore.ifrc.org/Download.aspx?FileId=255776",
      "publishedOn": "2019-09-03",
      "locator": "Printed p. 12 (PDF p. 13), note 9a: Guinea"
    }
  ],
  "primarySourceFile": {
    "url": "https://adore.ifrc.org/Download.aspx?FileId=255776",
    "sha256": "acf3202b9e44252a2e5e6b4402799eab218390b6f1375e02dfc126da5299d8b4",
    "retrievedOn": "2026-10-08",
    "label": "SHA-256 of the retained PDF, retrieved 8 October 2026. Source-file hash only; not a desk freeze."
  },
  "redaction": {
    "policyId": "case-card-redaction-v1",
    "public": [
      "Historical institutional source, its scope and procedural status, and proposed review questions"
    ],
    "withheld": [
      "Personal and supplier identities",
      "Underlying transaction records, customer data, and any invented award chronology",
      "Freeze hashes and readiness: no founder-confirmed freeze exists"
    ]
  },
  "claimBoundary": "IFRC is the subject and source of this historical financial disclosure, not a Trace-li customer or endorser. The CHF 354,500 is included within the wider Guinea amount, not additional to it. This card does not say Trace-li prevents fraud. Missing from this research packet does not mean absent from every original file. No frozen judgment or current institutional risk rating is issued."
})
}
