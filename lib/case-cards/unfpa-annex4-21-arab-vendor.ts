import type { CaseCardDraft } from '@/lib/field-registry/case-card'
import { UNFPA_PACK } from '@/lib/field-registry/packs/unfpa'
import type { AwardRegistrySnapshot } from '@/lib/field-registry/schema'

import { UNFPA_ANNEX4_PDF_SHA256, UNFPA_ANNEX4_PDF_URL } from '@/lib/case-cards/unfpa-annex4-13-esa-ip'
import { patternTicketsFor } from '@/lib/case-cards/pattern-tickets'
import { sourceField } from '@/lib/case-cards/public-source-field'

const RETRIEVED_AT = '2026-09-24T12:00:00.000Z'
const SLUG = 'unfpa-annex4-21-arab-vendor'
const TICKET_IDS = [
  'pt:unfpa-annex4-21:related-party-ties',
  'pt:unfpa-annex4-21:vendor-regulation-gap',
] as const

const page = 'annex4:entry-21'
const label = 'OAIS Annex 4 entry 21, Arab States'

export function unfpaAnnex421FixtureSnapshot(): AwardRegistrySnapshot {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'public-source',
    organizationId: 'org:public-case-cards',
    projectId: 'project:unfpa-annex4-21-arab-vendor',
    awardId: 'unfpa-annex4-21',
    procurementReference: 'Annex-4-entry-21',
    donor: { donorId: 'donor_unfpa', name: 'UNFPA' },
    framework: {
      frameworkId: UNFPA_PACK.packId,
      name: UNFPA_PACK.name,
      version: UNFPA_PACK.version,
    },
    asOf: RETRIEVED_AT,
    fields: [
      sourceField(
        'field:unfpa-annex4-21:loss',
        'evidence:unfpa-annex4-21:loss',
        'audit.estimated_loss_usd',
        { state: 'present', value: '140177.43' },
        UNFPA_ANNEX4_PDF_SHA256,
        RETRIEVED_AT,
        page,
        label,
      ),
      sourceField(
        'field:unfpa-annex4-21:related',
        'evidence:unfpa-annex4-21:related',
        'integrity.related_party_checked',
        {
          state: 'missing',
          reason:
            'Annex 4 entry 21 states the vendor had undisclosed ties with competing vendors. The summary does not include a related-party or beneficial-ownership check. No country or person is named.',
        },
        UNFPA_ANNEX4_PDF_SHA256,
        RETRIEVED_AT,
        page,
        label,
      ),
      sourceField(
        'field:unfpa-annex4-21:method',
        'evidence:unfpa-annex4-21:method',
        'procurement.method_vs_threshold',
        {
          state: 'missing',
          reason:
            'The annex says the procurements violated several elements of UNFPA procurement regulations. It does not itemize which element, so this fixture does not invent a threshold breach.',
        },
        UNFPA_ANNEX4_PDF_SHA256,
        RETRIEVED_AT,
        page,
        label,
      ),
      sourceField(
        'field:unfpa-annex4-21:vrc',
        'evidence:unfpa-annex4-21:vrc',
        'idd.vrc_iprc_status',
        { state: 'present', value: 'Referred to the VRC. VRC review ongoing.' },
        UNFPA_ANNEX4_PDF_SHA256,
        RETRIEVED_AT,
        page,
        label,
      ),
    ],
  }
}

/** Fixture. `frozenRecord` stays null until a founder-confirmed freeze is dropped in. */
export function unfpaAnnex421Draft(): CaseCardDraft {
  return {
    slug: SLUG,
    title: 'Arab States vendor investigation, Annex 4 entry 21',
    lede:
      'OAIS Annex 4 entry 21 reports an estimated loss of US$140,177.43 and undisclosed ties between a vendor and competing vendors. This fixture maps those facts onto the UNFPA pack. It is not a frozen desk record.',
    caseId: 'case:unfpa-annex4-21-arab-vendor',
    packScope: 'finding-slice',
    findings: [
      {
        findingId: 'finding:unfpa-annex4-21:ties',
        title: 'Undisclosed ties with competing vendors',
        summary:
          'A UNFPA vendor was involved in procurements that were fraudulent and violated several elements of UNFPA procurement regulations, and had undisclosed ties with competing vendors. The estimated loss is US$140,177.43. The annex gives the Arab States region and does not name a country or a person. This card does not add either.',
        sourceLabel: 'Annex 4 entry 21',
      },
      {
        findingId: 'finding:unfpa-annex4-21:vrc',
        title: 'Referral to the Vendor Review Committee',
        summary:
          'The case was substantiated and referred to the VRC. VRC review was ongoing in the annex. A referral is not a completed sanctions decision, and the estimated loss is not a recovered amount.',
        sourceLabel: 'Annex 4 entry 21, action column',
      },
    ],
    narrative: {
      officialRecord:
        'Annex 4 entry 21 is an Arab States vendor case in the 2025 investigation summaries. OAIS states fraudulent procurements, violations of UNFPA procurement regulations, undisclosed ties with competing vendors, and an estimated loss of US$140,177.43.',
      whatWasMissing:
        'The summary does not publish a related-party, shared-contact, or beneficial-ownership check, and it does not itemize which procurement-regulation elements failed. This fixture records those two registry fields as missing. It does not guess the clause.',
      whatFollowed:
        'OAIS referred the vendor to the VRC. The annex says that review was ongoing. This card stops there. It does not report a later VRC decision.',
      assuranceQuestion:
        'Before signature, can a reviewer see the related-party check among competing vendors and whether the solicitation method matches the value threshold?',
      whereTraceLiFits:
        'The UNFPA pack checks a related-party field and whether the solicitation method aligns with the threshold. This card shows the shape of those fields for a public case. It is a fixture awaiting a founder freeze. Nothing here says Trace-li would have prevented the finding. The vendor is not a Trace-li client.',
    },
    patternTicketIds: [...TICKET_IDS],
    patternTickets: patternTicketsFor(TICKET_IDS),
    primarySources: [
      {
        sourceId: 'src:unfpa-annex4-entry-21',
        title: 'Summary of investigation and closure reports issued in 2025',
        publisher: 'UNFPA Office of Audit and Investigation Services',
        url: UNFPA_ANNEX4_PDF_URL,
        publishedOn: '2026-04-01',
        locator: 'Annex 4 entry 21, Arab States',
      },
    ],
    primarySourceFile: {
      url: UNFPA_ANNEX4_PDF_URL,
      sha256: UNFPA_ANNEX4_PDF_SHA256,
      retrievedOn: '2026-09-24',
      label: 'Public OAIS Annex 4 PDF sha256, retrieved 24 September 2026. Not a freeze hash.',
    },
    redaction: {
      policyId: 'case-card-redaction-v1',
      public: [
        'Annex 4 entry 21 region band, estimated loss, and the VRC referral OAIS printed',
        'Pattern ticket ids and the Field Registry keys they point at',
      ],
      withheld: [
        'Country and personal names — the annex does not give them, and this card does not add any',
        'Vendor names',
        'Bid prices, evaluation sheets, and procurement file bytes',
        'Any customer upload or live desk packet',
        'Freeze hashes — no founder-confirmed freeze exists for this card',
      ],
    },
    claimBoundary:
      'Trace-li cites UNFPA OAIS. This card is a pre-signature missing-evidence surface. It does not say Trace-li prevents fraud, does not certify the vendor, and does not imply that UNFPA is a customer or endorser. An investigation is not a criminal verdict. The estimated loss is not recovered funds.',
    fixtureSnapshot: unfpaAnnex421FixtureSnapshot(),
    frozenRecord: null,
  }
}
