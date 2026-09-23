import 'server-only'

import { z } from 'zod'

import { isLoopbackHost } from '@/lib/trace/access-policy'
import {
  assertDeclaredBodySize,
  EXTRACTION_BODY_LIMIT,
  ExtractionAccessError,
  ExtractionError,
  extractionFileName,
  resolveExtractionMedia,
  type ExtractionInput,
} from '@/lib/field-registry/extract'
import { getExtractionProvider } from '@/lib/field-registry/extract-provider'
import { idSchema } from '@/lib/field-registry/schema'

const allowedFields = new Set(['file', 'awardId'])
const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
}

function hostName(host: string) {
  try {
    return new URL(`http://${host}`).hostname
  } catch {
    return ''
  }
}

export function assertExtractionOrigin(request: Request) {
  const host = request.headers.get('host')?.trim() ?? ''
  if (!host) throw new ExtractionAccessError()
  const origin = request.headers.get('origin')
  if (!origin) {
    if (!isLoopbackHost(hostName(host))) throw new ExtractionAccessError()
    return
  }
  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {
    throw new ExtractionAccessError()
  }
  if (originHost !== host) throw new ExtractionAccessError()
}

async function readBoundedBody(request: Request) {
  assertDeclaredBodySize(request.headers.get('content-length'))
  const reader = request.body?.getReader()
  if (!reader) throw new ExtractionError('invalid_input', 'The upload did not include a file.')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > EXTRACTION_BODY_LIMIT) {
        await reader.cancel()
        throw new ExtractionError('too_large', 'The file is larger than 8 MB.')
      }
      chunks.push(chunk.value)
    }
  } catch (error) {
    if (error instanceof ExtractionError) throw error
    throw new ExtractionError('invalid_input', 'The upload could not be read.')
  }
  if (size < 1) throw new ExtractionError('invalid_input', 'The upload did not include a file.')
  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

function formText(value: FormDataEntryValue | null, label: string) {
  if (value === null) return undefined
  if (typeof value !== 'string') throw new ExtractionError('invalid_input', `Send the file and an optional ${label}.`)
  const trimmed = value.trim()
  return trimmed || undefined
}

/**
 * Read a same-origin multipart body and reject fields outside `allowed`.
 * The upload desk uses a wider allowlist. `/api/extract` stays file + awardId.
 */
export async function readMultipartForm(
  request: Request,
  allowed: ReadonlySet<string>,
  unexpectedMessage: string,
): Promise<FormData> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.startsWith('multipart/form-data')) {
    throw new ExtractionError('invalid_input', 'Upload the file as multipart form data.')
  }
  assertExtractionOrigin(request)
  const body = await readBoundedBody(request)
  let form: FormData
  try {
    form = await new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body,
    }).formData()
  } catch {
    throw new ExtractionError('invalid_input', 'The upload could not be read.')
  }
  for (const key of form.keys()) {
    if (!allowed.has(key)) throw new ExtractionError('invalid_input', unexpectedMessage)
  }
  return form
}

/** File plus optional award id. Organization and path are not accepted from the client. */
export async function uploadFromMultipartForm(form: FormData): Promise<Omit<ExtractionInput, 'organizationId'>> {
  const file = form.get('file')
  if (!(file instanceof File)) throw new ExtractionError('invalid_input', 'Choose a file to upload.')
  const fileName = extractionFileName(file.name || 'upload')
  const bytes = new Uint8Array(await file.arrayBuffer())
  return uploadFromFileParts(fileName, bytes, file.type || 'application/octet-stream', form.get('awardId'))
}

function uploadFromFileParts(
  fileName: string,
  bytes: Uint8Array<ArrayBuffer>,
  mediaType: string,
  awardEntry: FormDataEntryValue | null,
): Omit<ExtractionInput, 'organizationId'> {
  if (bytes.byteLength < 1) throw new ExtractionError('invalid_input', 'The file is empty.')
  if (bytes.byteLength > EXTRACTION_BODY_LIMIT) throw new ExtractionError('too_large', 'The file is larger than 8 MB.')
  const resolvedMedia = resolveExtractionMedia(fileName, mediaType)
  const awardText = formText(awardEntry, 'award id')
  const awardId = awardText === undefined ? undefined : idSchema.safeParse(awardText)
  if (awardId && !awardId.success) throw new ExtractionError('invalid_input', 'Award id is not a registry id.')
  return {
    fileName,
    mediaType: resolvedMedia,
    bytes,
    ...(awardId?.success ? { awardId: awardId.data } : {}),
  }
}

/**
 * Multipart field `file`, optional `awardId`.
 * Organization comes from the server session. A client path is not accepted.
 */
export async function readExtractionUpload(request: Request): Promise<Omit<ExtractionInput, 'organizationId'>> {
  const form = await readMultipartForm(request, allowedFields, 'Send the file and an optional award id.')
  return uploadFromMultipartForm(form)
}

export async function extractParsedUpload(
  upload: Omit<ExtractionInput, 'organizationId'>,
  scope: { organizationId: string },
) {
  const organization = idSchema.safeParse(scope.organizationId)
  if (!organization.success) throw new ExtractionError('invalid_input', 'Organization id is not a registry id.')
  return getExtractionProvider().extract({ ...upload, organizationId: organization.data })
}

export async function extractUploadedFile(request: Request, scope: { organizationId: string }) {
  const upload = await readExtractionUpload(request)
  return extractParsedUpload(upload, scope)
}

export function extractionHttpError(error: unknown): Response {
  if (error instanceof ExtractionAccessError) {
    return Response.json({ error: error.message }, { status: 403, headers: privateHeaders })
  }
  if (error instanceof ExtractionError) {
    const status = error.code === 'too_large' ? 413
      : error.code === 'timeout' ? 504
      : error.code === 'unauthorized' || error.code === 'upstream' ? 502
      : error.code === 'not_configured' || error.code === 'unimplemented' ? 501
      : 400
    return Response.json({ error: error.message, code: error.code }, { status, headers: privateHeaders })
  }
  if (error instanceof z.ZodError) {
    return Response.json(
      { error: 'The upload could not be read. Check the file type and try again.' },
      { status: 400, headers: privateHeaders },
    )
  }
  return Response.json(
    { error: 'Extraction could not complete. Try again after checking the file.' },
    { status: 503, headers: privateHeaders },
  )
}
