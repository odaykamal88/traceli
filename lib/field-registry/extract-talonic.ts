import 'server-only'

import {
  ExtractionError,
  extractionFileName,
  extractionResultSchema,
  loadExtractionBytes,
  parseExtractionInput,
  resolveExtractionMedia,
  sourceFileHashOf,
  type ExtractionErrorCode,
  type ExtractionInput,
  type ExtractionProvider,
  type ExtractionResult,
  type ExtractionUpstreamDetail,
} from '@/lib/field-registry/extract'
import { type FragmentKindHint } from '@/lib/field-registry/schema'

/**
 * Live Talonic HTTP client. There is no SDK in this module.
 *
 * `TRACE_EXTRACTION_PROVIDER=talonic` requires `TRACE_TALONIC_API_KEY`.
 * An empty `TRACE_TALONIC_BASE_URL` uses https://api.talonic.com/v1.
 * The base URL must be https, with no userinfo, query, or hash.
 *
 * The call is `POST {base}/extract` with the file and `include_markdown`.
 * `include_provenance` is not sent: the POST form and the official SDK do
 * not list it. Provenance is still mapped when the body includes it.
 * A synchronous body is mapped into `fragmentSchema`. A 202 is polled on
 * the same host until the document completes, the primary budget ends, or
 * one bounded extension poll still finds it processing. The API key is a
 * header only: it is not logged, not followed onto another host, and not
 * copied onto the fragment result or the error JSON.
 *
 * Assumptions that still need a live confirmation are listed in
 * docs/eng/extraction-adapter.md.
 */

const EXTRACTOR_ID = 'extractor.talonic'
const DEFAULT_TALONIC_BASE_URL = 'https://api.talonic.com/v1'
/** Wait while Talonic reports processing, then one extension poll. */
const PRIMARY_BUDGET_MS = 150_000
const EXTENSION_MS = 20_000
const REQUEST_BUDGET_MS = PRIMARY_BUDGET_MS + EXTENSION_MS
const BACKOFF_CAP_MS = 8_000
const RESPONSE_BODY_LIMIT = 2 * 1024 * 1024
/** Safety cap. The deadline stops a live poll first. */
const MAX_POLLS = 30

export type TalonicExtractionOptions = {
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  now?: () => Date
  /** Epoch milliseconds. Defaults to `Date.now`. Tests can freeze or step it. */
  clock?: () => number
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
  extension: number
  clock: () => number
  headers: Record<string, string>
  request: (url: URL, init: RequestInit) => Promise<Response>
  sleep: (ms: number) => Promise<void>
}

const upstreamCodePattern = /^[A-Za-z0-9_]{1,64}$/
const upstreamRequestIdPattern = /^req_[A-Za-z0-9]{6,80}$/
const IDEMPOTENCY_PREFIX = 'trace-v2-'

function redact(value: string, secret: string, limit: number) {
  let text = secret ? value.split(secret).join('redacted') : value
  text = text
    .replace(/bearer\s+[a-z0-9._~+/=-]{8,}/gi, 'Bearer redacted')
    .replace(/\btlnc_[a-z0-9_-]{8,}\b/gi, 'redacted')
    .replace(/authorization\s*[:=]\s*\S+/gi, 'Authorization redacted')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length > limit) return `${text.slice(0, limit - 1)}…`
  return text
}

function redactDetail(detail: ExtractionUpstreamDetail | undefined, secret: string): ExtractionUpstreamDetail | undefined {
  if (!detail) return undefined
  const message = detail.message ? redact(detail.message, secret, 180) : ''
  const code = detail.code && (!secret || !detail.code.includes(secret)) ? detail.code : ''
  const requestId = detail.requestId && (!secret || !detail.requestId.includes(secret)) ? detail.requestId : ''
  const next: ExtractionUpstreamDetail = {}
  if (detail.status !== undefined) next.status = detail.status
  if (code) next.code = code
  if (message) next.message = message
  if (requestId) next.requestId = requestId
  if (next.status === undefined && !next.code && !next.message && !next.requestId) return undefined
  return next
}

function scrub(error: ExtractionError, secret: string) {
  const message = redact(error.message, secret, 500)
  const upstream = redactDetail(error.upstream, secret)
  const sameUpstream = JSON.stringify(upstream ?? null) === JSON.stringify(error.upstream ?? null)
  if (message === error.message && sameUpstream) return error
  return new ExtractionError(error.code, message, upstream)
}

function upstreamError(
  code: ExtractionErrorCode,
  summary: string,
  detail: ExtractionUpstreamDetail | undefined,
  secret: string,
) {
  return new ExtractionError(code, redact(summary, secret, 500), redactDetail(detail, secret))
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

function safeToken(value: unknown, pattern: RegExp) {
  if (typeof value !== 'string') return ''
  const token = value.trim()
  return pattern.test(token) ? token : ''
}

function upstreamCode(body: unknown) {
  const record = asRecord(body)
  if (!record) return ''
  const nested = asRecord(record.error)
  const raw = nested?.code ?? record.code ?? record.error_code ?? (typeof record.error === 'string' ? record.error : '')
  return safeToken(raw, upstreamCodePattern)
}

function upstreamMessage(body: unknown) {
  const record = asRecord(body)
  if (!record) return ''
  const nested = asRecord(record.error)
  if (typeof record.message === 'string') return record.message
  if (typeof nested?.message === 'string') return nested.message
  return ''
}

function detailFrom(body: unknown, status: number | undefined, header: string | null): ExtractionUpstreamDetail | undefined {
  const record = asRecord(body)
  const requestId = safeToken(
    (typeof record?.request_id === 'string' ? record.request_id : '') || header || '',
    upstreamRequestIdPattern,
  )
  const code = upstreamCode(body)
  const message = upstreamMessage(body)
  const detail: ExtractionUpstreamDetail = {}
  if (status !== undefined) detail.status = status
  if (code) detail.code = code
  if (message) detail.message = message
  if (requestId) detail.requestId = requestId
  if (detail.status === undefined && !detail.code && !detail.message && !detail.requestId) return undefined
  return detail
}

function classifyStatus(status: number, code: string): { errorCode: ExtractionErrorCode, summary: string } {
  const http = `HTTP ${status}`
  const normalized = code.toLowerCase()
  if (status === 401 || (status !== 403 && (normalized === 'unauthorized' || normalized === 'auth_required'))) {
    return {
      errorCode: 'unauthorized',
      summary: `Talonic refused the API key (${http}). Check TRACE_TALONIC_API_KEY. No fragments were returned.`,
    }
  }
  if (status === 403 || normalized === 'insufficient_permissions') {
    return {
      errorCode: 'unauthorized',
      summary: `Talonic refused this extraction (${http}). No fragments were returned.`,
    }
  }
  if (status === 413 || normalized === 'file_too_large') {
    return {
      errorCode: 'too_large',
      summary: `Talonic rejected the file as too large (${http}). No fragments were returned.`,
    }
  }
  if (status === 408 || status === 504) {
    return {
      errorCode: 'timeout',
      summary: `Talonic did not respond in time (${http}). No fragments were returned.`,
    }
  }
  if (status === 429 || normalized === 'rate_limited' || normalized === 'rate_limit_exceeded') {
    return {
      errorCode: 'upstream',
      summary: `Talonic rate limited this extraction (${http}). Try again later.`,
    }
  }
  if (normalized === 'unsupported_file_type') {
    return {
      errorCode: 'unsupported_media',
      summary: `Talonic does not accept this file type (${http}). No fragments were returned.`,
    }
  }
  if (normalized === 'extraction_failed') {
    return {
      errorCode: 'upstream',
      summary: `Talonic finished without usable text (${http}). No fragments were returned.`,
    }
  }
  if (status >= 500) {
    if (status === 500) {
      return {
        errorCode: 'upstream',
        summary: `Talonic reported an internal error (${http}). No fragments were returned.`,
      }
    }
    if (status === 502) {
      return {
        errorCode: 'upstream',
        summary: `Talonic returned a gateway error (${http}). No fragments were returned.`,
      }
    }
    if (status === 503) {
      return {
        errorCode: 'upstream',
        summary: `Talonic is unavailable (${http}). No fragments were returned.`,
      }
    }
    return {
      errorCode: 'upstream',
      summary: `Talonic could not complete extraction (${http}). No fragments were returned.`,
    }
  }
  if (status >= 400 && status < 500) {
    return {
      errorCode: 'upstream',
      summary: `Talonic rejected this file (${http}). Check the file and try again. No fragments were returned.`,
    }
  }
  return {
    errorCode: 'upstream',
    summary: `Talonic could not complete extraction (${http}). No fragments were returned.`,
  }
}

async function readErrorDetail(response: Response, secret: string) {
  const headerId = response.headers.get('x-request-id')
  try {
    return redactDetail(detailFrom(await readJsonBody(response), response.status, headerId), secret)
  } catch (error) {
    if (error instanceof ExtractionError && error.message.includes('too large')) {
      throw upstreamError(
        'upstream',
        `Talonic returned a response that was too large to read (HTTP ${response.status}).`,
        { status: response.status },
        secret,
      )
    }
    const requestId = safeToken(headerId ?? '', upstreamRequestIdPattern)
    return redactDetail({
      status: response.status,
      ...(requestId ? { requestId } : {}),
    }, secret)
  }
}

async function failStatus(response: Response, secret: string): Promise<never> {
  const detail = await readErrorDetail(response, secret)
  const code = detail?.code?.toLowerCase() ?? ''
  const classified = classifyStatus(response.status, code)
  throw upstreamError(classified.errorCode, classified.summary, detail, secret)
}

function resolveBudget(timeoutMs: number | undefined) {
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs)) {
    return { total: REQUEST_BUDGET_MS, extension: EXTENSION_MS }
  }
  const total = Math.min(Math.max(Math.floor(timeoutMs), 1), REQUEST_BUDGET_MS)
  const extension = total > PRIMARY_BUDGET_MS ? total - PRIMARY_BUDGET_MS : 0
  return { total, extension }
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

async function readSuccess(response: Response, ctx: RequestContext) {
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel()
    throw new ExtractionError('upstream', 'Talonic redirected the extraction request. It was not followed.')
  }
  if (response.status !== 200 && response.status !== 201) await failStatus(response, ctx.apiKey)
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
    }), ctx)
  }
  const links = asRecord(document.links)
  const extractions = typeof links?.extractions === 'string' ? links.extractions : ''
  if (!extractions) throw new ExtractionError('upstream', 'Talonic finished without an extraction result.')
  const list = await readSuccess(await ctx.request(resolveTalonicUrl(ctx.baseUrl, extractions), {
    method: 'GET',
    headers: ctx.headers,
    redirect: 'manual',
  }), ctx)
  const selected = selectExtraction(list)
  if (selected) return selected
  const link = summaryLink(list)
  if (!link) throw new ExtractionError('upstream', 'Talonic finished without an extraction result.')
  return readSuccess(await ctx.request(resolveTalonicUrl(ctx.baseUrl, link), {
    method: 'GET',
    headers: ctx.headers,
    redirect: 'manual',
  }), ctx)
}

function documentIdOf(record: Record<string, unknown>) {
  const document = asRecord(record.document)
  for (const value of [document?.id, record.id, record.document_id]) {
    if (typeof value === 'string' && isTalonicId(value.trim())) return value.trim()
  }
  return ''
}

function stillProcessingError(record: Record<string, unknown>, secret: string, headerId: string | null) {
  const detail = redactDetail(detailFrom(record, undefined, headerId), secret)
  const documentId = documentIdOf(record)
  const safeDocumentId = documentId && (!secret || !documentId.includes(secret)) ? documentId : ''
  const requestId = detail?.requestId ?? ''
  const refs = [
    safeDocumentId ? `document ${safeDocumentId}` : '',
    requestId ? `request ${requestId}` : '',
  ].filter(Boolean)
  const which = refs.length > 0 ? ` (${refs.join(', ')})` : ''
  return upstreamError(
    'timeout',
    `Talonic is still processing this document${which}. Try again. No fragments were returned.`,
    detail,
    secret,
  )
}

function applyPollRecord(record: Record<string, unknown>, ctx: RequestContext, headerId: string | null) {
  const status = typeof record.status === 'string' ? record.status.toLowerCase() : ''
  if (status === 'error' || status === 'failed') {
    throw upstreamError(
      'upstream',
      'Talonic could not extract this document. No fragments were returned.',
      detailFrom(record, undefined, headerId),
      ctx.apiKey,
    )
  }
  const data = asRecord(record.data)
  const hasMarkdown = typeof record.markdown === 'string' && record.markdown.trim().length > 0
  if (status === 'completed' || status === 'complete' || (data && Object.keys(data).length > 0) || hasMarkdown) {
    return true
  }
  return false
}

async function pollOnce(target: URL, ctx: RequestContext) {
  const response = await ctx.request(target, {
    method: 'GET',
    headers: ctx.headers,
    redirect: 'manual',
  })
  return {
    record: await readSuccess(response, ctx),
    headerId: response.headers.get('x-request-id'),
  }
}

async function observePoll(
  target: URL,
  ctx: RequestContext,
  last: Record<string, unknown>,
  headerId: string | null,
) {
  try {
    return await pollOnce(target, ctx)
  } catch (error) {
    if (error instanceof ExtractionError && error.code === 'timeout' && !error.upstream) {
      throw stillProcessingError(last, ctx.apiKey, headerId)
    }
    throw error
  }
}

async function pollExtraction(start: Record<string, unknown>, ctx: RequestContext, headerId: string | null = null) {
  const target = pollTarget(start, ctx.baseUrl)
  const primaryEnds = ctx.deadline - ctx.extension
  let delay = 0
  let last = start
  let lastHeader = headerId
  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    if (ctx.clock() >= primaryEnds) break
    if (delay > 0) {
      const wait = Math.min(delay, primaryEnds - ctx.clock())
      if (wait > 0) await ctx.sleep(wait)
    }
    if (ctx.clock() >= primaryEnds) break
    const polled = await observePoll(target, ctx, last, lastHeader)
    last = polled.record
    lastHeader = polled.headerId
    if (applyPollRecord(last, ctx, lastHeader)) return loadCompleted(last, ctx)
    delay = delay === 0 ? 1000 : Math.min(delay * 2, BACKOFF_CAP_MS)
  }
  if (ctx.extension > 0 && ctx.clock() < ctx.deadline) {
    const wait = Math.min(BACKOFF_CAP_MS, ctx.deadline - ctx.clock())
    if (wait > 0) await ctx.sleep(wait)
    if (ctx.clock() < ctx.deadline) {
      const polled = await observePoll(target, ctx, last, lastHeader)
      last = polled.record
      lastHeader = polled.headerId
      if (applyPollRecord(last, ctx, lastHeader)) return loadCompleted(last, ctx)
    }
  }
  throw stillProcessingError(last, ctx.apiKey, lastHeader)
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
  const response = await ctx.request(endpoint(ctx.baseUrl, 'extract'), {
    method: 'POST',
    headers: {
      ...authHeaders(ctx.apiKey),
      'Idempotency-Key': `${IDEMPOTENCY_PREFIX}${loaded.sourceFileHash}`.slice(0, 64),
    },
    body: form,
    redirect: 'manual',
  })
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel()
    throw new ExtractionError('upstream', 'Talonic redirected the extraction request. It was not followed.')
  }
  if (response.status === 202) {
    const acceptedHeader = response.headers.get('x-request-id')
    const record = asRecord(await readJsonBody(response))
    if (!record) throw new ExtractionError('upstream', 'Talonic accepted the file but did not return a status link.')
    return pollExtraction(record, ctx, acceptedHeader)
  }
  if (response.status !== 200 && response.status !== 201) await failStatus(response, ctx.apiKey)
  const acceptedHeader = response.headers.get('x-request-id')
  const record = asRecord(await readJsonBody(response))
  if (!record) throw new ExtractionError('upstream', 'Talonic returned a response that could not be read.')
  if (needsPoll(record)) return pollExtraction(record, ctx, acceptedHeader)
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
      const clock = this.options.clock ?? Date.now
      const budget = resolveBudget(this.options.timeoutMs)
      const deadline = clock() + budget.total
      const ctx: RequestContext = {
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        deadline,
        extension: budget.extension,
        clock,
        headers: authHeaders(config.apiKey),
        sleep,
        request: (url, init) => talonicRequest(fetchImpl, url, init, deadline - clock()),
      }
      const envelope = await postExtract(ctx, file)
      return mapTalonicEnvelope(envelope, file, this.options.now?.() ?? new Date())
    } catch (error) {
      if (error instanceof ExtractionError) throw scrub(error, config.apiKey)
      throw scrub(new ExtractionError(
        'upstream',
        'Talonic could not complete extraction. The client hit an unexpected error. No fragments were returned.',
      ), config.apiKey)
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
