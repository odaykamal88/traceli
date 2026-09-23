import 'server-only'

import { DeskJudgmentError } from '@/lib/desk/judgment'
import { ExtractionAccessError } from '@/lib/field-registry/extract'
import { assertExtractionOrigin } from '@/lib/field-registry/extract-upload'

/** Registry souvenir plus a short rationale. Larger than a trace command, smaller than a file upload. */
const MAX_JUDGMENT_BYTES = 1_500_000

export type DeskJudgmentBody = {
  decision: unknown
  reason: unknown
  view: unknown
}

/**
 * Same-origin JSON for a human disposition.
 * The body may include the registry snapshot already returned on the assessment.
 * It must not be treated as a file upload.
 */
export async function readDeskJudgmentBody(request: Request): Promise<DeskJudgmentBody> {
  try {
    assertExtractionOrigin(request)
  } catch (error) {
    if (error instanceof ExtractionAccessError) throw error
    throw new ExtractionAccessError()
  }
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.startsWith('application/json')) {
    throw new DeskJudgmentError('Send the judgment as JSON.')
  }
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_JUDGMENT_BYTES) {
    throw new DeskJudgmentError('The judgment payload is too large.')
  }
  const reader = request.body?.getReader()
  if (!reader) throw new DeskJudgmentError('The judgment did not include a body.')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > MAX_JUDGMENT_BYTES) {
        await reader.cancel()
        throw new DeskJudgmentError('The judgment payload is too large.')
      }
      chunks.push(chunk.value)
    }
  } catch (error) {
    if (error instanceof DeskJudgmentError) throw error
    throw new DeskJudgmentError('The judgment could not be read.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new DeskJudgmentError('The judgment could not be read.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new DeskJudgmentError('Choose a disposition and include the frozen assessment.')
  }
  const body = parsed as Record<string, unknown>
  return {
    decision: body.decision,
    reason: body.reason,
    view: body.view,
  }
}
