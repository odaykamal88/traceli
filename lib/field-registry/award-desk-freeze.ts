import 'server-only'

import {
  awardDeskScenario,
  sanitizeDisposition,
  type AwardDeskDecisionId,
  type AwardDeskFrozenRecordView,
  type FrozenGoverningPack,
} from '@/lib/award-desk'
import {
  SYNTHETIC_SHELTER_RULES,
  evaluateJudgment,
  type JudgmentResult,
} from '@/lib/field-registry/judgment'
import {
  evaluateDonorPacks,
  isDonorPackId,
} from '@/lib/field-registry/packs'
import {
  dispositionFromAwardDeskDecision,
  freezeAtJudgment,
  verifyFrozenRecord,
  type FrozenDecisionRecord,
} from '@/lib/field-registry/freeze'
import type {
  ActorRole,
  AwardRegistrySnapshot,
  PackToggle,
  WaiverRef,
} from '@/lib/field-registry/schema'

/** Fixed demo judgment clock — matches Leila's Cairo Monday morning on the desk. */
export const AWARD_DESK_FREEZE_AT = '2026-09-22T07:14:00.000Z'
export const AWARD_DESK_FREEZE_BY = 'user_leila'
export const AWARD_DESK_FREEZE_ROLE: ActorRole = 'Procurement Officer'
export const AWARD_DESK_DEMO_WAIVER: WaiverRef = {
  waiverId: 'waiver_ethiopia_demo',
  authorityRef: 'authority_leila_hassan',
}

const DEMO_SOURCE_HASH = 'ab'.repeat(32)

function provenance(sourceRef: AwardRegistrySnapshot['fields'][number]['provenance']['sourceRef']) {
  return {
    sourceFileHash: DEMO_SOURCE_HASH,
    sourceRef,
    extractedAt: '2026-09-21T23:14:00.000Z',
    confidence: 0.9,
    verificationMethod: 'deterministic_check' as const,
  }
}

/**
 * Registry snapshot for the public RFP-2026-041 Award desk.
 * Present Kenya hub, missing Ethiopia capacity, disagreeing coverage —
 * the same narrative as the overnight prep UI. No file bytes.
 */
export function awardDeskShelterSnapshot(): AwardRegistrySnapshot {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'synthetic',
    organizationId: 'org_trace_demo',
    projectId: 'project_kenya_shelter',
    awardId: awardDeskScenario.slug,
    procurementReference: awardDeskScenario.rfp,
    donor: { donorId: 'donor_echo_style', name: 'ECHO-style illustrative donor' },
    framework: {
      frameworkId: 'echo-donor-conditions',
      name: 'ECHO-style donor conditions',
      version: '2026.2',
    },
    asOf: '2026-09-22T06:00:00.000Z',
    fields: [
      {
        fieldId: 'field_kenya_hub',
        entityKind: 'evidence',
        entityId: 'evidence_kenya_hub',
        key: 'capacity.kenya',
        value: { state: 'present', value: 'Regional hub letter on file' },
        provenance: provenance({ kind: 'page', id: 'hub-kenya', label: 'Kenya hub letter' }),
      },
      {
        fieldId: 'field_ethiopia_capacity',
        entityKind: 'evidence',
        entityId: 'evidence_ethiopia_capacity',
        key: 'capacity.ethiopia',
        value: {
          state: 'missing',
          reason: 'No Ethiopia-specific capacity letter is linked to the winning claim.',
        },
        provenance: provenance({ kind: 'page', id: 'annex-b', label: 'Annex B' }),
      },
      {
        fieldId: 'field_coverage_declared',
        entityKind: 'criterion',
        entityId: 'criterion_coverage',
        key: 'coverage.declared',
        value: { state: 'present', value: 'Kenya+Sudan+Ethiopia' },
        provenance: provenance({ kind: 'page', id: 'annex-b', label: 'Annex B' }),
      },
      {
        fieldId: 'field_coverage_supported',
        entityKind: 'evidence',
        entityId: 'evidence_coverage',
        key: 'coverage.supported',
        value: { state: 'present', value: 'Kenya+Sudan' },
        provenance: provenance({ kind: 'page', id: 'coverage-map', label: 'Coverage map' }),
      },
      {
        fieldId: 'field_ethiopia_denial',
        entityKind: 'evidence',
        entityId: 'evidence_ethiopia_denial',
        key: 'capacity.ethiopia_denied',
        value: { state: 'negative', value: false },
        provenance: provenance({ kind: 'message', id: 'msg-441', label: 'Supplier mail' }),
      },
    ],
  }
}

export type FreezeAwardDeskDispositionInput = {
  decision: AwardDeskDecisionId | string
  reason: string
  governingPacks?: FrozenGoverningPack[]
  /** Override only in tests. Demo uses the fixed Cairo clock. */
  frozenAt?: string
  frozenBy?: string
  actorRole?: ActorRole
  recordId?: string
  supersedesRecordId?: string | null
  waiverRefs?: WaiverRef[]
  /** Optional alternate snapshot (donor-pack fixtures). Defaults to Award desk shelter. */
  snapshot?: AwardRegistrySnapshot
}

export type FreezeAwardDeskDispositionResult = {
  record: FrozenDecisionRecord
  judgment: JudgmentResult | null
  view: AwardDeskFrozenRecordView
}

function packTogglesFromGoverning(packs: readonly FrozenGoverningPack[]): PackToggle[] {
  return packs.map(pack => ({
    packId: pack.id,
    name: pack.name,
    version: pack.version,
    toggledScope: {
      orgDefault: true as const,
      showOnRecord: pack.showOnRecord,
      category: pack.category,
    },
  }))
}

/**
 * Run judgment for the packs in force at disposition.
 * Known donor pack ids (`global-fund` | `fcdo-prime`) use evaluateDonorPacks.
 * Otherwise the synthetic shelter rules cover the RFP-2026-041 demo snapshot.
 */
export function judgeAwardDeskPacks(
  snapshot: AwardRegistrySnapshot,
  packs: readonly PackToggle[],
  options?: { evaluatedAt?: string },
): JudgmentResult {
  const donorIds = packs.map(pack => pack.packId).filter(isDonorPackId)
  if (donorIds.length > 0) {
    return evaluateDonorPacks(snapshot, donorIds, options)
  }
  return evaluateJudgment(snapshot, SYNTHETIC_SHELTER_RULES, options)
}

function toFrozenView(
  record: FrozenDecisionRecord,
  findingCount: number,
): AwardDeskFrozenRecordView {
  return {
    recordId: record.recordId,
    snapshotHash: record.snapshotHash,
    packsHash: record.packsHash,
    hashMethod: record.hashMethod,
    frozenAt: record.frozenAt,
    frozenBy: record.frozenBy,
    readiness: record.pipelineStatus.readiness,
    findingCount,
    packIds: record.packsInForce.map(pack => pack.packId),
    dispositionDecision: record.disposition.decision,
  }
}

/**
 * Award desk disposition → Field Registry freeze.
 * Snapshots registry fields + provenance + packs in force + disposition + pipelineStatus.
 * Never accepts file bytes or vendor payloads.
 */
export function freezeAwardDeskDisposition(
  input: FreezeAwardDeskDispositionInput,
): FreezeAwardDeskDispositionResult {
  const sanitized = sanitizeDisposition({
    decision: input.decision,
    reason: input.reason,
    governingPacks: input.governingPacks,
  })
  const frozenAt = input.frozenAt ?? AWARD_DESK_FREEZE_AT
  const frozenBy = input.frozenBy ?? AWARD_DESK_FREEZE_BY
  const actorRole = input.actorRole ?? AWARD_DESK_FREEZE_ROLE
  const snapshot = input.snapshot ?? awardDeskShelterSnapshot()
  const packs = packTogglesFromGoverning(sanitized.governingPacks)
  const waiverRefs =
    input.waiverRefs ??
    (sanitized.decision === 'exception' ? [AWARD_DESK_DEMO_WAIVER] : [])

  const disposition = dispositionFromAwardDeskDecision({
    decision: sanitized.decision,
    actorId: frozenBy,
    actorRole,
    timestamp: frozenAt,
    rationale: sanitized.reason,
    waiverRefs,
  })

  const judgment = judgeAwardDeskPacks(snapshot, packs, { evaluatedAt: frozenAt })
  const recordId =
    input.recordId ??
    `record_${snapshot.awardId}_${sanitized.decision}_v1`.replace(/[^A-Za-z0-9._:-]/g, '_')

  const record = freezeAtJudgment(snapshot, {
    recordId,
    supersedesRecordId: input.supersedesRecordId ?? null,
    frozenAt,
    frozenBy,
    packs,
    disposition,
    pipelineStatus: judgment.pipelineStatus,
  })

  const verified = verifyFrozenRecord(structuredClone(record))
  return {
    record: verified,
    judgment,
    view: toFrozenView(verified, judgment.findings.length),
  }
}
