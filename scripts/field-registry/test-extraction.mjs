import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, mock, test } from 'node:test'
import { ZodError } from 'zod'

import {
  assertDeclaredBodySize,
  EXTRACTION_BYTE_LIMIT,
  ExtractionError,
  MAX_EXTRACTION_FRAGMENTS,
  extractionResultSchema,
  fragmentsTowardRegistryDraft,
  sourceFileHashOf,
} from '../../lib/field-registry/extract.ts'
import { freezeUploadedPacket } from '../../lib/desk/freeze-upload.ts'
import { MockExtractionProvider } from '../../lib/field-registry/extract-mock.ts'
import { getExtractionProvider } from '../../lib/field-registry/extract-provider.ts'
import { TalonicExtractionProvider } from '../../lib/field-registry/extract-talonic.ts'
import { extractUploadedFile, extractionHttpError } from '../../lib/field-registry/extract-upload.ts'
import { freezeAtJudgment, verifyFrozenRecord } from '../../lib/field-registry/freeze.ts'
import { GLOBAL_FUND_FIELD_KEYS } from '../../lib/field-registry/packs/global-fund.ts'
import { fragmentSchema } from '../../lib/field-registry/schema.ts'

const envKeys = ['TRACE_EXTRACTION_PROVIDER', 'TRACE_TALONIC_API_KEY', 'TRACE_TALONIC_BASE_URL']
const savedEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]))
const bytes = new TextEncoder().encode('synthetic annex body')

function input(fileName, mediaType, extra = {}) {
  return { fileName, mediaType, bytes, ...extra }
}

beforeEach(() => {
  for (const key of envKeys) delete process.env[key]
})

after(() => {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

test('mock extraction is stable and keeps provenance without the file body', async () => {
  const provider = new MockExtractionProvider()
  const first = await provider.extract(input('annex-b.pdf', 'application/pdf', { awardId: 'rfp-2026-041' }))
  const second = await provider.extract(input('annex-b.pdf', 'application/pdf', { awardId: 'rfp-2026-041' }))
  assert.deepEqual(first, second)
  assert.equal(first.schemaVersion, 'extraction-result-v1')
  assert.equal(first.providerId, 'mock')
  assert.equal(first.fragments[0].sourceFileHash, sourceFileHashOf(bytes))
  assert.equal(first.fragments[0].sourceRef.kind, 'page')
  assert.equal(first.fragments[0].sourceRef.id, 'page-1')
  assert.equal(first.fragments[0].kind, 'annex')
  assert.equal(first.fragments[0].confidence, 0.375)
  assert.equal(first.fragments[0].extractorId, 'extractor.mock')
  assert.equal(first.fragments[0].extractedAt, '2026-09-22T00:00:00.000Z')
  assert.ok(first.fragments[0].spans?.length >= 2)
  assert.equal(JSON.stringify(first).includes('synthetic annex body'), false)
  assert.equal(JSON.stringify(first).includes('"bytes"'), false)
  const changed = await provider.extract(input('annex-b.pdf', 'application/pdf', {
    bytes: new Uint8Array([1, 2, 3, 4]),
  }))
  assert.notEqual(changed.sourceFileHash, first.sourceFileHash)
  assert.equal(changed.fragments[0].kind, first.fragments[0].kind)
  assert.notEqual(changed.fragments[0].fragmentId, first.fragments[0].fragmentId)
})

test('filename and media type choose kind hints and a path matches bytes', async () => {
  const provider = new MockExtractionProvider()
  const cases = [
    ['prices.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'pricing_table', 'cell'],
    ['note.eml', 'message/rfc822', 'email_header', 'message'],
    ['thread.msg', 'application/vnd.ms-outlook', 'email_header', 'message'],
    ['waiver.pdf', 'application/pdf', 'waiver', 'page'],
    ['capacity.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'capacity_letter', 'page'],
    ['annex-b.pdf', 'application/octet-stream', 'annex', 'page'],
    ['scan.png', 'image/png', 'text', 'page'],
    ['photo.jpg', 'image/jpg', 'text', 'page'],
    ['notes.txt', 'text/plain; charset=utf-8', 'text', 'page'],
  ]
  for (const [fileName, mediaType, kind, sourceKind] of cases) {
    const result = await provider.extract(input(fileName, mediaType))
    assert.equal(result.fragments[0].kind, kind, fileName)
    assert.equal(result.fragments[0].sourceRef.kind, sourceKind, fileName)
    assert.equal(fragmentSchema.safeParse(result.fragments[0]).success, true, fileName)
  }
  const dir = await mkdtemp(join(tmpdir(), 'trace-extract-'))
  try {
    const path = join(dir, 'waiver.pdf')
    await writeFile(path, bytes)
    const fromPath = await provider.extract({ fileName: 'nested/waiver.pdf', mediaType: 'application/pdf', path })
    const fromBytes = await provider.extract(input('waiver.pdf', 'application/pdf'))
    assert.deepEqual(fromPath, fromBytes)
  } finally {
    await rm(dir, { recursive: true })
  }
})

test('the factory defaults to mock and a provider swap keeps the fragment schema', async () => {
  assert.equal(getExtractionProvider().providerId, 'mock')
  assert.equal(getExtractionProvider('talonic').providerId, 'talonic')
  process.env.TRACE_EXTRACTION_PROVIDER = 'talonic'
  assert.equal(getExtractionProvider().providerId, 'talonic')
  delete process.env.TRACE_EXTRACTION_PROVIDER
  assert.throws(() => getExtractionProvider('vendor-x'), ExtractionError)

  const mock = await getExtractionProvider('mock').extract(input('prices.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
  const remote = extractionResultSchema.parse({
    ...mock,
    providerId: 'talonic',
    extractorId: 'extractor.talonic',
    fragments: mock.fragments.map(fragment => ({ ...fragment, extractorId: 'extractor.talonic' })),
  })
  assert.equal(fragmentSchema.safeParse(mock.fragments[0]).success, true)
  assert.equal(fragmentSchema.safeParse(remote.fragments[0]).success, true)
  assert.deepEqual(Object.keys(mock.fragments[0]).sort(), Object.keys(remote.fragments[0]).sort())
  assert.throws(() => fragmentSchema.parse({ ...mock.fragments[0], talonicPayload: { raw: true } }), ZodError)
  assert.throws(() => fragmentSchema.parse({ ...remote.fragments[0], vendorBlocks: [] }), ZodError)
  assert.throws(() => extractionResultSchema.parse({ ...remote, bytes }), ZodError)
})

test('Talonic refuses a missing key, a bad URL, and an unread missing file', async () => {
  const provider = new TalonicExtractionProvider()
  await assert.rejects(
    provider.extract(input('payload.exe', 'application/octet-stream')),
    error => error instanceof ExtractionError && error.code === 'unsupported_media',
  )
  let calls = 0
  const guarded = new TalonicExtractionProvider({
    fetchImpl: () => {
      calls += 1
      throw new Error('network')
    },
  })
  const missing = {
    fileName: 'waiver.pdf',
    mediaType: 'application/pdf',
    path: '/tmp/does-not-exist-trace-extract.pdf',
  }
  await assert.rejects(guarded.extract(missing), error => error instanceof ExtractionError && error.code === 'not_configured')
  assert.equal(calls, 0)
  process.env.TRACE_TALONIC_API_KEY = 'local-test'
  process.env.TRACE_TALONIC_BASE_URL = 'http://extraction.example.invalid'
  await assert.rejects(
    guarded.extract(input('notes.txt', 'text/plain')),
    error => error instanceof ExtractionError && error.code === 'invalid_input',
  )
  process.env.TRACE_TALONIC_BASE_URL = 'https://user:secret@extraction.example.invalid/v1'
  await assert.rejects(
    guarded.extract(input('notes.txt', 'text/plain')),
    error => error instanceof ExtractionError && error.code === 'invalid_input',
  )
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1?token=secret'
  await assert.rejects(
    guarded.extract(missing),
    error => error instanceof ExtractionError && error.code === 'invalid_input',
  )
  assert.equal(calls, 0)
  const source = readFileSync(new URL('../../lib/field-registry/extract-talonic.ts', import.meta.url), 'utf8')
  assert.equal(source.includes('console.'), false)
  assert.equal(source.includes('node:http'), false)
  assert.equal(source.includes('globalThis.fetch'), true)
})

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

test('Talonic maps a synchronous extract into registry fragments', async () => {
  const secret = 'tlnc_test_secret_value'
  process.env.TRACE_TALONIC_API_KEY = secret
  delete process.env.TRACE_TALONIC_BASE_URL
  const calls = []
  const provider = new TalonicExtractionProvider({
    now: () => new Date('2026-09-23T00:00:00.000Z'),
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      const form = init.body
      assert.equal(typeof form.get, 'function')
      assert.equal(form.get('include_markdown'), 'true')
      assert.equal(form.get('include_provenance'), null)
      assert.equal(form.get('schema'), null)
      const file = form.get('file')
      assert.equal(file.name, 'waiver.pdf')
      assert.deepEqual(new Uint8Array(await file.arrayBuffer()), bytes)
      return jsonResponse(200, {
        extraction_id: 'ext-should-not-leak',
        request_id: 'req_should_not_leak',
        status: 'complete',
        created_at: '2026-09-23T12:00:00.000Z',
        document: { id: 'doc-1', filename: 'waiver.pdf', type_detected: 'waiver', pages: 2 },
        data: {
          note: null,
          amount: 0,
          waiver_authority: 'Panel chair',
          line_items: [{ description: 'Spare part', quantity: 2 }],
        },
        confidence: {
          overall: 0.8,
          fields: { waiver_authority: 0.91, line_items: 0.7 },
        },
        provenance: {
          waiver_authority: { page: 2, raw_text: 'Approved by the panel chair.' },
        },
        links: { dashboard: 'https://app.talonic.com/extractions/ext-should-not-leak' },
      })
    },
  })
  const result = await provider.extract(input('nested/waiver.pdf', 'application/pdf', {
    awardId: 'rfp-2026-041',
    organizationId: 'org_trace_demo',
  }))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://api.talonic.com/v1/extract')
  assert.equal(calls[0].init.method, 'POST')
  assert.equal(calls[0].init.redirect, 'manual')
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${secret}`)
  const idempotencyKey = calls[0].init.headers['Idempotency-Key']
  assert.equal(idempotencyKey, `trace-v2-${sourceFileHashOf(bytes)}`.slice(0, 64))
  assert.equal(idempotencyKey.length, 64)
  assert.equal(result.providerId, 'talonic')
  assert.equal(result.extractorId, 'extractor.talonic')
  assert.equal(result.fileName, 'waiver.pdf')
  assert.equal(result.awardId, 'rfp-2026-041')
  assert.equal(result.organizationId, 'org_trace_demo')
  assert.equal(result.fragments.length, 3)
  assert.deepEqual(result.fragments.map(fragment => fragment.kind), ['text', 'pricing_table', 'waiver'])
  const waiver = result.fragments[2]
  assert.equal(waiver.text, 'waiver_authority: Panel chair')
  assert.equal(waiver.confidence, 0.91)
  assert.equal(waiver.extractedAt, '2026-09-23T12:00:00.000Z')
  assert.equal(waiver.sourceRef.kind, 'page')
  assert.equal(waiver.sourceRef.id, 'page-2')
  assert.equal(waiver.spans[0].text, 'Approved by the panel chair.')
  assert.equal(result.fragments[0].text, 'amount: 0')
  assert.equal(result.fragments[0].confidence, 0.8)
  const serialized = JSON.stringify(result)
  assert.equal(serialized.includes(secret), false)
  assert.equal(serialized.includes('ext-should-not-leak'), false)
  assert.equal(serialized.includes('synthetic annex body'), false)
  assert.equal(serialized.includes('"bytes"'), false)
  const draft = fragmentsTowardRegistryDraft(result.fragments, { awardId: result.awardId })
  assert.deepEqual(draft.fields.map(field => field.key).sort(), ['pricing.table', 'waiver.noted'])
  assert.equal(draft.fields.every(field => field.provenance.verificationMethod === 'adapter_extract'), true)
  assert.equal(draft.unmappedFragmentIds.length, 1)
})

test('Talonic reports auth failure, timeout, and a refused redirect without the key', async () => {
  const secret = 'tlnc_test_secret_value'
  process.env.TRACE_TALONIC_API_KEY = secret
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  const auth = new TalonicExtractionProvider({
    fetchImpl: async () => jsonResponse(401, { error: { message: `bad ${secret}` } }),
  })
  let authError
  try {
    await auth.extract(input('notes.txt', 'text/plain'))
  } catch (error) {
    authError = error
  }
  assert.equal(authError instanceof ExtractionError, true)
  assert.equal(authError.code, 'unauthorized')
  assert.match(authError.message, /HTTP 401/)
  assert.equal(authError.message.includes(secret), false)
  assert.equal(authError.upstream?.message?.includes(secret), false)
  assert.equal(JSON.stringify(authError.upstream).includes('Authorization'), false)
  const refused = extractionHttpError(new ExtractionError(
    'unauthorized',
    'Talonic refused the API key. Check TRACE_TALONIC_API_KEY. No fragments were returned.',
  ))
  assert.equal(refused.status, 502)
  const timedOut = new TalonicExtractionProvider({
    timeoutMs: 30,
    fetchImpl: (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const error = new Error('aborted')
        error.name = 'AbortError'
        reject(error)
      })
    }),
  })
  await assert.rejects(timedOut.extract(input('notes.txt', 'text/plain')), error => {
    return error instanceof ExtractionError && error.code === 'timeout' && !error.message.includes(secret)
  })
  assert.equal(extractionHttpError(new ExtractionError('timeout', 'Talonic did not respond in time.')).status, 504)
  assert.equal(extractionHttpError(new ExtractionError('upstream', 'Talonic could not complete extraction.')).status, 502)
  let followed = 0
  const redirect = new TalonicExtractionProvider({
    fetchImpl: async () => {
      followed += 1
      return new Response(null, { status: 302, headers: { location: 'https://evil.example/collect' } })
    },
  })
  await assert.rejects(
    redirect.extract(input('notes.txt', 'text/plain')),
    error => error instanceof ExtractionError && error.code === 'upstream',
  )
  assert.equal(followed, 1)
})

test('Talonic polls a 202 on the configured host and then maps the extraction', async () => {
  const secret = 'tlnc_test_secret_value'
  process.env.TRACE_TALONIC_API_KEY = secret
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  const urls = []
  let polls = 0
  const provider = new TalonicExtractionProvider({
    sleep: async () => {},
    now: () => new Date('2026-09-23T00:00:00.000Z'),
    fetchImpl: async url => {
      const href = String(url)
      urls.push(href)
      if (href.endsWith('/extract')) {
        return jsonResponse(202, {
          status: 'processing',
          poll_url: 'https://evil.example/v1/documents/doc-1',
          document: { id: 'doc-1' },
        })
      }
      return jsonResponse(500, {})
    },
  })
  await assert.rejects(
    provider.extract(input('notes.txt', 'text/plain')),
    error => error instanceof ExtractionError && error.code === 'upstream' && !error.message.includes(secret),
  )
  assert.deepEqual(urls, ['https://extraction.example.invalid/v1/extract'])

  const polled = new TalonicExtractionProvider({
    sleep: async () => {},
    now: () => new Date('2026-09-23T00:00:00.000Z'),
    fetchImpl: async url => {
      const href = String(url)
      urls.push(href)
      if (href.endsWith('/extract')) {
        return jsonResponse(202, {
          status: 'processing',
          poll_url: '/v1/documents/doc-1',
          document: { id: 'doc-1' },
        })
      }
      if (href.endsWith('/documents/doc-1')) {
        polls += 1
        if (polls === 1) return jsonResponse(200, { id: 'doc-1', status: 'processing' })
        return jsonResponse(200, {
          id: 'doc-1',
          status: 'completed',
          latest_extraction_id: 'ext_1',
          links: { extractions: '/v1/documents/doc-1/extractions' },
        })
      }
      if (href.endsWith('/extractions/ext_1')) {
        return jsonResponse(200, {
          id: 'ext_1',
          status: 'complete',
          created_at: '2026-09-23T01:00:00.000Z',
          data: { capacity_statement: 'Workshop can deliver.' },
          confidence: { overall: 0.66, fields: { capacity_statement: 0.66 } },
        })
      }
      return jsonResponse(500, { message: secret })
    },
  })
  urls.length = 0
  const result = await polled.extract(input('capacity.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
  assert.deepEqual(urls, [
    'https://extraction.example.invalid/v1/extract',
    'https://extraction.example.invalid/v1/documents/doc-1',
    'https://extraction.example.invalid/v1/documents/doc-1',
    'https://extraction.example.invalid/v1/extractions/ext_1',
  ])
  assert.equal(result.fragments.length, 1)
  assert.equal(result.fragments[0].kind, 'capacity_letter')
  assert.equal(result.fragments[0].text, 'capacity_statement: Workshop can deliver.')
  assert.equal(result.fragments[0].sourceRef.kind, 'page')
  assert.equal(JSON.stringify(result).includes(secret), false)
})

test('Talonic uses markdown when discovery returns no fields', async () => {
  process.env.TRACE_TALONIC_API_KEY = 'tlnc_test_secret_value'
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  const provider = new TalonicExtractionProvider({
    fetchImpl: async () => jsonResponse(200, {
      status: 'complete',
      document: { type_detected: 'waiver' },
      data: {},
      markdown: 'Authority is the panel chair.',
      confidence: { overall: 0.55 },
    }),
  })
  const result = await provider.extract(input('packet.pdf', 'application/pdf'))
  assert.equal(result.fragments.length, 1)
  assert.equal(result.fragments[0].kind, 'waiver')
  assert.equal(result.fragments[0].text, 'Authority is the panel chair.')
  assert.equal(result.fragments[0].confidence, 0.55)
  const unsupported = new TalonicExtractionProvider({
    fetchImpl: async () => jsonResponse(400, { code: 'unsupported_file_type', message: 'no' }),
  })
  await assert.rejects(
    unsupported.extract(input('prices.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')),
    error => error instanceof ExtractionError && error.code === 'unsupported_media',
  )
})

test('Talonic error JSON keeps status, code, and a scrubbed message', async () => {
  const secret = 'desk-live-key-9f3a'
  process.env.TRACE_TALONIC_API_KEY = secret
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  const cases = [
    [500, 'Talonic reported an internal error (HTTP 500).'],
    [502, 'Talonic returned a gateway error (HTTP 502).'],
    [503, 'Talonic is unavailable (HTTP 503).'],
  ]
  for (const [status, summary] of cases) {
    const provider = new TalonicExtractionProvider({
      fetchImpl: async () => jsonResponse(status, {
        statusCode: status,
        code: 'INTERNAL_ERROR',
        message: `worker failed for Bearer ${secret} and Authorization: Bearer ${secret}`,
        request_id: 'req_0468dcdadafb4488',
        links: { dashboard: 'https://app.talonic.com/extractions/hidden' },
      }, { 'x-request-id': 'req_0468dcdadafb4488' }),
    })
    let caught
    try {
      await provider.extract(input('packet.pdf', 'application/pdf'))
    } catch (error) {
      caught = error
    }
    assert.equal(caught instanceof ExtractionError, true, String(status))
    assert.equal(caught.code, 'upstream')
    assert.match(caught.message, new RegExp(summary.replace(/[()]/g, '\\$&')))
    const body = await extractionHttpError(caught).json()
    assert.equal(body.upstream.status, status)
    assert.equal(body.upstream.code, 'INTERNAL_ERROR')
    assert.equal(body.upstream.requestId, 'req_0468dcdadafb4488')
    assert.match(body.upstream.message, /worker failed/)
    const serialized = JSON.stringify(body)
    assert.equal(serialized.includes(secret), false, String(status))
    assert.equal(serialized.includes('Authorization:'), false)
    assert.equal(serialized.includes('dashboard'), false)
    assert.equal(body.error.includes(secret), false)
  }

  const plain = new TalonicExtractionProvider({
    fetchImpl: async () => new Response('bad gateway', {
      status: 502,
      headers: { 'content-type': 'text/plain', 'x-request-id': 'req_plaintext1234' },
    }),
  })
  let plainError
  try {
    await plain.extract(input('packet.pdf', 'application/pdf'))
  } catch (error) {
    plainError = error
  }
  assert.match(plainError.message, /gateway error \(HTTP 502\)/)
  assert.equal(plainError.upstream.status, 502)
  assert.equal(plainError.upstream.requestId, 'req_plaintext1234')
  assert.equal(plainError.upstream.message, undefined)
  assert.equal(plainError.message.includes('bad gateway'), false)

  const headerOnly = new TalonicExtractionProvider({
    fetchImpl: async () => jsonResponse(403, {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'This action requires scopes: write',
    }, { 'x-request-id': 'not a request id' }),
  })
  let forbidden
  try {
    await headerOnly.extract(input('packet.pdf', 'application/pdf'))
  } catch (error) {
    forbidden = error
  }
  assert.equal(forbidden.code, 'unauthorized')
  assert.match(forbidden.message, /HTTP 403/)
  assert.equal(forbidden.upstream.code, 'INSUFFICIENT_PERMISSIONS')
  assert.equal(forbidden.upstream.requestId, undefined)
  assert.equal(forbidden.upstream.message, 'This action requires scopes: write')

  const rejected = new TalonicExtractionProvider({
    fetchImpl: async () => jsonResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'property include_provenance should not exist',
      request_id: 'req_abcdef123456',
    }),
  })
  let validation
  try {
    await rejected.extract(input('packet.pdf', 'application/pdf'))
  } catch (error) {
    validation = error
  }
  assert.match(validation.message, /rejected this file \(HTTP 400\)/)
  assert.equal(validation.upstream.code, 'VALIDATION_ERROR')
  assert.equal(validation.upstream.message, 'property include_provenance should not exist')

  const unexpected = new TalonicExtractionProvider({
    fetchImpl: async () => jsonResponse(200, {
      status: 'complete',
      data: { note: 'kept' },
    }),
    now: () => {
      throw new Error(`boom ${secret} Authorization: Bearer ${secret}`)
    },
  })
  let surprise
  try {
    await unexpected.extract(input('packet.pdf', 'application/pdf'))
  } catch (error) {
    surprise = error
  }
  assert.match(surprise.message, /unexpected error/)
  assert.equal(surprise.message.includes(secret), false)
  assert.equal(surprise.message.includes('boom'), false)
  assert.equal(surprise.upstream, undefined)
})

test('Talonic reports a failed document without dropping its error detail', async () => {
  const secret = 'desk-live-key-9f3a'
  process.env.TRACE_TALONIC_API_KEY = secret
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  const provider = new TalonicExtractionProvider({
    sleep: async () => {},
    fetchImpl: async url => {
      if (String(url).endsWith('/extract')) {
        return jsonResponse(202, { status: 'processing', poll_url: '/v1/documents/doc-1', document: { id: 'doc-1' } })
      }
      return jsonResponse(200, {
        status: 'failed',
        code: 'extraction_failed',
        message: `no text ${secret}`,
        request_id: 'req_failed123456',
      })
    },
  })
  let caught
  try {
    await provider.extract(input('packet.pdf', 'application/pdf'))
  } catch (error) {
    caught = error
  }
  assert.match(caught.message, /could not extract this document/)
  assert.equal(caught.upstream.code, 'extraction_failed')
  assert.equal(caught.upstream.requestId, 'req_failed123456')
  assert.equal(caught.upstream.message.includes(secret), false)
  assert.match(caught.upstream.message, /no text redacted/)
})

test('Talonic names the document and request when a long poll is still processing', async () => {
  const secret = 'tlnc_test_secret_value'
  process.env.TRACE_TALONIC_API_KEY = secret
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  let t = 0
  let polls = 0
  const seen = []
  const provider = new TalonicExtractionProvider({
    clock: () => t,
    sleep: async ms => { t += ms },
    fetchImpl: async url => {
      const href = String(url)
      seen.push(href)
      if (href.endsWith('/extract')) {
        return jsonResponse(202, {
          status: 'processing',
          poll_url: '/v1/documents/601b2dcd',
          document: { id: '601b2dcd' },
          request_id: 'req_601b2dcd01',
          message: `still working ${secret}`,
        }, { 'x-request-id': 'req_601b2dcd01' })
      }
      if (href.endsWith('/documents/601b2dcd')) {
        polls += 1
        return jsonResponse(200, {
          id: '601b2dcd',
          status: 'processing',
          request_id: 'req_601b2dcd01',
          message: `still working ${secret}`,
        })
      }
      return jsonResponse(500, { message: secret })
    },
  })
  let caught
  try {
    await provider.extract(input('packet.pdf', 'application/pdf'))
  } catch (error) {
    caught = error
  }
  assert.equal(caught instanceof ExtractionError, true)
  assert.equal(caught.code, 'timeout')
  assert.match(caught.message, /still processing this document \(document 601b2dcd, request req_601b2dcd01\)/)
  assert.match(caught.message, /Try again/)
  assert.equal(caught.message.includes(secret), false)
  assert.equal(caught.upstream.requestId, 'req_601b2dcd01')
  assert.match(caught.upstream.message, /still working redacted/)
  assert.equal(polls > 6, true)
  assert.equal(polls <= 31, true)
  assert.equal(t >= 150_000, true)
  assert.equal(t <= 170_000, true)
  assert.equal(seen.every(href => href.startsWith('https://extraction.example.invalid/')), true)
  const body = await extractionHttpError(caught).json()
  assert.equal(body.upstream.requestId, 'req_601b2dcd01')
  assert.equal(JSON.stringify(body).includes(secret), false)
  assert.match(body.error, /601b2dcd/)
})

test('Talonic maps a document that finishes on the one extension poll', async () => {
  process.env.TRACE_TALONIC_API_KEY = 'tlnc_test_secret_value'
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  let t = 0
  let polls = 0
  const provider = new TalonicExtractionProvider({
    clock: () => t,
    sleep: async ms => { t += ms },
    now: () => new Date('2026-09-23T00:00:00.000Z'),
    fetchImpl: async url => {
      const href = String(url)
      if (href.endsWith('/extract')) {
        return jsonResponse(202, {
          status: 'processing',
          poll_url: '/v1/documents/601b2dcd',
          document: { id: '601b2dcd' },
        })
      }
      if (href.endsWith('/documents/601b2dcd')) {
        polls += 1
        if (t < 150_000) return jsonResponse(200, { id: '601b2dcd', status: 'processing' })
        return jsonResponse(200, {
          id: '601b2dcd',
          status: 'completed',
          created_at: '2026-09-23T01:00:00.000Z',
          data: { capacity_statement: 'Workshop can deliver.' },
          confidence: { overall: 0.66, fields: { capacity_statement: 0.66 } },
        })
      }
      return jsonResponse(500, {})
    },
  })
  const result = await provider.extract(input('capacity.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
  assert.equal(result.fragments.length, 1)
  assert.equal(result.fragments[0].text, 'capacity_statement: Workshop can deliver.')
  assert.equal(polls > 6, true)
  assert.equal(t >= 150_000, true)
  assert.equal(t <= 170_000, true)
})

test('a short Talonic budget does not add the extension wait', async () => {
  process.env.TRACE_TALONIC_API_KEY = 'tlnc_test_secret_value'
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  let t = 0
  let polls = 0
  const provider = new TalonicExtractionProvider({
    timeoutMs: 1000,
    clock: () => t,
    sleep: async ms => { t += ms },
    fetchImpl: async url => {
      if (String(url).endsWith('/extract')) {
        return jsonResponse(202, {
          status: 'processing',
          poll_url: '/v1/documents/601b2dcd',
          document: { id: '601b2dcd' },
          request_id: 'req_shortbudget1',
        })
      }
      polls += 1
      return jsonResponse(200, {
        id: '601b2dcd',
        status: 'processing',
        request_id: 'req_shortbudget1',
      })
    },
  })
  let caught
  try {
    await provider.extract(input('packet.pdf', 'application/pdf'))
  } catch (error) {
    caught = error
  }
  assert.equal(caught.code, 'timeout')
  assert.equal(polls, 1)
  assert.equal(t, 1000)
  assert.match(caught.message, /document 601b2dcd/)
  assert.match(caught.message, /request req_shortbudget1/)
  assert.match(caught.message, /Try again/)
})

test('Talonic stops polling when the clock does not advance', async () => {
  process.env.TRACE_TALONIC_API_KEY = 'tlnc_test_secret_value'
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  let polls = 0
  const provider = new TalonicExtractionProvider({
    clock: () => 0,
    sleep: async () => {},
    fetchImpl: async url => {
      if (String(url).endsWith('/extract')) {
        return jsonResponse(202, {
          status: 'processing',
          poll_url: '/v1/documents/601b2dcd',
          document: { id: '601b2dcd' },
        })
      }
      polls += 1
      return jsonResponse(200, { id: '601b2dcd', status: 'processing' })
    },
  })
  let caught
  try {
    await provider.extract(input('packet.pdf', 'application/pdf'))
  } catch (error) {
    caught = error
  }
  assert.equal(caught.code, 'timeout')
  assert.equal(polls, 31)
  assert.match(caught.message, /document 601b2dcd/)
  assert.match(caught.message, /Try again/)
})

test('draft mapping fills hinted fields and leaves generic text unmapped', async () => {
  const provider = new MockExtractionProvider()
  const priced = await provider.extract(input('prices.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', {
    organizationId: 'org_trace_demo',
  }))
  const draft = fragmentsTowardRegistryDraft(priced.fragments, {
    awardId: priced.awardId,
    organizationId: priced.organizationId,
  })
  assert.equal(draft.schemaVersion, 'registry-entity-draft-v1')
  assert.equal(draft.organizationId, 'org_trace_demo')
  assert.equal(draft.fields.length, 1)
  assert.equal(draft.fields[0].key, 'pricing.table')
  assert.equal(draft.fields[0].entityKind, 'criterion')
  assert.equal(draft.fields[0].value.state, 'present')
  assert.equal(draft.fields[0].provenance.verificationMethod, 'adapter_extract')
  assert.equal(draft.fields[0].provenance.sourceFileHash, priced.sourceFileHash)
  assert.deepEqual(draft.unmappedFragmentIds, [])
  assert.equal('donor' in draft, false)
  assert.throws(() => freezeAtJudgment(draft, {}), ZodError)

  const notes = await provider.extract(input('notes.txt', 'text/plain'))
  const empty = fragmentsTowardRegistryDraft(notes.fragments)
  assert.deepEqual(empty.fields, [])
  assert.deepEqual(empty.unmappedFragmentIds, [notes.fragments[0].fragmentId])
})

test('upload validation rejects the wrong type and a declared oversized body', async () => {
  assert.throws(() => assertDeclaredBodySize(String(EXTRACTION_BYTE_LIMIT + (64 * 1024) + 1)), error => error.code === 'too_large')
  const provider = new MockExtractionProvider()
  await assert.rejects(
    provider.extract(input('payload.exe', 'application/octet-stream')),
    error => error instanceof ExtractionError && error.code === 'unsupported_media',
  )
  await assert.rejects(
    provider.extract(input('notes.txt', 'text/html')),
    error => error instanceof ExtractionError && error.code === 'unsupported_media',
  )
})

test('the upload route denies an anonymous caller and stamps the server organization', async () => {
  const traceMode = process.env.TRACELI_TRACE_MODE
  process.env.TRACELI_TRACE_MODE = 'disabled'
  try {
  mock.module('next/headers', { namedExports: { headers: async () => new Headers({ host: '127.0.0.1' }) } })
  mock.module('@workos-inc/authkit-nextjs', { namedExports: {
    withAuth: async () => { throw new Error('no session') },
    getWorkOS: () => { throw new Error('no workos') },
  } })
  mock.module(new URL('../../lib/workspace-access.ts', import.meta.url).href, {
    namedExports: { isWorkOSConfigured: () => false },
  })
  const { POST } = await import('../../app/api/extract/route.ts')
  const denied = await POST(new Request('http://127.0.0.1/api/extract', { method: 'POST' }))
  assert.equal(denied.status, 403)
  assert.match(denied.headers.get('cache-control') ?? '', /no-store/i)
  const body = await denied.json()
  assert.equal(typeof body.error, 'string')
  assert.equal(JSON.stringify(body).includes('TRACE_TALONIC'), false)

  function upload(origin) {
    const form = new FormData()
    form.set('file', new File([bytes], 'prices.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))
    form.set('awardId', 'rfp-2026-041')
    return new Request('http://127.0.0.1/api/extract', {
      method: 'POST',
      headers: { host: '127.0.0.1', origin },
      body: form,
    })
  }
  const result = await extractUploadedFile(upload('http://127.0.0.1'), { organizationId: 'org_trace_demo' })
  assert.equal(result.organizationId, 'org_trace_demo')
  assert.equal(result.awardId, 'rfp-2026-041')
  assert.equal(result.fragments[0].kind, 'pricing_table')
  assert.equal(result.fragments[0].sourceFileHash, sourceFileHashOf(bytes))

  const forbidden = extractionHttpError(await extractUploadedFile(upload('https://foreign.invalid'), {
    organizationId: 'org_trace_demo',
  }).then(() => {
    throw new Error('cross-origin upload should fail')
  }, error => error))
  assert.equal(forbidden.status, 403)
  } finally {
    if (traceMode === undefined) delete process.env.TRACELI_TRACE_MODE
    else process.env.TRACELI_TRACE_MODE = traceMode
  }
})

function talonicEnvelope(data, confidence) {
  return jsonResponse(200, {
    status: 'complete',
    created_at: '2026-09-23T12:00:00.000Z',
    data,
    ...(confidence ? { confidence } : {}),
  })
}

function discoveredClauseFields(count, confidenceFor) {
  const data = { empty_note: '', null_note: null, blank_note: '   ' }
  const fields = {}
  for (let index = 0; index < count; index += 1) {
    const key = `clause_${String(index).padStart(4, '0')}`
    data[key] = `Requirement ${index}`
    if (confidenceFor) fields[key] = confidenceFor(index)
  }
  return {
    data,
    confidence: { overall: 0.5, fields },
  }
}

test('extraction results accept the fragment cap and reject one more', async () => {
  assert.equal(MAX_EXTRACTION_FRAGMENTS, 256)
  assert.ok(MAX_EXTRACTION_FRAGMENTS > 64)
  const mock = await new MockExtractionProvider().extract(input('packet.txt', 'text/plain'))
  const base = mock.fragments[0]
  const fragments = Array.from({ length: MAX_EXTRACTION_FRAGMENTS }, (_, index) => ({
    ...base,
    fragmentId: `frag.mock.cap.${index}`,
    text: `clause ${index}`,
  }))
  const accepted = extractionResultSchema.parse({ ...mock, fragments })
  assert.equal(accepted.fragments.length, MAX_EXTRACTION_FRAGMENTS)
  const draft = fragmentsTowardRegistryDraft(accepted.fragments)
  assert.equal(draft.unmappedFragmentIds.length, MAX_EXTRACTION_FRAGMENTS)
  assert.throws(
    () => extractionResultSchema.parse({
      ...mock,
      fragments: [...fragments, { ...base, fragmentId: 'frag.mock.cap.extra', text: 'one more' }],
    }),
    ZodError,
  )
})

test('Talonic keeps award-packet field counts and truncates only above the cap', async () => {
  process.env.TRACE_TALONIC_API_KEY = 'tlnc_test_secret_value'
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  const source = readFileSync(new URL('../../lib/field-registry/extract-talonic.ts', import.meta.url), 'utf8')
  assert.equal(source.includes('Narrow the document'), false)
  assert.equal(source.includes('more than 64 fields'), false)
  assert.match(source, /Trace-li stores at most \$\{MAX_EXTRACTION_FRAGMENTS\} fields/)

  async function extractData(count, confidenceFor) {
    const body = discoveredClauseFields(count, confidenceFor)
    const provider = new TalonicExtractionProvider({
      now: () => new Date('2026-09-23T00:00:00.000Z'),
      fetchImpl: async () => talonicEnvelope(body.data, body.confidence),
    })
    return provider.extract(input('tor-ride-transport.pdf', 'application/pdf', {
      organizationId: 'org_trace_demo',
    }))
  }

  const aboveOldCap = await extractData(65)
  assert.equal(aboveOldCap.fragments.length, 65)
  assert.equal(aboveOldCap.fragments[0].text, 'clause_0000: Requirement 0')
  assert.equal(aboveOldCap.fragments[64].text, 'clause_0064: Requirement 64')
  assert.equal(fragmentsTowardRegistryDraft(aboveOldCap.fragments).unmappedFragmentIds.length, 65)

  const atCap = await extractData(MAX_EXTRACTION_FRAGMENTS)
  assert.equal(atCap.fragments.length, MAX_EXTRACTION_FRAGMENTS)
  assert.equal(atCap.fragments.at(-1).text, `clause_${String(MAX_EXTRACTION_FRAGMENTS - 1).padStart(4, '0')}: Requirement ${MAX_EXTRACTION_FRAGMENTS - 1}`)

  const dense = await extractData(MAX_EXTRACTION_FRAGMENTS + 1, index => {
    if (index === 0) return 0.1
    if (index === MAX_EXTRACTION_FRAGMENTS) return 0.99
    return 0.5
  })
  assert.equal(dense.fragments.length, MAX_EXTRACTION_FRAGMENTS)
  assert.equal(dense.fragments.some(fragment => fragment.text.startsWith('clause_0000:')), false)
  assert.equal(dense.fragments[0].text, 'clause_0001: Requirement 1')
  assert.equal(dense.fragments.at(-1).confidence, 0.99)
  assert.equal(
    dense.fragments.at(-1).text,
    `clause_${String(MAX_EXTRACTION_FRAGMENTS).padStart(4, '0')}: Requirement ${MAX_EXTRACTION_FRAGMENTS}`,
  )
  assert.deepEqual(
    dense.fragments.map(fragment => fragment.fragmentId),
    dense.fragments.map((_, index) => `frag.talonic.${dense.sourceFileHash.slice(0, 12)}.${index}`),
  )
  const denseDraft = fragmentsTowardRegistryDraft(dense.fragments, { organizationId: 'org_trace_demo' })
  assert.equal(denseDraft.unmappedFragmentIds.length, MAX_EXTRACTION_FRAGMENTS)
  assert.equal(denseDraft.fields.length, 0)

  const tied = await extractData(MAX_EXTRACTION_FRAGMENTS + 1)
  assert.equal(tied.fragments.length, MAX_EXTRACTION_FRAGMENTS)
  assert.equal(tied.fragments[0].text, 'clause_0000: Requirement 0')
  assert.equal(tied.fragments.some(fragment => fragment.text.startsWith(`clause_${String(MAX_EXTRACTION_FRAGMENTS).padStart(4, '0')}:`)), false)

  const frozen = freezeUploadedPacket({
    extraction: aboveOldCap,
    packId: 'global-fund',
    organizationId: 'org_trace_demo',
    actorId: 'user_fixture_reviewer',
    actorRole: 'Procurement Officer',
    frozenAt: '2026-09-23T12:00:00.000Z',
  })
  assert.equal(verifyFrozenRecord(frozen.record).recordId, frozen.record.recordId)
  assert.equal(frozen.view.fragmentCount, 65)
  assert.equal(frozen.view.unmappedFragmentCount, 65)
  assert.equal(frozen.record.snapshot.fields.length, GLOBAL_FUND_FIELD_KEYS.length)

  const truncatedFreeze = freezeUploadedPacket({
    extraction: dense,
    packId: 'global-fund',
    organizationId: 'org_trace_demo',
    actorId: 'user_fixture_reviewer',
    actorRole: 'Procurement Officer',
    frozenAt: '2026-09-23T12:00:00.000Z',
  })
  assert.equal(verifyFrozenRecord(truncatedFreeze.record).recordId, truncatedFreeze.record.recordId)
  assert.equal(truncatedFreeze.view.fragmentCount, MAX_EXTRACTION_FRAGMENTS)
  assert.equal(truncatedFreeze.view.unmappedFragmentCount, MAX_EXTRACTION_FRAGMENTS)
})

test('a desk pack sends a Talonic schema and keeps markdown as document text', async () => {
  const secret = 'tlnc_test_secret_value'
  process.env.TRACE_TALONIC_API_KEY = secret
  delete process.env.TRACE_TALONIC_BASE_URL
  const calls = []
  const provider = new TalonicExtractionProvider({
    now: () => new Date('2026-09-23T00:00:00.000Z'),
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      const form = init.body
      const schema = JSON.parse(form.get('schema'))
      assert.equal(schema.required, undefined)
      assert.equal(typeof schema.properties['ip.threshold_approver'].description, 'string')
      assert.equal(schema.properties['procurement.po_or_contract'].type, 'string')
      assert.match(form.get('instructions'), /verbatim/i)
      assert.match(form.get('instructions'), /absent/i)
      assert.equal(JSON.parse(form.get('options')).include_raw_text, true)
      assert.equal(form.get('include_provenance'), null)
      assert.equal(form.get('include_markdown'), 'true')
      return jsonResponse(200, {
        status: 'complete',
        created_at: '2026-09-23T12:00:00.000Z',
        data: { 'ip.threshold_approver': 'true' },
        markdown: 'No Regional Director approval is on file.',
        confidence: { overall: 0.66, fields: { 'ip.threshold_approver': 0.99 } },
      })
    },
  })
  const result = await provider.extract(input('packet.pdf', 'application/pdf', { packId: 'unfpa' }))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].init.headers['Idempotency-Key'], `trace-v4-unfpa-${sourceFileHashOf(bytes)}`.slice(0, 64))
  const corpus = result.fragments.find(fragment => fragment.tags?.includes('document_text'))
  assert.equal(corpus?.text, 'No Regional Director approval is on file.')
  assert.equal(corpus?.kind, 'text')
  const outcome = freezeUploadedPacket({
    extraction: result,
    packId: 'unfpa',
    organizationId: 'org_trace_demo',
    actorId: 'user_fixture_reviewer',
    actorRole: 'Procurement Officer',
    frozenAt: '2026-09-23T12:00:00.000Z',
  })
  const approver = outcome.record.snapshot.fields.find(field => field.key === 'ip.threshold_approver')
  assert.equal(approver?.value.state, 'negative')
  assert.equal(approver?.value.state === 'negative' ? approver.value.value : null, false)
  assert.equal(outcome.view.fields.find(field => field.key === 'ip.threshold_approver')?.fromPacket, true)
  assert.equal(outcome.record.snapshot.fields.some(field => field.key === 'waiver.noted'), false)
})

test('a Talonic pack-key value is not a generic waiver and does not become present', async () => {
  process.env.TRACE_TALONIC_API_KEY = 'tlnc_test_secret_value'
  delete process.env.TRACE_TALONIC_BASE_URL
  const provider = new TalonicExtractionProvider({
    now: () => new Date('2026-09-25T12:29:25.869Z'),
    fetchImpl: async () => jsonResponse(200, {
      status: 'complete',
      created_at: '2026-09-25T12:29:25.869Z',
      data: {
        'ip.competitive_or_waiver': 'non-competitive. NGO Partner A was engaged non-competitively in exceptional humanitarian circumstances.',
        'ip.threshold_approver': 'true',
      },
      markdown: [
        'Page 1',
        'No Regional Director approval is on file.',
        'IP selection path: non-competitive. NGO Partner A was engaged non-competitively in exceptional humanitarian circumstances.',
      ].join('\n'),
      confidence: { overall: 0.85, fields: { 'ip.competitive_or_waiver': 0.85, 'ip.threshold_approver': 0.99 } },
    }),
  })
  const result = await provider.extract(input('unfpa-ia-2025-29-sudan-rehearsal.pdf', 'application/pdf', { packId: 'unfpa' }))
  const competitive = result.fragments.find(fragment => fragment.text.startsWith('ip.competitive_or_waiver:'))
  assert.equal(competitive?.kind, 'text')
  assert.equal(competitive?.tags?.includes('document_text'), false)
  const outcome = freezeUploadedPacket({
    extraction: result,
    packId: 'unfpa',
    organizationId: 'org_trace_demo',
    actorId: 'user_fixture_reviewer',
    actorRole: 'Procurement Officer',
    frozenAt: '2026-09-25T12:29:25.869Z',
  })
  const field = outcome.record.snapshot.fields.find(item => item.key === 'ip.competitive_or_waiver')
  assert.equal(field?.value.state, 'missing')
  assert.equal(field?.value.state === 'missing' ? field.value.reason : '', 'Not extracted from this packet.')
  const approver = outcome.record.snapshot.fields.find(item => item.key === 'ip.threshold_approver')
  assert.equal(approver?.value.state, 'negative')
  assert.equal(approver?.value.state === 'negative' ? approver.value.value : null, false)
  assert.equal(outcome.record.snapshot.fields.some(item => item.key === 'waiver.noted'), false)
  assert.equal(outcome.view.fragmentCount, result.fragments.length)
  assert.equal(outcome.view.unmappedFragmentCount, result.fragments.length)
})

test('rules and freeze do not import a Talonic type', () => {
  for (const file of [
    'lib/field-registry/freeze.ts',
    'lib/field-registry/playbook.ts',
    'lib/field-registry/schema.ts',
    'lib/rule-library.ts',
  ]) {
    const source = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')
    assert.equal(/talonic/i.test(source), false, file)
  }
})
