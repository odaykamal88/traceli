import 'server-only'

import { DeskJudgmentError } from '@/lib/desk/judgment'
import { ExtractionAccessError } from '@/lib/field-registry/extract'
import { assertExtractionOrigin } from '@/lib/field-registry/extract-upload'

/** Same ceiling as a disposition. The body is the registry souvenir, not a file. */
const MAX_REPORT_BYTES = 1_500_000

export type PilotReportBody = {
  view: unknown
  judgment: unknown
}

/**
 * Same-origin JSON for a pilot-report download.
 * Organization is not accepted from the client.
 */
export async function readPilotReportBody(request: Request): Promise<PilotReportBody> {
  try {
    assertExtractionOrigin(request)
  } catch (error) {
    if (error instanceof ExtractionAccessError) throw error
    throw new ExtractionAccessError()
  }
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.startsWith('application/json')) {
    throw new DeskJudgmentError('Send the frozen record as JSON.')
  }
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_REPORT_BYTES) {
    throw new DeskJudgmentError('The report payload is too large.')
  }
  const reader = request.body?.getReader()
  if (!reader) throw new DeskJudgmentError('The report did not include a body.')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > MAX_REPORT_BYTES) {
        await reader.cancel()
        throw new DeskJudgmentError('The report payload is too large.')
      }
      chunks.push(chunk.value)
    }
  } catch (error) {
    if (error instanceof DeskJudgmentError) throw error
    throw new DeskJudgmentError('The report could not be read.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new DeskJudgmentError('The report could not be read.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new DeskJudgmentError('Include the frozen assessment and the human judgment.')
  }
  const body = parsed as Record<string, unknown>
  return { view: body.view, judgment: body.judgment }
}
