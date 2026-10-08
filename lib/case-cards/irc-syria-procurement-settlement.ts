import { researchFixture } from '@/lib/case-cards/research-fixture'

export function ircSyriaDraft() {
  return researchFixture({
  "slug": "irc-syria-procurement-settlement",
  "title": "International Rescue Committee: were the bids independent?",
  "lede": "In March 2021, the International Rescue Committee agreed to pay US$6,934,500 to settle False Claims Act allegations concerning USAID-funded Syria procurement. This is a civil settlement, not a criminal verdict. The card is a research fixture, not a frozen desk record.",
  "caseId": "case:irc-syria-procurement-settlement",
  "packScope": "finding-slice",
  "frameworkId": "irc-public-source-review",
  "frameworkName": "Trace-li IRC case review questions (proposed)",
  "donor": {
    "donorId": "donor:usaid",
    "name": "USAID"
  },
  "retrievedAt": "2026-10-08T12:31:34.953Z",
  "fields": [
    {
      "key": "research.source_status",
      "value": {
        "state": "present",
        "value": "Civil settlement of False Claims Act allegations, described by the Justice Department on 19 March 2021."
      },
      "locator": "PDF p. 1, paragraphs 1–4; DOJ press release 21-040"
    },
    {
      "key": "research.settlement_amount",
      "value": {
        "state": "present",
        "value": "US$6,934,500 agreed settlement; not a measure of total aid lost or a criminal fine."
      },
      "locator": "PDF p. 1, paragraphs 1–4; DOJ press release 21-040"
    },
    {
      "key": "integrity.bid_independence_review",
      "value": {
        "state": "missing",
        "reason": "The notice describes procurement allegations but does not publish transaction-level bid-independence checks or declarations. Those records are not reconstructed here."
      },
      "locator": "PDF p. 1, paragraphs 1–4; DOJ press release 21-040"
    },
    {
      "key": "procurement.independent_price_basis",
      "value": {
        "state": "missing",
        "reason": "The notice does not supply the price comparisons and authorizations needed to judge a particular purchase. Missing from the public packet is not proof that no original document existed."
      },
      "locator": "PDF p. 1, paragraphs 1–4; DOJ press release 21-040"
    }
  ],
  "findings": [
    {
      "findingId": "finding:irc-syria-procurement-settlement:1",
      "title": "Competition and relationships under examination",
      "summary": "DOJ described investigations into alleged collusion, kickbacks, bid steering, and staff–vendor conflicts in Turkey-based cross-border procurement. It reported inflated prices invoiced to USAID between October 2012 and December 2015. This card preserves the civil-settlement status.",
      "sourceLabel": "PDF p. 1, paragraphs 1–4; DOJ press release 21-040"
    }
  ],
  "narrative": {
    "officialRecord": "IRC was buying goods and services for people displaced inside Syria when the procurement relationships behind those purchases later became the subject of a civil investigation. The settlement notice supplies the institutional account; it does not supply a complete tender file.",
    "whatWasMissing": "The Justice Department described alleged interference with competition and staff–vendor conflicts, making the independence of the procurement a material review question. This card does not invent a missing declaration or claim that a completed form would have exposed the scheme.",
    "whatFollowed": "IRC agreed to the civil settlement. Separately, USAID OIG report 8-000-21-001-P called for assessment of IRC’s pledged corrective actions; its public tracker records that recommendation closed on 10 June 2021. All four audit recommendations show closure dates, the last on 5 December 2024. Closure alone does not establish the amount recovered or prove that every control remained effective.",
    "assuranceQuestion": "Before signing, what evidence supports the independence of the bids, the handling of staff–vendor relationships, and the reasonableness of the price?",
    "whereTraceLiFits": "This fixture asks a reviewer to connect those checks to their supporting evidence and a named decision. It is a proposed Trace-li review structure, not an IRC or USAID policy pack. Substantive verification and monitoring remain necessary; a well-organized file cannot guarantee detection of collusion."
  },
  "patternTicketIds": [
    "pt:irc-syria-procurement-settlement:bid-independence",
    "pt:irc-syria-procurement-settlement:price-basis"
  ],
  "primarySources": [
    {
      "sourceId": "src:irc-syria-procurement-settlement:1",
      "title": "IRC agrees to settle allegations concerning USAID-funded procurement",
      "publisher": "US Department of Justice; retained by USAID Office of Inspector General",
      "url": "https://oig.usaid.gov/sites/default/files/2022-02/Department-of-Justice-PressRelease-031921.pdf",
      "publishedOn": "2021-03-19",
      "locator": "PDF p. 1, paragraphs 1–4; DOJ press release 21-040"
    },
    {
      "sourceId": "src:irc-syria-procurement-settlement:2",
      "title": "Weaknesses in Oversight of USAID’s Syria Response, 8-000-21-001-P",
      "publisher": "USAID Office of Inspector General",
      "url": "https://oig.usaid.gov/node/4625",
      "publishedOn": "2021-03-04",
      "locator": "Recommendation 2 and closure dates for recommendations 1–4; checked 8 October 2026"
    }
  ],
  "primarySourceFile": {
    "url": "https://oig.usaid.gov/sites/default/files/2022-02/Department-of-Justice-PressRelease-031921.pdf",
    "sha256": "af3dd802c764c18d6094e0c1ddf91a2ee45ca35e6bdb820a25a70cc3d415c1fa",
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
  "claimBoundary": "The settlement resolves civil allegations; it is not a criminal verdict or a quantified total loss. Audit recommendation closure is distinct from recovery and from the settlement. IRC and USAID are not presented as Trace-li customers or endorsers. This card does not say Trace-li prevents fraud. Evidence absent from this public packet is not automatically absent from the original file."
})
}
