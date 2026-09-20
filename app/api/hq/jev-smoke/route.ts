import { JEV_SMOKE_ID } from '@/lib/hq/jev'
import { readJevSmoke, requireJevSmokeOwner, runJevSmoke } from '@/lib/hq/jev-smoke'

export const runtime = 'nodejs'
export const maxDuration = 30
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'", 'Referrer-Policy': 'same-origin' }
const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

export async function GET() {
  const owner = await requireJevSmokeOwner()
  if (!owner) return new Response('Not found', { status: 404, headers })
  try {
    const state = await readJevSmoke(owner)
    const button = state.state === 'not_started' && state.key_present ? `<form method="post"><input type="hidden" name="test_id" value="${JEV_SMOKE_ID}"><button type="submit">Run the authorized synthetic connection test once</button></form>` : ''
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><title>HQ · Jev connection check</title><body><main><h1>Jev connection check</h1><p>Private preview · one fixed synthetic request. This tests connectivity, not procurement correctness. Refreshing never calls the provider. A reserved attempt without a result requires review.</p>${button}<pre>${escape(JSON.stringify(state, null, 2))}</pre><a href="/hq">Back to HQ</a></main></body></html>`, { headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } })
  } catch { return Response.json({ state: 'storage_unavailable', provider_called: false }, { status: 503, headers }) }
}

export async function POST(request: Request) {
  const originMatches = request.headers.get('origin') === new URL(request.url).origin
  const fetchSite = request.headers.get('sec-fetch-site')
  if (!originMatches || fetchSite !== 'same-origin') {
    console.info('HQ Jev form denied', { originMatches, fetchSite: fetchSite === null ? 'absent' : ['same-origin', 'same-site', 'cross-site', 'none'].includes(fetchSite) ? fetchSite : 'unrecognized' })
    return new Response('Forbidden', { status: 403, headers })
  }
  const owner = await requireJevSmokeOwner()
  if (!owner) return new Response('Not found', { status: 404, headers })
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return new Response('Unsupported content', { status: 415, headers })
  if (Number(request.headers.get('content-length') || '0') > 256) return new Response('Too large', { status: 413, headers })
  const reader = request.body?.getReader()
  if (!reader) return new Response('Invalid test', { status: 400, headers })
  const chunks: Uint8Array[] = []; let size = 0
  for (;;) {
    const part = await reader.read(); if (part.done) break
    size += part.value.byteLength
    if (size > 256) { await reader.cancel(); return new Response('Too large', { status: 413, headers }) }
    chunks.push(part.value)
  }
  const body = Buffer.concat(chunks).toString('utf8')
  if (body.length > 256 || body !== 'test_id=' + JEV_SMOKE_ID) return new Response('Invalid test', { status: 400, headers })
  try { return Response.json(await runJevSmoke(owner), { headers }) }
  catch { return Response.json({ state: 'unknown', message: 'The reservation or receipt could not be confirmed. Inspect the saved state; do not retry the provider automatically.' }, { status: 503, headers }) }
}
