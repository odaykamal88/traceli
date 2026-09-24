import type { CaseCardDraft } from '@/lib/field-registry/case-card'
import { UNFPA_PACK } from '@/lib/field-registry/packs/unfpa'
import type { AwardRegistrySnapshot } from '@/lib/field-registry/schema'

import { patternTicketsFor } from '@/lib/case-cards/pattern-tickets'
import { sourceField } from '@/lib/case-cards/public-source-field'

/** SHA-256 of the public Sudan audit PDF retrieved 24 September 2026. Not a freeze hash. */
export const UNFPA_SUDAN_PDF_SHA256 = 'fe894dddeebfe00c0a9a9101957c564334af3bab871bee6d5165fdb95884b808'

export const UNFPA_SUDAN_PDF_URL = 'https://www.unfpa.org/sites/default/files/audit-reports/2025-12-24_Audit_of_the_UNFPA_CO_in_Sudan_-__FINAL.pdf'

const RETRIEVED_AT = '2026-09-24T12:00:00.000Z'
const SLUG = 'unfpa-ia-2025-29-sudan'
const TICKET_IDS = [
  'pt:unfpa-ia-2025-29:threshold-approver',
  'pt:unfpa-ia-2025-29:rfq-criteria-scores',
  'pt:unfpa-ia-2025-29:po-before-delivery',
  'pt:unfpa-ia-2025-29:rir-on-file',
] as const

export function unfpaSudanFixtureSnapshot(): AwardRegistrySnapshot {
  const hash = UNFPA_SUDAN_PDF_SHA256
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'public-source',
    organizationId: 'org:public-case-cards',
    projectId: 'project:unfpa-ia-2025-29-sudan',
    awardId: 'unfpa-ia-2025-29',
    procurementReference: 'IA/2025-29',
    donor: { donorId: 'donor_unfpa', name: 'UNFPA' },
    framework: {
      frameworkId: UNFPA_PACK.packId,
      name: UNFPA_PACK.name,
      version: UNFPA_PACK.version,
    },
    asOf: RETRIEVED_AT,
    fields: [
      sourceField(
        'field:unfpa-sudan:rating',
        'evidence:unfpa-sudan:rating',
        'audit.office_rating',
        { state: 'present', value: 'Partially Satisfactory with Major Improvement Needed' },
        hash,
        RETRIEVED_AT,
        'ia-2025-29:p5',
        'IA/2025-29 ¶5',
      ),
      sourceField(
        'field:unfpa-sudan:approver',
        'evidence:unfpa-sudan:approver',
        'ip.threshold_approver',
        {
          state: 'missing',
          reason:
            'Three NGO IPs were engaged non-competitively. The Representative approved. Regional Director approval was also required because each IP’s cumulative workplan budget exceeded US$0.5 million.',
        },
        hash,
        RETRIEVED_AT,
        'ia-2025-29:p34',
        'IA/2025-29 ¶33–34',
      ),
      sourceField(
        'field:unfpa-sudan:rfq',
        'evidence:unfpa-sudan:rfq',
        'procurement.rfq_criteria_and_scores',
        {
          state: 'missing',
          reason:
            'All four reviewed RFQ solicitations omitted evaluation criteria. Technical evaluations listed criteria and recorded no individual scores.',
        },
        hash,
        RETRIEVED_AT,
        'ia-2025-29:p81',
        'IA/2025-29 ¶81',
      ),
      sourceField(
        'field:unfpa-sudan:po',
        'evidence:unfpa-sudan:po',
        'procurement.po_or_contract',
        {
          state: 'missing',
          reason:
            'In 3 of 10 procurement transactions reviewed there was no approved purchase order: visibility items US$55,800; Sudanese Toub and Jalayia US$171,000; printed GBV guidelines US$12,137.',
        },
        hash,
        RETRIEVED_AT,
        'ia-2025-29:p78',
        'IA/2025-29 ¶78',
      ),
      sourceField(
        'field:unfpa-sudan:rir',
        'evidence:unfpa-sudan:rir',
        'procurement.rir',
        {
          state: 'missing',
          reason:
            'Policy-mandated RIRs were not available for 2 of 10 transactions, and a noncompliant template was used. Three other RIRs were incomplete and did not certify acceptance or rejection.',
        },
        hash,
        RETRIEVED_AT,
        'ia-2025-29:p82',
        'IA/2025-29 ¶82–83',
      ),
    ],
  }
}

/** Fixture. `frozenRecord` stays null until a founder-confirmed freeze is dropped in. */
export function unfpaSudanDraft(): CaseCardDraft {
  return {
    slug: SLUG,
    title: 'Sudan country office pre-award file, IA/2025-29',
    lede:
      'OAIS audit IA/2025-29 rated the UNFPA Country Office in Sudan Partially Satisfactory with Major Improvement Needed. This fixture maps the pre-award documentation gaps onto the UNFPA pack. It is not a frozen desk record.',
    caseId: 'case:unfpa-ia-2025-29-sudan',
    packScope: 'finding-slice',
    findings: [
      {
        findingId: 'finding:unfpa-sudan:threshold',
        title: 'Regional Director approval was still required',
        summary:
          'Non-competitive NGO IP selection may be used in exceptional circumstances if justifications are documented and approval is obtained from the Head of Office, or from the Regional Director if cumulative IP workplan amounts for the programme cycle are expected to exceed US$0.5 million. The office engaged three NGO IPs non-competitively. The Representative approved, and the audit team viewed the choice as justified in the humanitarian context, but Regional Director approval was also required because each IP’s cumulative workplan budget exceeded US$0.5 million.',
        sourceLabel: 'IA/2025-29 ¶33–34',
      },
      {
        findingId: 'finding:unfpa-sudan:rfq',
        title: 'RFQs without criteria, evaluations without individual scores',
        summary:
          'All four RFQ solicitation documents reviewed omitted evaluation criteria. The transactions included visibility items at US$55,800, venue and stationery at US$18,500, Sudanese Toub and Jalayia at US$171,000, and printed GBV guidelines at US$12,137. Technical evaluations listed criteria but recorded no individual scores. The file cannot demonstrate the scored comparison.',
        sourceLabel: 'IA/2025-29 ¶81',
      },
      {
        findingId: 'finding:unfpa-sudan:po-rir',
        title: 'Purchase orders and receiving reports were incomplete',
        summary:
          'In 3 of 10 procurement transactions reviewed there was no approved purchase order. Policy-mandated receiving and inspection reports were not available for 2 of 10 transactions, and a noncompliant template was used. Three other RIRs were incomplete and did not certify acceptance or rejection. A missing purchase order or an incomplete receipt file is not proof that goods were diverted.',
        sourceLabel: 'IA/2025-29 ¶78 and ¶82–83',
      },
    ],
    narrative: {
      officialRecord:
        'On 24 December 2025 OAIS published IA/2025-29, Audit of the UNFPA Country Office in the Republic of the Sudan. The remote audit ran from 23 June to 12 September 2025. The period covered is 1 January 2024 to 31 March 2025. The overall rating is Partially Satisfactory with Major Improvement Needed.',
      whatWasMissing:
        'This slice is the pre-award file: the Regional Director approval above the US$0.5 million cumulative workplan threshold, evaluation criteria and individual scores on RFQs, approved purchase orders, and receiving and inspection reports. Other Sudan findings, including inventory access and HACT assurance counts, sit outside this card.',
      whatFollowed:
        'Recommendation 5, on IP selection and HACT assurance, is high priority. OAIS records the status as Agree, with estimated completion in December 2026. Recommendation 9, on procurement documentation, is medium priority, status Agree, estimated completion March 2026. Agreed is not done. This card does not report a later completion.',
      assuranceQuestion:
        'Before signature, can a reviewer see the threshold approver, the RFQ criteria and individual scores, the purchase order or contract, and the receiving and inspection report the file will have to carry?',
      whereTraceLiFits:
        'The UNFPA pack checks those four fields. The receiving-report check is a warning because the control is completed after delivery; the pack still names it. This card is a fixture awaiting a founder freeze. Nothing here says Trace-li would have prevented the audit finding. The Sudan office is not a Trace-li client.',
    },
    patternTicketIds: [...TICKET_IDS],
    patternTickets: patternTicketsFor(TICKET_IDS),
    primarySources: [
      {
        sourceId: 'src:unfpa-ia-2025-29',
        title: 'Audit of the UNFPA Country Office in the Republic of the Sudan',
        publisher: 'UNFPA Office of Audit and Investigation Services',
        url: UNFPA_SUDAN_PDF_URL,
        publishedOn: '2025-12-24',
        locator: '¶5 rating; ¶33–34 IP approval; ¶78 purchase orders; ¶81 RFQs; ¶82–83 RIRs',
      },
    ],
    primarySourceFile: {
      url: UNFPA_SUDAN_PDF_URL,
      sha256: UNFPA_SUDAN_PDF_SHA256,
      retrievedOn: '2026-09-24',
      label: 'Public OAIS audit PDF sha256, retrieved 24 September 2026. Not a freeze hash.',
    },
    redaction: {
      policyId: 'case-card-redaction-v1',
      public: [
        'Report number, date, office, rating, and the amounts OAIS printed for the sampled transactions',
        'Recommendation 5 and 9 status and estimated completion dates',
        'Pattern ticket ids and the Field Registry keys they point at',
      ],
      withheld: [
        'Implementing partner names and staff names',
        'Procurement file bytes, bid prices, and evaluation sheets beyond the audit’s own summary',
        'Any customer upload or live desk packet',
        'Freeze hashes — no founder-confirmed freeze exists for this card',
      ],
    },
    claimBoundary:
      'Trace-li cites UNFPA OAIS. This card is a pre-signature missing-evidence surface. It does not say Trace-li prevents fraud, does not certify the country office, and does not imply that UNFPA is a customer or endorser. An audit is not a criminal verdict. An agreed recommendation is not a completed action.',
    fixtureSnapshot: unfpaSudanFixtureSnapshot(),
    frozenRecord: null,
  }
}
