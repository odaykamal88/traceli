import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

mock.module('../../lib/trace/access.ts', { namedExports: {
  requireTraceViewer: async () => ({ id: 'fixture-reviewer', organizationId: 'org_fixture', role: 'Procurement Director', mode: 'demo' }),
  TraceAccessError: class TraceAccessError extends Error {},
} })
const { readTenderCommand, readTenderUpload, requireTenderViewer, tenderHttpError } = await import('../../lib/tenders/http.ts')
const { TenderError } = await import('../../lib/tenders/contract.ts')
const { ExtractionError, ExtractionAccessError } = await import('../../lib/field-registry/extract.ts')
const { TraceAccessError } = await import('../../lib/trace/access.ts')
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
  form.set('classification', 'synthetic'); form.set('policyVersion','fixture-policy-v1'); form.set('consent','true'); form.set('expectedRevision', '0'); form.set('idempotencyKey', 'fixture-upload-001')
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

test('durable packet upload refuses a file above 4 MiB before storage', async () => {
  const request=multipart(),form=await request.formData()
  form.set('file',new File([new Uint8Array(4*1024*1024+1)],'oversized-fictional.txt',{type:'text/plain'}))
  const oversized=new Request(request.url,{method:'POST',headers:{host:'app.example',origin:'https://app.example'},body:form})
  await assert.rejects(readTenderUpload(oversized,'packet'),error=>error.code==='too_large'&&error.status===413)
})

test('policy acknowledgement is required and error responses do not disclose internals', async () => {
  const request = multipart(); const form = await request.formData(); form.delete('consent')
  await assert.rejects(readTenderUpload(new Request(request.url,{ method:'POST', headers:{host:'app.example',origin:'https://app.example'},body:form }), 'packet'), error=>error.name==='ZodError')
  const response = tenderHttpError(new Error('postgres://private-secret@example.internal'))
  assert.equal(response.status,503); assert.match(response.headers.get('cache-control'),/private, no-store/)
  assert.ok(!(await response.text()).includes('private-secret'))
  const stale = tenderHttpError(new TenderError(409,'stale','Another saved version exists.',8))
  assert.equal((await stale.json()).latestRevision,8)
})


test('provider failures retain actionable categories without exposing provider text', async () => {
  const expected = { not_configured: 501, unimplemented: 501, invalid_input: 400, unsupported_media: 400, too_large: 413, unauthorized: 502, timeout: 504, upstream: 502 }
  for (const [code, status] of Object.entries(expected)) {
    const privateText = 'secret-token org_private document-private provider-raw-body'
    const response = tenderHttpError(new ExtractionError(code, privateText, { status: 500, code: 'private_code', message: privateText, requestId: 'req_private123' }))
    assert.equal(response.status, status, code)
    assert.match(response.headers.get('cache-control'), /private, no-store/)
    const body = await response.json()
    assert.deepEqual(Object.keys(body).sort(), ['code', 'error'])
    assert.equal(body.code, code)
    assert.ok(!JSON.stringify(body).includes('private'), code)
    assert.ok(!body.error.includes('required fields'), code)
    assert.ok(!body.error.includes('secret-token'), code)
    if (code === 'timeout') assert.match(body.error, /same file again/)
    if (code === 'unauthorized') assert.match(body.error, /workspace administrator/)
  }
})

test('application access failures stay generic 403 separately from provider authorization', async () => {
  for (const error of [new TraceAccessError('org_private'), new ExtractionAccessError()]) {
    const response = tenderHttpError(error)
    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), { error: 'This tender or action is unavailable for your current access.', code: 'unavailable' })
    assert.match(response.headers.get('cache-control'), /private, no-store/)
  }
})
