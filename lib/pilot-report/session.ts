/**
 * Desk session JSON → the assessment view and human judgment a pilot
 * report is built from. Also rebuilds that pair from an already verified
 * judgment freeze so offline samples can be rendered. Does not rewrite
 * the freeze.
 */

import { sanitizeDeskChoice, sanitizeUploadDeskJudgment, type UploadDeskJudgmentView } from '@/lib/desk/judgment'
import { sanitizeUploadDeskView, type UploadDeskView } from '@/lib/desk/view'
import type { FrozenDecisionRecord } from '@/lib/field-registry/freeze'
import { evaluateDonorPack, isDonorPackId } from '@/lib/field-registry/packs'
import type { RegistryField } from '@/lib/field-registry/schema'

import { PilotReportError, type PilotReportInput } from '@/lib/pilot-report/build'

const HUMAN_DECISIONS = new Set(['request_evidence', 'accept_with_exception', 'escalate'])

function detailFor(field: RegistryField) {
  if (field.value.state === 'missing') return field.value.reason
  const value = field.value.value
  const shown = typeof value === 'string' ? value.slice(0, 160) : String(value)
  if (field.value.state !== 'negative') return shown
  const label = field.provenance.sourceRef.label ?? ''
  const quote = label.startsWith('Quote: ') ? label.slice('Quote: '.length).trim() : ''
  return quote ? `Negative: ${shown}. ${quote}`.slice(0, 500) : `Negative: ${shown}`
}

function fileNameFromSnapshot(record: FrozenDecisionRecord, explicit?: string) {
  if (explicit?.trim()) return explicit.trim().slice(0, 240)
  for (const field of record.snapshot.fields) {
    const label = field.provenance.sourceRef.label ?? ''
    if (label && !label.startsWith('Quote: ')) return label.slice(0, 240)
  }
  return 'packet'
}

function readReviewer(value: unknown) {
  if (!value || typeof value !== 'object') return { reviewerName: '', reviewerRole: null as string | null }
  const body = value as Record<string, unknown>
  const reviewerName = typeof body.reviewerName === 'string' ? body.reviewerName : ''
  const reviewerRole = typeof body.reviewerRole === 'string' ? body.reviewerRole : null
  return { reviewerName, reviewerRole }
}

/** Accept a desk session (`traceli.uploadDesk.frozen.v2`) or `{ view, judgment }`. */
export function sessionFromJson(value: unknown, reviewer?: { reviewerName?: string, reviewerRole?: string | null }): PilotReportInput {
  if (!value || typeof value !== 'object') throw new PilotReportError('The session file could not be read.')
  const body = value as Record<string, unknown>
  const view = sanitizeUploadDeskView(body.view)
  const judgment = sanitizeUploadDeskJudgment(body.judgment)
  if (!view || !judgment) throw new PilotReportError('The session file needs a frozen assessment and a human judgment.')
  if (judgment.record.supersedesRecordId !== view.record.recordId || judgment.record.snapshotHash !== view.record.snapshotHash) {
    throw new PilotReportError('The judgment does not belong to this assessment.')
  }
  const fromFile = readReviewer(body)
  return {
    view,
    judgment,
    reviewerName: reviewer?.reviewerName?.trim() || fromFile.reviewerName || 'Reviewer',
    reviewerRole: reviewer?.reviewerRole ?? fromFile.reviewerRole,
  }
}

/**
 * Rebuild the desk souvenir from a verified judgment freeze.
 * The assessment record id is the freeze's `supersedesRecordId`.
 * Pack fields and findings are read back from the snapshot. Hashes are not changed.
 */
export function sessionFromFrozenRecord(
  record: FrozenDecisionRecord,
  options?: { reviewerName?: string, reviewerRole?: string | null, fileName?: string },
): PilotReportInput {
  if (!record.supersedesRecordId) throw new PilotReportError('This freeze has no separate assessment to report.')
  if (!HUMAN_DECISIONS.has(record.disposition.decision)) {
    throw new PilotReportError('This freeze has no human decision to report.')
  }
  const packId = record.snapshot.framework.frameworkId
  if (!isDonorPackId(packId)) throw new PilotReportError('This freeze does not name a checklist Trace-li can report.')
  const pack = record.packsInForce.find(item => item.packId === packId) ?? record.packsInForce[0]
  if (!pack) throw new PilotReportError('This freeze has no checklist in force.')
  const evaluated = evaluateDonorPack(record.snapshot, packId, { evaluatedAt: record.frozenAt })
  if (evaluated.pipelineStatus.readiness !== record.pipelineStatus.readiness) {
    throw new PilotReportError('The readiness on this freeze does not match the checklist.')
  }
  const sourceFileHash = record.snapshot.fields[0]?.provenance.sourceFileHash
  if (!sourceFileHash || record.snapshot.fields.some(field => field.provenance.sourceFileHash !== sourceFileHash)) {
    throw new PilotReportError('This freeze does not share one source file hash.')
  }
  const choice = sanitizeDeskChoice(record.disposition.decision)
  if (!choice) throw new PilotReportError('This freeze has no human decision to report.')
  const autoDisposition = evaluated.pipelineStatus.readiness === 'green' ? 'accept_assessment' : 'request_evidence'
  const viewBody: UploadDeskView = {
    schemaVersion: 'upload-desk-result-v1',
    providerId: 'desk',
    fileName: fileNameFromSnapshot(record, options?.fileName),
    mediaType: 'application/pdf',
    sourceFileHash,
    organizationId: record.snapshot.organizationId,
    awardId: record.snapshot.awardId,
    procurementReference: record.snapshot.procurementReference,
    packId,
    packName: record.snapshot.framework.name,
    packVersion: record.snapshot.framework.version,
    fragmentCount: 0,
    unmappedFragmentCount: 0,
    readiness: evaluated.pipelineStatus.readiness,
    findingCount: evaluated.findings.length,
    findings: evaluated.findings.map(finding => ({
      findingId: finding.findingId,
      severity: finding.severity,
      code: finding.code,
      title: finding.title,
      summary: finding.summary,
    })),
    fields: record.snapshot.fields.map(field => ({
      fieldId: field.fieldId,
      key: field.key,
      state: field.value.state,
      detail: detailFor(field),
      fromPacket: !field.fieldId.startsWith('field.missing.'),
    })),
    snapshot: structuredClone(record.snapshot) as UploadDeskView['snapshot'],
    record: {
      recordId: record.supersedesRecordId,
      snapshotHash: record.snapshotHash,
      packsHash: record.packsHash,
      hashMethod: 'sha256:sorted-json-v1',
      frozenAt: record.snapshot.asOf,
      frozenBy: record.frozenBy,
      disposition: autoDisposition,
    },
  }
  const waiver = record.disposition.waiverRefs[0]
  const judgmentBody: UploadDeskJudgmentView = {
    schemaVersion: 'upload-desk-judgment-v1',
    choice: choice.choice,
    decision: choice.decision,
    reason: record.disposition.rationale,
    waiver: waiver ? { waiverId: waiver.waiverId, authorityRef: waiver.authorityRef } : null,
    readiness: evaluated.pipelineStatus.readiness,
    findingCount: evaluated.findings.length,
    packId,
    packName: pack.name,
    packVersion: pack.version,
    record: {
      recordId: record.recordId,
      supersedesRecordId: record.supersedesRecordId,
      snapshotHash: record.snapshotHash,
      packsHash: record.packsHash,
      hashMethod: 'sha256:sorted-json-v1',
      frozenAt: record.frozenAt,
      frozenBy: record.frozenBy,
    },
  }
  const view = sanitizeUploadDeskView(viewBody)
  const judgment = sanitizeUploadDeskJudgment(judgmentBody)
  if (!view || !judgment) throw new PilotReportError('This freeze could not be read as a desk session.')
  return {
    view,
    judgment,
    reviewerName: options?.reviewerName?.trim() || record.disposition.actorRole,
    reviewerRole: options?.reviewerRole ?? record.disposition.actorRole,
  }
}
