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
  extractionResultSchema,
  fragmentsTowardRegistryDraft,
  sourceFileHashOf,
} from '../../lib/field-registry/extract.ts'
import { MockExtractionProvider } from '../../lib/field-registry/extract-mock.ts'
import { getExtractionProvider } from '../../lib/field-registry/extract-provider.ts'
import { TalonicExtractionProvider } from '../../lib/field-registry/extract-talonic.ts'
import { extractUploadedFile, extractionHttpError } from '../../lib/field-registry/extract-upload.ts'
import { freezeAtJudgment } from '../../lib/field-registry/freeze.ts'
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

test('the Talonic skeleton never reads a file or the network', async () => {
  const provider = new TalonicExtractionProvider()
  await assert.rejects(
    provider.extract(input('payload.exe', 'application/octet-stream')),
    error => error instanceof ExtractionError && error.code === 'unsupported_media',
  )
  const missing = {
    fileName: 'waiver.pdf',
    mediaType: 'application/pdf',
    path: '/tmp/does-not-exist-trace-extract.pdf',
  }
  await assert.rejects(provider.extract(missing), error => error instanceof ExtractionError && error.code === 'not_configured')
  process.env.TRACE_TALONIC_API_KEY = 'local-test'
  process.env.TRACE_TALONIC_BASE_URL = 'http://extraction.example.invalid'
  await assert.rejects(provider.extract(input('notes.txt', 'text/plain')), error => error instanceof ExtractionError && error.code === 'invalid_input')
  process.env.TRACE_TALONIC_BASE_URL = 'https://extraction.example.invalid/v1'
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = () => {
    calls += 1
    throw new Error('network')
  }
  try {
    await assert.rejects(
      provider.extract(input('notes.txt', 'text/plain')),
      error => error instanceof ExtractionError && error.code === 'unimplemented',
    )
    assert.equal(calls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
  const source = readFileSync(new URL('../../lib/field-registry/extract-talonic.ts', import.meta.url), 'utf8')
  assert.equal(source.includes('fetch('), false)
  assert.equal(source.includes('node:http'), false)
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
