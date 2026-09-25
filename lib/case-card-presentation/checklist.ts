import { getDonorPack, isDonorPackId } from '@/lib/field-registry/packs'
import type { JudgmentRule } from '@/lib/field-registry/judgment'
import type { RegistryField } from '@/lib/field-registry/schema'

/**
 * Matches the start of pack-align’s stated-absent reason.
 * Presentation only. The stored reason is not rewritten.
 */
export const STATED_ABSENT_REASON_PREFIX = 'Stated absent in this packet'

/**
 * Human labels for registry keys that have no pack-rule title and no
 * pattern-ticket title. Presentation only. Do not copy these into pack rules.
 */
export const fieldLabelMap: Record<string, string> = {
  'audit.procurement_controls_rating': 'Procurement and financial controls rating',
  'audit.sample_scope': 'Audit sample',
  'audit.estimated_loss_usd': 'Estimated loss stated in the report',
  'audit.office_rating': 'Office rating stated in the report',
  'audit.forensic_backlog': 'Forensic audit backlog stated in the report',
}

export const checklistGroups = [
  { id: 'present', title: 'On file', hint: 'The record quotes this from the file.' },
  { id: 'missing', title: 'Missing', hint: 'The file does not state this. Missing stays missing.' },
  { id: 'stated-absent', title: 'Stated absent in the file', hint: 'The file says this is absent, and the reason starts with “Stated absent in this packet”.' },
  { id: 'negative', title: 'Marked negative', hint: 'The file supports an adverse answer.' },
] as const

export type ChecklistGroupId = (typeof checklistGroups)[number]['id']

export type ChecklistTitleSource = {
  fieldKey: string | null
  title: string
}

export type ChecklistRow = {
  fieldId: string
  key: string
  title: string
  quote: string
}

export type ChecklistGroup = (typeof checklistGroups)[number] & {
  rows: ChecklistRow[]
}

export function checklistGroupId(field: Pick<RegistryField, 'value'>): ChecklistGroupId {
  if (field.value.state === 'present') return 'present'
  if (field.value.state === 'negative') return 'negative'
  if (field.value.state === 'missing' && field.value.reason.startsWith(STATED_ABSENT_REASON_PREFIX)) {
    return 'stated-absent'
  }
  return 'missing'
}

export function checklistQuote(field: Pick<RegistryField, 'value'>): string {
  if (field.value.state === 'missing') return field.value.reason
  return plainScalar(field.value.value)
}

function plainScalar(value: string | number | boolean): string {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return String(value)
}

function ruleTitleForKey(rules: readonly JudgmentRule[], key: string): string | null {
  for (const rule of rules) {
    if ('fieldKey' in rule && rule.fieldKey === key && rule.title) return rule.title
  }
  return null
}

function humanizeKey(key: string): string {
  const words = key.split(/[._]/).filter(Boolean)
  if (words.length === 0) return key
  const sentence = words.join(' ')
  return sentence.charAt(0).toUpperCase() + sentence.slice(1)
}

/**
 * Prefer the pack-rule title for this key, then a pattern-ticket title on the
 * card, then the presentation label map.
 */
export function fieldTitle(
  key: string,
  packIds: readonly string[],
  tickets: readonly ChecklistTitleSource[] = [],
): string {
  for (const packId of packIds) {
    if (!isDonorPackId(packId)) continue
    const title = ruleTitleForKey(getDonorPack(packId).rules, key)
    if (title) return title
  }
  const ticket = tickets.find(item => item.fieldKey === key && item.title.trim())
  if (ticket) return ticket.title
  return fieldLabelMap[key] ?? humanizeKey(key)
}

export function groupChecklistFields(
  fields: readonly RegistryField[],
  packIds: readonly string[],
  tickets: readonly ChecklistTitleSource[] = [],
): ChecklistGroup[] {
  const groups: ChecklistGroup[] = checklistGroups.map(group => ({ ...group, rows: [] }))
  const byId = new Map(groups.map(group => [group.id, group]))
  for (const field of fields) {
    byId.get(checklistGroupId(field))?.rows.push({
      fieldId: field.fieldId,
      key: field.key,
      title: fieldTitle(field.key, packIds, tickets),
      quote: checklistQuote(field),
    })
  }
  return groups
}
