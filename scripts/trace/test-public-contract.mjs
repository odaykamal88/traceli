import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { buildPublicDemoPacket } from '../../lib/trace/public-demo-data.ts'
import { createSimulatedReview, buildPublicDemoExport } from '../../lib/trace/public-demo.ts'

const now = '2026-09-21T13:00:00.000Z'
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value)
const hash = value => createHash('sha256').update(value, 'utf8').digest('hex')
const review = (entry, changes = {}) => createSimulatedReview(entry, { action: 'request_evidence', rationale: 'Practice review of the supplied fictional evidence only.', authority: false, sequence: 1, now, ...changes })

test('public projection preserves all eight policy states and independent exact-byte hashes', () => {
  const packet = buildPublicDemoPacket()
  const expected = { missing: ['unknown', 'needs_evidence'], satisfied: ['satisfied', 'ready_for_review'], failed: ['not_satisfied', 'needs_rule_review'], excluded: ['not_applicable', 'ready_for_review'], conflict: ['conflict', 'needs_rule_review'], unknown_date: ['unknown', 'needs_rule_review'], timeout: ['satisfied', 'cannot_evaluate'], invalid_model: ['satisfied', 'cannot_evaluate'] }
  for (const [scenario, entry] of Object.entries(packet.cases)) {
    assert.deepEqual([entry.snapshot.policy.result, entry.snapshot.policy.disposition], expected[scenario])
    assert.equal(entry.snapshotHash, hash(canonical(entry.snapshot)))
    for (const source of entry.snapshot.sources) assert.equal(source.byteHash, hash(source.content))
    assert.equal(entry.snapshot.realDecisionEligible, false)
    assert.equal(entry.snapshot.benchmarkEligible, false)
    assert.equal(entry.snapshot.model.externalRequests, 0)
    assert.doesNotMatch(JSON.stringify(entry), /synthetic-local-v1|storageRef|createdBy|custody|organizationId|permissionRef/)
  }
  assert.deepEqual(buildPublicDemoPacket(), packet)
})

test('public evidence revision keeps the original rule, scope lane and exact source version', () => {
  const { cases: { missing }, revisedMissing: revised } = buildPublicDemoPacket()
  assert.equal(revised.snapshot.previousSnapshotId, missing.snapshot.id)
  assert.equal(revised.snapshot.version, missing.snapshot.version + 1)
  assert.equal(revised.snapshot.lane, missing.snapshot.lane)
  assert.deepEqual(revised.snapshot.rule, missing.snapshot.rule)
  assert.deepEqual(revised.snapshot.sources[0], missing.snapshot.sources[0])
  assert.equal(missing.snapshot.policy.result, 'unknown')
  assert.equal(revised.snapshot.policy.result, 'satisfied')
  assert.notEqual(revised.snapshotHash, missing.snapshotHash)
  assert.equal(revised.snapshotHash, hash(canonical(revised.snapshot)))
})

test('simulated review cannot rewrite failed evidence and requires a reason and override acknowledgment', () => {
  const { cases: { failed } } = buildPublicDemoPacket()
  const before = JSON.stringify(failed)
  assert.throws(() => review(failed, { rationale: 'short' }))
  assert.throws(() => review(failed, { action: 'override_assessment' }))
  const decision = review(failed, { action: 'override_assessment', authority: true })
  assert.equal(decision.originalPolicyResult, 'not_satisfied')
  assert.equal(decision.mode, 'browser_simulation')
  assert.equal(decision.authenticated, false)
  assert.equal(JSON.stringify(failed), before)
})

test('public export requires a review of the selected version and excludes authenticated grant claims', () => {
  const { cases: { missing }, revisedMissing: revised } = buildPublicDemoPacket()
  const first = review(missing)
  assert.throws(() => buildPublicDemoExport([missing, revised], [first], revised.snapshot.id, now))
  const second = review(revised, { sequence: 2, action: 'accept_assessment' })
  assert.throws(() => buildPublicDemoExport([revised], [{ ...second, snapshotHash: 'wrong' }], revised.snapshot.id, now))
  const exported = buildPublicDemoExport([missing, revised], [first, second], revised.snapshot.id, now)
  assert.equal(exported.schemaVersion, 'trace-public-demo-v1')
  assert.equal(exported.realDecisionEligible, false)
  assert.equal(exported.benchmarkEligible, false)
  assert.equal(exported.selectedSnapshotId, revised.snapshot.id)
  assert.equal(exported.simulatedReviews.length, 2)
  assert.doesNotMatch(JSON.stringify(exported), /grantId|expiresAt|recipientId|actorId|trace-export-v1/)
})
