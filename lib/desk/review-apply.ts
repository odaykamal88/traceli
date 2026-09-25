/**
 * Apply checklist decisions onto an extracted snapshot.
 * Confirm, and “leave missing” on a row that is already the unfilled gap,
 * return that field unchanged. Any other choice records reviewer_attested
 * and keeps the extracted value beside it.
 */

import {
  decisionIssue,
  isStatedAbsentReason,
  notExtractedReason,
  parseReviewerPage,
  type ReviewerDecision,
} from '@/lib/desk/review'
import {
  awardRegistrySnapshotSchema,
  statedAbsentReasonPrefix,
  type AwardRegistrySnapshot,
  type FieldValue,
  type RegistryField,
  type SourceRef,
} from '@/lib/field-registry/schema'

export class DeskReviewError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DeskReviewError'
  }
}

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1)}…`
}

function scalarFromReviewer(text: string): string | number | boolean {
  const trimmed = text.trim()
  if (/^true$/i.test(trimmed)) return true
  if (/^false$/i.test(trimmed)) return false
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(trimmed)) {
    const number = Number(trimmed)
    if (Number.isFinite(number)) return number
  }
  return trimmed
}

function pageRef(page: number, label: string): SourceRef {
  return { kind: 'page', id: `page-${page}`, label: clip(label, 240) }
}

function plainMissing(field: RegistryField) {
  return field.value.state === 'missing' && field.value.reason === notExtractedReason
}

function attestedField(
  field: RegistryField,
  value: FieldValue,
  sourceRef: SourceRef,
  reviewedBy: string,
  reviewedAt: string,
  quote?: string,
): RegistryField {
  if (field.provenance.verificationMethod === 'reviewer_attested') {
    throw new DeskReviewError('Extract the packet again.')
  }
  return {
    fieldId: field.fieldId,
    entityKind: field.entityKind,
    entityId: field.entityId,
    key: field.key,
    value,
    provenance: {
      sourceFileHash: field.provenance.sourceFileHash,
      sourceRef,
      extractedAt: field.provenance.extractedAt,
      confidence: field.provenance.confidence,
      verificationMethod: 'reviewer_attested',
      extractedValue: field.value,
      extractedSourceRef: field.provenance.sourceRef,
      extractedVerificationMethod: field.provenance.verificationMethod,
      reviewedBy,
      reviewedAt,
      ...(quote ? { reviewQuote: quote } : {}),
    },
  }
}

function nextField(
  field: RegistryField,
  decision: ReviewerDecision,
  title: string,
  reviewedBy: string,
  reviewedAt: string,
): RegistryField {
  const issue = decisionIssue(title, decision)
  if (issue) throw new DeskReviewError(issue)
  if (decision.action === 'confirm') return field
  if (decision.action === 'missing') {
    if (plainMissing(field) && field.provenance.verificationMethod === 'adapter_extract') return field
    return attestedField(
      field,
      { state: 'missing', reason: notExtractedReason },
      { kind: 'page', id: 'packet', label: 'Reviewer left this checklist item missing.' },
      reviewedBy,
      reviewedAt,
    )
  }
  const page = parseReviewerPage(decision.page)
  if (!page) throw new DeskReviewError(`Add a page number for “${title}”.`)
  if (decision.action === 'present') {
    const quote = clip(decision.quote, 400)
    return attestedField(
      field,
      { state: 'present', value: scalarFromReviewer(decision.value) },
      pageRef(page, `Quote: ${quote}`),
      reviewedBy,
      reviewedAt,
      quote,
    )
  }
  if (decision.action === 'negative') {
    const note = clip(decision.note, 500)
    const pointer = decision.quote.trim() ? clip(decision.quote, 400) : ''
    const label = pointer ? `Quote: ${pointer}` : `Note: ${note}`
    return attestedField(
      field,
      { state: 'negative', value: scalarFromReviewer(note) },
      pageRef(page, label),
      reviewedBy,
      reviewedAt,
      pointer || undefined,
    )
  }
  const absentQuote = clip(decision.quote, 400)
  const reason = clip(`${statedAbsentReasonPrefix}${absentQuote}`, 500)
  if (!isStatedAbsentReason(reason)) throw new DeskReviewError(`Add a quote for “${title}”.`)
  return attestedField(
    field,
    { state: 'missing', reason },
    pageRef(page, `Quote: ${absentQuote}`),
    reviewedBy,
    reviewedAt,
    absentQuote,
  )
}

/**
 * Returns a snapshot whose untouched fields are the extracted fields.
 * reviewedBy is the server session user id. The client does not choose it.
 */
export function applyReviewerDecisions(
  snapshot: AwardRegistrySnapshot,
  decisions: readonly ReviewerDecision[],
  titles: ReadonlyMap<string, string>,
  review: { reviewedBy: string, reviewedAt: string },
): AwardRegistrySnapshot {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(review.reviewedBy)) {
    throw new DeskReviewError('This session cannot review that checklist.')
  }
  const byKey = new Map(decisions.map(decision => [decision.key, decision]))
  if (byKey.size !== decisions.length) throw new DeskReviewError('Each checklist row can be reviewed once.')
  for (const decision of decisions) {
    if (!snapshot.fields.some(field => field.key === decision.key)) {
      throw new DeskReviewError('That checklist does not match this packet.')
    }
  }
  const fields = snapshot.fields.map(field => {
    const decision = byKey.get(field.key)
    if (!decision) return field
    return nextField(field, decision, titles.get(field.key) ?? field.key, review.reviewedBy, review.reviewedAt)
  })
  const unchanged = fields.every((field, index) => field === snapshot.fields[index])
  if (unchanged) return snapshot
  return awardRegistrySnapshotSchema.parse({ ...snapshot, fields })
}
