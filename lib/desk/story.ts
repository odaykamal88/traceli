/**
 * Post-freeze copy for the signed-in award desk.
 * Built only from the live upload view: file, pack, readiness, findings,
 * and pack fields. No fictional award, supplier, or overnight clock.
 */

import type { UploadDeskFieldState, UploadDeskReadiness, UploadDeskSeverity, UploadDeskView } from '@/lib/desk/view'

export type DeskPrepTone = 'attention' | 'ready'

export type DeskPrepStep = {
  id: 'extract' | 'fields' | 'check' | 'draft'
  phase: string
  work: string
  emphasis: string | null
  gap: boolean
}

export type DeskNeedLine =
  | { kind: 'item', text: string }
  | { kind: 'or' }
  | { kind: 'prompt', text: string }

export type DeskAwardStory = {
  prepTitle: 'Packet prep'
  frozenLabel: string
  pill: { tone: DeskPrepTone, label: string }
  steps: DeskPrepStep[]
  packTitle: string
  packVersion: string
  canShow: string[]
  stillNeeds: DeskNeedLine[]
  evidenceLines: string[]
  prepSummary: string
}

export type DeskStoryInput = {
  fileName: string
  packName: string
  packVersion: string
  readiness: UploadDeskReadiness
  findingCount: number
  findings: readonly { severity: UploadDeskSeverity, title: string }[]
  fields: readonly { key: string, fromPacket: boolean, state: UploadDeskFieldState }[]
  fragmentCount: number
  unmappedFragmentCount: number
  frozenAt: string
  reviewerName: string
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const severityRank: Record<UploadDeskSeverity, number> = { blocker: 0, warning: 1, info: 2 }
const severityLead: Record<UploadDeskSeverity, string> = {
  blocker: 'Blocker',
  warning: 'Warning',
  info: 'Note',
}

function countLabel(count: number, singular: string, pluralLabel: string) {
  return `${count} ${count === 1 ? singular : pluralLabel}`
}

function reviewerLabel(name: string) {
  const clean = name.replace(/\s+/g, ' ').trim()
  return clean.slice(0, 120) || 'the reviewer'
}

function cleanTitle(title: string) {
  return title.trim().replace(/\.+$/, '').slice(0, 160)
}

function linkedLabel(field: { key: string, state: UploadDeskFieldState }) {
  if (field.state === 'negative') return `${field.key} (negative)`
  if (field.state === 'missing') return `${field.key} (stated absent)`
  return field.key
}

function rankedFindings(findings: DeskStoryInput['findings']) {
  return [...findings]
    .filter(finding => finding.title.trim())
    .sort((left, right) => severityRank[left.severity] - severityRank[right.severity] || left.title.localeCompare(right.title))
}

/** UTC clock label. Invalid instants stay visible as given — they are not replaced. */
export function formatDeskInstant(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${hour}:${minute} UTC`
}

function findingClause(findings: DeskStoryInput['findings'], count: number) {
  if (count === 0) return 'No findings were raised.'
  const top = rankedFindings(findings)[0]
  const noun = countLabel(count, 'finding', 'findings')
  return top ? `${noun}, including ${cleanTitle(top.title)}.` : `${noun}.`
}

export function deskAwardStory(input: DeskStoryInput): DeskAwardStory {
  const fileName = input.fileName.trim() || 'this file'
  const packName = input.packName.trim() || 'this pack'
  const packVersion = input.packVersion.trim() || 'unknown'
  const reviewer = reviewerLabel(input.reviewerName)
  const fields = input.fields
  const mapped = fields.filter(field => field.fromPacket)
  const missing = fields.filter(field => !field.fromPacket)
  const total = fields.length
  const percent = total === 0 ? 0 : Math.round((mapped.length / total) * 100)
  const findings = input.findings
  const findingCount = Number.isInteger(input.findingCount) && input.findingCount >= 0
    ? input.findingCount
    : findings.length
  const openFindings = rankedFindings(findings).filter(finding => finding.severity === 'blocker' || finding.severity === 'warning')
  const needsAttention = input.readiness !== 'green' || missing.length > 0 || openFindings.length > 0
  const fragmentCount = Number.isInteger(input.fragmentCount) && input.fragmentCount > 0 ? input.fragmentCount : 0
  const unmappedCount = Number.isInteger(input.unmappedFragmentCount) && input.unmappedFragmentCount > 0
    ? input.unmappedFragmentCount
    : 0
  const frozen = formatDeskInstant(input.frozenAt)
  const findingsText = findingClause(findings, findingCount)

  const extractWork = fragmentCount === 0
    ? `Read ${fileName} — no fragments returned.`
    : `Read ${fileName} — ${countLabel(fragmentCount, 'fragment', 'fragments')} returned${
      unmappedCount > 0 ? `, ${countLabel(unmappedCount, 'fragment', 'fragments')} stayed unmapped` : ''
    }.`

  const fieldsWork = total === 0
    ? 'No pack fields were on this check.'
    : `Checked packet — ${mapped.length}/${total} pack fields linked (${percent}%).`

  let check: Pick<DeskPrepStep, 'work' | 'emphasis' | 'gap'>
  if (missing.length > 0 || openFindings.length > 0) {
    const parts: string[] = []
    if (missing.length > 0) parts.push(`${countLabel(missing.length, 'pack field', 'pack fields')} still missing`)
    if (findingCount > 0) {
      const top = rankedFindings(findings)[0]
      parts.push(top
        ? `${countLabel(findingCount, 'finding', 'findings')}, including ${cleanTitle(top.title)}`
        : countLabel(findingCount, 'finding', 'findings'))
    }
    check = { work: `Flagged gap — ${parts.join('; ')}.`, emphasis: null, gap: true }
  } else if (input.readiness === 'green') {
    check = { work: 'Pack checks passed. Readiness is green.', emphasis: null, gap: false }
  } else {
    check = {
      work: `Readiness is ${input.readiness}. No missing pack field was flagged.`,
      emphasis: null,
      gap: input.readiness === 'red' || input.readiness === 'amber',
    }
  }

  const shownMapped = mapped.slice(0, 4)
  const canShow: string[] = []
  if (total === 0) canShow.push('No pack fields were on this check.')
  else if (mapped.length === 0) canShow.push(`No pack field linked from ${fileName}.`)
  else canShow.push(`${mapped.length} of ${total} pack fields linked`)
  for (const field of shownMapped) {
    canShow.push(`Linked · ${linkedLabel(field)}`)
  }
  if (mapped.length > shownMapped.length) {
    canShow.push(countLabel(mapped.length - shownMapped.length, 'more linked field', 'more linked fields'))
  }
  if (fragmentCount > 0) canShow.push(`${countLabel(fragmentCount, 'fragment', 'fragments')} read from the file`)

  const stillNeeds: DeskNeedLine[] = []
  const shownMissing = missing.slice(0, 5)
  for (const field of shownMissing) stillNeeds.push({ kind: 'item', text: `Missing · ${field.key}` })
  if (missing.length > shownMissing.length) {
    stillNeeds.push({
      kind: 'item',
      text: countLabel(missing.length - shownMissing.length, 'more pack field still missing', 'more pack fields still missing'),
    })
  }
  for (const finding of openFindings.slice(0, 3)) {
    stillNeeds.push({ kind: 'item', text: `${severityLead[finding.severity]} · ${cleanTitle(finding.title)}` })
  }
  if (stillNeeds.length === 0) {
    stillNeeds.push({
      kind: 'prompt',
      text: input.readiness === 'green'
        ? 'Your judgment before sign-off. Pack checks passed. This is not a certification.'
        : 'Your judgment before sign-off. Readiness did not come back as a pass.',
    })
  } else {
    stillNeeds.push({ kind: 'or' })
    stillNeeds.push({
      kind: 'prompt',
      text: 'Record a judgment: request the missing evidence, accept with a desk-session exception, or escalate.',
    })
  }

  const evidenceLines = [
    total === 0
      ? `No pack fields were checked for ${fileName}.`
      : `${mapped.length} of ${total} pack fields linked from ${fileName} (${percent}%).`,
  ]
  if (mapped.length === 0) {
    evidenceLines.push('No pack field was linked from the packet.')
  } else {
    const shown = mapped.slice(0, 8).map(field => linkedLabel(field))
    const extra = mapped.length - shown.length
    evidenceLines.push(`Linked: ${shown.join(', ')}${extra > 0 ? `, and ${extra} more` : ''}.`)
  }
  if (missing.length === 0) {
    evidenceLines.push('No pack fields are missing.')
  } else {
    const shown = missing.slice(0, 8).map(field => field.key)
    const extra = missing.length - shown.length
    evidenceLines.push(
      `Gap: ${countLabel(missing.length, 'pack field', 'pack fields')} still missing (${shown.join(', ')}${extra > 0 ? `, and ${extra} more` : ''}). Missing means the packet did not yield the field.`,
    )
  }
  evidenceLines.push(findingsText)

  const missingSentence = missing.length === 0
    ? 'No pack fields are missing.'
    : `${countLabel(missing.length, 'pack field', 'pack fields')} still missing.`
  const prepSummary = `This run read ${fileName}, checked it against ${packName} version ${packVersion}, and drafted a judgment note for ${reviewer}. Readiness is ${input.readiness}. ${findingsText} ${missingSentence}`

  return {
    prepTitle: 'Packet prep',
    frozenLabel: `Frozen · ${frozen}`,
    pill: needsAttention
      ? { tone: 'attention', label: `Human decision required · ${input.readiness} readiness` }
      : { tone: 'ready', label: 'Pack checks passed · judgment open' },
    steps: [
      { id: 'extract', phase: 'Extract', work: extractWork, emphasis: fileName === 'this file' ? null : fileName, gap: false },
      {
        id: 'fields',
        phase: 'Fields',
        work: fieldsWork,
        emphasis: total === 0 ? null : `${mapped.length}/${total}`,
        gap: false,
      },
      { id: 'check', phase: 'Check', ...check },
      {
        id: 'draft',
        phase: 'Draft',
        work: `Drafted a judgment note for ${reviewer}.`,
        emphasis: reviewer === 'the reviewer' ? null : reviewer,
        gap: false,
      },
    ],
    packTitle: `Checked against ${packName}`,
    packVersion,
    canShow,
    stillNeeds,
    evidenceLines,
    prepSummary,
  }
}

export function deskAwardStoryFromView(
  view: Pick<UploadDeskView, 'fileName' | 'packName' | 'packVersion' | 'readiness' | 'findingCount' | 'findings' | 'fields' | 'fragmentCount' | 'unmappedFragmentCount' | 'record'>,
  reviewerName: string,
) {
  return deskAwardStory({
    fileName: view.fileName,
    packName: view.packName,
    packVersion: view.packVersion,
    readiness: view.readiness,
    findingCount: view.findingCount,
    findings: view.findings,
    fields: view.fields,
    fragmentCount: view.fragmentCount,
    unmappedFragmentCount: view.unmappedFragmentCount,
    frozenAt: view.record.frozenAt,
    reviewerName,
  })
}
