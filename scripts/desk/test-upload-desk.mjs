import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, mock, test } from 'node:test'
import { ExtractionError } from '../../lib/field-registry/extract.ts'
import { MockExtractionProvider } from '../../lib/field-registry/extract-mock.ts'
import { verifyFrozenRecord } from '../../lib/field-registry/freeze.ts'
import { FCDO_PRIME_FIELD_KEYS } from '../../lib/field-registry/packs/fcdo-prime.ts'
import { GLOBAL_FUND_FIELD_KEYS } from '../../lib/field-registry/packs/global-fund.ts'
import { deskExtractionFailure, deskWorkingCopy } from '../../lib/desk/failure-copy.ts'
import { DeskAccessError, freezeUploadedPacket } from '../../lib/desk/freeze-upload.ts'
import { sanitizeUploadDeskView } from '../../lib/desk/view.ts'

const envKeys = ['TRACELI_TRACE_MODE', 'NODE_ENV', 'VERCEL', 'DATABASE_URL', 'TRACE_EXTRACTION_PROVIDER']
const savedEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]))
const secret = 'SECRET_FILE_BYTES_SHOULD_NOT_LEAK'
const secretBytes = new TextEncoder().encode(secret)

mock.module('next/headers', {
  namedExports: { headers: async () => new Headers({ host: '127.0.0.1' }) },
})
mock.module('@workos-inc/authkit-nextjs', {
  namedExports: {
    withAuth: async () => { throw new Error('no session') },
    getWorkOS: () => { throw new Error('no workos') },
  },
})
mock.module(new URL('../../lib/workspace-access.ts', import.meta.url).href, {
  namedExports: { isWorkOSConfigured: () => false },
})

const { POST } = await import('../../app/api/desk/route.ts')

after(() => {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

function enableLocal() {
  process.env.TRACELI_TRACE_MODE = 'local'
  process.env.NODE_ENV = 'development'
  delete process.env.VERCEL
  process.env.DATABASE_URL = 'postgres://trace:trace@127.0.0.1:5432/trace'
  delete process.env.TRACE_EXTRACTION_PROVIDER
}

function disableTrace() {
  process.env.TRACELI_TRACE_MODE = 'disabled'
  delete process.env.VERCEL
  delete process.env.TRACE_EXTRACTION_PROVIDER
}

function hasBytesKey(value) {
  if (!value || typeof value !== 'object') return false
  if (Object.prototype.hasOwnProperty.call(value, 'bytes')) return true
  return Object.values(value).some(hasBytesKey)
}

function deskRequest({
  packId = 'global-fund',
  fileName = 'packet.txt',
  type = 'text/plain',
  bytes = secretBytes,
  origin = 'http://127.0.0.1',
  extra,
} = {}) {
  const form = new FormData()
  form.set('file', new File([bytes], fileName, { type }))
  if (packId !== null) form.set('packId', packId)
  if (extra) {
    for (const [key, value] of Object.entries(extra)) form.set(key, value)
  }
  return new Request('http://127.0.0.1/api/desk', {
    method: 'POST',
    headers: { host: '127.0.0.1', origin },
    body: form,
  })
}

test('mock upload maps missing pack fields and freezes a verified record without the file', async () => {
  const provider = new MockExtractionProvider()
  const extraction = await provider.extract({
    fileName: 'packet.txt',
    mediaType: 'text/plain',
    bytes: secretBytes,
    organizationId: 'org_trace_demo',
  })
  const outcome = freezeUploadedPacket({
    extraction,
    packId: 'global-fund',
    organizationId: 'org_trace_demo',
    actorId: 'user_fixture_reviewer',
    actorRole: 'Procurement Officer',
    frozenAt: '2026-09-22T12:00:00.000Z',
  })
  assert.equal(verifyFrozenRecord(outcome.record).recordId, outcome.record.recordId)
  assert.equal(outcome.record.snapshot.classification, 'synthetic')
  assert.equal(outcome.record.snapshot.organizationId, 'org_trace_demo')
  assert.equal(outcome.record.disposition.decision, 'request_evidence')
  assert.equal(outcome.record.pipelineStatus.readiness, 'red')
  assert.equal(outcome.view.record.snapshotHash, outcome.record.snapshotHash)
  assert.equal(outcome.view.record.packsHash, outcome.record.packsHash)
  assert.equal(outcome.view.providerId, 'mock')
  assert.equal(outcome.view.unmappedFragmentCount, 1)
  assert.equal(sanitizeUploadDeskView(outcome.view)?.record.recordId, outcome.view.record.recordId)
  for (const key of GLOBAL_FUND_FIELD_KEYS) {
    const field = outcome.record.snapshot.fields.find(item => item.key === key)
    assert.equal(field?.value.state, 'missing', key)
    assert.equal(field?.value.state === 'missing' ? field.value.reason : '', 'Not extracted from this packet.')
  }
  const serialized = JSON.stringify(outcome.record) + JSON.stringify(outcome.view)
  assert.equal(serialized.includes(secret), false)
  assert.equal(hasBytesKey(outcome.record), false)
  assert.equal(serialized.includes('talonic'), false)
  const dirty = sanitizeUploadDeskView({ ...outcome.view, bytes: secret })
  assert.equal(JSON.stringify(dirty).includes(secret), false)

  const priced = await provider.extract({
    fileName: 'prices.xlsx',
    mediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    bytes: secretBytes,
    organizationId: 'org_trace_demo',
  })
  const sheet = freezeUploadedPacket({
    extraction: priced,
    packId: 'fcdo-prime',
    organizationId: 'org_trace_demo',
    actorId: 'user_fixture_reviewer',
    actorRole: 'Procurement Officer',
    frozenAt: '2026-09-22T12:00:00.000Z',
  })
  const pricing = sheet.view.fields.find(field => field.key === 'pricing.table')
  assert.equal(pricing?.state, 'present')
  assert.equal(pricing?.fromPacket, true)
  assert.equal(sheet.view.unmappedFragmentCount, 0)
  for (const key of FCDO_PRIME_FIELD_KEYS) {
    const field = sheet.record.snapshot.fields.find(item => item.key === key)
    assert.equal(field?.value.state, 'missing', key)
  }
  assert.equal(JSON.stringify(sheet.record).includes(secret), false)

  assert.throws(
    () => freezeUploadedPacket({
      extraction,
      packId: 'usaid',
      organizationId: 'org_trace_demo',
      actorId: 'user_fixture_reviewer',
      actorRole: 'Procurement Officer',
    }),
    error => error instanceof ExtractionError,
  )
  assert.throws(
    () => freezeUploadedPacket({
      extraction,
      packId: 'global-fund',
      organizationId: 'org_trace_demo',
      actorId: 'user_fixture_reviewer',
      actorRole: 'Intern',
    }),
    DeskAccessError,
  )
  const otherOrg = await provider.extract({
    fileName: 'packet.txt',
    mediaType: 'text/plain',
    bytes: secretBytes,
    organizationId: 'org_other',
  })
  assert.throws(
    () => freezeUploadedPacket({
      extraction: otherOrg,
      packId: 'global-fund',
      organizationId: 'org_trace_demo',
      actorId: 'user_fixture_reviewer',
      actorRole: 'Procurement Officer',
    }),
    DeskAccessError,
  )
})

test('the desk route denies an anonymous caller and freezes one mock upload', async () => {
  disableTrace()
  const denied = await POST(deskRequest())
  assert.equal(denied.status, 403)
  assert.match(denied.headers.get('cache-control') ?? '', /no-store/i)
  const deniedBody = await denied.json()
  assert.equal(typeof deniedBody.error, 'string')
  assert.equal(JSON.stringify(deniedBody).includes(secret), false)

  enableLocal()
  const logs = []
  const original = console.log
  console.log = (...args) => { logs.push(args.map(String).join(' ')) }
  try {
    const response = await POST(deskRequest({
      extra: { awardId: 'rfp-2026-041' },
    }))
    assert.equal(response.status, 200, await response.clone().text())
    const view = sanitizeUploadDeskView(await response.json())
    assert.ok(view)
    assert.equal(view.providerId, 'mock')
    assert.equal(view.packId, 'global-fund')
    assert.equal(view.organizationId, 'org_trace_local')
    assert.equal(view.awardId, 'rfp-2026-041')
    assert.equal(view.readiness, 'red')
    assert.equal(view.record.disposition, 'request_evidence')
    assert.match(view.record.recordId, /^record\.desk\.global-fund\./)
    assert.match(view.record.snapshotHash, /^[a-f0-9]{64}$/)
    assert.match(view.record.packsHash, /^[a-f0-9]{64}$/)
    assert.equal(view.findings.some(finding => finding.code === 'gf_eligibility_not_met'), true)
    const capacity = view.fields.find(field => field.key === 'eligibility.contractor_capable')
    assert.equal(capacity?.state, 'missing')
    assert.equal(JSON.stringify(view).includes(secret), false)
    assert.equal(logs.some(line => line.includes(secret)), false)

    const fcdo = await POST(deskRequest({ packId: 'fcdo-prime', fileName: 'notes.txt' }))
    assert.equal(fcdo.status, 200)
    const fcdoView = sanitizeUploadDeskView(await fcdo.json())
    assert.equal(fcdoView?.packId, 'fcdo-prime')
    assert.equal(
      fcdoView?.fields.find(field => field.key === 'delivery_chain.partners_identified')?.state,
      'missing',
    )

    const sheet = await POST(deskRequest({
      fileName: 'prices.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))
    const sheetView = sanitizeUploadDeskView(await sheet.json())
    assert.equal(sheetView?.fields.find(field => field.key === 'pricing.table')?.fromPacket, true)
    assert.equal(sheet.status, 200)

    const unknown = await POST(deskRequest({ packId: 'usaid' }))
    assert.equal(unknown.status, 400)
    const foreign = await POST(deskRequest({ origin: 'https://foreign.invalid' }))
    assert.equal(foreign.status, 403)
    const injected = await POST(deskRequest({ extra: { organizationId: 'org_attacker' } }))
    assert.equal(injected.status, 400)
    const badAward = await POST(deskRequest({ extra: { awardId: 'not a valid id' } }))
    assert.equal(badAward.status, 400)
  } finally {
    console.log = original
  }
})

test('the extract route still rejects a donor pack field', async () => {
  enableLocal()
  const { POST: extractPost } = await import('../../app/api/extract/route.ts')
  const form = new FormData()
  form.set('file', new File([secretBytes], 'packet.txt', { type: 'text/plain' }))
  form.set('packId', 'global-fund')
  const response = await extractPost(new Request('http://127.0.0.1/api/extract', {
    method: 'POST',
    headers: { host: '127.0.0.1', origin: 'http://127.0.0.1' },
    body: form,
  }))
  assert.equal(response.status, 400)
})

test('desk working copy stays on one honest status', () => {
  assert.equal(deskWorkingCopy.button, 'Working…')
  assert.match(deskWorkingCopy.status, /^Working… Trace-li /)
  assert.equal(deskWorkingCopy.status.includes('Extracting…'), false)
  assert.equal(deskWorkingCopy.status.includes('Freezing…'), false)
})

test('the upload desk file control is a labelled button with a working spinner', () => {
  const view = readFileSync(new URL('../../app/desk/upload-desk.tsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../../app/desk/desk.module.css', import.meta.url), 'utf8')
  const route = readFileSync(new URL('../../app/api/desk/route.ts', import.meta.url), 'utf8')
  assert.match(view, /htmlFor="packet-file"/)
  assert.match(view, /id="packet-file"/)
  assert.match(view, /Choose file/)
  assert.match(view, /deskWorkingCopy/)
  assert.match(view, /className=\{s\.spinner\}/)
  assert.match(view, /disabled=\{pending\}/)
  assert.match(css, /\.fileButton \{/)
  assert.match(css, /background: var\(--navy\)/)
  assert.match(css, /color: var\(--ivory\)/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.match(route, /export const maxDuration = 180/)
  assert.equal(route.includes('talonic'), false)
})

test('desk failure copy shows Talonic detail and drops secrets', () => {
  const secret = 'tlnc_live_key_should_not_render'
  const shaped = deskExtractionFailure({
    error: 'Talonic returned a gateway error (HTTP 502). No fragments were returned.',
    code: 'upstream',
    upstream: {
      status: 502,
      code: 'INTERNAL_ERROR',
      message: `worker failed Bearer ${secret}`,
      requestId: 'req_0468dcdadafb4488',
      authorization: `Bearer ${secret}`,
    },
  })
  assert.equal(shaped.summary, 'Talonic returned a gateway error (HTTP 502). No fragments were returned.')
  assert.equal(
    shaped.detail,
    'Talonic said: worker failed Bearer redacted. Code INTERNAL_ERROR. Request req_0468dcdadafb4488.',
  )
  assert.equal(`${shaped.summary} ${shaped.detail}`.includes(secret), false)
  assert.equal(shaped.detail.includes('authorization'), false)

  const poisoned = deskExtractionFailure({
    error: `Talonic refused the API key. ${secret}`,
    upstream: {
      status: 401,
      code: 'not a code',
      message: `Authorization: Bearer ${secret}`,
      requestId: `req_${secret}`,
    },
  })
  assert.equal(poisoned.summary.includes(secret), false)
  assert.match(poisoned.summary, /redacted/)
  assert.equal(poisoned.detail.includes('not a code'), false)
  assert.equal(poisoned.detail.includes(secret), false)
  assert.match(poisoned.detail, /HTTP 401/)
  assert.equal(deskExtractionFailure({ ok: true }), null)
  assert.equal(deskExtractionFailure(null), null)

  const waiting = deskExtractionFailure({
    error: 'Talonic is still processing this document (document 601b2dcd, request req_601b2dcd01). Try again. No fragments were returned.',
    code: 'timeout',
    upstream: { requestId: 'req_601b2dcd01' },
  })
  assert.match(waiting.summary, /document 601b2dcd/)
  assert.match(waiting.summary, /Try again/)
  assert.equal(waiting.detail, 'Request req_601b2dcd01.')
})

test('desk sources do not log and do not name Talonic', () => {
  for (const file of [
    'app/api/desk/route.ts',
    'lib/desk/freeze-upload.ts',
    'lib/desk/packet.ts',
  ]) {
    const source = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')
    assert.equal(source.includes('console.'), false, file)
    assert.equal(source.includes('talonic'), false, file)
    assert.equal(source.includes('TRACE_EXTRACTION_PROVIDER'), false, file)
  }
})
