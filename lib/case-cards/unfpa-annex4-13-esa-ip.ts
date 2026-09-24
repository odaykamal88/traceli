import type { CaseCardDraft } from '@/lib/field-registry/case-card'
import { UNFPA_PACK } from '@/lib/field-registry/packs/unfpa'
import type { AwardRegistrySnapshot } from '@/lib/field-registry/schema'

import { patternTicketsFor } from '@/lib/case-cards/pattern-tickets'
import { sourceField } from '@/lib/case-cards/public-source-field'

/** SHA-256 of the public Annex 4 PDF retrieved 24 September 2026. Not a freeze hash. */
export const UNFPA_ANNEX4_PDF_SHA256 = 'f12d0948980c51f171aafd0cac064340204e4a977f71fe7f2c229bc71955365a'

export const UNFPA_ANNEX4_PDF_URL = 'https://www.unfpa.org/sites/default/files/board-documents/Annex%204%20-%20Summary%20of%20investigation%20report%20and%20closure%20reports%20issued%20in%202025%20-%201Apr26.pdf'

const RETRIEVED_AT = '2026-09-24T12:00:00.000Z'
const SLUG = 'unfpa-annex4-13-esa-ip'
const TICKET_IDS = [
  'pt:unfpa-annex4-13:ip-vendor-coi',
  'pt:unfpa-annex4-13:iprc-unpp-vrc',
] as const

const page = 'annex4:entry-13'
const label = 'OAIS Annex 4 entry 13, East and Southern Africa'

export function unfpaAnnex413FixtureSnapshot(): AwardRegistrySnapshot {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'public-source',
    organizationId: 'org:public-case-cards',
    projectId: 'project:unfpa-annex4-13-esa-ip',
    awardId: 'unfpa-annex4-13',
    procurementReference: 'Annex-4-entry-13',
    donor: { donorId: 'donor_unfpa', name: 'UNFPA' },
    framework: {
      frameworkId: UNFPA_PACK.packId,
      name: UNFPA_PACK.name,
      version: UNFPA_PACK.version,
    },
    asOf: RETRIEVED_AT,
    fields: [
      sourceField(
        'field:unfpa-annex4-13:loss',
        'evidence:unfpa-annex4-13:loss',
        'audit.estimated_loss_usd',
        { state: 'present', value: '1441593.00' },
        UNFPA_ANNEX4_PDF_SHA256,
        RETRIEVED_AT,
        page,
        label,
      ),
      sourceField(
        'field:unfpa-annex4-13:coi',
        'evidence:unfpa-annex4-13:coi',
        'integrity.coi_declared',
        {
          state: 'missing',
          reason:
            'Annex 4 entry 13 states the IP procured vendor services in violation of conflict-of-interest procurement rules. The summary does not include a declaration. No country or person is named.',
        },
        UNFPA_ANNEX4_PDF_SHA256,
        RETRIEVED_AT,
        page,
        label,
      ),
      sourceField(
        'field:unfpa-annex4-13:vrc',
        'evidence:unfpa-annex4-13:vrc',
        'idd.vrc_iprc_status',
        {
          state: 'present',
          value: 'IP debarred. IPRC raised a UNPP flag. Vendor list referred to the VRC. VRC review ongoing. Recovery efforts ongoing.',
        },
        UNFPA_ANNEX4_PDF_SHA256,
        RETRIEVED_AT,
        page,
        label,
      ),
    ],
  }
}

/** Fixture. `frozenRecord` stays null until a founder-confirmed freeze is dropped in. */
export function unfpaAnnex413Draft(): CaseCardDraft {
  return {
    slug: SLUG,
    title: 'East and Southern Africa IP investigation, Annex 4 entry 13',
    lede:
      'OAIS Annex 4 entry 13 reports an estimated loss of US$1,441,593 at an East and Southern Africa implementing partner. This fixture maps the conflict-of-interest and review-status facts onto the UNFPA pack. It is not a frozen desk record.',
    caseId: 'case:unfpa-annex4-13-esa-ip',
    packScope: 'finding-slice',
    findings: [
      {
        findingId: 'finding:unfpa-annex4-13:coi',
        title: 'Vendor procurement broke conflict-of-interest rules',
        summary:
          'The IP falsified payroll and timesheets, procured vendor services in violation of conflict-of-interest procurement rules, contracted with vendors which engaged in fraudulent practices, and submitted fraudulent reports that misreported activities. The estimated loss is US$1,441,593.00. The annex is region-banded. This card does not add a country or a personal name.',
        sourceLabel: 'Annex 4 entry 13',
      },
      {
        findingId: 'finding:unfpa-annex4-13:sanctions-path',
        title: 'Debarment, a UNPP flag, and a VRC referral',
        summary:
          'The case was substantiated. OAIS reported it to the Legal Office and recommended referral to the IPRC and the VRC. The IP has been debarred and the IPRC raised a flag on the UNPP. Efforts to recover the loss are ongoing. The vendor list was referred to the VRC, and VRC review is ongoing. Recovery ongoing is not recovered funds. A referral is not a completed sanctions outcome.',
        sourceLabel: 'Annex 4 entry 13, action column',
      },
    ],
    narrative: {
      officialRecord:
        'Annex 4 to the OAIS annual report summarizes investigation and closure reports issued in 2025. Entry 13 is an East and Southern Africa implementing partner. OAIS states an estimated loss of US$1,441,593.00. The public summary does not name the country or any person, and this card does not invent either.',
      whatWasMissing:
        'The summary does not publish a conflict-of-interest declaration for the IP–vendor procurements. It states that those procurements violated conflict-of-interest rules. This fixture records integrity.coi_declared as missing for that reason. It does not reconstruct a solicitation file the annex does not contain.',
      whatFollowed:
        'The IP was debarred and flagged on the UNPP. The vendor list went to the VRC, where review was still ongoing in the annex. Management was pursuing recovery. This card does not report a later outcome, and it does not treat debarment as proof the loss was recovered.',
      assuranceQuestion:
        'Before the IP workplan or a vendor purchase is signed, can a reviewer see the conflict-of-interest declaration and the VRC, IPRC, and UNPP status?',
      whereTraceLiFits:
        'Trace-li is pre-signature award assurance: a frozen Field Registry record of what was on file, what was missing, and what a person decided. The UNFPA pack checks a conflict-of-interest declaration and a VRC / IPRC / UNPP status. This card is a fixture awaiting a founder freeze. Nothing here says Trace-li would have prevented the investigation finding. The case is not a Trace-li client.',
    },
    patternTicketIds: [...TICKET_IDS],
    patternTickets: patternTicketsFor(TICKET_IDS),
    primarySources: [
      {
        sourceId: 'src:unfpa-annex4-entry-13',
        title: 'Summary of investigation and closure reports issued in 2025',
        publisher: 'UNFPA Office of Audit and Investigation Services',
        url: UNFPA_ANNEX4_PDF_URL,
        publishedOn: '2026-04-01',
        locator: 'Annex 4 entry 13, East and Southern Africa',
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
        'Annex 4 entry 13 region band, estimated loss, and the actions OAIS printed',
        'Debarment, UNPP flag, and VRC referral status as stated in the annex',
        'Pattern ticket ids and the Field Registry keys they point at',
      ],
      withheld: [
        'Country and personal names — the annex does not give them, and this card does not add any',
        'Vendor names and staff names',
        'Payroll, timesheets, and procurement file bytes',
        'Any customer upload or live desk packet',
        'Freeze hashes — no founder-confirmed freeze exists for this card',
      ],
    },
    claimBoundary:
      'Trace-li cites UNFPA OAIS. This card is a pre-signature missing-evidence surface. It does not say Trace-li prevents fraud, does not certify the partner, and does not imply that UNFPA is a customer or endorser. An investigation is not a criminal verdict. The estimated loss is not recovered funds.',
    fixtureSnapshot: unfpaAnnex413FixtureSnapshot(),
    frozenRecord: null,
  }
}
