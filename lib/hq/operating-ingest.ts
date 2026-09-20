import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import pg from 'pg'
import { operatingPacketSchema } from '@/lib/hq/operating-contract'

const limit = 200000
let pool: pg.Pool | undefined
const answer = (status: number, value: object) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } })

/** A machine credential only accepts this source's minimized mirror. It cannot
 * read HQ, approve a draft, send a message or alter original source records. */
export async function ingestOperatingSource(request: Request) {
  const key = process.env.HQ_SOURCE_SIGNING_KEY
  const connectionString = process.env.HQ_SOURCE_DATABASE_URL
  if (process.env.TRACELI_HQ_ACCESS !== 'workos' || !key || !/^[a-f0-9]{64}$/.test(key) || !connectionString) return answer(503, { error: 'Source connection unavailable' })
  const signedAt = request.headers.get('x-hq-signed-at') || ''
  const signature = request.headers.get('x-hq-signature') || ''
  if (!/^\d{13}$/.test(signedAt) || Math.abs(Date.now() - Number(signedAt)) > 300000 || !/^[a-f0-9]{64}$/.test(signature)) return answer(401, { error: 'Source authentication required' })
  if (!request.headers.get('content-type')?.startsWith('application/json')) return answer(415, { error: 'JSON required' })
  if (Number(request.headers.get('content-length') || 0) > limit || !request.body) return answer(413, { error: 'Source packet too large' })
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break
      size += value.byteLength; if (size > limit) return answer(413, { error: 'Source packet too large' })
      chunks.push(value)
    }
  } finally { await reader.cancel().catch(() => {}) }
  const body = Buffer.concat(chunks).toString('utf8')
  const expected = createHmac('sha256', Buffer.from(key, 'hex')).update(signedAt + '.' + body).digest()
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return answer(401, { error: 'Source authentication required' })
  let packet
  try {
    packet = operatingPacketSchema.parse(JSON.parse(body))
    const captured = Date.parse(packet.captured_at)
    if (captured > Number(signedAt) + 60000 || captured < Number(signedAt) - 300000) throw new Error('Invalid capture time')
    const dated = [...packet.records.tasks.map(r => r.updated_at), ...packet.records.reviews.flatMap(r => [r.created_at, ...(r.reviewed_at ? [r.reviewed_at] : [])]), ...packet.records.latest.map(r => r.at)]
    if (dated.some(at => Date.parse(at) > Number(signedAt) + 60000)) throw new Error('Future source record')
  } catch { return answer(422, { error: 'Invalid source packet' }) }
  let client: pg.PoolClient | undefined
  try {
    const address = new URL(connectionString)
    if (!['postgres:', 'postgresql:'].includes(address.protocol) || address.searchParams.get('sslmode') !== 'verify-full') throw new Error('Verified TLS required')
    pool ??= new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, statement_timeout: 5000 })
    client = await pool.connect()
    await client.query('BEGIN'); await client.query('SET LOCAL ROLE traceli_hq_source_ingestor')
    const result = await client.query('SELECT public.hq_operating_ingest($1::jsonb) AS receipt', [JSON.stringify(packet)])
    await client.query('COMMIT')
    return answer(200, result.rows[0].receipt)
  } catch {
    if (client) await client.query('ROLLBACK').catch(() => {})
    console.warn('HQ operating source delivery unavailable')
    return answer(503, { error: 'Source delivery unavailable; retry on next source read' })
  } finally { client?.release() }
}
