import type { ReviewerDecision } from '@/lib/desk/review'

export type PendingDraftKey = { organizationId: string; viewerId: string; tenderId: string }
export type PendingDraft = { packetReceiptId: string; decisions: ReviewerDecision[]; manualVersionIds: string[]; expectedRevision: number }
const ttl = 30 * 60 * 1000
const maximum = 8
const drafts = new Map<string, { value: PendingDraft; expiresAt: number }>()
function key(scope: PendingDraftKey) { return JSON.stringify([scope.organizationId, scope.viewerId, scope.tenderId]) }
function copy(value: PendingDraft): PendingDraft { return { ...value, decisions: value.decisions.map(item => ({ ...item })), manualVersionIds: [...value.manualVersionIds] } }
function expire(now: number) { for (const [id, item] of drafts) if (item.expiresAt <= now) drafts.delete(id) }
/** Browser memory only. No source bytes or browser/disk storage are retained. */
export function keepPendingDraft(scope: PendingDraftKey, value: PendingDraft, now = Date.now()) {
  expire(now)
  const id = key(scope)
  drafts.delete(id)
  drafts.set(id, { value: copy(value), expiresAt: now + ttl })
  while (drafts.size > maximum) drafts.delete(drafts.keys().next().value!)
}
/** Call only after a fresh authorized read confirms edit access and receipt ownership. */
export function readPendingDraft(scope: PendingDraftKey, now = Date.now()): PendingDraft | null {
  expire(now)
  const item = drafts.get(key(scope))
  return item ? copy(item.value) : null
}
export function clearPendingDraft(scope: PendingDraftKey) { drafts.delete(key(scope)) }

function signature(value: PendingDraft) {
  return JSON.stringify([value.packetReceiptId, value.expectedRevision,
    [...value.decisions].sort((a, b) => a.key.localeCompare(b.key)).map(item => [item.key, item.action, item.value, item.page, item.quote, item.note]),
    [...value.manualVersionIds].sort()])
}
/** An older request must never erase edits recovered or changed by a newer instance. */
export function clearPendingDraftIfMatching(scope: PendingDraftKey, saved: PendingDraft, now = Date.now()): boolean {
  expire(now)
  const current = drafts.get(key(scope))
  if (!current || signature(current.value) !== signature(saved)) return false
  drafts.delete(key(scope))
  return true
}
