import 'server-only'

import {
  DeskJudgmentError,
  sanitizeDeskChoice,
  sanitizeDeskReason,
  type UploadDeskJudgmentView,
} from '@/lib/desk/judgment'
import { applyReviewerDecisions, DeskReviewError } from '@/lib/desk/review-apply'
import {
  notExtractedReason,
  sanitizeReviewerDecisions,
  sanitizeUploadChecklist,
  type ChecklistRow,
  type UploadChecklist,
} from '@/lib/desk/review'
import { sanitizeUploadDeskView, type UploadDeskFieldView, type UploadDeskView } from '@/lib/desk/view'
import {
  ExtractionError,
  extractionResultSchema,
  fragmentsTowardRegistryDraft,
  type ExtractionResult,
} from '@/lib/field-registry/extract'
import { alignPackFields } from '@/lib/field-registry/pack-align'
import {
  dispositionFromAwardDeskDecision,
  freezeAtJudgment,
  hashJson,
  verifyFrozenRecord,
  type FrozenDecisionRecord,
} from '@/lib/field-registry/freeze'
import {
  FCDO_PRIME_FIELD_KEYS,
  FCDO_PRIME_PACK,
  GLOBAL_FUND_FIELD_KEYS,
  GLOBAL_FUND_PACK,
  OCHA_CBPF_FIELD_KEYS,
  OCHA_CBPF_PACK,
  UNFPA_FIELD_KEYS,
  UNFPA_PACK,
  donorPackIds,
  evaluateDonorPack,
  isDonorPackId,
  packToggleForId,
  type DonorPackId,
} from '@/lib/field-registry/packs'
import { packFieldExpectsBoolean, packFieldTitle } from '@/lib/field-registry/pack-schema'
import {
  actorRoles,
  awardRegistrySnapshotSchema,
  dispositionSchema,
  statedAbsentReasonPrefix,
  waiverRefSchema,
  type ActorRole,
  type AwardRegistrySnapshot,
  type RegistryField,
} from '@/lib/field-registry/schema'

export class DeskAccessError extends Error {
  constructor(message = 'This session cannot freeze a record.') {
    super(message)
    this.name = 'DeskAccessError'
  }
}

const MISSING_REASON = notExtractedReason

const fieldKeysByPack = {
  'global-fund': GLOBAL_FUND_FIELD_KEYS,
  'fcdo-prime': FCDO_PRIME_FIELD_KEYS,
  unfpa: UNFPA_FIELD_KEYS,
  'ocha-cbpf': OCHA_CBPF_FIELD_KEYS,
} as const

const packContexts: Record<DonorPackId, {
  pack: { name: string, version: string }
  donor: { donorId: string, name: string }
  framework: { frameworkId: DonorPackId, name: string, version: string }
}> = {
  'global-fund': {
    pack: GLOBAL_FUND_PACK,
    donor: { donorId: 'donor_global_fund', name: 'The Global Fund' },
    framework: {
      frameworkId: 'global-fund',
      name: GLOBAL_FUND_PACK.name,
      version: GLOBAL_FUND_PACK.version,
    },
  },
  'fcdo-prime': {
    pack: FCDO_PRIME_PACK,
    donor: { donorId: 'donor_fcdo', name: 'FCDO (via commercial prime)' },
    framework: {
      frameworkId: 'fcdo-prime',
      name: FCDO_PRIME_PACK.name,
      version: FCDO_PRIME_PACK.version,
    },
  },
  unfpa: {
    pack: UNFPA_PACK,
    donor: { donorId: 'donor_unfpa', name: 'UNFPA' },
    framework: {
      frameworkId: 'unfpa',
      name: UNFPA_PACK.name,
      version: UNFPA_PACK.version,
    },
  },
  'ocha-cbpf': {
    pack: OCHA_CBPF_PACK,
    donor: { donorId: 'donor_ocha_cbpf', name: 'OCHA CBPF' },
    framework: {
      frameworkId: 'ocha-cbpf',
      name: OCHA_CBPF_PACK.name,
      version: OCHA_CBPF_PACK.version,
    },
  },
}

function unknownPackMessage() {
  return `Choose a donor pack: ${donorPackIds.join(', ')}.`
}

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
 *
 * A selected pack owns the snapshot. Generic kind targets (`waiver.noted`,
 * `pricing.table`, and the other draft keys) are not pack fields, so they
 * stay out of the snapshot and count as unmapped. A Talonic value is not
 * copied onto a pack key from that draft: only `alignPackFields` may fill one.
 */
export function snapshotFromUpload(
  extraction: ExtractionResult,
  packId: DonorPackId,
  scope: {
    organizationId: string
    awardId: string
    procurementReference: string
    asOf: string
    classification?: 'synthetic' | 'customer'
  },
): { snapshot: AwardRegistrySnapshot, fromPacketFieldIds: ReadonlySet<string>, unmappedFragmentCount: number } {
  const draft = fragmentsTowardRegistryDraft(extraction.fragments, {
    awardId: scope.awardId,
    organizationId: scope.organizationId,
  })
  const aligned = alignPackFields(extraction.fragments, packId)
  const alignedByKey = new Map(aligned.fields.map(field => [field.key, field]))
  const fromPacketFieldIds = new Set(aligned.fields.map(field => field.fieldId))
  const packKeys = fieldKeysByPack[packId]
  const fields: RegistryField[] = []
  for (const key of packKeys) {
    const fromDocument = alignedByKey.get(key)
    fields.push(fromDocument ?? missingField(key, extraction))
  }
  const context = packContexts[packId]
  const snapshot = awardRegistrySnapshotSchema.parse({
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: scope.classification ?? 'synthetic',
    organizationId: scope.organizationId,
    projectId: 'project.upload-desk',
    awardId: scope.awardId,
    procurementReference: scope.procurementReference,
    donor: context.donor,
    framework: context.framework,
    asOf: scope.asOf,
    fields,
  })
  return {
    snapshot,
    fromPacketFieldIds,
    unmappedFragmentCount: draft.unmappedFragmentIds.length + draft.fields.length,
  }
}

function quoteFromLabel(label: string | undefined) {
  if (!label?.startsWith('Quote: ')) return null
  const quote = label.slice('Quote: '.length).trim()
  return quote || null
}

function pageFromRef(field: RegistryField) {
  const match = /^page-(\d+)$/.exec(field.provenance.sourceRef.id)
  if (!match) return null
  const page = Number(match[1])
  return page >= 1 && page <= 10000 ? String(page) : null
}

function checklistRow(field: RegistryField, packId: DonorPackId, fromPacket: boolean): ChecklistRow {
  const quote = quoteFromLabel(field.provenance.sourceRef.label)
  const absentQuote = field.value.state === 'missing' && field.value.reason.startsWith(statedAbsentReasonPrefix)
    ? field.value.reason.slice(statedAbsentReasonPrefix.length).trim() || null
    : null
  return {
    fieldId: field.fieldId,
    key: field.key,
    title: packFieldTitle(packId, field.key),
    state: field.value.state,
    valueText: detailFor(field),
    quote: quote ?? absentQuote,
    page: pageFromRef(field),
    fromPacket,
    open: !fromPacket,
    expectsBoolean: packFieldExpectsBoolean(packId, field.key),
  }
}

export type PrepareUploadChecklistInput = {
  extraction: ExtractionResult
  packId: string
  organizationId: string
  procurementReference?: string
  classification?: 'synthetic' | 'customer'
  /** Override only in tests. The desk uses the request clock. */
  asOf?: string
}

/**
 * Extraction → checklist. Does not judge and does not freeze.
 * The snapshot is the same one freezeUploadedPacket would freeze at this clock.
 */
export function prepareUploadChecklist(input: PrepareUploadChecklistInput): UploadChecklist {
  const extraction = extractionResultSchema.parse(input.extraction)
  const packId = input.packId
  if (!isDonorPackId(packId)) {
    throw new ExtractionError('invalid_input', unknownPackMessage())
  }
  if (extraction.organizationId && extraction.organizationId !== input.organizationId) {
    throw new DeskAccessError()
  }
  const context = packContexts[packId]
  const asOf = input.asOf ?? new Date().toISOString()
  const awardId = extraction.awardId ?? `award.${extraction.sourceFileHash.slice(0, 16)}`
  const procurementReference = input.procurementReference
    ?? `UPLOAD-${extraction.sourceFileHash.slice(0, 12)}`
  const mapped = snapshotFromUpload(extraction, packId, {
    organizationId: input.organizationId,
    awardId,
    procurementReference,
    asOf,
    classification: input.classification,
  })
  const checklist: UploadChecklist = {
    schemaVersion: 'upload-desk-checklist-v1',
    providerId: extraction.providerId,
    fileName: extraction.fileName,
    mediaType: extraction.mediaType,
    sourceFileHash: extraction.sourceFileHash,
    organizationId: input.organizationId,
    awardId,
    procurementReference,
    packId,
    packName: context.pack.name,
    packVersion: context.pack.version,
    fragmentCount: extraction.fragments.length,
    unmappedFragmentCount: mapped.unmappedFragmentCount,
    snapshotHash: hashJson(mapped.snapshot),
    snapshot: mapped.snapshot,
    rows: mapped.snapshot.fields.map(field => checklistRow(
      field,
      packId,
      mapped.fromPacketFieldIds.has(field.fieldId),
    )),
  }
  const sanitized = sanitizeUploadChecklist(checklist)
  if (!sanitized || sanitized.snapshotHash !== hashJson(sanitized.snapshot)) {
    throw new ExtractionError('invalid_input', 'The checklist could not be prepared.')
  }
  return sanitized
}

function fromPacketIdsAfterReview(originalIds: ReadonlySet<string>, fields: readonly RegistryField[]) {
  const ids = new Set<string>()
  for (const field of fields) {
    if (field.provenance.verificationMethod === 'reviewer_attested') {
      const plainMissing = field.value.state === 'missing' && field.value.reason === MISSING_REASON
      if (!plainMissing) ids.add(field.fieldId)
      continue
    }
    if (originalIds.has(field.fieldId)) ids.add(field.fieldId)
  }
  return ids
}

export type FreezeReviewedPacketInput = {
  checklist: unknown
  decisions: unknown
  organizationId: string
  actorId: string
  actorRole: string
  /** Override only in tests. Review time and freeze time are this clock. */
  frozenAt?: string
}

/**
 * Reviewed checklist → judgment on the reviewed snapshot → freezeAtJudgment.
 * Decisions that leave every row as extracted reproduce freezeUploadedPacket's hashes
 * when the checklist was prepared at the same clock.
 */
export function freezeReviewedPacket(input: FreezeReviewedPacketInput): FreezeUploadedPacketResult {
  const checklist = sanitizeUploadChecklist(input.checklist)
  if (!checklist) throw new DeskReviewError('Extract the packet again.')
  if (hashJson(checklist.snapshot) !== checklist.snapshotHash) {
    throw new DeskReviewError('Extract the packet again.')
  }
  if (checklist.organizationId !== input.organizationId || checklist.snapshot.organizationId !== input.organizationId) {
    throw new DeskAccessError('This session cannot freeze that checklist.')
  }
  const decisions = sanitizeReviewerDecisions(input.decisions, checklist.rows)
  if (!decisions) throw new DeskReviewError('Check the checklist and try again.')
  const actorRole = actorRoleOf(input.actorRole)
  const frozenAt = input.frozenAt ?? new Date().toISOString()
  const titles = new Map(checklist.rows.map(row => [row.key, row.title]))
  const reviewed = applyReviewerDecisions(checklist.snapshot, decisions, titles, {
    reviewedBy: input.actorId,
    reviewedAt: frozenAt,
  })
  const originalIds = new Set(
    checklist.snapshot.fields.filter(field => field.fieldId.startsWith('field.packet.')).map(field => field.fieldId),
  )
  return freezeMappedSnapshot({
    snapshot: reviewed,
    fromPacketFieldIds: fromPacketIdsAfterReview(originalIds, reviewed.fields),
    packId: checklist.packId,
    organizationId: input.organizationId,
    actorId: input.actorId,
    actorRole,
    awardId: checklist.awardId,
    procurementReference: checklist.procurementReference,
    providerId: checklist.providerId,
    fileName: checklist.fileName,
    mediaType: checklist.mediaType,
    sourceFileHash: checklist.sourceFileHash,
    fragmentCount: checklist.fragmentCount,
    unmappedFragmentCount: checklist.unmappedFragmentCount,
    frozenAt,
  })
}

function detailFor(field: RegistryField) {
  if (field.value.state === 'missing') return field.value.reason
  const value = field.value.value
  const shown = typeof value === 'string' ? value.slice(0, 160) : String(value)
  if (field.value.state !== 'negative') return shown
  const label = field.provenance.sourceRef.label ?? ''
  const quote = label.startsWith('Quote: ') ? label.slice('Quote: '.length).trim() : ''
  return quote ? `Negative: ${shown}. ${quote}`.slice(0, 500) : `Negative: ${shown}`
}

function rationaleFor(packName: string, readiness: string, findingCount: number) {
  if (readiness === 'green') {
    return `Upload desk recorded a passing ${packName} judgment with ${findingCount} findings. Review this freeze before sign-off.`
  }
  return `Upload desk recorded ${packName} with readiness ${readiness} and ${findingCount} findings. Evidence is still required before sign-off.`
}

function freezeMappedSnapshot(input: {
  snapshot: AwardRegistrySnapshot
  fromPacketFieldIds: ReadonlySet<string>
  packId: DonorPackId
  organizationId: string
  actorId: string
  actorRole: ActorRole
  awardId: string
  procurementReference: string
  providerId: string
  fileName: string
  mediaType: string
  sourceFileHash: string
  fragmentCount: number
  unmappedFragmentCount: number
  frozenAt: string
}): FreezeUploadedPacketResult {
  const context = packContexts[input.packId]
  const judgment = evaluateDonorPack(input.snapshot, input.packId, { evaluatedAt: input.frozenAt })
  const decision = judgment.pipelineStatus.readiness === 'green' ? 'accept_assessment' : 'request_evidence'
  const disposition = dispositionSchema.parse({
    decision,
    waiverRefs: [],
    actorId: input.actorId,
    actorRole: input.actorRole,
    timestamp: input.frozenAt,
    rationale: rationaleFor(context.pack.name, judgment.pipelineStatus.readiness, judgment.findings.length),
  })
  const stamp = input.frozenAt.replace(/[^A-Za-z0-9]/g, '')
  const record = verifyFrozenRecord(freezeAtJudgment(input.snapshot, {
    recordId: `record.desk.${input.packId}.${input.sourceFileHash.slice(0, 12)}.${stamp}`,
    supersedesRecordId: null,
    frozenAt: input.frozenAt,
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
    fromPacket: input.fromPacketFieldIds.has(field.fieldId),
  }))
  const view: UploadDeskView = {
    schemaVersion: 'upload-desk-result-v1',
    providerId: input.providerId,
    fileName: input.fileName,
    mediaType: input.mediaType,
    sourceFileHash: input.sourceFileHash,
    organizationId: input.organizationId,
    awardId: input.awardId,
    procurementReference: input.procurementReference,
    packId: input.packId,
    packName: context.pack.name,
    packVersion: context.pack.version,
    fragmentCount: input.fragmentCount,
    unmappedFragmentCount: input.unmappedFragmentCount,
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
    snapshot: awardRegistrySnapshotSchema.parse(structuredClone(record.snapshot)),
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

/**
 * Extracted fragments → registry snapshot → donor-pack judgment → freezeAtJudgment.
 * The returned record is verified. It does not contain file bytes or a vendor payload.
 * Callers that skip the checklist use this path. A checklist frozen with no edits
 * reproduces these hashes when both use the same clock.
 */
export function freezeUploadedPacket(input: FreezeUploadedPacketInput): FreezeUploadedPacketResult {
  const extraction = extractionResultSchema.parse(input.extraction)
  if (!isDonorPackId(input.packId)) {
    throw new ExtractionError('invalid_input', unknownPackMessage())
  }
  if (extraction.organizationId && extraction.organizationId !== input.organizationId) {
    throw new DeskAccessError()
  }
  const actorRole = actorRoleOf(input.actorRole)
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
  return freezeMappedSnapshot({
    snapshot: mapped.snapshot,
    fromPacketFieldIds: mapped.fromPacketFieldIds,
    packId: input.packId,
    organizationId: input.organizationId,
    actorId: input.actorId,
    actorRole,
    awardId,
    procurementReference,
    providerId: extraction.providerId,
    fileName: extraction.fileName,
    mediaType: extraction.mediaType,
    sourceFileHash: extraction.sourceFileHash,
    fragmentCount: extraction.fragments.length,
    unmappedFragmentCount: mapped.unmappedFragmentCount,
    frozenAt,
  })
}

export type SupersedeUploadedPacketInput = {
  view: unknown
  decision: unknown
  reason: unknown
  organizationId: string
  actorId: string
  actorRole: string
  /** Override only in tests. The desk uses the request clock. */
  frozenAt?: string
}

export type SupersedeUploadedPacketResult = {
  record: FrozenDecisionRecord
  judgment: UploadDeskJudgmentView
}

const REFUSE_SUPERSEDE = 'This freeze cannot be superseded. Extract the packet again.'

function deskWaiver(actorId: string, sourceFileHash: string, frozenAt: string) {
  const stamp = frozenAt.replace(/[^A-Za-z0-9]/g, '').slice(-12)
  return waiverRefSchema.parse({
    waiverId: `waiver.desk.${sourceFileHash.slice(0, 12)}.${stamp}`,
    authorityRef: actorId,
  })
}

/**
 * Human disposition → a new verified freeze that supersedes the auto record.
 * The snapshot is rehydrated from the client souvenir and rejected unless its
 * hash matches the assessment freeze. The auto record is not mutated.
 * No file bytes are stored, and the new record is not written to a database.
 */
export function supersedeUploadedPacket(input: SupersedeUploadedPacketInput): SupersedeUploadedPacketResult {
  const view = sanitizeUploadDeskView(input.view)
  if (!view) throw new DeskJudgmentError(REFUSE_SUPERSEDE)
  const choice = sanitizeDeskChoice(input.decision)
  if (!choice) throw new DeskJudgmentError('Choose a disposition.')
  const reason = sanitizeDeskReason(input.reason)
  if (!reason) throw new DeskJudgmentError('Enter a reason between 20 and 2,000 characters.')
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(input.actorId)) {
    throw new DeskAccessError('This session cannot record a judgment on that record.')
  }
  if (view.organizationId !== input.organizationId || view.snapshot.organizationId !== input.organizationId) {
    throw new DeskAccessError('This session cannot record a judgment on that record.')
  }
  if (view.record.frozenBy !== input.actorId) {
    throw new DeskAccessError('This session cannot record a judgment on that record.')
  }
  const actorRole = actorRoleOf(input.actorRole)
  if (hashJson(view.snapshot) !== view.record.snapshotHash) {
    throw new DeskJudgmentError(REFUSE_SUPERSEDE)
  }
  const frozenAt = input.frozenAt ?? new Date().toISOString()
  const judgment = evaluateDonorPack(view.snapshot, view.packId, { evaluatedAt: frozenAt })
  const expectedAuto = judgment.pipelineStatus.readiness === 'green' ? 'accept_assessment' : 'request_evidence'
  if (judgment.pipelineStatus.readiness !== view.readiness || judgment.findings.length !== view.findingCount) {
    throw new DeskJudgmentError(REFUSE_SUPERSEDE)
  }
  if (view.record.disposition !== expectedAuto) throw new DeskJudgmentError(REFUSE_SUPERSEDE)
  const waiverRefs = choice.decision === 'accept_with_exception'
    ? [deskWaiver(input.actorId, view.sourceFileHash, frozenAt)]
    : []
  const disposition = dispositionFromAwardDeskDecision({
    decision: choice.choice,
    actorId: input.actorId,
    actorRole,
    timestamp: frozenAt,
    rationale: reason,
    waiverRefs,
  })
  const stamp = frozenAt.replace(/[^A-Za-z0-9]/g, '')
  const recordId = `record.desk.${view.packId}.${view.sourceFileHash.slice(0, 12)}.${stamp}.judgment`
  if (recordId === view.record.recordId) throw new DeskJudgmentError(REFUSE_SUPERSEDE)
  const record = verifyFrozenRecord(freezeAtJudgment(view.snapshot, {
    recordId,
    supersedesRecordId: view.record.recordId,
    frozenAt,
    frozenBy: input.actorId,
    packs: [packToggleForId(view.packId)],
    disposition,
    pipelineStatus: judgment.pipelineStatus,
  }))
  const judgmentView: UploadDeskJudgmentView = {
    schemaVersion: 'upload-desk-judgment-v1',
    choice: choice.choice,
    decision: choice.decision,
    reason,
    waiver: waiverRefs[0]
      ? { waiverId: waiverRefs[0].waiverId, authorityRef: waiverRefs[0].authorityRef }
      : null,
    readiness: record.pipelineStatus.readiness,
    findingCount: judgment.findings.length,
    packId: view.packId,
    packName: record.packsInForce[0]?.name ?? view.packName,
    packVersion: record.packsInForce[0]?.version ?? view.packVersion,
    record: {
      recordId: record.recordId,
      supersedesRecordId: view.record.recordId,
      snapshotHash: record.snapshotHash,
      packsHash: record.packsHash,
      hashMethod: 'sha256:sorted-json-v1',
      frozenAt: record.frozenAt,
      frozenBy: record.frozenBy,
    },
  }
  return { record, judgment: judgmentView }
}
