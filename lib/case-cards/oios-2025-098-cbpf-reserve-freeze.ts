import { FieldRegistryError, dispositionFromAwardDeskDecision, freezeAtJudgment, verifyFrozenRecord } from '@/lib/field-registry/freeze'
import { evaluateDonorPack, packToggleForId } from '@/lib/field-registry/packs'
import { OCHA_CBPF_FIELD_KEYS, OCHA_CBPF_PACK } from '@/lib/field-registry/packs/ocha-cbpf'
import type { AwardRegistrySnapshot, RegistryField } from '@/lib/field-registry/schema'

/**
 * Founder Freeze #2 from Production upload desk, 24 September 2026.
 * Hashes are checked, not invented.
 *
 * `actorRole` is not covered by `snapshotHash` or `packsHash`. Production stores
 * `viewer.role` from `requireTraceViewer` / `traceRole`, which maps the WorkOS
 * slug `workspace-admin` to `Workspace Admin`. The session dump does not include
 * the role. This founder actor is recorded as Workspace Admin.
 */
export const OIOS_2025_098_ACTOR_ROLE = 'Workspace Admin' as const

export const OIOS_2025_098_RECORD_ID = 'record.desk.ocha-cbpf.3a1034810747.20260924T172704560Z.judgment'
export const OIOS_2025_098_SUPERSEDES_RECORD_ID = 'record.desk.ocha-cbpf.3a1034810747.20260924T172624919Z'
export const OIOS_2025_098_SNAPSHOT_HASH = '538f10ad7ee62c24e6f058c79d41bbb4f300a6ae92b12d0fd5224da85be20aea'
export const OIOS_2025_098_PACKS_HASH = '9362f22bd4c510dfb0d03758b7bb3a480a86497626ed27271b32593b3e4b8255'

const FROZEN_AT = '2026-09-24T17:27:04.560Z'
const FROZEN_BY = 'user_01M2MDYWCDDT13QGCTJHHSYD1C'
const SOURCE_FILE_HASH = '3a1034810747faf9d15e66993e9871a66c298ab3c9109ab315e4ef266ab492de'
const EXTRACTED_AT = '2026-09-24T17:25:51.932Z'
const MISSING_REASON = 'Not extracted from this packet.'

const JUDGMENT_REASON = 'OCHA CBPF Global Guidelines-shaped award desk v0 readiness is red. 20 findings. Top findings: Allocation modality must be standard or reserve; Allocation strategy filed, including reserve pre-selection criteria; Annex 7 declarations required, including conflict of interest and designated entity. Pack fields still missing: partner.due_diligence_passed, partner.capacity_assessment, partner.annex7_declarations, allocation.modality, allocation.preselection_justification, allocation.strategy_on_file, selection.scorecard_or_alternative, selection.committee_decision, and 16 more. Evidence is still open. Edit this draft, then confirm your judgment.'

function rehearsalField(key: string): RegistryField {
  return {
    fieldId: `field.missing.${key}`,
    entityKind: 'evidence',
    entityId: `evidence.missing.${key}`,
    key,
    value: { state: 'missing', reason: MISSING_REASON },
    provenance: {
      sourceFileHash: SOURCE_FILE_HASH,
      sourceRef: { kind: 'page', id: 'packet', label: 'oios-2025-098-cbpf-rehearsal.pdf' },
      extractedAt: EXTRACTED_AT,
      confidence: 0,
      verificationMethod: 'adapter_extract',
    },
  }
}

/** Synthetic upload-desk snapshot from Freeze #2. No pack field was mapped from the packet. */
export function oios2025098DeskSnapshot(): AwardRegistrySnapshot {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'synthetic',
    organizationId: 'org_01M2MDYMMMY9SWVAC8VWE52BM3',
    projectId: 'project.upload-desk',
    awardId: 'award.3a1034810747faf9',
    procurementReference: 'Rehearsal · OIOS 2025/098 reserve pre-selection (synthetic)',
    donor: { donorId: 'donor_ocha_cbpf', name: 'OCHA CBPF' },
    framework: {
      frameworkId: OCHA_CBPF_PACK.packId,
      name: OCHA_CBPF_PACK.name,
      version: OCHA_CBPF_PACK.version,
    },
    asOf: '2026-09-24T17:26:24.919Z',
    fields: OCHA_CBPF_FIELD_KEYS.map(rehearsalField),
  }
}

/** Disposition freeze (`.judgment`) reconstructed on the same path as `supersedeUploadedPacket`. */
export function oios2025098FrozenRecord() {
  const snapshot = oios2025098DeskSnapshot()
  const judgment = evaluateDonorPack(snapshot, 'ocha-cbpf', { evaluatedAt: FROZEN_AT })
  if (judgment.pipelineStatus.readiness !== 'red' || judgment.findings.length !== 20) {
    throw new FieldRegistryError('Founder freeze judgment does not match the Production desk session.')
  }
  const record = verifyFrozenRecord(freezeAtJudgment(snapshot, {
    recordId: OIOS_2025_098_RECORD_ID,
    supersedesRecordId: OIOS_2025_098_SUPERSEDES_RECORD_ID,
    frozenAt: FROZEN_AT,
    frozenBy: FROZEN_BY,
    packs: [packToggleForId('ocha-cbpf')],
    disposition: dispositionFromAwardDeskDecision({
      decision: 'request',
      actorId: FROZEN_BY,
      actorRole: OIOS_2025_098_ACTOR_ROLE,
      timestamp: FROZEN_AT,
      rationale: JUDGMENT_REASON,
      waiverRefs: [],
    }),
    pipelineStatus: judgment.pipelineStatus,
  }))
  if (record.snapshotHash !== OIOS_2025_098_SNAPSHOT_HASH || record.packsHash !== OIOS_2025_098_PACKS_HASH) {
    throw new FieldRegistryError('Founder freeze hashes do not match the Production desk session.')
  }
  return record
}
