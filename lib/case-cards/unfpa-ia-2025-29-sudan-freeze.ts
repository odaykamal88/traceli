import { FieldRegistryError, dispositionFromAwardDeskDecision, freezeAtJudgment, verifyFrozenRecord } from '@/lib/field-registry/freeze'
import { evaluateDonorPack, packToggleForId } from '@/lib/field-registry/packs'
import { UNFPA_FIELD_KEYS, UNFPA_PACK } from '@/lib/field-registry/packs/unfpa'
import type { AwardRegistrySnapshot, FieldValue, RegistryField } from '@/lib/field-registry/schema'

/**
 * Founder Freeze #3 from Production upload desk, 25 September 2026.
 * Hashes are checked, not invented.
 *
 * `actorRole` is not covered by `snapshotHash` or `packsHash`. Production stores
 * `viewer.role` from `requireTraceViewer` / `traceRole`, which maps the WorkOS
 * slug `workspace-admin` to `Workspace Admin`. The session dump does not include
 * the role. This founder actor is recorded as Workspace Admin.
 */
export const UNFPA_SUDAN_ACTOR_ROLE = 'Workspace Admin' as const

export const UNFPA_SUDAN_RECORD_ID = 'record.desk.unfpa.be80723e5df1.20260925T130553746Z.judgment'
export const UNFPA_SUDAN_SUPERSEDES_RECORD_ID = 'record.desk.unfpa.be80723e5df1.20260925T130056395Z'
export const UNFPA_SUDAN_SNAPSHOT_HASH = '254131851795ef62894609cf3eb6f1d682527840f768de4fcafb8a318576af00'
export const UNFPA_SUDAN_PACKS_HASH = '1bc1c66aad1ddbcc8a5188a2da89532a4632b09ddb3bec460dee8253c9448b49'

const FROZEN_AT = '2026-09-25T13:05:53.746Z'
const FROZEN_BY = 'user_01M2MDYWCDDT13QGCTJHHSYD1C'
const SOURCE_FILE_HASH = 'be80723e5df1013dfc8c9244bdcc342742db769dabab254ae0d4ddd8e93ad7d2'
const EXTRACTED_AT = '2026-09-25T13:00:56.389Z'
const PACKET_LABEL = 'unfpa-ia-2025-29-sudan-rehearsal.pdf'
const MISSING_REASON = 'Not extracted from this packet.'

const JUDGMENT_REASON = 'UNFPA OAIS-shaped award desk v0 readiness is red. 26 findings. Top findings: Annual procurement plan line required; Approver must match the cumulative workplan threshold; Binding purchase order or contract required before delivery. Pack fields still missing: ip.competitive_or_waiver, ip.waiver_or_competition_documented, ip.unpp_profile, ip.hact_micro_assessment, ip.psea_assessment, procurement.plan_line, procurement.method_vs_threshold, procurement.crc_gate, and 15 more. Evidence is still open. Edit this draft, then confirm your judgment.'

/** Four pack keys Talonic read from page 1. The other 23 stay unextracted. */
const PACKET_READS: Record<string, { value: FieldValue; label: string }> = {
  'ip.threshold_approver': {
    value: { state: 'negative', value: false },
    label: 'Quote: No Regional Director approval is on file.',
  },
  'procurement.rfq_criteria_and_scores': {
    value: {
      state: 'missing',
      reason: 'Stated absent in this packet: RFQ evaluation criteria in the solicitation: none listed.',
    },
    label: 'Quote: RFQ evaluation criteria in the solicitation: none listed.',
  },
  'procurement.po_or_contract': {
    value: {
      state: 'missing',
      reason: 'Stated absent in this packet: No approved purchase order was issued before the goods were received, and no signed contract is on file.',
    },
    label: 'Quote: No approved purchase order was issued before the goods were received, and no signed contract is on file.',
  },
  'procurement.rir': {
    value: {
      state: 'missing',
      reason: 'Stated absent in this packet: Receiving and inspection report (RIR): no policy-compliant RIR is on file.',
    },
    label: 'Quote: Receiving and inspection report (RIR): no policy-compliant RIR is on file.',
  },
}

function rehearsalField(key: string): RegistryField {
  const read = PACKET_READS[key]
  if (read) {
    return {
      fieldId: `field.packet.${key}`,
      entityKind: 'evidence',
      entityId: `evidence.packet.${key}`,
      key,
      value: read.value,
      provenance: {
        sourceFileHash: SOURCE_FILE_HASH,
        sourceRef: { kind: 'page', id: 'page-1', label: read.label },
        extractedAt: EXTRACTED_AT,
        confidence: 0.16,
        verificationMethod: 'adapter_extract',
      },
    }
  }
  return {
    fieldId: `field.missing.${key}`,
    entityKind: 'evidence',
    entityId: `evidence.missing.${key}`,
    key,
    value: { state: 'missing', reason: MISSING_REASON },
    provenance: {
      sourceFileHash: SOURCE_FILE_HASH,
      sourceRef: { kind: 'page', id: 'packet', label: PACKET_LABEL },
      extractedAt: EXTRACTED_AT,
      confidence: 0,
      verificationMethod: 'adapter_extract',
    },
  }
}

/** Synthetic upload-desk snapshot from Freeze #3. Four of 27 pack keys were read from the packet. */
export function unfpaSudanDeskSnapshot(): AwardRegistrySnapshot {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'synthetic',
    organizationId: 'org_01M2MDYMMMY9SWVAC8VWE52BM3',
    projectId: 'project.upload-desk',
    awardId: 'award.be80723e5df1013d',
    procurementReference: 'Rehearsal · IA/2025-29 Sudan pre-award file (synthetic)',
    donor: { donorId: 'donor_unfpa', name: 'UNFPA' },
    framework: {
      frameworkId: UNFPA_PACK.packId,
      name: UNFPA_PACK.name,
      version: UNFPA_PACK.version,
    },
    asOf: '2026-09-25T13:00:56.395Z',
    fields: UNFPA_FIELD_KEYS.map(rehearsalField),
  }
}

/** Disposition freeze (`.judgment`) reconstructed on the same path as `supersedeUploadedPacket`. */
export function unfpaSudanFrozenRecord() {
  const snapshot = unfpaSudanDeskSnapshot()
  const judgment = evaluateDonorPack(snapshot, 'unfpa', { evaluatedAt: FROZEN_AT })
  if (judgment.pipelineStatus.readiness !== 'red' || judgment.findings.length !== 26) {
    throw new FieldRegistryError('Founder freeze judgment does not match the Production desk session.')
  }
  const record = verifyFrozenRecord(freezeAtJudgment(snapshot, {
    recordId: UNFPA_SUDAN_RECORD_ID,
    supersedesRecordId: UNFPA_SUDAN_SUPERSEDES_RECORD_ID,
    frozenAt: FROZEN_AT,
    frozenBy: FROZEN_BY,
    packs: [packToggleForId('unfpa')],
    disposition: dispositionFromAwardDeskDecision({
      decision: 'request',
      actorId: FROZEN_BY,
      actorRole: UNFPA_SUDAN_ACTOR_ROLE,
      timestamp: FROZEN_AT,
      rationale: JUDGMENT_REASON,
      waiverRefs: [],
    }),
    pipelineStatus: judgment.pipelineStatus,
  }))
  if (record.snapshotHash !== UNFPA_SUDAN_SNAPSHOT_HASH || record.packsHash !== UNFPA_SUDAN_PACKS_HASH) {
    throw new FieldRegistryError('Founder freeze hashes do not match the Production desk session.')
  }
  return record
}
