import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { metricProgress, newestFirst, snapshotAge, taskPriorityLabel, updatesDeskUrl, requestTaskState } from '../../app/hq/control-model.ts'

test('task updates stay on the fixed owner desk and old priority remains unknown', () => {
  assert.equal(updatesDeskUrl(), 'https://traceli-operating-room.odeyqemal.chatgpt.site/updates')
  assert.equal(updatesDeskUrl(48), 'https://traceli-operating-room.odeyqemal.chatgpt.site/updates?task=48')
  for (const id of [0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1, '48']) assert.throws(() => updatesDeskUrl(id))
  assert.equal(taskPriorityLabel(), 'Priority not recorded')
  assert.equal(taskPriorityLabel('later'), 'Later')
  assert.equal(taskPriorityLabel('normal'), 'Normal priority')
})
test('a mixed request cannot keep asking for deferred or completed tasks', () => {
  const tasks = [{ id: 38, status: 'review', priority: 'later' }, { id: 39, status: 'todo', priority: 'normal' }]
  assert.deepEqual(requestTaskState([38, 39], tasks), { current: [39], later: [38], completed: [], completeRequest: false })
  assert.deepEqual(requestTaskState([38, 39], [{ ...tasks[0], status: 'done' }, tasks[1]]), { current: [39], later: [], completed: [38], completeRequest: false })
  assert.equal(requestTaskState([38, 39, 99], tasks).completeRequest, false)
  assert.deepEqual(requestTaskState([39], tasks), { current: [39], later: [], completed: [], completeRequest: true })
  assert.equal(requestTaskState([38], tasks).current.length, 0)
})

test('missing or invalid outcome evidence is not rendered as zero progress', () => {
  for (const metric of [undefined, { current: null, target: 5 }, { current: -1, target: 5 }, { current: 0, target: 0 }, { current: NaN, target: 5 }]) assert.equal(metricProgress(metric), null)
  assert.deepEqual(metricProgress({ current: 0, target: 5 }), { current: 0, target: 5, percent: 0, remaining: 5 })
  assert.deepEqual(metricProgress({ current: 6, target: 5 }), { current: 6, target: 5, percent: 100, remaining: 0 })
})
test('dated evidence becomes stale independently of page refresh', () => {
  const now = Date.parse('2026-09-18T12:00:00Z')
  assert.equal(snapshotAge('2026-09-18T11:00:00Z', now), 'recent')
  assert.equal(snapshotAge('2026-09-16T12:00:00Z', now), 'stale')
  assert.equal(snapshotAge('2026-09-19T12:00:00Z', now), 'unknown')
  assert.equal(snapshotAge('bad date', now), 'unknown')
})
test('latest activity is ordered deterministically without mutating ledger history', () => {
  const events = [{ id: 'timed', at: '2026-09-17T11:00:00Z' }, { id: 'checkpoint', at: '2026-09-17' }, { id: 'older', at: '2026-09-14T11:00:00Z' }, { id: 'new', at: '2026-09-17T22:00:00Z' }]
  assert.deepEqual(newestFirst(events).map(e => e.id), ['new', 'checkpoint', 'timed', 'older'])
  assert.equal(events[0].id, 'timed')
})
test('operating snapshot and handoffs reconcile to original IDs and real evidence files', async () => {
  const root = resolve('docs/hq')
  const control = JSON.parse(await readFile(resolve(root, 'data/control-room.json')))
  const room = JSON.parse(await readFile(resolve(root, 'data/operating-room.json')))
  const tasks = new Set(room.tasks.map(t => t.id))
  assert.equal(tasks.size, room.tasks.length)
  assert.equal(room.tasks.length, 45)
  for (const item of [...control.asks, ...control.blockers]) for (const id of item.task_ids) assert.ok(tasks.has(id), `Missing original task ${id}`)
  for (const id of control.business_milestone.metric_ids) assert.ok(room.metrics.some(m => m.id === id))
  for (const review of room.reviews) assert.ok(tasks.has(review.task_id))
  for (const item of [...control.workstreams, ...control.lessons, ...control.blockers, control.business_milestone, control.cloud_milestone]) await access(resolve(root, item.evidence_ref))
  assert.equal(new Set(control.workstreams.map(w => w.id)).size, 7)
  assert.equal(room.reviews.filter(r => r.status === 'pending').length, 5)
})
