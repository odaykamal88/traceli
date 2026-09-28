import type { ReviewerDecision } from '@/lib/desk/review'

/** Compare the reviewer-editable values, independent of JSON property or row order. */
export function sameReviewerDecision(left: ReviewerDecision | undefined, right: ReviewerDecision | undefined): boolean {
  if (!left || !right) return left === right
  return left.key === right.key
    && left.action === right.action
    && left.value === right.value
    && left.page === right.page
    && left.quote === right.quote
    && left.note === right.note
}

export function sameReviewerDecisions(left: readonly ReviewerDecision[], right: readonly ReviewerDecision[]): boolean {
  if (left.length !== right.length) return false
  const byKey = new Map(right.map(item => [item.key, item]))
  return byKey.size === right.length
    && new Set(left.map(item => item.key)).size === left.length
    && left.every(item => sameReviewerDecision(item, byKey.get(item.key)))
}

export function sameManualVersions(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const orderedLeft = [...left].sort()
  const orderedRight = [...right].sort()
  return orderedLeft.every((id, index) => id === orderedRight[index])
}
