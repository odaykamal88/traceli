/**
 * Operator copy for a failed upload-desk extraction.
 * The browser treats the JSON as untrusted and keeps only a short scrubbed
 * summary plus Talonic status, code, message, and request id when they match
 * a safe shape. API keys and Authorization headers are not rendered.
 */

const codePattern = /^[A-Za-z0-9_]{1,64}$/
const requestIdPattern = /^req_[A-Za-z0-9]{6,80}$/

export type DeskExtractionFailure = {
  summary: string
  detail: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function redactOperatorText(value: string, limit: number) {
  const text = value
    .replace(/bearer\s+[a-z0-9._~+/=-]{8,}/gi, 'Bearer redacted')
    .replace(/\btlnc_[a-z0-9_-]{8,}\b/gi, 'redacted')
    .replace(/authorization\s*[:=]\s*\S+/gi, 'Authorization redacted')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
}

export function deskExtractionFailure(body: unknown): DeskExtractionFailure | null {
  const record = asRecord(body)
  if (!record || typeof record.error !== 'string') return null
  const summary = redactOperatorText(record.error, 500)
  if (!summary) return null
  const upstream = asRecord(record.upstream)
  const parts: string[] = []
  if (upstream) {
    if (typeof upstream.message === 'string') {
      const message = redactOperatorText(upstream.message, 180)
      if (message) parts.push(`Talonic said: ${message}`)
    }
    if (typeof upstream.code === 'string' && codePattern.test(upstream.code)) parts.push(`Code ${upstream.code}`)
    if (typeof upstream.requestId === 'string' && requestIdPattern.test(upstream.requestId)) {
      parts.push(`Request ${upstream.requestId}`)
    }
    if (
      typeof upstream.status === 'number'
      && Number.isInteger(upstream.status)
      && upstream.status >= 100
      && upstream.status <= 599
      && !summary.includes(`HTTP ${upstream.status}`)
    ) {
      parts.push(`HTTP ${upstream.status}`)
    }
  }
  return { summary, detail: parts.length > 0 ? `${parts.join('. ')}.` : '' }
}
