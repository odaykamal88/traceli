import 'server-only'

import { ExtractionError, type ExtractionProvider } from '@/lib/field-registry/extract'
import { MockExtractionProvider } from '@/lib/field-registry/extract-mock'
import { TalonicExtractionProvider } from '@/lib/field-registry/extract-talonic'

export const extractionProviderIds = ['mock', 'talonic'] as const
export type ExtractionProviderId = (typeof extractionProviderIds)[number]

/** `TRACE_EXTRACTION_PROVIDER=mock|talonic`. Unset means mock. */
export function resolveExtractionProviderId(name?: string | null): ExtractionProviderId {
  const selected = (name ?? process.env.TRACE_EXTRACTION_PROVIDER ?? '').trim()
  if (!selected) return 'mock'
  if (selected === 'mock' || selected === 'talonic') return selected
  throw new ExtractionError('invalid_input', 'TRACE_EXTRACTION_PROVIDER must be mock or talonic.')
}

export function getExtractionProvider(name?: string | null): ExtractionProvider {
  return resolveExtractionProviderId(name) === 'talonic'
    ? new TalonicExtractionProvider()
    : new MockExtractionProvider()
}
