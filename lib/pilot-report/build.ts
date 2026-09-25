/**
 * Plain-language pilot memo built from one frozen desk record.
 * Assessment snapshot + human judgment. Does not rewrite the freeze,
 * the hashes, or the pack rules.
 */

import { draftDeskReasonFromView, type UploadDeskJudgmentView } from '@/lib/desk/judgment'
import type { UploadDeskView } from '@/lib/desk/view'
import { formatDeskInstant } from '@/lib/desk/story'
import { hashJson } from '@/lib/field-registry/freeze'
import type { Finding, JudgmentRule } from '@/lib/field-registry/judgment'
import { STATED_ABSENT_PREFIX } from '@/lib/field-registry/pack-align'
import { evaluateDonorPack, getDonorPack, isDonorPackId, packToggleForId } from '@/lib/field-registry/packs'
import type { RegistryField } from '@/lib/field-registry/schema'

export const PILOT_WORDMARK = 'Trace-li'

export const PILOT_HASH_RECOMPUTE =
  'These codes confirm this note still matches the frozen checklist.'

/** Page 1 lists at most this many things to ask for. The rest stay in the checklist. */
export const PILOT_FRONT_ASK_LIMIT = 5

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
  /** One sentence for the first page. The stated reason stays in decisionReason. */
  decisionSentence: string
  readiness: UploadDeskView['readiness']
  readinessWords: string
  readinessLabel: string
  openItemCount: number
  openItemLine: string
  decisionLabel: string
  decisionReason: string
  /** Client page text. An untouched desk draft is replaced with one plain sentence. */
  printedReason: string
  /** At most five plain lines for the first page, blockers first. */
  frontAskLines: string[]
  furtherOpenItemCount: number
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

function humanFindingTitle(finding: Finding, rulesById: Map<string, JudgmentRule>) {
  const rule = rulesById.get(finding.ruleId)
  const fromRule = rule ? ruleTitle(rule) : ''
  if (fromRule) return fromRule
  const fromFinding = finding.title.includes(' ') ? finding.title.trim() : ''
  return fromFinding
}

/**
 * Turn a checklist title into the thing to ask for.
 * Strips a trailing "required" or a trailing "must be …" when that leaves a phrase.
 * Otherwise the title is kept as written.
 */
export function askForLine(title: string): string {
  const clean = title.replace(/\s+/g, ' ').trim().replace(/\.+$/, '')
  if (!clean) return title.trim()
  const withoutRequired = clean.replace(/\s+(?:is\s+)?required$/i, '').trim()
  if (withoutRequired && withoutRequired !== clean) return withoutRequired
  const requiredOn = /^(.*)\s+required on\b/i.exec(clean)
  if (requiredOn) {
    const left = requiredOn[1].trim().replace(/[,:;]+$/, '')
    if (left.split(/\s+/).filter(Boolean).length >= 2) return left
  }
  const mustBe = /^(.*)\s+must be\b/i.exec(clean)
  if (mustBe) {
    const left = mustBe[1].trim().replace(/[,:;]+$/, '')
    if (left.split(/\s+/).filter(Boolean).length >= 2) return left
  }
  return clean
}

/**
 * The few things a director should ask for, taken from checklist rows that are not on file.
 * Blockers come first. Each line is the thing to request, not a second policy sentence.
 */
export function frontAskLinesFor(
  rows: readonly { title: string }[],
  findings: readonly Finding[],
  rules: readonly JudgmentRule[],
  limit = PILOT_FRONT_ASK_LIMIT,
): string[] {
  const take = Math.min(PILOT_FRONT_ASK_LIMIT, Math.max(0, limit))
  const byId = new Map(rules.map(rule => [rule.ruleId, rule]))
  const rankByTitle = new Map<string, number>()
  for (const finding of findings) {
    if (finding.severity !== 'blocker' && finding.severity !== 'warning') continue
    const title = humanFindingTitle(finding, byId)
    if (!title) continue
    const rank = finding.severity === 'blocker' ? 0 : 1
    const previous = rankByTitle.get(title)
    if (previous === undefined || rank < previous) rankByTitle.set(title, rank)
  }
  return [...rows]
    .map(row => ({ title: row.title.trim(), rank: rankByTitle.get(row.title.trim()) ?? 2 }))
    .filter(row => row.title)
    .sort((left, right) => left.rank - right.rank || left.title.localeCompare(right.title))
    .slice(0, take)
    .map(row => askForLine(row.title))
}

const PACK_KEY = /\b[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+\b/g

function fallbackReason(decision: string) {
  if (decision === 'request_evidence') return 'The reviewer asked for the missing evidence before signing.'
  if (decision === 'accept_with_exception') return 'The reviewer accepted this with an exception.'
  if (decision === 'escalate') return 'The reviewer escalated this before signing.'
  return 'The reviewer recorded a decision on this checklist.'
}

function isDeskInstruction(sentence: string) {
  return /edit this draft/i.test(sentence) || /confirm your judgment/i.test(sentence)
}

function stripDeskLeakage(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(sentence => !isDeskInstruction(sentence))
  let joined = sentences.join(' ').replace(PACK_KEY, ' ')
  joined = joined
    .replace(/\s+,/g, ',')
    .replace(/(?:,\s*){2,}/g, ', ')
    .replace(/:\s*,/g, ':')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+([,.;])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/^(?:,|and)\s+/i, '')
    .replace(/\s+(?:,|and)\s*$/i, '')
    .trim()
  return joined
}

/**
 * Text for the client page. An untouched desk draft becomes one sentence.
 * An edited reason is kept, without pack keys or the desk's instruction line.
 */
export function clientFacingReason(reason: string, decision: string, draft: string | null) {
  const normalized = reason.replace(/\s+/g, ' ').trim()
  const normalizedDraft = draft?.replace(/\s+/g, ' ').trim() ?? ''
  if (!normalized || (normalizedDraft && normalized === normalizedDraft)) return fallbackReason(decision)
  const stripped = stripDeskLeakage(normalized)
  if (stripped.replace(/[^A-Za-z0-9]+/g, '').length < 12) return fallbackReason(decision)
  return stripped
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
  if (count === 0) return 'No open items.'
  if (count === 1) return '1 open item.'
  return `${count} open items.`
}

function decisionSentence(label: string, waiver: boolean) {
  if (label === 'request evidence') return 'The decision is to request evidence before you sign.'
  if (label === 'escalate') return 'The decision is to escalate this before you sign.'
  if (label === 'accept with exception') {
    return waiver
      ? 'The decision is to accept with an exception, and a note is recorded on this freeze.'
      : 'The decision is to accept with an exception.'
  }
  return `The decision is to ${label}.`
}

function readinessLabel(words: string) {
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : words
}

/**
 * Build the memo. An open item is a checklist row that is not on file.
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
  const openRows = groups.filter(group => group.id !== 'on_file').flatMap(group => group.rows)
  const frontAskLines = frontAskLinesFor(openRows, evaluated.findings, pack.rules)
  const openItemCount = openRows.length
  const readiness = judgment.readiness
  const words = readinessWords[readiness]
  const reviewerName = reviewerLabel(input.reviewerName)
  const reviewerRoleRaw = input.reviewerRole ? cleanLine(input.reviewerRole, 80) || null : null
  const reviewerRole = reviewerRoleRaw && reviewerRoleRaw !== reviewerName ? reviewerRoleRaw : null
  const exception = judgment.waiver ? ' A desk-session exception note is on this freeze.' : ''
  const summary = `Readiness is ${words} (${readiness}). ${openSentence(openItemCount)} The reviewer decided to ${decisionLabel}.${exception} Their reason: ${judgment.reason}`
  const sentence = decisionSentence(decisionLabel, Boolean(judgment.waiver))
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
    decisionSentence: sentence,
    readiness,
    readinessWords: words,
    readinessLabel: readinessLabel(words),
    openItemCount,
    openItemLine: openSentence(openItemCount),
    decisionLabel,
    decisionReason: judgment.reason,
    printedReason: clientFacingReason(judgment.reason, judgment.decision, draftDeskReasonFromView(view)),
    frontAskLines,
    furtherOpenItemCount: Math.max(0, openItemCount - frontAskLines.length),
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
