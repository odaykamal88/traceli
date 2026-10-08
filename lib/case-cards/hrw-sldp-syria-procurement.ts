import { researchFixture } from '@/lib/case-cards/research-fixture'

export function hrwSyriaDraft() {
  return researchFixture({
  "slug": "hrw-sldp-syria-procurement",
  "title": "Human Rights Watch: beyond a sanctions-list check",
  "lede": "Human Rights Watch and the Syrian Legal Development Programme examined UN procurement in Syria in 2022. Their guide asks for human-rights due diligence beyond sanctions screening. HRW is the research publisher, not the subject of a procurement-failure finding. This is a research fixture.",
  "caseId": "case:hrw-sldp-syria-procurement",
  "packScope": "finding-slice",
  "frameworkId": "hrw-sldp-public-source-review",
  "frameworkName": "Trace-li HRW-SLDP case review questions (proposed)",
  "donor": {
    "donorId": "donor:not-applicable",
    "name": "No individual grant or donor assessed in this guide fixture"
  },
  "retrievedAt": "2026-10-08T12:31:37.849Z",
  "fields": [
    {
      "key": "research.source_status",
      "value": {
        "state": "present",
        "value": "Human Rights Watch and Syrian Legal Development Programme research and recommendations, 27 January 2022; not a UN audit or legal judgment."
      },
      "locator": "Introduction; question 6, phases 0 and II; recommendations"
    },
    {
      "key": "research.review_scope",
      "value": {
        "state": "present",
        "value": "UN procurement practices in Syria examined by the authors. No individual award is cleared or assessed by Trace-li."
      },
      "locator": "Introduction; question 6, phases 0 and II; recommendations"
    },
    {
      "key": "integrity.human_rights_assessment",
      "value": {
        "state": "missing",
        "reason": "No supplier-specific assessment is reconstructed in this guide fixture. The guide supports a review question; it is not the transaction evidence needed to answer it."
      },
      "locator": "Introduction; question 6, phases 0 and II; recommendations"
    },
    {
      "key": "integrity.human_rights_disposition",
      "value": {
        "state": "missing",
        "reason": "A named reviewer, alternatives, and approval for a particular procurement are not established by this research packet. This is not a finding that every UN award lacked them."
      },
      "locator": "Introduction; question 6, phases 0 and II; recommendations"
    }
  ],
  "findings": [
    {
      "findingId": "finding:hrw-sldp-syria-procurement:1",
      "title": "A screening result cannot answer the whole question",
      "summary": "The guide recommends a context-specific assessment across procurement stages. Its conclusions are attributed research, not a judicial finding.",
      "sourceLabel": "Introduction; question 6, phases 0 and II; recommendations"
    }
  ],
  "narrative": {
    "officialRecord": "UN procurement teams in Syria had to obtain supplies in a difficult operating environment, while the HRW/SLDP guide asked them to examine whom those purchases could support. Published in January 2022, it is a historical guidance case about UN procurement, not alleged misconduct by HRW.",
    "whatWasMissing": "The authors found that the examined processes did not appear to contain robust human-rights due diligence, with sanctions checks often used as a substitute. Their analysis does not establish that every UN procurement file had the same gap.",
    "whatFollowed": "The guide reflects responses from the UN Country Team, UN Human Rights Advisor, and UNOPS, and notes the creation of a Regional Dialogue Mechanism to discuss procurement risks. It recommended earlier risk mapping and stronger supplier verification. The reviewed guide does not establish subsequent implementation or an enforcement outcome.",
    "assuranceQuestion": "If a supplier clears the applicable sanctions checks, what separate evidence lets the reviewer assess human-rights risks and record the decision?",
    "whereTraceLiFits": "This fixture makes that separate question visible in a review checklist. It cannot determine current sanctions, clear a supplier, replace contextual expertise, or convert an NGO recommendation into binding policy. The useful next step is to identify the assessment and the person accountable for its disposition."
  },
  "patternTicketIds": [
    "pt:hrw-sldp-syria-procurement:rights-diligence",
    "pt:hrw-sldp-syria-procurement:risk-disposition"
  ],
  "primarySources": [
    {
      "sourceId": "src:hrw-sldp-syria-procurement:1",
      "title": "HRW and SLDP Guide on Human Rights-Compliant Procurement Processes in Syria",
      "publisher": "Human Rights Watch and Syrian Legal Development Programme",
      "url": "https://www.hrw.org/news/2022/01/27/hrw-and-sldp-guide-human-rights-compliant-procurement-processes-syria",
      "publishedOn": "2022-01-27",
      "locator": "Introduction; question 6, phases 0 and II; recommendations"
    }
  ],
  "primarySourceFile": {
    "url": "https://www.hrw.org/news/2022/01/27/hrw-and-sldp-guide-human-rights-compliant-procurement-processes-syria",
    "sha256": "8ea3ef40e9718339b45ea3b3ce8314c879faac5c0921e178262bc97044afda6c",
    "retrievedOn": "2026-10-08",
    "label": "SHA-256 of the retained HTML page, retrieved 8 October 2026. Source-file hash only; not a desk freeze."
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
  "claimBoundary": "Human Rights Watch and SLDP are the research publishers; UN procurement in Syria is the subject. This is NGO research and guidance, not an audit, criminal verdict, or finding of wrongdoing by HRW. The 2022 account is not current sanctions advice. None of the named organizations is presented as a Trace-li customer or endorser. This card does not say Trace-li prevents fraud or human-rights harm."
})
}
