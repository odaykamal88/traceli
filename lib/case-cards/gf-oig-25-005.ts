import type { CaseCardDraft } from '@/lib/field-registry/case-card'
import { GLOBAL_FUND_PACK } from '@/lib/field-registry/packs/global-fund'
import type { AwardRegistrySnapshot, RegistryField } from '@/lib/field-registry/schema'

import { gfOig25005FrozenRecord } from '@/lib/case-cards/gf-oig-25-005-freeze'
import { patternTicketsFor } from '@/lib/case-cards/pattern-tickets'

/** SHA-256 of the public PDF retrieved 23 September 2026. Not a freeze hash. */
export const GF_OIG_25_005_PDF_SHA256 = 'fb54a35e9d7a71cbbe893d0fa2108113283ade43d2b99bb81a6f471fa68a12a8'

export const GF_OIG_25_005_PDF_URL = 'https://www.theglobalfund.org/media/gbqltprg/oig_gf-oig-25-005_report_en.pdf'

const RETRIEVED_AT = '2026-09-23T12:00:00.000Z'
const TICKET_IDS = [
  'pt:gf-oig-25-005:competition-exception-docs',
  'pt:gf-oig-25-005:procurement-file-completeness',
  'pt:gf-oig-25-005:extension-authority',
] as const

function provenance(pageId: string, label: string) {
  return {
    sourceFileHash: GF_OIG_25_005_PDF_SHA256,
    sourceRef: { kind: 'page' as const, id: pageId, label },
    extractedAt: RETRIEVED_AT,
    confidence: 1,
    verificationMethod: 'unverified' as const,
  }
}

function field(
  fieldId: string,
  entityId: string,
  key: string,
  value: RegistryField['value'],
  pageId: string,
  label: string,
): RegistryField {
  return {
    fieldId,
    entityKind: 'evidence',
    entityId,
    key,
    value,
    provenance: provenance(pageId, label),
  }
}

/**
 * Registry-shaped reading of OIG finding 4.4. Not a desk freeze.
 * Only facts the public report states are on the snapshot.
 */
export function gfOig25005FixtureSnapshot(): AwardRegistrySnapshot {
  const page = 'gf-oig-25-005:p18'
  const label = 'GF-OIG-25-005 finding 4.4, PDF p. 18'
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'public-source',
    organizationId: 'org:public-case-cards',
    projectId: 'project:gf-oig-25-005',
    awardId: 'gf-oig-25-005',
    procurementReference: 'GF-OIG-25-005',
    donor: { donorId: 'donor_global_fund', name: 'The Global Fund' },
    framework: {
      frameworkId: GLOBAL_FUND_PACK.packId,
      name: GLOBAL_FUND_PACK.name,
      version: GLOBAL_FUND_PACK.version,
    },
    asOf: RETRIEVED_AT,
    fields: [
      field(
        'field:gf-oig-25-005:control-rating',
        'evidence:gf-oig-25-005:rating',
        'audit.procurement_controls_rating',
        { state: 'present', value: 'Partially Effective' },
        'gf-oig-25-005:s1.4',
        'GF-OIG-25-005 §1.4 objective rating',
      ),
      field(
        'field:gf-oig-25-005:sample',
        'evidence:gf-oig-25-005:sample',
        'audit.sample_scope',
        { state: 'present', value: '30 contracts, 64 percent of non-health procurement value, 2021–2023' },
        page,
        label,
      ),
      field(
        'field:gf-oig-25-005:competition-docs',
        'evidence:gf-oig-25-005:competition',
        'procurement.competition_or_exemption_documented',
        {
          state: 'missing',
          reason:
            'Three reviewed contracts used restricted negotiation or single sourcing where the value called for more competition. Global Fund non-objection was given. The manual does not provide for those exceptions, and authorization was not consistently on file.',
        },
        page,
        label,
      ),
      field(
        'field:gf-oig-25-005:award-rationale',
        'evidence:gf-oig-25-005:rationale',
        'documentation.award_rationale_on_file',
        {
          state: 'missing',
          reason:
            'In some reviewed files the document justifying and authorizing the award choice was missing. The OIG did not say every Togo award lacked a rationale.',
        },
        page,
        label,
      ),
      field(
        'field:gf-oig-25-005:file-completeness',
        'evidence:gf-oig-25-005:files',
        'procurement.file_completeness',
        {
          state: 'missing',
          reason:
            'Of €10 million in non-health procurement reviewed, files for €2.7 million lacked proof of delivery, final validation of works, reception minutes, or delivery notes.',
        },
        page,
        label,
      ),
      field(
        'field:gf-oig-25-005:extension-authority',
        'evidence:gf-oig-25-005:extensions',
        'procurement.extension_authority_documented',
        {
          state: 'missing',
          reason:
            'Extensions were granted, 30% of them for as long as 18 months. The manual covers when and how far, not who may authorize an extension or how that authorization is recorded.',
        },
        page,
        label,
      ),
    ],
  }
}

/** Case #1. Published from founder Freeze #1 (thin rehearsal, evidence requested). */
export function gfOig25005Draft(): CaseCardDraft {
  return {
    slug: 'gf-oig-25-005',
    title: 'Procurement oversight on Global Fund grants in Togo',
    lede:
      'OIG audit GF-OIG-25-005 rated procurement and financial controls in Togo Partially Effective. This card publishes the founder desk freeze of a thin rehearsal packet for finding 4.4: evidence requested, readiness red, 22 findings, and no pack fields mapped from the file.',
    caseId: 'case:gf-oig-25-005',
    packScope: 'finding-slice',
    findings: [
      {
        findingId: 'finding:gf-oig-25-005:incomplete-files',
        title: 'Incomplete non-health procurement files',
        summary:
          'Of the €10 million in non-health product procurement the OIG reviewed, files covering €2.7 million were incomplete. Missing pieces included proof of delivery to final users, final validation of works, minutes of reception, and delivery notes. That gap impairs a later review of legitimacy, authorization, and execution. Health products, about 49% of Grant Cycle 6 funds, moved through the pooled procurement mechanism and sit outside this finding.',
        sourceLabel: 'GF-OIG-25-005 §4.4',
      },
      {
        findingId: 'finding:gf-oig-25-005:competition-exceptions',
        title: 'Competition exceptions were not consistently documented',
        summary:
          'Three reviewed contracts were awarded by restricted negotiation or single sourcing where the value required a more competitive process. Those procurements received Global Fund non-objection. The exceptions are not provided for in the procedures manual and were not consistently documented and approved. In some files the document that justified and authorized the award choice was missing.',
        sourceLabel: 'GF-OIG-25-005 §4.4',
      },
      {
        findingId: 'finding:gf-oig-25-005:extension-authority',
        title: 'Contract extensions lack a recorded authorizing authority',
        summary:
          'Contract execution by suppliers was often late, and contracts were extended or amended without penalties for the delay. Thirty percent of those extensions ran for as long as 18 months. The procedures manual states when an extension may be granted and how far time and cost may move. It does not state who may authorize an extension or how that authorization is documented.',
        sourceLabel: 'GF-OIG-25-005 §4.4',
      },
    ],
    narrative: {
      officialRecord:
        'On 4 June 2025 the Global Fund Office of the Inspector General published audit GF-OIG-25-005, Global Fund Grants to the Togolese Republic. The Principal Recipient is the Office of the Prime Minister of the Togolese Republic. For the objective covering the PR’s internal controls over procurement and financial management, the OIG rating is Partially Effective. The audit period is Grant Cycle 6 (January 2021–December 2023), with design aspects of Grant Cycle 7.',
      whatWasMissing:
        'Finding 4.4 says oversight of non-health procurement did not catch delays, incomplete files, or undocumented exceptions. The OIG reviewed 30 contracts, 64% of non-health procurement value from 2021 to 2023. The published freeze is a thin rehearsal of that finding on the Global Fund pack: no pack field was mapped from the packet. It is not a reconstruction of one named tender, and it does not rate health-product purchases made through the pooled mechanism.',
      whatFollowed:
        'Agreed Management Action 3 asks the Global Fund Secretariat to work with the Principal Recipient to assess the Program Management Unit procurement team and develop an improvement plan. The owner is the Head of Grants Management Division. The due date is 30 June 2026. This card does not report whether that action has been completed.',
      assuranceQuestion:
        'Before signature, can a reviewer open the competition or exemption record, the award authorization, the delivery and reception file, and the authority for any contract extension?',
      whereTraceLiFits:
        'Trace-li is pre-signature award assurance: a frozen Field Registry record of what was on file, what was missing, and what a person decided. The Global Fund pack already checks competition-or-exemption documentation and an award rationale. Pattern tickets on this card mark two further gaps the pack does not check yet. Nothing here says Trace-li would have prevented the audit finding.',
    },
    patternTicketIds: [...TICKET_IDS],
    patternTickets: patternTicketsFor(TICKET_IDS),
    primarySources: [
      {
        sourceId: 'src:gf-oig-25-005',
        title: 'Global Fund Grants to the Togolese Republic',
        publisher: 'The Global Fund Office of the Inspector General',
        url: GF_OIG_25_005_PDF_URL,
        publishedOn: '2025-06-04',
        locator: 'Finding 4.4, PDF p. 18; objective rating in §1.4',
      },
    ],
    primarySourceFile: {
      url: GF_OIG_25_005_PDF_URL,
      sha256: GF_OIG_25_005_PDF_SHA256,
      retrievedOn: '2026-09-23',
      label: 'Public OIG PDF sha256, retrieved 23 September 2026. Not a freeze hash.',
    },
    redaction: {
      policyId: 'case-card-redaction-v1',
      public: [
        'Report number, date, OIG rating, and aggregate euro amounts published in GF-OIG-25-005',
        'The Principal Recipient named in the report: the Office of the Prime Minister of the Togolese Republic',
        'Agreed Management Action 3 owner role and due date',
        'Pattern ticket ids and the Field Registry keys they point at',
      ],
      withheld: [
        'Supplier names — the public finding does not name them, and this card does not add any',
        'Individual staff names',
        'Procurement file bytes, bid prices, and evaluation sheets',
        'Any customer upload or live desk packet',
        'Freeze hashes — published from the founder desk freeze. Customer upload bytes stay withheld.',
      ],
    },
    claimBoundary:
      'Trace-li cites the Global Fund Office of the Inspector General. This card is a pre-signature missing-evidence surface. It does not say Trace-li prevents fraud, does not certify the Principal Recipient, and does not imply that the Global Fund is a customer or endorser.',
    fixtureSnapshot: gfOig25005FixtureSnapshot(),
    frozenRecord: gfOig25005FrozenRecord(),
  }
}
