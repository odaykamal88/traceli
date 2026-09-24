import type { CaseCardDraft } from '@/lib/field-registry/case-card'
import { OCHA_CBPF_PACK } from '@/lib/field-registry/packs/ocha-cbpf'
import type { AwardRegistrySnapshot } from '@/lib/field-registry/schema'

import { oios2025098FrozenRecord } from '@/lib/case-cards/oios-2025-098-cbpf-reserve-freeze'
import { patternTicketsFor } from '@/lib/case-cards/pattern-tickets'
import { sourceField } from '@/lib/case-cards/public-source-field'

/** SHA-256 of the public OIOS 2025/098 PDF retrieved 24 September 2026. Not a freeze hash. */
export const OIOS_2025_098_PDF_SHA256 = '720f0c73cc971e60523c1bd39b5949fedb664429dde172f4a0a45a3e4b8e02f8'

export const OIOS_2025_098_PDF_URL = 'https://oios.un.org/system/files/confidential-files/Reports/2025_098_pd.pdf'

const RETRIEVED_AT = '2026-09-24T12:00:00.000Z'
const SLUG = 'oios-2025-098-cbpf-reserve'
const TICKET_IDS = [
  'pt:oios-2025-098:reserve-preselection-justification',
  'pt:oios-2025-098:scorecard-before-recommend',
  'pt:oios-2025-098:onegms-selection-record',
  'pt:oios-2025-098:no-secretariat-sanctions-list',
] as const

export function oios2025098FixtureSnapshot(): AwardRegistrySnapshot {
  const hash = OIOS_2025_098_PDF_SHA256
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'public-source',
    organizationId: 'org:public-case-cards',
    projectId: 'project:oios-2025-098-cbpf-reserve',
    awardId: 'oios-2025-098',
    procurementReference: 'OIOS-2025/098',
    donor: { donorId: 'donor_ocha_cbpf', name: 'OCHA CBPF' },
    framework: {
      frameworkId: OCHA_CBPF_PACK.packId,
      name: OCHA_CBPF_PACK.name,
      version: OCHA_CBPF_PACK.version,
    },
    asOf: RETRIEVED_AT,
    fields: [
      sourceField(
        'field:oios-2025-098:modality',
        'evidence:oios-2025-098:modality',
        'allocation.modality',
        { state: 'present', value: 'reserve' },
        hash,
        RETRIEVED_AT,
        'oios-2025-098:p25',
        'OIOS 2025/098 ¶25',
      ),
      sourceField(
        'field:oios-2025-098:justify',
        'evidence:oios-2025-098:justify',
        'allocation.preselection_justification',
        {
          state: 'missing',
          reason:
            'Of 15 reserve allocations reviewed, 10 were single-sourced. The basis was justified for five and was not documented for the other five.',
        },
        hash,
        RETRIEVED_AT,
        'oios-2025-098:p25',
        'OIOS 2025/098 ¶25',
      ),
      sourceField(
        'field:oios-2025-098:scorecard',
        'evidence:oios-2025-098:scorecard',
        'selection.scorecard_or_alternative',
        {
          state: 'missing',
          reason:
            'Project scorecards or alternative project selection documents were missing for 2 standard-allocation projects and 11 reserve-allocation projects.',
        },
        hash,
        RETRIEVED_AT,
        'oios-2025-098:p31',
        'OIOS 2025/098 ¶31',
      ),
      sourceField(
        'field:oios-2025-098:onegms',
        'evidence:oios-2025-098:onegms',
        'onegms.selection_record',
        {
          state: 'missing',
          reason:
            'OCHA accepted a OneGMS feature so mandatory project scorecards would be uploaded before projects are recommended for funding. The report does not show that feature as already in force.',
        },
        hash,
        RETRIEVED_AT,
        'oios-2025-098:p32',
        'OIOS 2025/098 ¶32',
      ),
      sourceField(
        'field:oios-2025-098:list',
        'evidence:oios-2025-098:list',
        'misconduct.secretariat_sanctions_regime',
        { state: 'present', value: 'none' },
        hash,
        RETRIEVED_AT,
        'oios-2025-098:p37',
        'OIOS 2025/098 ¶37',
      ),
    ],
  }
}

/** Published from founder Freeze #2 (thin rehearsal, 0 pack fields mapped, evidence requested). */
export function oios2025098Draft(): CaseCardDraft {
  return {
    slug: SLUG,
    title: 'CBPF reserve pre-selection and scorecards, OIOS 2025/098',
    lede:
      'OIOS 2025/098 found reserve pre-selection justifications and project scorecards missing from the CBPF file. This card publishes the founder desk freeze of a thin rehearsal packet: evidence requested, readiness red, 20 findings, and no pack fields mapped from the file.',
    caseId: 'case:oios-2025-098-cbpf-reserve',
    packScope: 'finding-slice',
    findings: [
      {
        findingId: 'finding:oios-2025-098:preselection',
        title: 'Single-source reserve justifications were not all on file',
        summary:
          'Of 15 reserve allocations reviewed, 10 were single-sourced. The basis for single-source pre-selection was justified for five, using project scorecards or other tools, and was not documented for the other five. An undocumented justification is a file gap. OIOS does not say those partners were ineligible.',
        sourceLabel: 'OIOS 2025/098 ¶25',
      },
      {
        findingId: 'finding:oios-2025-098:scorecard',
        title: 'Scorecards or alternative selection documents were missing',
        summary:
          'Project scorecards or alternative project selection documents were missing for 2 standard-allocation projects and 11 reserve-allocation projects. OCHA indicated that project scorecards were not mandatory under reserve allocations. OCHA also accepted a OneGMS feature that would upload mandatory project scorecards before projects are recommended for funding. Accepted is not in force.',
        sourceLabel: 'OIOS 2025/098 ¶31–32',
      },
      {
        findingId: 'finding:oios-2025-098:no-list',
        title: 'No formal Secretariat partner-sanctions procedure',
        summary:
          'The Secretariat, including OCHA, did not have a formal procedure for sanctioning partners, nor a procedure for sharing information on non-performing or non-compliant partners with other United Nations system organizations. The pack records that regime as none. This card does not invent a sanctions list. A database of suspected and confirmed fraud cases is not that regime.',
        sourceLabel: 'OIOS 2025/098 ¶37',
      },
    ],
    narrative: {
      officialRecord:
        'On 30 December 2025 OIOS published the audit of management and oversight of country-based pooled funds, report 2025/098, assignment AN2024-590-02. The audit period is 1 January 2023 to 31 December 2024. OIOS’s overall opinion is that management and oversight mechanisms were effective, and that they needed strengthening in transparency of partner selection and in the completeness of selection and pre-selection documents.',
      whatWasMissing:
        'This slice is the reserve pre-selection justification, the scorecard or alternative selection document, and the OneGMS selection record those documents would occupy. The published freeze is a thin rehearsal of that slice on the OCHA CBPF pack: no pack field was mapped from the packet. The overall “effective” opinion stays in view. A missing document is not a finding that the project was wrongly chosen.',
      whatFollowed:
        'Recommendations 2 and 3 were accepted. OCHA said it would keep monitoring reserve pre-selection and would introduce OneGMS features for allocation strategies and for scorecards before recommendation. This card does not report those features as implemented.',
      assuranceQuestion:
        'Before a reserve allocation is signed, can a reviewer open the pre-selection justification, the scorecard or alternative selection document, and the OneGMS selection record?',
      whereTraceLiFits:
        'The CBPF pack checks those fields, and it requires the Secretariat partner-sanctions regime to be recorded as none. The published freeze left every pack field unmapped, including modality and that regime. Nothing here says Trace-li would have prevented an allocation. These funds are not Trace-li clients.',
    },
    patternTicketIds: [...TICKET_IDS],
    patternTickets: patternTicketsFor(TICKET_IDS),
    primarySources: [
      {
        sourceId: 'src:oios-2025-098',
        title: 'Audit of the management and oversight of country-based pooled funds',
        publisher: 'United Nations Office of Internal Oversight Services',
        url: OIOS_2025_098_PDF_URL,
        publishedOn: '2025-12-30',
        locator: '¶25 reserve pre-selection; ¶31–32 scorecards; ¶37 sanctions procedure',
      },
    ],
    primarySourceFile: {
      url: OIOS_2025_098_PDF_URL,
      sha256: OIOS_2025_098_PDF_SHA256,
      retrievedOn: '2026-09-24',
      label: 'Public OIOS PDF sha256, retrieved 24 September 2026. Not a freeze hash.',
    },
    redaction: {
      policyId: 'case-card-redaction-v1',
      public: [
        'Report number, date, audit period, and the sample counts OIOS printed',
        'OCHA’s accepted-action wording on OneGMS, as the report states it',
        'Pattern ticket ids and the Field Registry keys they point at',
      ],
      withheld: [
        'Partner names — the cited paragraphs do not name them, and this card does not add any',
        'Allocation file bytes and scorecard sheets',
        'Any customer upload or live desk packet',
        'Freeze hashes — published from the founder desk freeze. Customer upload bytes stay withheld.',
      ],
    },
    claimBoundary:
      'Trace-li cites OIOS. This card is a pre-signature missing-evidence surface. It does not say Trace-li prevents fraud, does not certify a country-based pooled fund, and does not imply that OCHA is a customer or endorser. An audit is not a criminal verdict. An accepted recommendation is not an implemented control.',
    fixtureSnapshot: oios2025098FixtureSnapshot(),
    frozenRecord: oios2025098FrozenRecord(),
  }
}
