import 'server-only'

import { DeskReviewError } from '@/lib/desk/review-apply'
import { ExtractionAccessError } from '@/lib/field-registry/extract'
import { assertExtractionOrigin } from '@/lib/field-registry/extract-upload'

/** Checklist souvenir plus one decision per pack row. Larger than a trace command, smaller than a file upload. */
const MAX_FREEZE_BYTES = 1_500_000

export type DeskFreezeBody = {
  checklist: unknown
  decisions: unknown
}

/**
 * Same-origin JSON for freezing a reviewed checklist.
 * The body carries the extracted snapshot already returned to this browser.
 * It must not be treated as a file upload.
 */
export async function readDeskFreezeBody(request: Request): Promise<DeskFreezeBody> {
  try {
    assertExtractionOrigin(request)
  } catch (error) {
    if (error instanceof ExtractionAccessError) throw error
    throw new ExtractionAccessError()
  }
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.startsWith('application/json')) {
    throw new DeskReviewError('Send the checklist as JSON.')
  }
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_FREEZE_BYTES) {
    throw new DeskReviewError('The checklist payload is too large.')
  }
  const reader = request.body?.getReader()
  if (!reader) throw new DeskReviewError('The checklist did not include a body.')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > MAX_FREEZE_BYTES) {
        await reader.cancel()
        throw new DeskReviewError('The checklist payload is too large.')
      }
      chunks.push(chunk.value)
    }
  } catch (error) {
    if (error instanceof DeskReviewError) throw error
    throw new DeskReviewError('The checklist could not be read.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new DeskReviewError('The checklist could not be read.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new DeskReviewError('Include the checklist before freezing.')
  }
  const body = parsed as Record<string, unknown>
  return {
    checklist: body.checklist,
    decisions: body.decisions,
  }
}
