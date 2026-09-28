import 'server-only'

import { z } from 'zod'
import { ExtractionAccessError, ExtractionError } from '@/lib/field-registry/extract'
import { readMultipartForm, uploadFromMultipartForm } from '@/lib/field-registry/extract-upload'
import { requireTraceViewer, TraceAccessError } from '@/lib/trace/access'
import { privateHeaders } from '@/lib/trace/http'
import { tenderWorkspacesEnabled } from '@/lib/tenders/config'
import { idempotencyKeySchema, policyAcknowledgementSchema, revisionSchema, TenderError, type TenderPolicyAcknowledgement } from '@/lib/tenders/contract'

export { privateHeaders }
export async function requireTenderViewer() {
  if (!tenderWorkspacesEnabled()) throw new TenderError(404, 'unavailable', 'Saved tender workspaces are unavailable here.')
  if (!process.env.DATABASE_URL) throw new TenderError(500, 'unavailable', 'Saved tender workspaces are not configured. Your draft has been kept.')
  return requireTraceViewer()
}

export function assertTenderOrigin(request: Request) {
  let sameOrigin = false
  try {
    const origin = new URL(request.headers.get('origin') || '')
    const host = request.headers.get('host') || ''
    sameOrigin = origin.origin === `${new URL(request.url).protocol}//${host}`
  } catch { /* missing or malformed origin fails closed */ }
  if (!sameOrigin) throw new TenderError(403, 'denied', 'This request is unavailable.')
}

export async function readTenderCommand(request: Request): Promise<unknown> {
  assertTenderOrigin(request)
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new TenderError(400, 'invalid', 'Send a valid saved-work request.')
  }
  const limit = 256 * 1024
  if (Number(request.headers.get('content-length')) > limit) throw new TenderError(413, 'too_large', 'This draft is too large to save.')
  const reader = request.body?.getReader()
  if (!reader) throw new TenderError(400, 'invalid', 'The request is empty.')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > limit) { await reader.cancel(); throw new TenderError(413, 'too_large', 'This draft is too large to save.') }
      chunks.push(chunk.value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch (error) {
    if (error instanceof TenderError) throw error
    throw new TenderError(400, 'invalid', 'The request could not be read. Your draft has been kept.')
  }
}

function singleText(form: FormData, name: string): string | undefined {
  const values = form.getAll(name)
  if (values.length > 1 || (values.length && typeof values[0] !== 'string')) throw new TenderError(400, 'invalid', 'Check the upload fields.')
  return values.length ? String(values[0]) : undefined
}

type TenderUpload = TenderPolicyAcknowledgement & { fileName: string; mediaType: string; bytes: Uint8Array<ArrayBuffer>; expectedRevision: number; idempotencyKey: string }
export function readTenderUpload(request: Request, kind: 'packet'): Promise<TenderUpload>
export function readTenderUpload(request: Request, kind: 'manual'): Promise<TenderUpload & { label?: string; supersedesId?: string }>
export async function readTenderUpload(request: Request, kind: 'packet' | 'manual') {
  assertTenderOrigin(request)
  const allowed = new Set(kind === 'packet'
    ? ['file', 'classification', 'policyVersion', 'consent', 'expectedRevision', 'idempotencyKey']
    : ['file', 'label', 'supersedesId', 'classification', 'policyVersion', 'consent', 'expectedRevision', 'idempotencyKey'])
  const form = await readMultipartForm(request, allowed, 'Send only the file and its saved-tender details.')
  for (const key of allowed) if (form.getAll(key).length > 1) throw new TenderError(400, 'invalid', 'Duplicate upload fields are not allowed.')
  const revisionText = singleText(form, 'expectedRevision')
  if (!revisionText || !/^\d+$/.test(revisionText)) throw new TenderError(400, 'invalid', 'The current saved version is required.')
  const expectedRevision = revisionSchema.parse(Number(revisionText))
  const idempotencyKey = idempotencyKeySchema.parse(singleText(form, 'idempotencyKey'))
  const acknowledgement = policyAcknowledgementSchema.parse({ classification: singleText(form,'classification'), policyVersion: singleText(form,'policyVersion'), consent: singleText(form,'consent') === 'true' })
  const upload = await uploadFromMultipartForm(form)
  if (!upload.bytes) throw new TenderError(400, 'invalid', 'Choose a file to upload.')
  if (upload.bytes.byteLength > 4 * 1024 * 1024) throw new TenderError(413, 'too_large', 'Choose a file no larger than 4 MB.')
  const common = { fileName: upload.fileName, mediaType: upload.mediaType, bytes: upload.bytes, expectedRevision, idempotencyKey, ...acknowledgement }
  if (kind === 'packet') {
    return common
  }
  const label = z.string().trim().min(1).max(160).optional().parse(singleText(form, 'label'))
  const supersedesId = z.uuid().optional().parse(singleText(form, 'supersedesId'))
  return { ...common, ...(label ? { label } : {}), ...(supersedesId ? { supersedesId } : {}) }
}

export function tenderJson(value: unknown, status = 200) {
  const etag = value && typeof value === 'object' && 'etag' in value && typeof value.etag === 'string' ? value.etag : null
  return Response.json(value, { status, headers: { ...privateHeaders, ...(etag ? { ETag: etag } : {}) } })
}

export function tenderHttpError(error: unknown): Response {
  if (error instanceof TenderError) return tenderJson({ error: error.message, code: error.code, ...(error.latestRevision !== undefined ? { latestRevision: error.latestRevision } : {}) }, error.status)
  if (error instanceof TraceAccessError || error instanceof ExtractionAccessError) return tenderJson({ error: 'This tender or action is unavailable for your current access.', code: 'unavailable' }, 403)
  if (error instanceof z.ZodError || error instanceof SyntaxError || error instanceof ExtractionError) return tenderJson({ error: 'Check the required fields and try again. Your draft has been kept.', code: 'invalid' }, 400)
  return tenderJson({ error: 'Saved work is temporarily unavailable. Your draft has been kept; try again.', code: 'unavailable' }, 503)
}
