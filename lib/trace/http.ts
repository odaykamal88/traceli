import 'server-only'
import { z } from 'zod'
import { TraceAccessError } from '@/lib/trace/access'

export const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow' }

export async function readTraceCommand(request: Request): Promise<unknown> {
  // Next may normalize request.url to localhost behind its Node server. Compare
  // the browser Origin to the actual Host header, never X-Forwarded-Host.
  let sameOrigin = false
  try {
    const origin = new URL(request.headers.get('origin') || '')
    sameOrigin = origin.origin === `${new URL(request.url).protocol}//${request.headers.get('host')}`
  } catch { /* deny missing or malformed Origin */ }
  if (!sameOrigin ||
      !request.headers.get('content-type')?.startsWith('application/json')) {
    throw new TraceAccessError()
  }
  const limit = 8192
  if (Number(request.headers.get('content-length')) > limit) throw new z.ZodError([])
  const reader = request.body?.getReader()
  if (!reader) throw new z.ZodError([])
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > limit) { await reader.cancel(); throw new z.ZodError([]) }
      chunks.push(chunk.value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch { throw new z.ZodError([]) }
}

export function traceHttpError(error: unknown): Response {
  if (error instanceof TraceAccessError) return Response.json({ error: error.message }, { status: 403, headers: privateHeaders })
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return Response.json({ error: 'Check the selected action and required fields. Your draft has been kept.' }, { status: 400, headers: privateHeaders })
  }
  // Domain errors use a closed code vocabulary; arbitrary DB/provider errors never reach a response.
  const code = error && typeof error === 'object' && 'code' in error ? error.code : ''
  if (code === 'stale') return Response.json({ error: 'This record changed. Reload the latest record before saving; your draft has been kept.', code }, { status: 409, headers: privateHeaders })
  if (code === 'denied' || code === 'not_found') return Response.json({ error: 'This record or action is unavailable for your current access.' }, { status: 403, headers: privateHeaders })
  if (code === 'invalid' || code === 'idempotency_conflict') return Response.json({ error: 'The request could not be saved. Check the required fields and reload the record.' }, { status: 409, headers: privateHeaders })
  return Response.json({ error: 'Trace could not complete this request. Your draft has been kept. Try again after checking the local service.' }, { status: 503, headers: privateHeaders })
}
