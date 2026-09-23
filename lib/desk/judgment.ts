/**
 * Client-safe human judgment for the signed-in upload desk.
 * Drafts a reason from the frozen assessment. Does not import fictional
 * Award desk scenario data, and does not accept file bytes.
 */

import type { UploadDeskPackId, UploadDeskReadiness, UploadDeskSeverity, UploadDeskView } from '@/lib/desk/view'

export class DeskJudgmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DeskJudgmentError'
  }
}

export const deskJudgmentChoices = [
  {
    id: 'request',
    decision: 'request_evidence',
    label: 'Request evidence',
    hint: 'Hold sign-off until the missing pack fields are supplied.',
    status: 'Evidence requested',
  },
  {
    id: 'exception',
    decision: 'accept_with_exception',
    label: 'Accept with exception',
    hint: 'Continue with a desk-session exception note. This is not a formal organization waiver.',
    status: 'Accepted with a desk-session exception',
  },
  {
    id: 'escalate',
    decision: 'escalate',
    label: 'Escalate',
    hint: 'Send this packet for review before sign-off.',
    status: 'Escalated for review',
  },
] as const

export type UploadDeskChoiceId = (typeof deskJudgmentChoices)[number]['id']
export type UploadDeskHumanDecision = (typeof deskJudgmentChoices)[number]['decision']

const choiceById = new Map(deskJudgmentChoices.map(choice => [choice.id, choice]))
const choiceByDecision = new Map(deskJudgmentChoices.map(choice => [choice.decision, choice]))

const severityRank: Record<UploadDeskSeverity, number> = {
  blocker: 0,
  warning: 1,
  info: 2,
}

export type DeskReasonInput = {
  packName: string
  readiness: UploadDeskReadiness
  findingCount: number
  findings: readonly { severity: UploadDeskSeverity, title: string }[]
  missingKeys: readonly string[]
}

export type UploadDeskWaiverView = {
  waiverId: string
  authorityRef: string
}

export type UploadDeskJudgmentView = {
  schemaVersion: 'upload-desk-judgment-v1'
  choice: UploadDeskChoiceId
  decision: UploadDeskHumanDecision
  reason: string
  waiver: UploadDeskWaiverView | null
  readiness: UploadDeskReadiness
  findingCount: number
  packId: UploadDeskPackId
  packName: string
  packVersion: string
  record: {
    recordId: string
    supersedesRecordId: string
    snapshotHash: string
    packsHash: string
    hashMethod: 'sha256:sorted-json-v1'
    frozenAt: string
    frozenBy: string
  }
}

const hashPattern = /^[a-f0-9]{64}$/
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/
const readinessLevels = new Set<UploadDeskReadiness>(['unknown', 'red', 'amber', 'green'])
const packIds = new Set<UploadDeskPackId>(['global-fund', 'fcdo-prime'])

function text(value: unknown, max: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max ? value : null
}

function clampReason(textValue: string) {
  const compact = textValue.replace(/\s+/g, ' ').trim()
  if (compact.length < 20) {
    const padded = `${compact} Edit this draft, then confirm your judgment.`.trim()
    return padded.slice(0, 2000)
  }
  if (compact.length <= 2000) return compact
  const sliced = compact.slice(0, 1999).trimEnd()
  return `${sliced}…`.slice(0, 2000)
}

/** Reason drafted from this packet's readiness, findings, and missing pack fields. */
export function draftDeskReason(input: DeskReasonInput) {
  const pack = input.packName.trim() || 'This pack'
  const count = Number.isInteger(input.findingCount) && input.findingCount >= 0
    ? input.findingCount
    : input.findings.length
  const findingSentence = count === 0
    ? 'No findings were raised.'
    : `${count} finding${count === 1 ? '' : 's'}.`
  const top = [...input.findings]
    .filter(finding => finding.title.trim())
    .sort((left, right) => severityRank[left.severity] - severityRank[right.severity] || left.title.localeCompare(right.title))
    .slice(0, 3)
    .map(finding => finding.title.trim().slice(0, 160))
  const topSentence = top.length > 0 ? ` Top findings: ${top.join('; ')}.` : ''
  const missing = input.missingKeys.map(key => key.trim()).filter(Boolean)
  const shown = missing.slice(0, 8)
  const extra = missing.length - shown.length
  const missingSentence = shown.length === 0
    ? ' No pack fields are missing.'
    : ` Pack fields still missing: ${shown.join(', ')}${extra > 0 ? `, and ${extra} more` : ''}.`
  const close = input.readiness === 'green'
    ? ' Pack checks passed. You can still request evidence, record a desk-session exception, or escalate before sign-off.'
    : ' Evidence is still open. Edit this draft, then confirm your judgment.'
  return clampReason(`${pack} readiness is ${input.readiness}. ${findingSentence}${topSentence}${missingSentence}${close}`)
}

export function draftDeskReasonFromView(view: Pick<UploadDeskView, 'packName' | 'readiness' | 'findingCount' | 'findings' | 'fields'>) {
  return draftDeskReason({
    packName: view.packName,
    readiness: view.readiness,
    findingCount: view.findingCount,
    findings: view.findings,
    missingKeys: view.fields.filter(field => !field.fromPacket).map(field => field.key),
  })
}

export function sanitizeDeskChoice(value: unknown): { choice: UploadDeskChoiceId, decision: UploadDeskHumanDecision } | null {
  if (typeof value !== 'string') return null
  const byId = choiceById.get(value as UploadDeskChoiceId)
  if (byId) return { choice: byId.id, decision: byId.decision }
  const byDecision = choiceByDecision.get(value as UploadDeskHumanDecision)
  if (byDecision) return { choice: byDecision.id, decision: byDecision.decision }
  return null
}

export function sanitizeDeskReason(value: unknown) {
  if (typeof value !== 'string') return null
  const reason = value.trim()
  if (reason.length < 20 || reason.length > 2000) return null
  return reason
}

export function deskJudgmentChoice(id: UploadDeskChoiceId) {
  const choice = choiceById.get(id)
  if (!choice) throw new DeskJudgmentError('Choose a disposition.')
  return choice
}

export function shortHash(hash: string) {
  if (hash.length < 16) return hash
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`
}

function sanitizeWaiver(value: unknown): UploadDeskWaiverView | null {
  if (!value || typeof value !== 'object') return null
  const waiver = value as Record<string, unknown>
  const waiverId = text(waiver.waiverId, 160)
  const authorityRef = text(waiver.authorityRef, 160)
  if (!waiverId || !idPattern.test(waiverId) || !authorityRef || !idPattern.test(authorityRef)) return null
  return { waiverId, authorityRef }
}

/** Drop a stored human judgment that does not match the desk contract. */
export function sanitizeUploadDeskJudgment(value: unknown): UploadDeskJudgmentView | null {
  if (!value || typeof value !== 'object') return null
  const body = value as Record<string, unknown>
  if (body.schemaVersion !== 'upload-desk-judgment-v1') return null
  const mapped = sanitizeDeskChoice(body.choice)
  if (!mapped || body.decision !== mapped.decision) return null
  const reason = sanitizeDeskReason(body.reason)
  if (!reason) return null
  if (!packIds.has(body.packId as UploadDeskPackId)) return null
  if (!readinessLevels.has(body.readiness as UploadDeskReadiness)) return null
  const packName = text(body.packName, 240)
  const packVersion = text(body.packVersion, 80)
  if (!packName || !packVersion) return null
  if (!Number.isInteger(body.findingCount) || (body.findingCount as number) < 0 || (body.findingCount as number) > 64) return null
  const needsWaiver = mapped.decision === 'accept_with_exception'
  const waiver = body.waiver == null ? null : sanitizeWaiver(body.waiver)
  if (needsWaiver && !waiver) return null
  if (!needsWaiver && body.waiver != null) return null
  const record = body.record
  if (!record || typeof record !== 'object') return null
  const frozen = record as Record<string, unknown>
  const recordId = text(frozen.recordId, 160)
  const supersedesRecordId = text(frozen.supersedesRecordId, 160)
  const snapshotHash = text(frozen.snapshotHash, 64)
  const packsHash = text(frozen.packsHash, 64)
  const frozenAt = text(frozen.frozenAt, 40)
  const frozenBy = text(frozen.frozenBy, 160)
  if (!recordId || !idPattern.test(recordId) || !supersedesRecordId || !idPattern.test(supersedesRecordId)) return null
  if (recordId === supersedesRecordId) return null
  if (!snapshotHash || !hashPattern.test(snapshotHash) || !packsHash || !hashPattern.test(packsHash)) return null
  if (frozen.hashMethod !== 'sha256:sorted-json-v1') return null
  if (!frozenAt || !frozenBy || !idPattern.test(frozenBy)) return null
  return {
    schemaVersion: 'upload-desk-judgment-v1',
    choice: mapped.choice,
    decision: mapped.decision,
    reason,
    waiver,
    readiness: body.readiness as UploadDeskReadiness,
    findingCount: body.findingCount as number,
    packId: body.packId as UploadDeskPackId,
    packName,
    packVersion,
    record: {
      recordId,
      supersedesRecordId,
      snapshotHash,
      packsHash,
      hashMethod: 'sha256:sorted-json-v1',
      frozenAt,
      frozenBy,
    },
  }
}
