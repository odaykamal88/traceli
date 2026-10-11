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
    title: 'The partner was selected. Could the file explain why?',
    lede:
      'A reserve allocation moves aid quickly. The next reviewer still needs to see why that partner was chosen. OIOS found that basis undocumented in 5 of 10 single-source reserve allocations reviewed. Oversight was rated effective overall. The red readiness result below is a Trace-li rehearsal, not an OCHA rating.',
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
          'In a sample of 60 projects, scorecards or alternative selection documents were missing for 2 of 35 standard projects and 11 of 25 reserve projects. OCHA said reserve scorecards were not mandatory. It accepted a future OneGMS feature for uploading mandatory scorecards before funding recommendation; the audit does not establish implementation.',
        sourceLabel: 'OIOS 2025/098 ¶31–32',
      },
      {
        findingId: 'finding:oios-2025-098:selection-mismatch',
        title: 'A recommendation could differ from the score without an explanation',
        summary:
          'OIOS found some mismatches between review-committee project scores and the partners recommended for selection, without documented justification. It gives no count. The missing explanation weakens the decision record; it does not establish that the selected partner was ineligible or that the award was improper.',
        sourceLabel: 'OIOS 2025/098 ¶32',
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
        'OIOS rated OCHA’s pooled-fund oversight effective overall, while finding gaps in the record of why partners and projects were selected. Report 2025/098 was issued on 30 December 2025 and made publicly available on 30 January 2026. It covers 1 January 2023 to 31 December 2024. These are grant partner and project selections, distinct from supplier procurement.',
      whatWasMissing:
        'The selection basis was undocumented in 5 of 10 single-source reserve allocations; selection documents were missing for 11 of 25 reserve projects and 2 of 35 standard projects reviewed; OCHA said reserve scorecards were not mandatory. OIOS also found unexplained differences between committee scores and recommended partners, without giving a count. Missing evidence does not establish an improper award. The separate Trace-li founder freeze is a thin rehearsal with no pack fields mapped from its packet.',
      whatFollowed:
        'OCHA accepted recommendations 2 and 3: strengthen selection monitoring, store allocation strategies centrally, and record selection decisions in OneGMS. Its response proposed OneGMS features for allocation strategies and for uploading mandatory scorecards before funding recommendation. Acceptance is recorded at the report date; later implementation or closure has not been established here.',
      assuranceQuestion:
        'Before recommending funding, can the financing unit show why each partner was invited, open the scorecard or alternative selection record, and explain any departure from committee scores? Can the next reviewer retrieve that same record without rebuilding the decision?',
      whereTraceLiFits:
        'The CBPF checklist brings the selection basis, supporting evidence and reviewer decision into one review record. The published rehearsal left every checklist field unmapped; its red status describes that packet. In his 24 August 2026 Ukraine briefing, Tom Fletcher called for unified donor tracking to replace parallel reporting. Our proposed connection is a reusable selection record that reviewers can cite later. A pilot would need to test whether it reduces repeated evidence requests. His statement is reporting context, not an endorsement or a new selection rule. OCHA is not presented as a Trace-li client.',
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
        locator: 'Executive summary; ¶25; ¶31–32; ¶37; OIOS landing page for public availability date',
      },
      {
        sourceId: 'src:ocha-fletcher-2026-08-24',
        title: 'Tom Fletcher — Security Council briefing on the humanitarian situation in Ukraine',
        publisher: 'United Nations Office for the Coordination of Humanitarian Affairs',
        url: 'https://www.unocha.org/publications/report/ukraine/mr-tom-fletcher-under-secretary-general-humanitarian-affairs-and-emergency-relief-coordinator-briefing-security-council-humanitarian-situation-ukraine-24-august-2026',
        publishedOn: '2026-08-24',
        locator: 'As-delivered statement, paragraph beginning “Ukraine is a strong model”; unified donor tracking',
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
      'Trace-li cites OIOS. This card is a pre-signature missing-evidence surface. It does not say Trace-li prevents fraud, does not certify a country-based pooled fund, and does not imply that OCHA is a customer or endorser. An audit is not a criminal verdict. An accepted recommendation is not an implemented control. This is grant-selection assurance. Fletcher’s reporting proposal is context; any reduction in reporting work remains a pilot hypothesis.',
    fixtureSnapshot: oios2025098FixtureSnapshot(),
    frozenRecord: oios2025098FrozenRecord(),
  }
}
