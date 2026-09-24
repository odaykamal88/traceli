import type { CaseCardDraft } from '@/lib/field-registry/case-card'
import { OCHA_CBPF_PACK } from '@/lib/field-registry/packs/ocha-cbpf'
import type { AwardRegistrySnapshot } from '@/lib/field-registry/schema'

import { patternTicketsFor } from '@/lib/case-cards/pattern-tickets'
import { sourceField } from '@/lib/case-cards/public-source-field'

/** SHA-256 of the public OIOS 2020/005 PDF retrieved 24 September 2026. Not a freeze hash. */
export const OIOS_2020_005_PDF_SHA256 = '16022f54a0a71a9789619277b07c3ce065e7f97c65c495eeffc11c0426c42f4e'

export const OIOS_2020_005_PDF_URL = 'https://oios.un.org/system/files/Reports/2020_005_pd.pdf'

const RETRIEVED_AT = '2026-09-24T12:00:00.000Z'
const SLUG = 'oios-2020-005-iraq-forensic'
const TICKET_IDS = ['pt:oios-2020-005:forensic-backlog-not-presignature'] as const

export function oios2020005FixtureSnapshot(): AwardRegistrySnapshot {
  const hash = OIOS_2020_005_PDF_SHA256
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'public-source',
    organizationId: 'org:public-case-cards',
    projectId: 'project:oios-2020-005-iraq-forensic',
    awardId: 'oios-2020-005',
    procurementReference: 'OIOS-2020/005',
    donor: { donorId: 'donor_ocha_cbpf', name: 'OCHA CBPF' },
    framework: {
      frameworkId: OCHA_CBPF_PACK.packId,
      name: OCHA_CBPF_PACK.name,
      version: OCHA_CBPF_PACK.version,
    },
    asOf: RETRIEVED_AT,
    fields: [
      sourceField(
        'field:oios-2020-005:backlog',
        'evidence:oios-2020-005:backlog',
        'audit.forensic_backlog',
        {
          state: 'present',
          value: '2 of 35 suspected cases under forensic audit, 2015–2019, completed in 382 and 586 days. Both reported no evidence of fraud or wrongdoing.',
        },
        hash,
        RETRIEVED_AT,
        'oios-2020-005:p35',
        'OIOS 2020/005 ¶35',
      ),
      sourceField(
        'field:oios-2020-005:not-proof',
        'evidence:oios-2020-005:not-proof',
        'assurance.forensic_is_not_presignature_proof',
        {
          state: 'missing',
          reason:
            'The report measures forensic time after referral. It does not supply a pre-signature eligibility or selection file. Completion of those two audits is not that file.',
        },
        hash,
        RETRIEVED_AT,
        'oios-2020-005:p35',
        'OIOS 2020/005 ¶33–36',
      ),
    ],
  }
}

/** Fixture. `frozenRecord` stays null until a founder-confirmed freeze is dropped in. */
export function oios2020005Draft(): CaseCardDraft {
  return {
    slug: SLUG,
    title: 'Iraq Humanitarian Fund forensic timing, OIOS 2020/005',
    lede:
      'OIOS 2020/005 reports that 2 of 35 suspected fraud cases under forensic audit were completed, in 382 and 586 days. This fixture keeps that timing off the pre-signature file. It is not a frozen desk record.',
    caseId: 'case:oios-2020-005-iraq-forensic',
    packScope: 'finding-slice',
    findings: [
      {
        findingId: 'finding:oios-2020-005:backlog',
        title: 'Two forensic audits finished, out of thirty-five',
        summary:
          'CBPF standard operating procedures give three options for reported fraud: an implementing-partner investigation, a forensic review by an independent audit firm, or an OIOS investigation. Only 2 of the 35 suspected fraudulent cases under forensic audit from 2015 to 2019 had been completed. Those two took 382 and 586 days from the partner notification date. Both reported no evidence of fraud or wrongdoing. That sentence covers the two completed files. It does not clear the other thirty-three.',
        sourceLabel: 'OIOS 2020/005 ¶33–35',
      },
      {
        findingId: 'finding:oios-2020-005:timeframe',
        title: 'No standard timeframe was attached to forensic audits',
        summary:
          'Terms of reference for external audits expect them to be ideally completed in six months. OIOS found no timeframe attached to forensic audits. Recommendation 3 asked OCHA to review commissioning procedures and estimate standard timeframes. OCHA accepted. The recommendation remained open pending evidence that procedures had been updated. This card does not update that 2020 status.',
        sourceLabel: 'OIOS 2020/005 ¶35–36',
      },
    ],
    narrative: {
      officialRecord:
        'On 8 April 2020 OIOS published the audit of OCHA operations in Iraq, report 2020/005, assignment AN2019-590-03, including management of the Iraq Humanitarian Fund. The period is 1 January 2018 to 30 September 2019. The forensic sample in paragraph 35 reaches back to cases from 2015.',
      whatWasMissing:
        'The paragraphs that matter here are about time after a suspicion was referred, not about a scorecard or a reserve justification on a new award. The CBPF pack does not treat a completed forensic audit as a pre-signature gate. This fixture records that non-equivalence as its own field, with no pack rule behind it yet.',
      whatFollowed:
        'Recommendation 3 remained open at the date of the report. OCHA said timelines were not entirely within its control. Open in 2020 is not a statement about 2026. This card does not carry the recommendation forward.',
      assuranceQuestion:
        'Before signature, which document is the eligibility and selection file? A forensic audit that finishes hundreds of days later is a different record.',
      whereTraceLiFits:
        'Trace-li’s CBPF pack checks reserve pre-selection and a scorecard or alternative selection document before recommendation. This card’s pattern ticket says a forensic backlog is not those fields. The card is a fixture awaiting a founder freeze. Nothing here says Trace-li would have prevented a suspected case. The Iraq Humanitarian Fund is not a Trace-li client.',
    },
    patternTicketIds: [...TICKET_IDS],
    patternTickets: patternTicketsFor(TICKET_IDS),
    primarySources: [
      {
        sourceId: 'src:oios-2020-005',
        title: 'Audit of the operations of OCHA in Iraq',
        publisher: 'United Nations Office of Internal Oversight Services',
        url: OIOS_2020_005_PDF_URL,
        publishedOn: '2020-04-08',
        locator: '¶33 pathway; ¶35 forensic timing; ¶36 recommendation 3',
      },
    ],
    primarySourceFile: {
      url: OIOS_2020_005_PDF_URL,
      sha256: OIOS_2020_005_PDF_SHA256,
      retrievedOn: '2026-09-24',
      label: 'Public OIOS PDF sha256, retrieved 24 September 2026. Not a freeze hash.',
    },
    redaction: {
      policyId: 'case-card-redaction-v1',
      public: [
        'Report number, date, and the forensic counts and day counts OIOS printed',
        'Recommendation 3 status as open at the date of the 2020 report',
        'Pattern ticket id and the field key it points at',
      ],
      withheld: [
        'Partner names — the cited paragraphs do not name them, and this card does not add any',
        'Forensic file bytes',
        'Any customer upload or live desk packet',
        'Freeze hashes — no founder-confirmed freeze exists for this card',
      ],
    },
    claimBoundary:
      'Trace-li cites OIOS. This card is a pre-signature missing-evidence surface. It does not say Trace-li prevents fraud, does not certify the Iraq Humanitarian Fund, and does not imply that OCHA is a customer or endorser. An audit is not a criminal verdict. “No evidence” on two completed forensic audits is not a conclusion about the other cases.',
    fixtureSnapshot: oios2020005FixtureSnapshot(),
    frozenRecord: null,
  }
}
