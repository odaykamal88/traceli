import assert from 'node:assert/strict'
import { test } from 'node:test'
import { tenderOwner, tenderProgress } from '../../lib/tenders/workflow.ts'

const editor = { canEdit: true, canAssess: true, canJudge: true }
const reader = { canEdit: false, canAssess: false, canJudge: false }
const panel = { canEdit: true, canAssess: false, canJudge: false }

test('workflow distinguishes each persisted milestone without award approval claims', () => {
  const states = ['no_packet', 'packet_ready', 'correction_incomplete', 'review_ready', 'assessment_current', 'human_decision_current', 'exception_proposed']
  const results = states.map(state => tenderProgress(state, editor, true))
  assert.equal(new Set(results.map(result => result.status)).size, states.length)
  assert.deepEqual(results.map(result => result.stage), ['evidence', 'review', 'review', 'review', 'decision', 'record', 'record'])
  assert.match(results[4].status, /human decision needed/)
  assert.match(results[6].status, /approval not recorded/)
  for (const result of results) assert.doesNotMatch(result.status, /approved|completed|award authorized/i)
})

test('read grants and panel review roles never receive unavailable write invitations', () => {
  for (const state of ['no_packet', 'packet_ready', 'correction_incomplete', 'review_ready', 'assessment_current', 'human_decision_current', 'exception_proposed']) {
    assert.match(tenderProgress(state, reader, true).nextAction, /^View /)
  }
  assert.equal(tenderProgress('review_ready', panel, true).nextAction, 'View saved review')
  assert.equal(tenderProgress('review_ready', panel, true).section, 'review')
  assert.equal(tenderProgress('assessment_current', panel, true).nextAction, 'View assessment')
  assert.equal(tenderProgress('correction_incomplete', panel, true).nextAction, 'Complete checklist corrections')
})

test('fixture ingestion is explicit and gated independently from editing', () => {
  assert.equal(tenderProgress('no_packet', editor, true).nextAction, 'Add a synthetic fixture packet')
  assert.equal(tenderProgress('no_packet', editor, false).nextAction, 'View evidence')
  assert.equal(tenderProgress('no_packet', reader, true).nextAction, 'View evidence')
})

test('unknown state presents a view action, never progress or write success', () => {
  assert.deepEqual(tenderProgress('unknown', editor, true), { stage: 'review', status: 'Current progress unavailable', nextAction: 'View workspace', section: 'review' })
})

test('owner labels use current identity or a stable member identifier without inventing names', () => {
  assert.deepEqual(tenderOwner('fixture-owner', 'fixture-owner'), { id: 'fixture-owner', label: 'You', isCurrentUser: true })
  const other = tenderOwner('fixture-owner', 'fixture-viewer')
  assert.match(other.label, /^Member [a-f0-9]{8}$/)
  assert.equal(other.isCurrentUser, false)
  assert.equal(tenderOwner('fixture-owner', 'another-viewer').label, other.label)
  assert.notEqual(tenderOwner('different-owner', 'fixture-viewer').label, other.label)
})
