import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

mock.module('../../lib/trace/access.ts', { namedExports: {
  requireTraceViewer: async () => ({ id: 'fixture-reviewer', organizationId: 'org_fixture', role: 'Procurement Director', mode: 'demo' }),
  TraceAccessError: class TraceAccessError extends Error {},
} })
const { readTenderCommand, readTenderUpload, requireTenderViewer, tenderHttpError } = await import('../../lib/tenders/http.ts')
const { TenderError } = await import('../../lib/tenders/contract.ts')
const json = (body, headers = {}) => new Request('https://app.example/api/tenders', { method: 'POST', headers: { host: 'app.example', origin: 'https://app.example', 'content-type': 'application/json', ...headers }, body })

test('tender rollout is closed by default and missing database never downgrades', async () => {
  const flag = process.env.TRACELI_TENDER_WORKSPACES, db = process.env.DATABASE_URL
  try {
    delete process.env.TRACELI_TENDER_WORKSPACES
    await assert.rejects(requireTenderViewer(), error => error.status === 404)
    process.env.TRACELI_TENDER_WORKSPACES = '1'
    delete process.env.DATABASE_URL
    await assert.rejects(requireTenderViewer(), error => error.status === 500)
    process.env.DATABASE_URL = 'postgres://fixture@127.0.0.1/fixture'
    assert.equal((await requireTenderViewer()).organizationId, 'org_fixture')
  } finally {
    if (flag === undefined) delete process.env.TRACELI_TENDER_WORKSPACES; else process.env.TRACELI_TENDER_WORKSPACES = flag
    if (db === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = db
  }
})

test('commands reject absent, foreign and protocol-mismatched origins', async () => {
  assert.deepEqual(await readTenderCommand(json('{"title":"Fixture"}')), { title: 'Fixture' })
  for (const origin of ['', 'https://evil.example', 'http://app.example']) {
    await assert.rejects(readTenderCommand(json('{}', { origin })), error => error.status === 403)
  }
  await assert.rejects(readTenderCommand(json('{}', { 'content-type': 'text/plain' })), error => error.status === 400)
})

test('command body limit applies to actual bytes without Content-Length', async () => {
  await assert.rejects(readTenderCommand(json('x'.repeat(256 * 1024 + 1))), error => error.status === 413)
  await assert.rejects(readTenderCommand(json('{')), error => error.status === 400)
})

function multipart(extra = {}) {
  const form = new FormData()
  form.set('file', new File(['Only fictional test evidence.'], 'fixture.txt', { type: 'text/plain' }))
  form.set('classification', 'synthetic'); form.set('expectedRevision', '0'); form.set('idempotencyKey', 'fixture-upload-001')
  for (const [key, value] of Object.entries(extra)) form.append(key, value)
  return new Request('https://app.example/api/tenders/fixture/packets', { method: 'POST', headers: { host: 'app.example', origin: 'https://app.example' }, body: form })
}

test('packet intake rejects duplicate, forged and foreign-origin fields', async () => {
  const parsed = await readTenderUpload(multipart(), 'packet')
  assert.equal(parsed.classification, 'synthetic'); assert.equal(parsed.expectedRevision, 0)
  for (const extra of [{ organizationId: 'org_other' }, { packId: 'unfpa' }, { expectedRevision: '3' }, { classification: 'customer' }]) {
    await assert.rejects(readTenderUpload(multipart(extra), 'packet'))
  }
  const foreign = multipart(); foreign.headers.set('origin', 'https://evil.example')
  await assert.rejects(readTenderUpload(foreign, 'packet'), error => error.status === 403)
})

test('unclassified customer packet is refused and error responses do not disclose internals', async () => {
  const request = multipart(); const form = await request.formData(); form.set('classification','customer')
  await assert.rejects(readTenderUpload(new Request(request.url,{ method:'POST', headers:{host:'app.example',origin:'https://app.example'},body:form }), 'packet'), error=>error.code==='customer_data_disabled')
  const response = tenderHttpError(new Error('postgres://private-secret@example.internal'))
  assert.equal(response.status,503); assert.match(response.headers.get('cache-control'),/private, no-store/)
  assert.ok(!(await response.text()).includes('private-secret'))
  const stale = tenderHttpError(new TenderError(409,'stale','Another saved version exists.',8))
  assert.equal((await stale.json()).latestRevision,8)
})
