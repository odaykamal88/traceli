import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runOnce, modelRequest, parseDraft } from './worker.mjs'

const claim = { run_id: 'fixture-run', job_id: 'fixture-job', lease_token: 'fixture-token', lease_remaining_ms: 120000, model: 'gpt-5.6-luna', inputs: [{ ref: 'fixture:approved', text: 'The HQ preview is available; paid workers are not enabled.' }] }
const draft = { summary: 'Draft readiness brief', observations: [{ statement: 'Paid workers are not enabled.', source_refs: ['fixture:approved'] }], questions: ['Has the pilot budget been approved?'] }
const response = () => ({ id: 'fixture-response', status: 'completed', usage: { input_tokens: 1000, output_tokens: 100 }, output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(draft) }] }] })
function database(events, value = claim) { return { query: async (sql, args) => {
  events.push(sql.includes('claim') ? 'claim' : sql.includes('reserve') ? 'reserve' : 'submit')
  if (sql.includes('claim')) return { rows: [{ claim: value }] }
  if (sql.includes('submit')) { assert.deepEqual(JSON.parse(args[2]), draft); return { rows: [{ result: { artifactHash: 'fixture-hash' } }] } }
  return { rows: [{}] }
} } }

test('one reserved model call precedes submission; fixed endpoint, no tools, no storage', async () => {
  const events = []
  const result = await runOnce({ db: database(events), apiKey: 'fixture-only', fetchImpl: async (url, options) => {
    events.push('model'); assert.equal(url, 'https://api.openai.com/v1/responses'); assert.equal(options.redirect, 'error')
    const request = JSON.parse(options.body); assert.equal(request.store, false); assert.equal(request.max_output_tokens, 2048); assert.equal(request.tools, undefined)
    return Response.json(response())
  } })
  assert.deepEqual(events, ['claim', 'reserve', 'model', 'submit']); assert.equal(result.status, 'review')
})
test('idle worker makes no reservation or model call', async () => {
  const events = []; assert.deepEqual(await runOnce({ db: database(events, null), apiKey: 'fixture-only', fetchImpl: () => assert.fail('Unexpected model call') }), { status: 'idle' }); assert.deepEqual(events, ['claim'])
})
test('timeout/HTTP failure never retries, submits, or releases reservation', async () => {
  for (const outcome of ['timeout', 'http']) {
    const events = []; let calls = 0
    await assert.rejects(runOnce({ db: database(events), apiKey: 'fixture-only', fetchImpl: async () => { calls++; if (outcome === 'timeout') throw new Error('timeout'); return new Response('', { status: 429 }) } }))
    assert.equal(calls, 1); assert.deepEqual(events, ['claim', 'reserve'])
  }
})
test('reservation refusal prevents API spend', async () => {
  await assert.rejects(runOnce({ db: { query: async sql => { if (sql.includes('claim')) return { rows: [{ claim }] }; throw new Error('Budget exhausted') } }, apiKey: 'fixture-only', fetchImpl: () => assert.fail('Unexpected model call') }), /Budget/)
})
test('incomplete, refused, unsourced, malformed and unmetered responses are rejected', () => {
  for (const edit of [r => { r.status = 'incomplete' }, r => { r.usage = null }, r => { r.usage.output_tokens = 3000 }, r => { r.output[0].content = [{ type: 'refusal' }] }, r => { r.output[0].content[0].text = JSON.stringify({ ...draft, observations: [{ statement: 'invented', source_refs: ['unknown'] }] }) }, r => { r.output[0].content[0].text = '{}' }]) {
    const r = response(); edit(r); assert.throws(() => parseDraft(r, claim))
  }
})
test('model/source/request bounds cannot be expanded by a job', () => {
  assert.throws(() => modelRequest({ ...claim, model: 'different-model' }))
  assert.throws(() => modelRequest({ ...claim, inputs: [{ ref: 'fixture', text: 'x'.repeat(16001) }] }))
  assert.throws(() => modelRequest({ ...claim, inputs: [{ ref: 'fixture' }] }))
})
test('oversized provider body is stopped before submission', async () => {
  const events = []
  await assert.rejects(runOnce({ db: database(events), apiKey: 'fixture-only', fetchImpl: async () => new Response('x'.repeat(262145)) }), /exceeds bound/)
  assert.deepEqual(events, ['claim', 'reserve'])
})
test('near-expiry replacement cannot reserve or start a model call', async () => {
  const events = []
  await assert.rejects(runOnce({ db: database(events, { ...claim, lease_remaining_ms: 15000 }), apiKey: 'fixture-only', fetchImpl: () => assert.fail('Late model call') }), /lease time/)
  assert.deepEqual(events, ['claim'])
})
test('reservation latency consumes remaining lease; no paid replay after delay', async () => {
  const events = []; let now = 0; const base = database(events, { ...claim, lease_remaining_ms: 30000 })
  const db = { query: async (...args) => { const result = await base.query(...args); if (args[0].includes('reserve')) now = 14500; return result } }
  await assert.rejects(runOnce({ db, apiKey: 'fixture-only', monotonicNow: () => now, fetchImpl: () => assert.fail('Late model call') }), /after reservation/)
  assert.deepEqual(events, ['claim', 'reserve'])
})
