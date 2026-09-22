import 'server-only'

import {
  ExtractionError,
  extractionFileName,
  parseExtractionInput,
  resolveExtractionMedia,
  type ExtractionInput,
  type ExtractionProvider,
  type ExtractionResult,
} from '@/lib/field-registry/extract'

/**
 * Talonic skeleton. There is no SDK and no HTTP client in this module.
 *
 * Required when `TRACE_EXTRACTION_PROVIDER=talonic`:
 * - `TRACE_TALONIC_API_KEY`
 * - `TRACE_TALONIC_BASE_URL` (https, no userinfo, no query)
 *
 * Until a later change maps Talonic JSON into `fragmentSchema`, `extract` throws
 * `not_configured` or `unimplemented` and does not send the file.
 */

function talonicFailure(env: NodeJS.ProcessEnv): ExtractionError {
  const apiKey = env.TRACE_TALONIC_API_KEY?.trim() ?? ''
  const baseUrl = env.TRACE_TALONIC_BASE_URL?.trim() ?? ''
  if (!apiKey || !baseUrl) {
    return new ExtractionError(
      'not_configured',
      'Talonic extraction needs TRACE_TALONIC_API_KEY and TRACE_TALONIC_BASE_URL. No request was sent.',
    )
  }
  let parsed: URL
  try {
    parsed = new URL(baseUrl)
  } catch {
    return new ExtractionError('invalid_input', 'TRACE_TALONIC_BASE_URL must be an https URL. No request was sent.')
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) {
    return new ExtractionError(
      'invalid_input',
      'TRACE_TALONIC_BASE_URL must be an https URL without credentials or query. No request was sent.',
    )
  }
  return new ExtractionError('unimplemented', 'Talonic extraction is not implemented. No request was sent.')
}

export class TalonicExtractionProvider implements ExtractionProvider {
  readonly providerId = 'talonic'

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const parsed = parseExtractionInput(input)
    resolveExtractionMedia(extractionFileName(parsed.fileName), parsed.mediaType)
    throw talonicFailure(process.env)
  }
}
