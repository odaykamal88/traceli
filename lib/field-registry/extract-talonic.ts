import 'server-only'

import {
  ExtractionError,
  extractionFileName,
  extractionResultSchema,
  loadExtractionBytes,
  parseExtractionInput,
  resolveExtractionMedia,
  sourceFileHashOf,
  type ExtractionInput,
  type ExtractionProvider,
  type ExtractionResult,
} from '@/lib/field-registry/extract'
import { type FragmentKindHint } from '@/lib/field-registry/schema'

/**
 * Live Talonic HTTP client. There is no SDK in this module.
 *
 * `TRACE_EXTRACTION_PROVIDER=talonic` requires `TRACE_TALONIC_API_KEY`.
 * An empty `TRACE_TALONIC_BASE_URL` uses https://api.talonic.com/v1.
 * The base URL must be https, with no userinfo, query, or hash.
 *
 * The call is `POST {base}/extract` with the file. A synchronous body is
 * mapped into `fragmentSchema`. A 202 is polled on the same host until the
 * document completes or the request budget ends. The API key is a header
 * only: it is not logged, not followed onto another host, and not copied
 * onto the fragment result.
 *
 * Assumptions that still need a live confirmation are listed in
 * docs/eng/extraction-adapter.md.
 */

const EXTRACTOR_ID = 'extractor.talonic'
const DEFAULT_TALONIC_BASE_URL = 'https://api.talonic.com/v1'
const REQUEST_BUDGET_MS = 20_000
const RESPONSE_BODY_LIMIT = 2 * 1024 * 1024
const MAX_POLLS = 6

export type TalonicExtractionOptions = {
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  now?: () => Date
  timeoutMs?: number
  env?: NodeJS.ProcessEnv
}

type TalonicConfig = {
  apiKey: string
  baseUrl: URL
}

type LoadedFile = {
  fileName: string
  mediaType: string
  sourceFileHash: string
  awardId?: string
  organizationId?: string
  bytes: Uint8Array
}

type RequestContext = {
  apiKey: string
  baseUrl: URL
  deadline: number
  headers: Record<string, string>
  request: (url: URL, init: RequestInit) => Promise<Response>
  sleep: (ms: number) => Promise<void>
}

function scrub(error: ExtractionError, secret: string) {
  if (!secret || !error.message.includes(secret)) return error
  return new ExtractionError(error.code, error.message.split(secret).join('redacted'))
}

function resolveTalonicConfig(env: NodeJS.ProcessEnv): TalonicConfig {
  const apiKey = env.TRACE_TALONIC_API_KEY?.trim() ?? ''
  if (!apiKey) {
    throw new ExtractionError(
      'not_configured',
      'Talonic extraction needs TRACE_TALONIC_API_KEY. No request was sent.',
    )
  }
  if (apiKey.length > 512 || /[\u0000-\u001f\u007f]/.test(apiKey)) {
    throw new ExtractionError(
      'invalid_input',
      'TRACE_TALONIC_API_KEY is not a usable token. No request was sent.',
    )
  }
  const baseRaw = env.TRACE_TALONIC_BASE_URL?.trim() || DEFAULT_TALONIC_BASE_URL
  let baseUrl: URL
  try {
    baseUrl = new URL(baseRaw)
  } catch {
    throw new ExtractionError('invalid_input', 'TRACE_TALONIC_BASE_URL must be an https URL. No request was sent.')
  }
  if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
    throw new ExtractionError(
      'invalid_input',
      'TRACE_TALONIC_BASE_URL must be an https URL without credentials or query. No request was sent.',
    )
  }
  return { apiKey, baseUrl }
}

function endpoint(base: URL, path: string) {
  const root = base.href.endsWith('/') ? base : new URL(`${base.href}/`)
  return new URL(path.replace(/^\//, ''), root)
}

function isAllowedTalonicPath(target: URL, base: URL) {
  const basePath = base.pathname.replace(/\/$/, '')
  if (basePath && (target.pathname === basePath || target.pathname.startsWith(`${basePath}/`))) return true
  return target.pathname === '/v1' || target.pathname.startsWith('/v1/')
}

function resolveTalonicUrl(base: URL, value: string) {
  let target: URL
  try {
    target = new URL(value, base)
  } catch {
    throw new ExtractionError('upstream', 'Talonic returned a result link that could not be followed.')
  }
  if (target.protocol !== 'https:' || target.username || target.password || target.hash || target.origin !== base.origin) {
    throw new ExtractionError('upstream', 'Talonic returned a result link outside the configured host. It was not followed.')
  }
  if (!isAllowedTalonicPath(target, base)) {
    throw new ExtractionError('upstream', 'Talonic returned a result link outside the extraction API. It was not followed.')
  }
  return target
}

function isTalonicId(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function unitInterval(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function defaultSleep(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms)
  })
}

function isAbortError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  return 'name' in error && error.name === 'AbortError'
}

async function readJsonBody(response: Response): Promise<unknown> {
  const declared = response.headers.get('content-length')
  if (declared !== null && declared.trim() !== '') {
    if (!/^\d+$/.test(declared) || Number(declared) > RESPONSE_BODY_LIMIT) {
      await response.body?.cancel()
      throw new ExtractionError('upstream', 'Talonic returned a response that was too large to read.')
    }
  }
  if (!response.body) return null
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > RESPONSE_BODY_LIMIT) {
        await reader.cancel()
        throw new ExtractionError('upstream', 'Talonic returned a response that was too large to read.')
      }
      chunks.push(chunk.value)
    }
  } catch (error) {
    if (error instanceof ExtractionError) throw error
    throw new ExtractionError('upstream', 'Talonic returned a response that could not be read.')
  }
  if (size === 0) return null
  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown
  } catch {
    throw new ExtractionError('upstream', 'Talonic returned a response that could not be read.')
  }
}

function safeErrorCode(body: unknown) {
  const record = asRecord(body)
  if (!record) return ''
  const nested = asRecord(record.error)
  const raw = nested?.code ?? record.code ?? record.error_code ?? (typeof record.error === 'string' ? record.error : '')
  if (typeof raw !== 'string') return ''
  const token = raw.trim().toLowerCase()
  return /^[a-z0-9_]{1,64}$/.test(token) ? token : ''
}

function statusError(status: number, code: string): ExtractionError {
  if (status === 401 || status === 403 || code === 'unauthorized') {
    return new ExtractionError(
      'unauthorized',
      'Talonic refused the API key. Check TRACE_TALONIC_API_KEY. No fragments were returned.',
    )
  }
  if (status === 413 || code === 'file_too_large') {
    return new ExtractionError('too_large', 'Talonic rejected the file as too large. No fragments were returned.')
  }
  if (status === 408 || status === 504) {
    return new ExtractionError('timeout', 'Talonic did not respond in time. No fragments were returned.')
  }
  if (status === 429 || code === 'rate_limited') {
    return new ExtractionError('upstream', 'Talonic rate limited this extraction. Try again later.')
  }
  if (code === 'unsupported_file_type') {
    return new ExtractionError('unsupported_media', 'Talonic does not accept this file type. No fragments were returned.')
  }
  if (status >= 400 && status < 500) {
    return new ExtractionError('upstream', 'Talonic could not read this file. Check the file type and try again.')
  }
  return new ExtractionError('upstream', 'Talonic could not complete extraction. No fragments were returned.')
}

async function failStatus(response: Response): Promise<never> {
  let code = ''
  if (response.status === 400 || response.status === 413 || response.status === 422) {
    try {
      code = safeErrorCode(await readJsonBody(response))
    } catch (error) {
      if (error instanceof ExtractionError && error.message.includes('too large')) throw error
      code = ''
    }
  } else {
    await response.body?.cancel()
  }
  throw statusError(response.status, code)
}

function budgetOf(timeoutMs: number | undefined) {
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs)) return REQUEST_BUDGET_MS
  return Math.min(Math.max(timeoutMs, 1), 60_000)
}

function kindFromText(value: string): FragmentKindHint | undefined {
  const lower = value.toLowerCase()
  if (lower.includes('waiver')) return 'waiver'
  if (lower.includes('capacity')) return 'capacity_letter'
  if (lower.includes('annex')) return 'annex'
  if (lower.includes('pricing') || lower.includes('line_item') || lower.includes('unit_price')) return 'pricing_table'
  if (lower.includes('email') || lower.includes('subject') || lower.includes('message_id')) return 'email_header'
  return undefined
}

function kindFromFile(fileName: string, mediaType: string, typeDetected: string | undefined): FragmentKindHint {
  if (typeDetected) {
    const fromType = kindFromText(typeDetected)
    if (fromType) return fromType
  }
  const lower = fileName.toLowerCase()
  if (mediaType === 'message/rfc822' || mediaType === 'application/vnd.ms-outlook') return 'email_header'
  if (lower.includes('waiver')) return 'waiver'
  if (
    mediaType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || lower.includes('pricing')
  ) {
    return 'pricing_table'
  }
  if (lower.includes('capacity')) return 'capacity_letter'
  if (lower.includes('annex')) return 'annex'
  return 'text'
}

function fieldLabel(key: string) {
  return key.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 80)
}

function renderStructured(value: unknown) {
  try {
    const json = JSON.stringify(value)
    return json && json !== '{}' && json !== '[]' ? json : null
  } catch {
    return null
  }
}

function renderValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return value.length === 0 ? null : renderStructured(value)
  if (asRecord(value)) return renderStructured(value)
  return null
}

function fieldPayload(value: unknown) {
  const record = asRecord(value)
  if (record && 'value' in record && ('confidence' in record || 'provenance' in record || 'page' in record)) {
    return {
      value: record.value,
      confidence: unitInterval(record.confidence),
      entry: asRecord(record.provenance) ?? record,
    }
  }
  return { value, confidence: undefined as number | undefined, entry: null as Record<string, unknown> | null }
}

function provenanceEntry(key: string, envelope: Record<string, unknown>) {
  const provenance = asRecord(envelope.provenance)
  if (!provenance) return null
  return asRecord(provenance[key])
}

function pageOf(entry: Record<string, unknown> | null) {
  if (!entry) return undefined
  if (typeof entry.page === 'number' && Number.isInteger(entry.page) && entry.page >= 1 && entry.page <= 10000) {
    return entry.page
  }
  if (
    typeof entry.page_index === 'number'
    && Number.isInteger(entry.page_index)
    && entry.page_index >= 0
    && entry.page_index < 10000
  ) {
    return entry.page_index + 1
  }
  return undefined
}

function quoteOf(entry: Record<string, unknown> | null) {
  if (!entry) return undefined
  for (const key of ['raw_text', 'source_text', 'text', 'quote']) {
    const value = entry[key]
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (!trimmed || trimmed.length > 4000) continue
    return trimmed
  }
  return undefined
}

function confidenceFor(key: string, envelope: Record<string, unknown>, fallback: number) {
  const confidence = asRecord(envelope.confidence)
  if (!confidence) return fallback
  const fields = asRecord(confidence.fields)
  const fromField = fields ? unitInterval(fields[key]) : undefined
  if (fromField !== undefined) return fromField
  const direct = unitInterval(confidence[key])
  if (direct !== undefined) return direct
  return unitInterval(confidence.overall) ?? fallback
}

function extractedAtOf(envelope: Record<string, unknown>, now: Date) {
  if (typeof envelope.created_at === 'string' && !Number.isNaN(Date.parse(envelope.created_at))) {
    return new Date(envelope.created_at).toISOString()
  }
  return now.toISOString()
}

function sourceRefFor(fileName: string, mediaType: string, page: number | undefined) {
  if (mediaType === 'message/rfc822' || mediaType === 'application/vnd.ms-outlook') {
    return { kind: 'message' as const, id: page ? `message-${page}` : 'message-1', label: fileName }
  }
  return { kind: 'page' as const, id: page ? `page-${page}` : 'page-1', label: fileName }
}

function typeDetectedOf(envelope: Record<string, unknown>) {
  const document = asRecord(envelope.document)
  return typeof document?.type_detected === 'string' ? document.type_detected : undefined
}

function fragmentText(label: string, rendered: string) {
  const text = `${label}: ${rendered}`
  return text.length <= 16000 ? text : `${text.slice(0, 15999)}…`
}

function mapTalonicEnvelope(envelope: Record<string, unknown>, loaded: LoadedFile, now: Date): ExtractionResult {
  const extractedAt = extractedAtOf(envelope, now)
  const data = asRecord(envelope.data) ?? {}
  const fragments = []
  for (const key of Object.keys(data).sort()) {
    const payload = fieldPayload(data[key])
    const rendered = renderValue(payload.value)
    const label = fieldLabel(key)
    if (!rendered || !label) continue
    const provenance = payload.entry ?? provenanceEntry(key, envelope)
    const quote = quoteOf(provenance)
    const kind = kindFromText(key) ?? 'text'
    fragments.push({
      fragmentId: `frag.talonic.${loaded.sourceFileHash.slice(0, 12)}.${fragments.length}`,
      sourceFileHash: loaded.sourceFileHash,
      sourceRef: sourceRefFor(loaded.fileName, loaded.mediaType, pageOf(provenance)),
      text: fragmentText(label, rendered),
      extractedAt,
      confidence: payload.confidence ?? confidenceFor(key, envelope, 0.5),
      extractorId: EXTRACTOR_ID,
      kind,
      tags: [kind],
      ...(quote ? { spans: [{ text: quote, label }] } : {}),
    })
  }
  if (fragments.length > 64) {
    throw new ExtractionError('upstream', 'Talonic returned more than 64 fields. Narrow the document and try again.')
  }
  if (fragments.length === 0) {
    const markdown = typeof envelope.markdown === 'string' ? envelope.markdown.trim() : ''
    if (!markdown) {
      throw new ExtractionError('upstream', 'Talonic returned no usable text. No fragments were stored.')
    }
    const kind = kindFromFile(loaded.fileName, loaded.mediaType, typeDetectedOf(envelope))
    const text = markdown.length <= 16000 ? markdown : `${markdown.slice(0, 15999)}…`
    const overall = unitInterval(asRecord(envelope.confidence)?.overall) ?? 0.5
    fragments.push({
      fragmentId: `frag.talonic.${loaded.sourceFileHash.slice(0, 12)}.0`,
      sourceFileHash: loaded.sourceFileHash,
      sourceRef: sourceRefFor(loaded.fileName, loaded.mediaType, undefined),
      text,
      extractedAt,
      confidence: overall,
      extractorId: EXTRACTOR_ID,
      kind,
      tags: [kind],
    })
  }
  const parsed = extractionResultSchema.safeParse({
    schemaVersion: 'extraction-result-v1',
    providerId: 'talonic',
    extractorId: EXTRACTOR_ID,
    fileName: loaded.fileName,
    mediaType: loaded.mediaType,
    sourceFileHash: loaded.sourceFileHash,
    ...(loaded.awardId ? { awardId: loaded.awardId } : {}),
    ...(loaded.organizationId ? { organizationId: loaded.organizationId } : {}),
    fragments,
  })
  if (!parsed.success) {
    throw new ExtractionError('upstream', 'Talonic returned fields that could not be stored as fragments.')
  }
  return parsed.data
}

function needsPoll(record: Record<string, unknown>) {
  if (asRecord(record.data) || (typeof record.markdown === 'string' && record.markdown.trim())) return false
  return typeof record.poll_url === 'string' || record.status === 'processing'
}

function pollTarget(record: Record<string, unknown>, base: URL) {
  if (typeof record.poll_url === 'string' && record.poll_url.trim()) {
    return resolveTalonicUrl(base, record.poll_url.trim())
  }
  const document = asRecord(record.document)
  const id = typeof document?.id === 'string' ? document.id : ''
  if (isTalonicId(id)) return endpoint(base, `documents/${id}`)
  throw new ExtractionError('upstream', 'Talonic accepted the file but did not return a status link.')
}

function selectExtraction(body: unknown) {
  const record = asRecord(body)
  if (!record) return null
  if (asRecord(record.data) || typeof record.markdown === 'string') return record
  const list = Array.isArray(record.data) ? record.data : Array.isArray(record.extractions) ? record.extractions : null
  if (!list) return null
  for (const item of list) {
    const entry = asRecord(item)
    if (entry && (asRecord(entry.data) || typeof entry.markdown === 'string')) return entry
  }
  return null
}

function summaryLink(body: unknown) {
  const record = asRecord(body)
  const list = Array.isArray(record?.data) ? record.data : []
  for (const item of list) {
    const entry = asRecord(item)
    if (!entry) continue
    const links = asRecord(entry.links)
    if (typeof links?.self === 'string') return links.self
    if (typeof entry.id === 'string' && isTalonicId(entry.id)) return `extractions/${entry.id}`
  }
  return ''
}

async function readSuccess(response: Response) {
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel()
    throw new ExtractionError('upstream', 'Talonic redirected the extraction request. It was not followed.')
  }
  if (response.status !== 200 && response.status !== 201) await failStatus(response)
  const body = await readJsonBody(response)
  const record = asRecord(body)
  if (!record) throw new ExtractionError('upstream', 'Talonic returned a response that could not be read.')
  return record
}

async function loadCompleted(document: Record<string, unknown>, ctx: RequestContext) {
  const data = asRecord(document.data)
  const markdown = typeof document.markdown === 'string' ? document.markdown.trim() : ''
  if ((data && Object.keys(data).length > 0) || markdown) return document
  const extractionId = typeof document.latest_extraction_id === 'string' ? document.latest_extraction_id : ''
  if (isTalonicId(extractionId)) {
    return readSuccess(await ctx.request(endpoint(ctx.baseUrl, `extractions/${extractionId}`), {
      method: 'GET',
      headers: ctx.headers,
      redirect: 'manual',
    }))
  }
  const links = asRecord(document.links)
  const extractions = typeof links?.extractions === 'string' ? links.extractions : ''
  if (!extractions) throw new ExtractionError('upstream', 'Talonic finished without an extraction result.')
  const list = await readSuccess(await ctx.request(resolveTalonicUrl(ctx.baseUrl, extractions), {
    method: 'GET',
    headers: ctx.headers,
    redirect: 'manual',
  }))
  const selected = selectExtraction(list)
  if (selected) return selected
  const link = summaryLink(list)
  if (!link) throw new ExtractionError('upstream', 'Talonic finished without an extraction result.')
  return readSuccess(await ctx.request(resolveTalonicUrl(ctx.baseUrl, link), {
    method: 'GET',
    headers: ctx.headers,
    redirect: 'manual',
  }))
}

async function pollExtraction(start: Record<string, unknown>, ctx: RequestContext) {
  const target = pollTarget(start, ctx.baseUrl)
  let delay = 0
  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    if (ctx.deadline - Date.now() <= 0) {
      throw new ExtractionError('timeout', 'Talonic is still processing this document. No fragments were returned.')
    }
    if (delay > 0) await ctx.sleep(Math.min(delay, ctx.deadline - Date.now()))
    if (ctx.deadline - Date.now() <= 0) {
      throw new ExtractionError('timeout', 'Talonic is still processing this document. No fragments were returned.')
    }
    const record = await readSuccess(await ctx.request(target, {
      method: 'GET',
      headers: ctx.headers,
      redirect: 'manual',
    }))
    const status = typeof record.status === 'string' ? record.status.toLowerCase() : ''
    if (status === 'error' || status === 'failed') {
      throw new ExtractionError('upstream', 'Talonic could not extract this document. No fragments were returned.')
    }
    const data = asRecord(record.data)
    const hasMarkdown = typeof record.markdown === 'string' && record.markdown.trim().length > 0
    if (status === 'completed' || status === 'complete' || (data && Object.keys(data).length > 0) || hasMarkdown) {
      return loadCompleted(record, ctx)
    }
    delay = delay === 0 ? 1000 : Math.min(delay * 2, 8000)
  }
  throw new ExtractionError('timeout', 'Talonic is still processing this document. No fragments were returned.')
}

function authHeaders(apiKey: string) {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
}

async function postExtract(ctx: RequestContext, loaded: LoadedFile) {
  const form = new FormData()
  const copy = new Uint8Array(loaded.bytes.byteLength)
  copy.set(loaded.bytes)
  form.append('file', new Blob([copy], { type: loaded.mediaType }), loaded.fileName)
  form.append('include_markdown', 'true')
  // Documented on the Talonic MCP/SDK surface. The POST form reference documents include_markdown only.
  form.append('include_provenance', 'true')
  const response = await ctx.request(endpoint(ctx.baseUrl, 'extract'), {
    method: 'POST',
    headers: {
      ...authHeaders(ctx.apiKey),
      'Idempotency-Key': `trace-${loaded.sourceFileHash}`,
    },
    body: form,
    redirect: 'manual',
  })
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel()
    throw new ExtractionError('upstream', 'Talonic redirected the extraction request. It was not followed.')
  }
  if (response.status === 202) {
    const record = asRecord(await readJsonBody(response))
    if (!record) throw new ExtractionError('upstream', 'Talonic accepted the file but did not return a status link.')
    return pollExtraction(record, ctx)
  }
  if (response.status !== 200 && response.status !== 201) await failStatus(response)
  const record = asRecord(await readJsonBody(response))
  if (!record) throw new ExtractionError('upstream', 'Talonic returned a response that could not be read.')
  if (needsPoll(record)) return pollExtraction(record, ctx)
  return record
}

export class TalonicExtractionProvider implements ExtractionProvider {
  readonly providerId = 'talonic'
  readonly options: TalonicExtractionOptions

  constructor(options: TalonicExtractionOptions = {}) {
    this.options = options
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const parsed = parseExtractionInput(input)
    const fileName = extractionFileName(parsed.fileName)
    resolveExtractionMedia(fileName, parsed.mediaType)
    const config = resolveTalonicConfig(this.options.env ?? process.env)
    try {
      const loaded = await loadExtractionBytes(parsed)
      const bytes = loaded.bytes
      const file: LoadedFile = {
        fileName: loaded.fileName,
        mediaType: loaded.mediaType,
        sourceFileHash: sourceFileHashOf(bytes),
        bytes,
        ...(loaded.input.awardId ? { awardId: loaded.input.awardId } : {}),
        ...(loaded.input.organizationId ? { organizationId: loaded.input.organizationId } : {}),
      }
      const fetchImpl = this.options.fetchImpl ?? globalThis.fetch
      const sleep = this.options.sleep ?? defaultSleep
      const deadline = Date.now() + budgetOf(this.options.timeoutMs)
      const ctx: RequestContext = {
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        deadline,
        headers: authHeaders(config.apiKey),
        sleep,
        request: (url, init) => talonicRequest(fetchImpl, url, init, deadline - Date.now()),
      }
      const envelope = await postExtract(ctx, file)
      return mapTalonicEnvelope(envelope, file, this.options.now?.() ?? new Date())
    } catch (error) {
      if (error instanceof ExtractionError) throw scrub(error, config.apiKey)
      throw new ExtractionError('upstream', 'Talonic could not complete extraction. No fragments were returned.')
    }
  }
}

function talonicRequest(fetchImpl: typeof fetch, url: URL, init: RequestInit, remaining: number) {
  if (remaining <= 0) {
    return Promise.reject(new ExtractionError('timeout', 'Talonic did not respond in time. No fragments were returned.'))
  }
  const controller = new AbortController()
  let settled = false
  return new Promise<Response>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort()
      if (settled) return
      settled = true
      reject(new ExtractionError('timeout', 'Talonic did not respond in time. No fragments were returned.'))
    }, remaining)
    fetchImpl(url, { ...init, signal: controller.signal }).then(
      response => {
        if (settled) {
          void response.body?.cancel()
          return
        }
        settled = true
        clearTimeout(timer)
        resolve(response)
      },
      error => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (controller.signal.aborted || isAbortError(error)) {
          reject(new ExtractionError('timeout', 'Talonic did not respond in time. No fragments were returned.'))
          return
        }
        reject(new ExtractionError('upstream', 'Talonic could not be reached. No fragments were returned.'))
      },
    )
  })
}
