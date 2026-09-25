/**
 * Plain-language pilot memo built from one frozen desk record.
 * Assessment snapshot + human judgment. Does not rewrite the freeze,
 * the hashes, or the pack rules.
 */

import type { UploadDeskJudgmentView } from '@/lib/desk/judgment'
import type { UploadDeskView } from '@/lib/desk/view'
import { formatDeskInstant } from '@/lib/desk/story'
import { hashJson } from '@/lib/field-registry/freeze'
import type { Finding, JudgmentRule } from '@/lib/field-registry/judgment'
import { STATED_ABSENT_PREFIX } from '@/lib/field-registry/pack-align'
import { evaluateDonorPack, getDonorPack, isDonorPackId, packToggleForId } from '@/lib/field-registry/packs'
import type { RegistryField } from '@/lib/field-registry/schema'

export const PILOT_WORDMARK = 'Trace-li'

export const PILOT_HASH_RECOMPUTE =
  'Recompute each hash as the SHA-256 of the canonical JSON for that part: sort object keys alphabetically, keep array order, and hash the UTF-8 text. The snapshot hash covers the award registry snapshot. The packs hash covers the packs in force on this freeze.'

export const PILOT_BOUNDARY =
  'Trace-li does not certify the award or replace the organisation\'s own committees. A missing item is not a finding of fraud.'

const REVIEWER_ATTESTED = 'reviewer_attested'

const readinessWords = {
  red: 'not ready',
  amber: 'needs attention',
  green: 'ready',
  unknown: 'not yet assessed',
} as const

const decisionWords = {
  request_evidence: 'request evidence',
  accept_with_exception: 'accept with exception',
  escalate: 'escalate',
} as const

export class PilotReportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PilotReportError'
  }
}

export type PilotChecklistGroupId = 'on_file' | 'stated_absent' | 'negative' | 'missing'

export type PilotChecklistRow = {
  title: string
  detail: string
  confirmedByReviewer: boolean
  /** Set only when verificationMethod is reviewer_attested. */
  confirmationNote: string | null
}

export type PilotChecklistGroup = {
  id: PilotChecklistGroupId
  heading: string
  rows: PilotChecklistRow[]
}

export type PilotAuditorAsk = {
  title: string
  request: string
}

export type PilotReport = {
  wordmark: typeof PILOT_WORDMARK
  fileName: string
  procurementReference: string
  donorName: string
  packName: string
  packVersion: string
  frozenAt: string
  frozenAtLabel: string
  reviewerName: string
  reviewerRole: string | null
  summary: string
  readiness: UploadDeskView['readiness']
  readinessWords: string
  openItemCount: number
  decisionLabel: string
  decisionReason: string
  groups: PilotChecklistGroup[]
  auditorAsks: PilotAuditorAsk[]
  verification: {
    recordId: string
    snapshotHash: string
    packsHash: string
    hashMethod: 'sha256:sorted-json-v1'
    recompute: string
  }
  boundary: string
}

export type PilotReportInput = {
  view: UploadDeskView
  judgment: UploadDeskJudgmentView
  reviewerName: string
  reviewerRole?: string | null
}

type ChecklistSource = {
  key: string
  value: RegistryField['value']
  sourceRef: { kind: string, id: string, label?: string }
  verificationMethod?: string
  reviewedBy?: string
  reviewedAt?: string
}

const groupOrder: { id: PilotChecklistGroupId, heading: string }[] = [
  { id: 'on_file', heading: 'On file' },
  { id: 'stated_absent', heading: 'Stated absent in the file' },
  { id: 'negative', heading: 'Marked negative' },
  { id: 'missing', heading: 'Missing' },
]

function cleanLine(value: string, max: number) {
  const compact = value.replace(/\s+/g, ' ').trim()
  return compact.length <= max ? compact : `${compact.slice(0, max - 1).trimEnd()}…`
}

function ruleTitle(rule: JudgmentRule) {
  return typeof rule.title === 'string' ? rule.title.trim() : ''
}

function titleForKey(rules: readonly JudgmentRule[], key: string) {
  for (const rule of rules) {
    if ('fieldKey' in rule && rule.fieldKey === key) {
      const title = ruleTitle(rule)
      if (title) return title
    }
  }
  return ''
}

function verificationMethodOf(field: ChecklistSource) {
  return typeof field.verificationMethod === 'string' ? field.verificationMethod : ''
}

function optionalText(value: unknown, max: number) {
  if (typeof value !== 'string') return null
  const clean = cleanLine(value, max)
  return clean || null
}

/**
 * Marker only for an explicit reviewer attestation.
 * reviewedBy and reviewedAt are optional and are omitted when absent.
 */
function confirmationNote(field: ChecklistSource) {
  if (verificationMethodOf(field) !== REVIEWER_ATTESTED) return null
  const who = optionalText(field.reviewedBy, 160)
  const whenRaw = optionalText(field.reviewedAt, 40)
  const when = whenRaw ? formatDeskInstant(whenRaw) : null
  const parts = ['Confirmed by reviewer', who, when].filter((part): part is string => Boolean(part))
  return parts.join(' · ')
}

function pageLabel(sourceRef: ChecklistSource['sourceRef']) {
  if (sourceRef.kind !== 'page') return null
  const match = /^page-(\d+)$/.exec(sourceRef.id)
  if (!match) return null
  const page = Number(match[1])
  if (!Number.isInteger(page) || page < 1) return null
  return `Page ${page}`
}

function quoteFromLabel(label: string | undefined) {
  if (!label?.startsWith('Quote: ')) return null
  const quote = label.slice('Quote: '.length).trim()
  return quote || null
}

function statedAbsentQuote(reason: string) {
  if (!reason.startsWith(STATED_ABSENT_PREFIX)) return null
  const quote = reason.slice(STATED_ABSENT_PREFIX.length).trim()
  return quote || null
}

function classify(field: ChecklistSource): PilotChecklistGroupId | null {
  if (field.value.state === 'present') return 'on_file'
  if (field.value.state === 'negative') return 'negative'
  if (field.value.state === 'missing') {
    return field.value.reason.startsWith(STATED_ABSENT_PREFIX) ? 'stated_absent' : 'missing'
  }
  return null
}

function detailFor(field: ChecklistSource, group: PilotChecklistGroupId) {
  const page = pageLabel(field.sourceRef)
  if (group === 'on_file') return page ?? 'Page not recorded'
  if (group === 'missing') return 'Not in this file.'
  const quote = group === 'stated_absent' && field.value.state === 'missing'
    ? statedAbsentQuote(field.value.reason)
    : quoteFromLabel(field.sourceRef.label)
  const quoted = quote ? `"${quote}"` : group === 'negative' ? 'Recorded as not met.' : 'The file states that this is absent.'
  return page ? `${page}. ${quoted}` : quoted
}

/**
 * Group pack fields by what the file did with them.
 * Titles come from the pack rule. A key with no human title is left out.
 * `reviewer_attested` adds a marker. reviewedBy and reviewedAt are optional.
 * Any other method, including none, does not add a marker.
 */
export function groupPilotChecklist(
  fields: readonly ChecklistSource[],
  rules: readonly JudgmentRule[],
): PilotChecklistGroup[] {
  const buckets = new Map<PilotChecklistGroupId, { title: string, detail: string, confirmedByReviewer: boolean, confirmationNote: string | null, sort: string }[]>()
  for (const group of groupOrder) buckets.set(group.id, [])
  for (const field of fields) {
    const group = classify(field)
    const title = titleForKey(rules, field.key)
    if (!group || !title) continue
    const note = confirmationNote(field)
    buckets.get(group)?.push({
      title,
      detail: detailFor(field, group),
      confirmedByReviewer: note !== null,
      confirmationNote: note,
      sort: `${title}\u0000${field.key}`,
    })
  }
  return groupOrder.map(group => ({
    id: group.id,
    heading: group.heading,
    rows: (buckets.get(group.id) ?? [])
      .sort((left, right) => left.sort.localeCompare(right.sort))
      .map(({ title, detail, confirmedByReviewer, confirmationNote: note }) => ({
        title,
        detail,
        confirmedByReviewer,
        confirmationNote: note,
      })),
  }))
}

function ruleRecord(rule: JudgmentRule) {
  return rule as JudgmentRule & { remediation?: unknown, text?: unknown }
}

/** Evidence to request, taken from the rule title or an optional remediation/text field. */
export function evidenceRequestForRule(rule: JudgmentRule): string | null {
  const extra = ruleRecord(rule)
  const remediation = typeof extra.remediation === 'string' ? extra.remediation.trim() : ''
  const text = typeof extra.text === 'string' ? extra.text.trim() : ''
  const title = ruleTitle(rule)
  const body = remediation || text || title
  if (!body) return null
  const sentence = body.replace(/\s+/g, ' ').trim().replace(/\.+$/, '')
  if (remediation && title && remediation !== title) {
    const lead = title.replace(/\.+$/, '')
    return `Ask for this evidence: ${lead}. ${sentence}.`
  }
  return `Ask for this evidence: ${sentence}.`
}

function auditorAsks(findings: readonly Finding[], rules: readonly JudgmentRule[]): PilotAuditorAsk[] {
  const byId = new Map(rules.map(rule => [rule.ruleId, rule]))
  const asks: PilotAuditorAsk[] = []
  const seen = new Set<string>()
  for (const finding of findings) {
    if (finding.severity !== 'blocker') continue
    const rule = byId.get(finding.ruleId)
    const request = rule ? evidenceRequestForRule(rule) : null
    const title = (rule ? ruleTitle(rule) : '') || (finding.title.includes(' ') ? finding.title.trim() : '')
    if (!request || !title || seen.has(request)) continue
    seen.add(request)
    asks.push({ title, request })
  }
  asks.sort((left, right) => left.title.localeCompare(right.title) || left.request.localeCompare(right.request))
  return asks
}

function packsHashFor(packId: UploadDeskView['packId'], frozenAt: string, frozenBy: string) {
  const toggle = packToggleForId(packId)
  return hashJson([{
    packId: toggle.packId,
    version: toggle.version,
    name: toggle.name,
    toggledScope: {
      orgDefault: toggle.toggledScope.orgDefault,
      showOnRecord: toggle.toggledScope.showOnRecord,
      category: toggle.toggledScope.category,
    },
    frozenAt,
    frozenBy,
  }])
}

function reviewerLabel(name: string) {
  const clean = cleanLine(name, 120)
  return clean || 'Reviewer'
}

function openSentence(count: number) {
  if (count === 0) return 'No items are still open.'
  if (count === 1) return '1 item is still open.'
  return `${count} items are still open.`
}

/**
 * Build the memo. Open items are pack findings still marked blocker or warning.
 * Hashes are recomputed and must match the judgment freeze.
 */
export function buildPilotReport(input: PilotReportInput): PilotReport {
  const { view, judgment } = input
  if (!isDonorPackId(view.packId) || judgment.packId !== view.packId) {
    throw new PilotReportError('This freeze does not name a checklist Trace-li can report.')
  }
  if (judgment.record.supersedesRecordId !== view.record.recordId) {
    throw new PilotReportError('The judgment does not belong to this assessment.')
  }
  if (judgment.record.snapshotHash !== view.record.snapshotHash) {
    throw new PilotReportError('The snapshot hash does not match this freeze.')
  }
  if (hashJson(view.snapshot) !== judgment.record.snapshotHash) {
    throw new PilotReportError('The snapshot hash does not match this freeze.')
  }
  if (judgment.packName !== view.packName || judgment.packVersion !== view.packVersion) {
    throw new PilotReportError('The checklist name on the judgment does not match the assessment.')
  }
  if (view.snapshot.framework.name !== view.packName || view.snapshot.framework.version !== view.packVersion) {
    throw new PilotReportError('The checklist name on the judgment does not match the assessment.')
  }
  if (!view.snapshot.donor.name.trim()) {
    throw new PilotReportError('The donor on this freeze could not be read.')
  }
  const packsHash = packsHashFor(view.packId, judgment.record.frozenAt, judgment.record.frozenBy)
  if (packsHash !== judgment.record.packsHash || judgment.record.hashMethod !== 'sha256:sorted-json-v1') {
    throw new PilotReportError('The packs hash does not match this freeze.')
  }
  const evaluated = evaluateDonorPack(view.snapshot, view.packId, { evaluatedAt: judgment.record.frozenAt })
  if (evaluated.pipelineStatus.readiness !== judgment.readiness || evaluated.pipelineStatus.readiness !== view.readiness) {
    throw new PilotReportError('The readiness on this freeze does not match the checklist.')
  }
  if (evaluated.findings.length !== judgment.findingCount || evaluated.findings.length !== view.findingCount) {
    throw new PilotReportError('The findings on this freeze do not match the checklist.')
  }
  const decisionLabel = decisionWords[judgment.decision]
  if (!decisionLabel) throw new PilotReportError('This freeze has no human decision to report.')
  const pack = getDonorPack(view.packId)
  const groups = groupPilotChecklist(view.snapshot.fields.map(field => ({
    key: field.key,
    value: field.value,
    sourceRef: field.provenance.sourceRef,
    verificationMethod: field.provenance.verificationMethod,
    reviewedBy: field.provenance.reviewedBy,
    reviewedAt: field.provenance.reviewedAt,
  })), pack.rules)
  const asks = auditorAsks(evaluated.findings, pack.rules)
  const openItemCount = evaluated.findings.filter(finding => finding.severity === 'blocker' || finding.severity === 'warning').length
  const readiness = judgment.readiness
  const words = readinessWords[readiness]
  const reviewerName = reviewerLabel(input.reviewerName)
  const reviewerRoleRaw = input.reviewerRole ? cleanLine(input.reviewerRole, 80) || null : null
  const reviewerRole = reviewerRoleRaw && reviewerRoleRaw !== reviewerName ? reviewerRoleRaw : null
  const exception = judgment.waiver ? ' A desk-session exception note is on this freeze.' : ''
  const summary = `Readiness is ${words} (${readiness}). ${openSentence(openItemCount)} The reviewer decided to ${decisionLabel}.${exception} Their reason: ${judgment.reason}`
  return {
    wordmark: PILOT_WORDMARK,
    fileName: view.fileName,
    procurementReference: view.procurementReference,
    donorName: view.snapshot.donor.name,
    packName: view.packName,
    packVersion: view.packVersion,
    frozenAt: judgment.record.frozenAt,
    frozenAtLabel: formatDeskInstant(judgment.record.frozenAt),
    reviewerName,
    reviewerRole,
    summary,
    readiness,
    readinessWords: words,
    openItemCount,
    decisionLabel,
    decisionReason: judgment.reason,
    groups,
    auditorAsks: asks,
    verification: {
      recordId: judgment.record.recordId,
      snapshotHash: judgment.record.snapshotHash,
      packsHash: judgment.record.packsHash,
      hashMethod: judgment.record.hashMethod,
      recompute: PILOT_HASH_RECOMPUTE,
    },
    boundary: PILOT_BOUNDARY,
  }
}

export function pilotReportFileName(reference: string) {
  const slug = reference.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
  return slug ? `trace-li-pilot-report-${slug}.pdf` : 'trace-li-pilot-report.pdf'
}
