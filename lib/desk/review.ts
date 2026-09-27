/**
 * Client-safe checklist contract for the signed-in award desk.
 * Extraction builds the rows. A reviewer edit is applied on the server.
 * Confirming every row, or leaving an already-missing row missing, does not
 * change the snapshot.
 */

import { awardRegistrySnapshotSchema, statedAbsentReasonPrefix, type AwardRegistrySnapshot } from '@/lib/field-registry/schema'
import { uploadDeskPackIds, type UploadDeskFieldState, type UploadDeskPackId } from '@/lib/desk/view'

export const notExtractedReason = 'Not extracted from this packet.'
export const reviewerActions = ['confirm', 'present', 'negative', 'stated_absent', 'missing'] as const

export type ReviewerAction = (typeof reviewerActions)[number]

export type ReviewerDecision = {
  key: string
  action: ReviewerAction
  value: string
  page: string
  quote: string
  note: string
}

export type ChecklistRow = {
  fieldId: string
  key: string
  title: string
  state: UploadDeskFieldState
  valueText: string
  quote: string | null
  page: string | null
  fromPacket: boolean
  open: boolean
  expectsBoolean: boolean
}

export type UploadChecklist = {
  schemaVersion: 'upload-desk-checklist-v1'
  providerId: string
  fileName: string
  mediaType: string
  sourceFileHash: string
  organizationId: string
  awardId: string
  procurementReference: string
  packId: UploadDeskPackId
  packName: string
  packVersion: string
  fragmentCount: number
  unmappedFragmentCount: number
  snapshotHash: string
  snapshot: AwardRegistrySnapshot
  rows: ChecklistRow[]
}

const hashPattern = /^[a-f0-9]{64}$/
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/
const keyPattern = /^[a-z][a-z0-9_.]{0,119}$/
const fieldStates = new Set<UploadDeskFieldState>(['present', 'missing', 'negative'])
const actionSet = new Set<string>(reviewerActions)

export function blankDecision(key: string, action: ReviewerAction = 'confirm'): ReviewerDecision {
  return { key, action, value: '', page: '', quote: '', note: '' }
}

export function defaultDecision(row: ChecklistRow): ReviewerDecision {
  return blankDecision(row.key, row.open ? 'missing' : 'confirm')
}

function text(value: unknown, max: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max ? value : null
}

function bounded(value: unknown, max: number) {
  if (typeof value !== 'string' || value.length > max) return null
  return value
}

export function parseReviewerPage(value: string): number | null {
  const trimmed = value.trim()
  if (!/^(?:[1-9]\d{0,3}|10000)$/.test(trimmed)) return null
  const page = Number(trimmed)
  if (!Number.isInteger(page) || page < 1 || page > 10000) return null
  return page
}

export function decisionIssue(title: string, decision: ReviewerDecision): string | null {
  if (decision.action === 'confirm' || decision.action === 'missing') return null
  const page = parseReviewerPage(decision.page)
  if (!page) return `Add a page number for “${title}”.`
  if (decision.action === 'present') {
    if (decision.value.trim().length < 1) return `Add a value for “${title}”.`
    if (decision.quote.trim().length < 1) return `Add a quote or pointer for “${title}”.`
  }
  if (decision.action === 'negative' && decision.note.trim().length < 1) {
    return `Add a note for “${title}”.`
  }
  if (decision.action === 'stated_absent' && decision.quote.trim().length < 1) {
    return `Add a quote for “${title}”.`
  }
  return null
}

export function decisionsForRows(rows: readonly ChecklistRow[], stored: readonly ReviewerDecision[] | null): ReviewerDecision[] {
  const byKey = new Map((stored ?? []).map(decision => [decision.key, decision]))
  return rows.map(row => {
    const found = byKey.get(row.key)
    return found ? { ...found, key: row.key } : defaultDecision(row)
  })
}

export function openItemCount(rows: readonly ChecklistRow[], decisions: readonly ReviewerDecision[]): number {
  const byKey = new Map(decisions.map(decision => [decision.key, decision.action]))
  return rows.filter(row => {
    const action = byKey.get(row.key) ?? (row.open ? 'missing' : 'confirm')
    if (action === 'present' || action === 'negative' || action === 'stated_absent') return false
    if (action === 'missing') return true
    return row.open
  }).length
}

export function incompleteCorrectionCount(rows: readonly ChecklistRow[], decisions: readonly ReviewerDecision[]): number {
  const byKey = new Map(decisions.map(decision => [decision.key, decision]))
  return rows.filter(row => {
    const decision = byKey.get(row.key)
    return decision ? decisionIssue(row.title, decision) !== null : false
  }).length
}

export function checklistRowVisible(
  openOnly: boolean,
  row: ChecklistRow,
  decision: ReviewerDecision,
  activeKey: string | null,
): boolean {
  if (!openOnly) return true
  if (activeKey === row.key || decisionIssue(row.title, decision)) return true
  return openItemCount([row], [decision]) > 0
}

export function isStatedAbsentReason(reason: string) {
  return reason.startsWith(statedAbsentReasonPrefix)
}

function sanitizeRow(value: unknown): ChecklistRow | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const fieldId = text(row.fieldId, 160)
  const key = text(row.key, 120)
  const title = text(row.title, 240)
  const valueText = text(row.valueText, 500)
  if (!fieldId || !idPattern.test(fieldId) || !key || !keyPattern.test(key) || !title || !valueText) return null
  if (!fieldStates.has(row.state as UploadDeskFieldState)) return null
  if (typeof row.fromPacket !== 'boolean' || typeof row.open !== 'boolean' || typeof row.expectsBoolean !== 'boolean') return null
  const quote = row.quote === null ? null : text(row.quote, 500)
  const page = row.page === null ? null : text(row.page, 8)
  if (row.quote !== null && !quote) return null
  if (row.page !== null && !page) return null
  if (page && !parseReviewerPage(page)) return null
  return {
    fieldId,
    key,
    title,
    state: row.state as UploadDeskFieldState,
    valueText,
    quote,
    page,
    fromPacket: row.fromPacket,
    open: row.open,
    expectsBoolean: row.expectsBoolean,
  }
}

function sanitizeDecision(value: unknown): ReviewerDecision | null {
  if (!value || typeof value !== 'object') return null
  const decision = value as Record<string, unknown>
  const key = text(decision.key, 120)
  if (!key || !keyPattern.test(key) || !actionSet.has(decision.action as string)) return null
  const reviewValue = bounded(decision.value, 4000)
  const page = bounded(decision.page, 8)
  const quote = bounded(decision.quote, 500)
  const note = bounded(decision.note, 500)
  if (reviewValue === null || page === null || quote === null || note === null) return null
  return {
    key,
    action: decision.action as ReviewerAction,
    value: reviewValue,
    page,
    quote,
    note,
  }
}

/** Drop a stored checklist that does not match this desk. */
export function sanitizeUploadChecklist(value: unknown): UploadChecklist | null {
  if (!value || typeof value !== 'object') return null
  const checklist = value as Record<string, unknown>
  if (checklist.schemaVersion !== 'upload-desk-checklist-v1') return null
  if (!uploadDeskPackIds.includes(checklist.packId as UploadDeskPackId)) return null
  const providerId = text(checklist.providerId, 160)
  const fileName = text(checklist.fileName, 240)
  const mediaType = text(checklist.mediaType, 160)
  const sourceFileHash = text(checklist.sourceFileHash, 64)
  const organizationId = text(checklist.organizationId, 160)
  const awardId = text(checklist.awardId, 160)
  const procurementReference = text(checklist.procurementReference, 80)
  const packName = text(checklist.packName, 240)
  const packVersion = text(checklist.packVersion, 80)
  const snapshotHash = text(checklist.snapshotHash, 64)
  if (!providerId || !fileName || !mediaType || !sourceFileHash || !hashPattern.test(sourceFileHash)) return null
  if (!organizationId || !idPattern.test(organizationId) || !awardId || !idPattern.test(awardId)) return null
  if (!procurementReference || !packName || !packVersion || !snapshotHash || !hashPattern.test(snapshotHash)) return null
  if (!Number.isInteger(checklist.fragmentCount) || !Number.isInteger(checklist.unmappedFragmentCount)) return null
  if ((checklist.fragmentCount as number) < 0 || (checklist.unmappedFragmentCount as number) < 0) return null
  if (!Array.isArray(checklist.rows) || checklist.rows.length < 1 || checklist.rows.length > 256) return null
  const rows = checklist.rows.map(sanitizeRow)
  if (rows.some(row => !row)) return null
  const parsedRows = rows as ChecklistRow[]
  if (new Set(parsedRows.map(row => row.key)).size !== parsedRows.length) return null
  const parsedSnapshot = awardRegistrySnapshotSchema.safeParse(checklist.snapshot)
  if (!parsedSnapshot.success) return null
  const snapshot = parsedSnapshot.data
  if (snapshot.organizationId !== organizationId || snapshot.awardId !== awardId) return null
  if (snapshot.procurementReference !== procurementReference) return null
  if (snapshot.framework.frameworkId !== checklist.packId) return null
  if (snapshot.framework.name !== packName || snapshot.framework.version !== packVersion) return null
  if (snapshot.fields.some(field => field.provenance.sourceFileHash !== sourceFileHash)) return null
  if (snapshot.fields.some(field => field.provenance.verificationMethod !== 'adapter_extract')) return null
  if (snapshot.fields.length !== parsedRows.length) return null
  const byKey = new Map(snapshot.fields.map(field => [field.key, field]))
  if (parsedRows.some(row => byKey.get(row.key)?.fieldId !== row.fieldId)) return null
  return {
    schemaVersion: 'upload-desk-checklist-v1',
    providerId,
    fileName,
    mediaType,
    sourceFileHash,
    organizationId,
    awardId,
    procurementReference,
    packId: checklist.packId as UploadDeskPackId,
    packName,
    packVersion,
    fragmentCount: checklist.fragmentCount as number,
    unmappedFragmentCount: checklist.unmappedFragmentCount as number,
    snapshotHash,
    snapshot,
    rows: parsedRows,
  }
}

export function sanitizeReviewerDecisions(value: unknown, rows: readonly ChecklistRow[]): ReviewerDecision[] | null {
  if (!Array.isArray(value) || value.length > 256) return null
  const decisions = value.map(sanitizeDecision)
  if (decisions.some(decision => !decision)) return null
  const parsed = decisions as ReviewerDecision[]
  if (new Set(parsed.map(decision => decision.key)).size !== parsed.length) return null
  const keys = new Set(rows.map(row => row.key))
  if (parsed.some(decision => !keys.has(decision.key))) return null
  return decisionsForRows(rows, parsed)
}
