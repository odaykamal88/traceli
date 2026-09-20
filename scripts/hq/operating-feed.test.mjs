import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { operatingPacketSchema, operatingSourceId } from '../../lib/hq/operating-contract.ts'
import { ingestOperatingSource } from '../../lib/hq/operating-ingest.ts'
import { runCycle } from '../../workers/hq/worker.mjs'

const key = 'ab'.repeat(32)
process.env.HQ_SOURCE_SIGNING_KEY = key
process.env.HQ_SOURCE_DATABASE_URL = 'postgresql://fictional@invalid/fixture?sslmode=verify-full'
process.env.TRACELI_HQ_ACCESS = 'workos'
const packet = () => ({ schema_version: 1, source_id: operatingSourceId, captured_at: new Date().toISOString(), records: { tasks: [], metrics: [], reviews: [], latest: [], receipt_count: 0 } })
function request(body, { at = Date.now(), signature, extraHeaders = {} } = {}) {
  const raw = JSON.stringify(body), signedAt = String(at)
  return new Request('https://fixture.invalid/api/hq/source', { method: 'POST', headers: { 'content-type': 'application/json', 'x-hq-signed-at': signedAt, 'x-hq-signature': signature || createHmac('sha256', Buffer.from(key, 'hex')).update(signedAt + '.' + raw).digest('hex'), ...extraHeaders }, body: raw })
}
test('unsigned, tampered, expired and future packets stop before database access', async () => {
  assert.equal((await ingestOperatingSource(request(packet(), { signature: '00'.repeat(32) }))).status, 401)
  for (const at of [Date.now()-360000, Date.now()+360000]) assert.equal((await ingestOperatingSource(request(packet(), { at }))).status, 401)
})
test('private fields, wrong source, orphan reviews and oversized payloads are rejected', async () => {
  for (const body of [{ ...packet(), source_id: 'other' }, { ...packet(), records: { ...packet().records, contacts: ['private'] } }, { ...packet(), captured_at: '2000-01-01T00:00:00Z' }]) assert.equal((await ingestOperatingSource(request(body))).status, 422)
  assert.equal((await ingestOperatingSource(request(packet(), { extraHeaders: { 'content-length': '200001' } }))).status, 413)
  const p = packet(); p.records.reviews.push({ id: 'r', task_id: 9, title: 'fixture', status: 'pending', created_at: p.captured_at, reviewed_at: null })
  assert.equal(operatingPacketSchema.safeParse(p).success, false)
})
test('ineligible cloud checks never claim, reserve or call a model', async () => {
  for (const status of ['source_missing', 'source_stale', 'review_pending', 'unchanged', 'daily_job_exists', 'job_running', 'budget_exhausted', 'model_policy_paused']) {
    const queries = []
    const result = await runCycle({ db: { query: async sql => { queries.push(sql); return { rows: [{ result: { status, model_eligible: false } }] } } }, fetchImpl: () => { throw new Error('Unexpected spend') } })
    assert.equal(result.model_called, false); assert.equal(queries.length, 1)
  }
})
