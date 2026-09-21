import type { DateFact, TraceOutcome, TraceScenario } from '@/lib/trace/contract'

export const publicScenarioOptions: { id: TraceScenario; label: string; description: string }[] = [
  { id: 'missing', label: 'A missing review note', description: 'Start here: find the gap, add the fictional evidence, then record a review.' },
  { id: 'satisfied', label: 'A signed note', description: 'Evidence supports the requirement. A human still reviews the assessment.' },
  { id: 'failed', label: 'An unsigned, late note', description: 'Supplied evidence shows a failure, even when the mock model is confident.' },
  { id: 'excluded', label: 'A procedure outside scope', description: 'An explicit exclusion means the requirement does not apply.' },
  { id: 'conflict', label: 'Two competing rules', description: 'Conflicting instruments need a qualified rule review.' },
  { id: 'unknown_date', label: 'An unknown effective date', description: 'An unknown date leaves the rule’s applicability unresolved.' },
  { id: 'timeout', label: 'A model timeout', description: 'The evidence check remains visible; the combined assessment is incomplete.' },
  { id: 'invalid_model', label: 'An invalid model response', description: 'A malformed response cannot clear a decision.' },
]

export const demoReviewActions = [
  { id: 'accept_assessment', label: 'Accept this scoped assessment' },
  { id: 'request_evidence', label: 'Request more evidence' },
  { id: 'request_rule_review', label: 'Request a rule review' },
  { id: 'override_assessment', label: 'Record a fictional override' },
  { id: 'decline_decision', label: 'Decline to decide' },
] as const
export type DemoReviewAction = typeof demoReviewActions[number]['id']

export type PublicDemoSnapshot = {
  schemaVersion: 'trace-public-snapshot-v1'
  id: string
  scenario: TraceScenario
  lane: 'U' | 'M' | 'G'
  version: number
  previousSnapshotId: string | null
  provenance: 'Fixed fictional example generated for the public Trace demo'
  classification: 'synthetic'
  realDecisionEligible: false
  benchmarkEligible: false
  decisionDate: DateFact
  rule: { text: string; sourceId: string; locator: string }
  sources: { id: string; title: string; edition: string; content: string; byteHash: string; effectiveDate: DateFact }[]
  evidence: { id: string; text: string; sourceIds: string[]; locator: string; limitations: string }[]
  missingEvidence: string[]
  policy: { result: TraceOutcome; reason: string; nextAction: string; disposition: string; applicability: string; implementationVersion: string }
  model: { state: 'completed' | 'timeout' | 'invalid_response'; distribution: { supports: number; doesNotSupport: number; unknown: number } | null; findings: string[]; externalRequests: 0 }
}
export type PublicDemoCase = { snapshot: PublicDemoSnapshot; snapshotHash: string }
export type PublicDemoPacket = { cases: Record<TraceScenario, PublicDemoCase>; revisedMissing: PublicDemoCase }
export type SimulatedReview = {
  sequence: number; snapshotId: string; snapshotHash: string; action: DemoReviewAction; rationale: string
  originalPolicyResult: TraceOutcome; citedEvidenceIds: string[]; fictionalExceptionAuthority: boolean
  recordedAt: string; mode: 'browser_simulation'; authenticated: false
}

export function defaultDemoAction(snapshot: PublicDemoSnapshot): DemoReviewAction {
  if (snapshot.policy.disposition === 'needs_evidence') return 'request_evidence'
  if (snapshot.policy.disposition === 'ready_for_review') return 'accept_assessment'
  return 'request_rule_review'
}

/** Pure browser demonstration; this is deliberately not a protected Trace decision or export grant. */
export function createSimulatedReview(entry: PublicDemoCase, input: {
  action: DemoReviewAction; rationale: string; authority: boolean; sequence: number; now: string
}): SimulatedReview {
  const rationale = input.rationale.trim()
  if (!demoReviewActions.some(action => action.id === input.action) || rationale.length < 20 || rationale.length > 2000) {
    throw new Error('Choose a practice decision and enter a reason between 20 and 2,000 characters.')
  }
  if (!Number.isInteger(input.sequence) || input.sequence < 1 || !Number.isFinite(Date.parse(input.now))) throw new Error('Start this practice review again.')
  if (input.action === 'override_assessment' && (!input.authority || !entry.snapshot.evidence.length)) {
    throw new Error('A fictional override needs supplied evidence and the fictional exception authority.')
  }
  return {
    sequence: input.sequence, snapshotId: entry.snapshot.id, snapshotHash: entry.snapshotHash,
    action: input.action, rationale, originalPolicyResult: entry.snapshot.policy.result,
    citedEvidenceIds: entry.snapshot.evidence.map(evidence => evidence.id),
    fictionalExceptionAuthority: input.action === 'override_assessment' && input.authority,
    recordedAt: input.now, mode: 'browser_simulation', authenticated: false,
  }
}

export function buildPublicDemoExport(entries: PublicDemoCase[], reviews: SimulatedReview[], selectedId: string, now: string) {
  const selected = entries.find(entry => entry.snapshot.id === selectedId)
  if (!selected || !reviews.some(review => review.snapshotId === selectedId)) throw new Error('Record a practice review of this version before downloading it.')
  if (entries.some(entry => entry.snapshot.realDecisionEligible || entry.snapshot.benchmarkEligible)) throw new Error('Only fictional demo records can be downloaded here.')
  const boundReviews = reviews.filter(review => entries.some(entry => entry.snapshot.id === review.snapshotId && entry.snapshotHash === review.snapshotHash))
  if (boundReviews.length !== reviews.length) throw new Error('The practice review does not match this example.')
  return {
    schemaVersion: 'trace-public-demo-v1' as const, classification: 'synthetic' as const,
    realDecisionEligible: false as const, benchmarkEligible: false as const,
    exportedAt: now, selectedSnapshotId: selectedId,
    provenance: { mode: 'public_browser_simulation', persistence: 'This browser tab only; no server record', identity: 'No authenticated reviewer', providerCalls: 0 },
    snapshots: entries, simulatedReviews: boundReviews,
    verification: {
      snapshotHash: 'SHA-256 of each exact snapshot: sort object keys recursively, preserve array order, then UTF-8 encode JSON with no added whitespace.',
      sourceByteHash: 'SHA-256 of the exact UTF-8 source content string, including line breaks.',
      scope: 'Hashes identify these fictional bytes. They do not prove legal authority, authenticated approval or durable server custody. Simulated reviews are separate from the snapshot hashes.',
    },
    limitations: ['Fictional rules, evidence and practice reviews only.', 'This file is not an authenticated Trace export or an approval of a procurement.', 'No real outcome or benchmark result is asserted. A downloaded copy is outside the demo and cannot be recalled.'],
  }
}
