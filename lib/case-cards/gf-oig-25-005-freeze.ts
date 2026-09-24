import { FieldRegistryError, dispositionFromAwardDeskDecision, freezeAtJudgment, verifyFrozenRecord } from '@/lib/field-registry/freeze'
import { evaluateDonorPack, packToggleForId } from '@/lib/field-registry/packs'
import { GLOBAL_FUND_FIELD_KEYS, GLOBAL_FUND_PACK } from '@/lib/field-registry/packs/global-fund'
import type { AwardRegistrySnapshot, RegistryField } from '@/lib/field-registry/schema'

/**
 * Founder Freeze #1 from Production upload desk, 24 September 2026.
 * Session key `traceli.uploadDesk.frozen.v2`. Hashes are checked, not invented.
 *
 * `actorRole` is not covered by `snapshotHash` or `packsHash`. Production stores
 * `viewer.role` from `requireTraceViewer` / `traceRole`, which maps the WorkOS
 * slug `workspace-admin` to `Workspace Admin`. The session dump does not include
 * the role. This founder actor is recorded as Workspace Admin.
 */
export const GF_OIG_25_005_ACTOR_ROLE = 'Workspace Admin' as const

export const GF_OIG_25_005_RECORD_ID = 'record.desk.global-fund.15c00a23c999.20260924T130659035Z.judgment'
export const GF_OIG_25_005_SUPERSEDES_RECORD_ID = 'record.desk.global-fund.15c00a23c999.20260924T130635783Z'
export const GF_OIG_25_005_SNAPSHOT_HASH = '0916edffbb669fc65309767dbf9b7c498dae8a8a6617718903bb20d89ac2e64b'
export const GF_OIG_25_005_PACKS_HASH = 'dc5f8ddc49b676243f07889c93309194db36e445c8427a913ff8aa778d864dc3'

const FROZEN_AT = '2026-09-24T13:06:59.035Z'
const FROZEN_BY = 'user_01M2MDYWCDDT13QGCTJHHSYD1C'
const SOURCE_FILE_HASH = '15c00a23c999b178cb50fa80cfdd44e61dc460b932ad672155231fa9d7db1589'
const EXTRACTED_AT = '2026-09-24T13:05:54.554Z'
const MISSING_REASON = 'Not extracted from this packet.'

const JUDGMENT_REASON = 'Global Fund Grant Regulations v1 readiness is red. 22 findings. Top findings: Affiliated and key persons, with roles, required on the IDD record; Award must be competitive or an established exemption; Award rationale documentation required. Pack fields still missing: eligibility.contractor_capable, integrity.coi_disclosed, procurement.competitive_or_exempt, procurement.competition_or_exemption_documented, procurement.solicitation_notified, documentation.award_rationale_on_file, award.contract_value_usd, threshold.method_aligned, and 18 more. Evidence is still open. Edit this draft, then confirm your judgment.'

function rehearsalField(key: string): RegistryField {
  return {
    fieldId: `field.missing.${key}`,
    entityKind: 'evidence',
    entityId: `evidence.missing.${key}`,
    key,
    value: { state: 'missing', reason: MISSING_REASON },
    provenance: {
      sourceFileHash: SOURCE_FILE_HASH,
      sourceRef: { kind: 'page', id: 'packet', label: 'gf-oig-25-005-rehearsal.pdf' },
      extractedAt: EXTRACTED_AT,
      confidence: 0,
      verificationMethod: 'adapter_extract',
    },
  }
}

/** Synthetic upload-desk snapshot from Freeze #1. No pack field was mapped from the packet. */
export function gfOig25005DeskSnapshot(): AwardRegistrySnapshot {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'synthetic',
    organizationId: 'org_01M2MDYMMMY9SWVAC8VWE52BM3',
    projectId: 'project.upload-desk',
    awardId: 'award.15c00a23c999b178',
    procurementReference: 'Rehearsal · GF-OIG-25-005 finding 4.4 (synthetic non-health file)',
    donor: { donorId: 'donor_global_fund', name: 'The Global Fund' },
    framework: {
      frameworkId: GLOBAL_FUND_PACK.packId,
      name: GLOBAL_FUND_PACK.name,
      version: GLOBAL_FUND_PACK.version,
    },
    asOf: '2026-09-24T13:06:35.783Z',
    fields: GLOBAL_FUND_FIELD_KEYS.map(rehearsalField),
  }
}

/** Disposition freeze (`.judgment`) reconstructed on the same path as `supersedeUploadedPacket`. */
export function gfOig25005FrozenRecord() {
  const snapshot = gfOig25005DeskSnapshot()
  const judgment = evaluateDonorPack(snapshot, 'global-fund', { evaluatedAt: FROZEN_AT })
  if (judgment.pipelineStatus.readiness !== 'red' || judgment.findings.length !== 22) {
    throw new FieldRegistryError('Founder freeze judgment does not match the Production desk session.')
  }
  const record = verifyFrozenRecord(freezeAtJudgment(snapshot, {
    recordId: GF_OIG_25_005_RECORD_ID,
    supersedesRecordId: GF_OIG_25_005_SUPERSEDES_RECORD_ID,
    frozenAt: FROZEN_AT,
    frozenBy: FROZEN_BY,
    packs: [packToggleForId('global-fund')],
    disposition: dispositionFromAwardDeskDecision({
      decision: 'request',
      actorId: FROZEN_BY,
      actorRole: GF_OIG_25_005_ACTOR_ROLE,
      timestamp: FROZEN_AT,
      rationale: JUDGMENT_REASON,
      waiverRefs: [],
    }),
    pipelineStatus: judgment.pipelineStatus,
  }))
  if (record.snapshotHash !== GF_OIG_25_005_SNAPSHOT_HASH || record.packsHash !== GF_OIG_25_005_PACKS_HASH) {
    throw new FieldRegistryError('Founder freeze hashes do not match the Production desk session.')
  }
  return record
}
