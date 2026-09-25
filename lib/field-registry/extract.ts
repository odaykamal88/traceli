import 'server-only'

import { createHash } from 'node:crypto'
import { open, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

import { z } from 'zod'

import { donorPackIds } from '@/lib/field-registry/packs/types'
import {
  fieldProvenanceSchema,
  fieldValueSchema,
  fragmentSchema,
  hashSchema,
  idSchema,
  type Fragment,
  type FragmentKindHint,
} from '@/lib/field-registry/schema'

/**
 * P2 ingestion boundary.
 * Providers return `Fragment` values. They do not return vendor payloads.
 * `freezeAtJudgment` and the Rule library do not import this module's providers.
 * File bytes stop here: the result and the registry draft store a hash, not the file.
 */

export const EXTRACTION_BYTE_LIMIT = 8 * 1024 * 1024
export const EXTRACTION_BODY_LIMIT = EXTRACTION_BYTE_LIMIT + 64 * 1024
export const MOCK_EXTRACTED_AT = '2026-09-22T00:00:00.000Z'

/**
 * Most fragments one extraction result may hold.
 *
 * Schema-less Talonic discovery maps each non-empty top-level field to one
 * fragment. A cap of 64 rejected ordinary multi-page terms of reference
 * before the desk could freeze them.
 *
 * 256 matches the draft ceilings below and `awardRegistrySnapshotSchema`'s
 * field ceiling. Schema-less clauses stay `text` and unmapped, so they do
 * not fill snapshot field slots; the donor pack's missing keys still fit.
 * Raising this above 256 without raising those ceilings would accept the
 * extract and then fail the desk freeze.
 */
export const MAX_EXTRACTION_FRAGMENTS = 256

export const extractionErrorCodes = [
  'not_configured',
  'unimplemented',
  'invalid_input',
  'unsupported_media',
  'too_large',
  'unauthorized',
  'timeout',
  'upstream',
] as const

export type ExtractionErrorCode = (typeof extractionErrorCodes)[number]

/** Safe Talonic diagnostic. Callers must scrub secrets before constructing. */
export type ExtractionUpstreamDetail = {
  status?: number
  code?: string
  message?: string
  requestId?: string
}

const upstreamCodePattern = /^[A-Za-z0-9_]{1,64}$/
const upstreamRequestIdPattern = /^req_[A-Za-z0-9]{6,80}$/

function copyUpstream(value: ExtractionUpstreamDetail | undefined): ExtractionUpstreamDetail | undefined {
  if (!value) return undefined
  const detail: ExtractionUpstreamDetail = {}
  if (typeof value.status === 'number' && Number.isInteger(value.status) && value.status >= 100 && value.status <= 599) {
    detail.status = value.status
  }
  if (typeof value.code === 'string' && upstreamCodePattern.test(value.code)) detail.code = value.code
  if (typeof value.requestId === 'string' && upstreamRequestIdPattern.test(value.requestId)) {
    detail.requestId = value.requestId
  }
  if (typeof value.message === 'string') {
    const message = value.message.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
    if (message) detail.message = message.length > 180 ? `${message.slice(0, 179)}…` : message
  }
  if (detail.status === undefined && !detail.code && !detail.requestId && !detail.message) return undefined
  return detail
}

export class ExtractionError extends Error {
  readonly code: ExtractionErrorCode
  readonly upstream?: ExtractionUpstreamDetail

  constructor(code: ExtractionErrorCode, message: string, upstream?: ExtractionUpstreamDetail) {
    super(message)
    this.name = 'ExtractionError'
    this.code = code
    const detail = copyUpstream(upstream)
    if (detail) this.upstream = detail
  }
}

export class ExtractionAccessError extends Error {
  readonly code = 'denied' as const

  constructor() {
    super('This upload is unavailable for this request.')
    this.name = 'ExtractionAccessError'
  }
}

const extensionMedia = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  eml: 'message/rfc822',
  msg: 'application/vnd.ms-outlook',
  txt: 'text/plain',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
} as const

export type ExtractionExtension = keyof typeof extensionMedia

export const extractionInputSchema = z.strictObject({
  fileName: z.string().trim().min(1).max(240),
  mediaType: z.string().trim().min(1).max(160),
  bytes: z.instanceof(Uint8Array).optional(),
  path: z.string().trim().min(1).max(1024).optional(),
  awardId: idSchema.optional(),
  organizationId: idSchema.optional(),
  /** Donor pack for a desk extract. `/api/extract` omits it and stays schema-less. */
  packId: z.enum(donorPackIds).optional(),
}).superRefine((input, ctx) => {
  const byteLength = input.bytes?.byteLength ?? 0
  const hasBytes = byteLength > 0
  const hasPath = Boolean(input.path)
  if (hasBytes === hasPath) {
    ctx.addIssue({ code: 'custom', message: 'Provide file bytes or a path.' })
  }
  if (input.bytes && byteLength === 0 && !hasPath) {
    ctx.addIssue({ code: 'custom', message: 'The file is empty.' })
  }
})

export type ExtractionInput = z.infer<typeof extractionInputSchema>

export const extractionResultSchema = z.strictObject({
  schemaVersion: z.literal('extraction-result-v1'),
  providerId: idSchema,
  extractorId: idSchema,
  fileName: z.string().trim().min(1).max(240),
  mediaType: z.string().trim().min(1).max(160),
  sourceFileHash: hashSchema,
  awardId: idSchema.optional(),
  organizationId: idSchema.optional(),
  fragments: z.array(fragmentSchema).min(1).max(MAX_EXTRACTION_FRAGMENTS),
}).superRefine((result, ctx) => {
  for (const fragment of result.fragments) {
    if (fragment.sourceFileHash !== result.sourceFileHash) {
      ctx.addIssue({ code: 'custom', message: 'Fragment provenance must use the uploaded file hash.' })
    }
    if (fragment.extractorId !== result.extractorId) {
      ctx.addIssue({ code: 'custom', message: 'Fragment extractor must match the result.' })
    }
  }
})

export type ExtractionResult = z.infer<typeof extractionResultSchema>

export interface ExtractionProvider {
  readonly providerId: string
  extract(input: ExtractionInput): Promise<ExtractionResult>
}

const draftTargets: Partial<Record<FragmentKindHint, { entityKind: 'criterion' | 'evidence', key: string }>> = {
  pricing_table: { entityKind: 'criterion', key: 'pricing.table' },
  waiver: { entityKind: 'evidence', key: 'waiver.noted' },
  email_header: { entityKind: 'evidence', key: 'correspondence.header' },
  capacity_letter: { entityKind: 'evidence', key: 'capacity.letter' },
  annex: { entityKind: 'evidence', key: 'annex.excerpt' },
}

export const registryDraftFieldSchema = z.strictObject({
  fieldId: idSchema,
  entityKind: z.enum(['criterion', 'evidence']),
  entityId: idSchema,
  key: z.string().trim().regex(/^[a-z][a-z0-9_.]{0,119}$/),
  value: fieldValueSchema,
  provenance: fieldProvenanceSchema,
  sourceFragmentId: idSchema,
})

export const registryEntityDraftSchema = z.strictObject({
  schemaVersion: z.literal('registry-entity-draft-v1'),
  awardId: idSchema.optional(),
  organizationId: idSchema.optional(),
  fields: z.array(registryDraftFieldSchema).max(MAX_EXTRACTION_FRAGMENTS),
  unmappedFragmentIds: z.array(idSchema).max(MAX_EXTRACTION_FRAGMENTS),
}).superRefine((draft, ctx) => {
  const fieldIds = draft.fields.map(field => field.fieldId)
  if (new Set(fieldIds).size !== fieldIds.length) {
    ctx.addIssue({ code: 'custom', message: 'Draft field ids must be unique.' })
  }
  const fragmentIds = [
    ...draft.fields.map(field => field.sourceFragmentId),
    ...draft.unmappedFragmentIds,
  ]
  if (new Set(fragmentIds).size !== fragmentIds.length) {
    ctx.addIssue({ code: 'custom', message: 'Each fragment is mapped once.' })
  }
})

export type RegistryEntityDraft = z.infer<typeof registryEntityDraftSchema>

export function sourceFileHashOf(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex')
}

export function assertExtractionByteLength(byteLength: number) {
  if (!Number.isSafeInteger(byteLength) || byteLength < 1) {
    throw new ExtractionError('invalid_input', 'The file is empty.')
  }
  if (byteLength > EXTRACTION_BYTE_LIMIT) {
    throw new ExtractionError('too_large', 'The file is larger than 8 MB.')
  }
}

export function assertDeclaredBodySize(contentLength: string | null) {
  if (contentLength === null || contentLength.trim() === '') return
  if (!/^\d+$/.test(contentLength) || contentLength.length > 12) {
    throw new ExtractionError('invalid_input', 'Content-Length is invalid.')
  }
  if (Number(contentLength) > EXTRACTION_BODY_LIMIT) {
    throw new ExtractionError('too_large', 'The file is larger than 8 MB.')
  }
}

export function extractionFileName(name: string) {
  const base = name.replaceAll('\\', '/').split('/').pop()?.trim() ?? ''
  if (!base || base === '.' || base === '..' || /[\u0000-\u001f]/.test(base) || base.length > 240) {
    throw new ExtractionError('invalid_input', 'Choose a file name with no path.')
  }
  return base
}

export function extensionOf(fileName: string) {
  const lower = fileName.toLowerCase()
  const dot = lower.lastIndexOf('.')
  if (dot <= 0 || dot === lower.length - 1) return ''
  return lower.slice(dot + 1)
}

export function mediaTypeForFileName(fileName: string) {
  const extension = extensionOf(fileName)
  const media = extensionMedia[extension as ExtractionExtension]
  if (!media) throw new ExtractionError('unsupported_media', 'This file type is not accepted.')
  return media
}

export function resolveExtractionMedia(fileName: string, mediaType: string) {
  const expected = mediaTypeForFileName(fileName)
  const given = mediaType.split(';', 1)[0]?.trim().toLowerCase() ?? ''
  const generic = given === '' || given === 'application/octet-stream'
  const jpegAlias = expected === 'image/jpeg' && given === 'image/jpg'
  if (!generic && given !== expected && !jpegAlias) {
    throw new ExtractionError('unsupported_media', 'The file type does not match its name.')
  }
  return expected
}

export function parseExtractionInput(input: unknown): ExtractionInput {
  if (input && typeof input === 'object' && 'bytes' in input && input.bytes instanceof Uint8Array) {
    if (input.bytes.byteLength > EXTRACTION_BYTE_LIMIT) {
      throw new ExtractionError('too_large', 'The file is larger than 8 MB.')
    }
  }
  const parsed = extractionInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new ExtractionError('invalid_input', 'Extraction input needs a file name, a media type, and either bytes or a path.')
  }
  return parsed.data
}

async function readExtractionPath(path: string) {
  if (path.includes('\0')) throw new ExtractionError('invalid_input', 'Extraction path is invalid.')
  const absolute = resolve(path)
  let info
  try {
    info = await stat(absolute)
  } catch {
    throw new ExtractionError('invalid_input', 'Extraction path is not a readable file.')
  }
  if (!info.isFile()) throw new ExtractionError('invalid_input', 'Extraction path must be a file.')
  assertExtractionByteLength(info.size)
  const handle = await open(absolute, 'r')
  try {
    const buffer = Buffer.alloc(info.size)
    const { bytesRead } = await handle.read(buffer, 0, info.size, 0)
    if (bytesRead !== info.size) throw new ExtractionError('invalid_input', 'Extraction path could not be read.')
    return buffer
  } finally {
    await handle.close()
  }
}

/** Resolve bytes for a provider. The HTTP route passes bytes and never a client path. */
export async function loadExtractionBytes(input: ExtractionInput) {
  const parsed = parseExtractionInput(input)
  const fileName = extractionFileName(parsed.fileName)
  const mediaType = resolveExtractionMedia(fileName, parsed.mediaType)
  const bytes = parsed.bytes && parsed.bytes.byteLength > 0 ? parsed.bytes : await readExtractionPath(parsed.path ?? '')
  assertExtractionByteLength(bytes.byteLength)
  return { input: parsed, bytes, mediaType, fileName }
}

function draftScope(scope?: { awardId?: string, organizationId?: string }) {
  if (!scope) return {}
  const awardId = scope.awardId === undefined ? undefined : idSchema.safeParse(scope.awardId)
  const organizationId = scope.organizationId === undefined ? undefined : idSchema.safeParse(scope.organizationId)
  if (awardId && !awardId.success) throw new ExtractionError('invalid_input', 'Award id is not a registry id.')
  if (organizationId && !organizationId.success) {
    throw new ExtractionError('invalid_input', 'Organization id is not a registry id.')
  }
  return {
    ...(awardId?.success ? { awardId: awardId.data } : {}),
    ...(organizationId?.success ? { organizationId: organizationId.data } : {}),
  }
}

/**
 * Best-effort alignment from fragments onto registry-shaped evidence.
 * Generic text stays unmapped. This draft is not an `AwardRegistrySnapshot`
 * and cannot be frozen.
 */
export function fragmentsTowardRegistryDraft(
  fragments: readonly Fragment[],
  scope?: { awardId?: string, organizationId?: string },
): RegistryEntityDraft {
  const parsedFragments = fragments.map(fragment => {
    const parsed = fragmentSchema.safeParse(fragment)
    if (!parsed.success) throw new ExtractionError('invalid_input', 'A fragment does not match the registry schema.')
    return parsed.data
  })
  const fragmentIds = parsedFragments.map(fragment => fragment.fragmentId)
  if (new Set(fragmentIds).size !== fragmentIds.length) {
    throw new ExtractionError('invalid_input', 'Fragment ids must be unique.')
  }

  const fields = []
  const unmappedFragmentIds = []
  for (const [index, fragment] of parsedFragments.entries()) {
    const target = fragment.kind ? draftTargets[fragment.kind] : undefined
    if (!target) {
      unmappedFragmentIds.push(fragment.fragmentId)
      continue
    }
    const suffix = `${fragment.sourceFileHash.slice(0, 12)}.${index}`
    const text = fragment.text.length > 4000 ? fragment.text.slice(0, 4000) : fragment.text
    fields.push({
      fieldId: `field.${suffix}`,
      entityKind: target.entityKind,
      entityId: `${target.entityKind}.${suffix}`,
      key: target.key,
      value: { state: 'present' as const, value: text },
      provenance: {
        sourceFileHash: fragment.sourceFileHash,
        sourceRef: fragment.sourceRef,
        extractedAt: fragment.extractedAt,
        confidence: fragment.confidence,
        verificationMethod: 'adapter_extract' as const,
      },
      sourceFragmentId: fragment.fragmentId,
    })
  }

  const draft = registryEntityDraftSchema.safeParse({
    schemaVersion: 'registry-entity-draft-v1',
    ...draftScope(scope),
    fields,
    unmappedFragmentIds,
  })
  if (!draft.success) throw new ExtractionError('invalid_input', 'Fragments could not be drafted onto registry fields.')
  return draft.data
}
