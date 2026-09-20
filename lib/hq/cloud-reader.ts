import 'server-only'
import pg from 'pg'
import { z } from 'zod'
import { operatingSnapshotSchema } from '@/lib/hq/operating-contract'

const snapshotSchema = z.object({
  operating: operatingSnapshotSchema,
  checked_at: z.string(),
  workers: z.array(z.object({ actor: z.string(), mandate: z.string(), enabled: z.boolean(), monthly_limit_microusd: z.number(), reserved_microusd: z.number(), pricing_valid_until: z.string() })),
  runs: z.array(z.object({
    id: z.string(), job_id: z.string(), attempt: z.number(), status: z.string(), started_at: z.string(), finished_at: z.string().nullable(),
    input_tokens: z.coerce.number().nullable().optional(), output_tokens: z.coerce.number().nullable().optional(),
    estimated_microusd: z.number().nullable(), reserved_microusd: z.number().nullable(), cost_uncertain: z.boolean(), content_hash: z.string().nullable(),
    draft: z.object({ summary: z.string(), observations: z.array(z.object({ statement: z.string(), source_refs: z.array(z.string()) })), questions: z.array(z.string()) }).nullable(),
  })),
})
export type CloudSnapshot = z.infer<typeof snapshotSchema>
export type CloudState = { connection: 'not-configured' | 'unavailable'; snapshot: null } | { connection: 'connected'; snapshot: CloudSnapshot }
let pool: pg.Pool | undefined

/** Call only after requireHQViewer. This pool never uses the application owner
 * credential and cannot dispatch, approve or mutate any company record. */
export async function readCloudHQ(): Promise<CloudState> {
  const connectionString = process.env.HQ_READER_DATABASE_URL
  if (!connectionString) return { connection: 'not-configured', snapshot: null }
  let client: pg.PoolClient | undefined
  try {
    const address = new URL(connectionString)
    if (!['postgres:', 'postgresql:'].includes(address.protocol) || address.searchParams.get('sslmode') !== 'verify-full') throw new Error('Verified TLS required')
    pool ??= new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, statement_timeout: 5000, query_timeout: 7000, application_name: 'traceli-hq-reader' })
    client = await pool.connect()
    await client.query('BEGIN READ ONLY')
    await client.query('SET LOCAL ROLE traceli_hq_cloud_reader')
    const result = await client.query('SELECT public.hq_cloud_snapshot() AS snapshot')
    const operating = await client.query('SELECT public.hq_operating_snapshot() AS snapshot')
    await client.query('COMMIT')
    return { connection: 'connected', snapshot: snapshotSchema.parse({ ...result.rows[0].snapshot, operating: operating.rows[0].snapshot }) }
  } catch {
    if (client) await client.query('ROLLBACK').catch(() => {})
    // Never log connection strings, provider bodies, source text or credentials.
    console.warn('HQ cloud snapshot unavailable')
    return { connection: 'unavailable', snapshot: null }
  } finally { client?.release() }
}
