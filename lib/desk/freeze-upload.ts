import 'server-only'

import type { UploadDeskFieldView, UploadDeskView } from '@/lib/desk/view'
import {
  ExtractionError,
  extractionResultSchema,
  fragmentsTowardRegistryDraft,
  type ExtractionResult,
  type RegistryEntityDraft,
} from '@/lib/field-registry/extract'
import {
  freezeAtJudgment,
  verifyFrozenRecord,
  type FrozenDecisionRecord,
} from '@/lib/field-registry/freeze'
import {
  FCDO_PRIME_FIELD_KEYS,
  FCDO_PRIME_PACK,
  GLOBAL_FUND_FIELD_KEYS,
  GLOBAL_FUND_PACK,
  evaluateDonorPack,
  isDonorPackId,
  packToggleForId,
} from '@/lib/field-registry/packs'
import {
  actorRoles,
  awardRegistrySnapshotSchema,
  dispositionSchema,
  type ActorRole,
  type AwardRegistrySnapshot,
  type RegistryField,
} from '@/lib/field-registry/schema'

export class DeskAccessError extends Error {
  constructor() {
    super('This session cannot freeze a record.')
    this.name = 'DeskAccessError'
  }
}

const MISSING_REASON = 'Not extracted from this packet.'

const fieldKeysByPack = {
  'global-fund': GLOBAL_FUND_FIELD_KEYS,
  'fcdo-prime': FCDO_PRIME_FIELD_KEYS,
} as const

export type FreezeUploadedPacketInput = {
  extraction: ExtractionResult
  packId: string
  organizationId: string
  actorId: string
  actorRole: string
  procurementReference?: string
  /** Override only in tests. The desk uses the request clock. */
  frozenAt?: string
}

export type FreezeUploadedPacketResult = {
  record: FrozenDecisionRecord
  view: UploadDeskView
}

function actorRoleOf(role: string): ActorRole {
  if (!actorRoles.includes(role as ActorRole)) throw new DeskAccessError()
  return role as ActorRole
}

function packContext(packId: 'global-fund' | 'fcdo-prime') {
  if (packId === 'global-fund') {
    return {
      pack: GLOBAL_FUND_PACK,
      donor: { donorId: 'donor_global_fund', name: 'The Global Fund' },
      framework: {
        frameworkId: 'global-fund',
        name: GLOBAL_FUND_PACK.name,
        version: GLOBAL_FUND_PACK.version,
      },
    }
  }
  return {
    pack: FCDO_PRIME_PACK,
    donor: { donorId: 'donor_fcdo', name: 'FCDO (via commercial prime)' },
    framework: {
      frameworkId: 'fcdo-prime',
      name: FCDO_PRIME_PACK.name,
      version: FCDO_PRIME_PACK.version,
    },
  }
}

function registryFieldFromDraft(field: RegistryEntityDraft['fields'][number]): RegistryField {
  return {
    fieldId: field.fieldId,
    entityKind: field.entityKind,
    entityId: field.entityId,
    key: field.key,
    value: field.value,
    provenance: field.provenance,
  }
}

function missingField(key: string, extraction: ExtractionResult): RegistryField {
  const fragment = extraction.fragments[0]
  return {
    fieldId: `field.missing.${key}`,
    entityKind: 'evidence',
    entityId: `evidence.missing.${key}`,
    key,
    value: { state: 'missing', reason: MISSING_REASON },
    provenance: {
      sourceFileHash: extraction.sourceFileHash,
      sourceRef: { kind: 'page', id: 'packet', label: extraction.fileName },
      extractedAt: fragment.extractedAt,
      confidence: 0,
      verificationMethod: 'adapter_extract',
    },
  }
}

/**
 * Map fragments onto registry fields, then record every pack key the packet
 * did not yield as missing evidence. A draft alone is not a snapshot.
 */
export function snapshotFromUpload(
  extraction: ExtractionResult,
  packId: 'global-fund' | 'fcdo-prime',
  scope: {
    organizationId: string
    awardId: string
    procurementReference: string
    asOf: string
  },
): { snapshot: AwardRegistrySnapshot, fromPacketFieldIds: ReadonlySet<string>, unmappedFragmentCount: number } {
  const draft = fragmentsTowardRegistryDraft(extraction.fragments, {
    awardId: scope.awardId,
    organizationId: scope.organizationId,
  })
  const draftFields = draft.fields.map(registryFieldFromDraft)
  const fromPacketFieldIds = new Set(draftFields.map(field => field.fieldId))
  const packKeys = fieldKeysByPack[packId]
  const packKeySet = new Set<string>(packKeys)
  const fields: RegistryField[] = []
  for (const key of packKeys) {
    const matched = draftFields.filter(field => field.key === key)
    if (matched.length > 0) fields.push(...matched)
    else fields.push(missingField(key, extraction))
  }
  fields.push(...draftFields.filter(field => !packKeySet.has(field.key)))
  const context = packContext(packId)
  const snapshot = awardRegistrySnapshotSchema.parse({
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'synthetic',
    organizationId: scope.organizationId,
    projectId: 'project.upload-desk',
    awardId: scope.awardId,
    procurementReference: scope.procurementReference,
    donor: context.donor,
    framework: context.framework,
    asOf: scope.asOf,
    fields,
  })
  return { snapshot, fromPacketFieldIds, unmappedFragmentCount: draft.unmappedFragmentIds.length }
}

function detailFor(field: RegistryField) {
  if (field.value.state === 'missing') return field.value.reason
  const value = field.value.value
  const shown = typeof value === 'string' ? value.slice(0, 160) : String(value)
  return field.value.state === 'negative' ? `Negative: ${shown}` : shown
}

function rationaleFor(packName: string, readiness: string, findingCount: number) {
  if (readiness === 'green') {
    return `Upload desk recorded a passing ${packName} judgment with ${findingCount} findings. Review this freeze before sign-off.`
  }
  return `Upload desk recorded ${packName} with readiness ${readiness} and ${findingCount} findings. Evidence is still required before sign-off.`
}

/**
 * Extracted fragments → registry snapshot → donor-pack judgment → freezeAtJudgment.
 * The returned record is verified. It does not contain file bytes or a vendor payload.
 */
export function freezeUploadedPacket(input: FreezeUploadedPacketInput): FreezeUploadedPacketResult {
  const extraction = extractionResultSchema.parse(input.extraction)
  if (!isDonorPackId(input.packId)) {
    throw new ExtractionError('invalid_input', 'Choose a donor pack: global-fund or fcdo-prime.')
  }
  if (extraction.organizationId && extraction.organizationId !== input.organizationId) {
    throw new DeskAccessError()
  }
  const actorRole = actorRoleOf(input.actorRole)
  const context = packContext(input.packId)
  const frozenAt = input.frozenAt ?? new Date().toISOString()
  const awardId = extraction.awardId ?? `award.${extraction.sourceFileHash.slice(0, 16)}`
  const procurementReference = input.procurementReference
    ?? `UPLOAD-${extraction.sourceFileHash.slice(0, 12)}`
  const mapped = snapshotFromUpload(extraction, input.packId, {
    organizationId: input.organizationId,
    awardId,
    procurementReference,
    asOf: frozenAt,
  })
  const judgment = evaluateDonorPack(mapped.snapshot, input.packId, { evaluatedAt: frozenAt })
  const decision = judgment.pipelineStatus.readiness === 'green' ? 'accept_assessment' : 'request_evidence'
  const disposition = dispositionSchema.parse({
    decision,
    waiverRefs: [],
    actorId: input.actorId,
    actorRole,
    timestamp: frozenAt,
    rationale: rationaleFor(context.pack.name, judgment.pipelineStatus.readiness, judgment.findings.length),
  })
  const stamp = frozenAt.replace(/[^A-Za-z0-9]/g, '')
  const record = verifyFrozenRecord(freezeAtJudgment(mapped.snapshot, {
    recordId: `record.desk.${input.packId}.${extraction.sourceFileHash.slice(0, 12)}.${stamp}`,
    supersedesRecordId: null,
    frozenAt,
    frozenBy: input.actorId,
    packs: [packToggleForId(input.packId)],
    disposition,
    pipelineStatus: judgment.pipelineStatus,
  }))
  const fields: UploadDeskFieldView[] = record.snapshot.fields.map(field => ({
    fieldId: field.fieldId,
    key: field.key,
    state: field.value.state,
    detail: detailFor(field),
    fromPacket: mapped.fromPacketFieldIds.has(field.fieldId),
  }))
  const view: UploadDeskView = {
    schemaVersion: 'upload-desk-result-v1',
    providerId: extraction.providerId,
    fileName: extraction.fileName,
    mediaType: extraction.mediaType,
    sourceFileHash: extraction.sourceFileHash,
    organizationId: input.organizationId,
    awardId,
    procurementReference,
    packId: input.packId,
    packName: context.pack.name,
    packVersion: context.pack.version,
    fragmentCount: extraction.fragments.length,
    unmappedFragmentCount: mapped.unmappedFragmentCount,
    readiness: record.pipelineStatus.readiness,
    findingCount: judgment.findings.length,
    findings: judgment.findings.map(finding => ({
      findingId: finding.findingId,
      severity: finding.severity,
      code: finding.code,
      title: finding.title,
      summary: finding.summary,
    })),
    fields,
    record: {
      recordId: record.recordId,
      snapshotHash: record.snapshotHash,
      packsHash: record.packsHash,
      hashMethod: 'sha256:sorted-json-v1',
      frozenAt: record.frozenAt,
      frozenBy: record.frozenBy,
      disposition: decision,
    },
  }
  return { record, view }
}
