import 'server-only'
import type { PoolClient } from 'pg'
import { getDatabasePool } from '@/lib/db/client'
import { requireHQViewer } from '@/lib/hq/access'
import { hqBinding, type HQBinding } from '@/lib/hq/access-policy'
import { evaluateJev, JEV_SMOKE_ID, jevSmokePacket, jsonHash, publicJevReceipt, type JevReceipt } from '@/lib/hq/jev'

export function jevPreviewAllowed(env: Record<string, string | undefined>) {
  return env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === 'codex/trace-li-hq'
}
// This grants only the founder-authorized, fixed single connectivity attempt.
// HQ viewing never grants a general worker, policy or approval capability.
export async function requireJevSmokeOwner(): Promise<HQBinding | null> {
  if (!jevPreviewAllowed(process.env)) return null
  const viewer = await requireHQViewer()
  return viewer.mode === 'workos' ? hqBinding(process.env) : null
}
async function scoped<T>(binding: HQBinding, action: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getDatabasePool().connect()
  try {
    await client.query('BEGIN')
    await client.query('SET LOCAL ROLE traceli_hq_worker')
    await client.query("SELECT set_config('app.organization_id',$1,true),set_config('app.hq_actor_id',$2,true),set_config('app.hq_mandate_id','institutional-memory',true)", [binding.organizationId, binding.ownerUserId])
    await client.query("SET LOCAL statement_timeout='5s'")
    await client.query("SET LOCAL lock_timeout='2s'")
    const result = await action(client)
    await client.query('COMMIT')
    return result
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error }
  finally { client.release() }
}
export async function readJevSmoke(binding: HQBinding) {
  return scoped(binding, async client => {
    const rows = await client.query('SELECT id,evidence FROM hq_events WHERE organization_id=$1 AND id=ANY($2::text[])', [binding.organizationId, [JEV_SMOKE_ID, JEV_SMOKE_ID + '-result']])
    const reservation = rows.rows.find(r => r.id === JEV_SMOKE_ID)
    const result = rows.rows.find(r => r.id === JEV_SMOKE_ID + '-result')
    return { test_id: JEV_SMOKE_ID, state: result ? 'finished' : reservation ? 'unknown' : 'not_started', key_present: Boolean(process.env.TYPESAFE_API_KEY), receipt: result ? publicJevReceipt(result.evidence as JevReceipt) : null }
  })
}
export async function runJevSmoke(binding: HQBinding) {
  if (!process.env.TYPESAFE_API_KEY) return { test_id: JEV_SMOKE_ID, state: 'missing_key', receipt: null }
  const reserved = await scoped(binding, async client => {
    const r = await client.query(`INSERT INTO hq_events(organization_id,id,mandate_id,actor_id,event_type,evidence)
      VALUES($1,$2,'institutional-memory',$3,'jev_smoke_reserved',$4) ON CONFLICT(organization_id,id) DO NOTHING RETURNING id`,
    [binding.organizationId, JEV_SMOKE_ID, binding.ownerUserId, JSON.stringify({ approval: 'Oday confirmed key and one synthetic preview smoke 2026-09-20', input_hash: jsonHash(jevSmokePacket), maximum_attempts: 1, automatic_retry: false })])
    return r.rowCount === 1
  })
  // The durable reservation commits before any provider request, across all replicas.
  // A crash or uncertain response consumes this allowance until separately reviewed.
  if (!reserved) return { ...(await readJevSmoke(binding)), reused: true }
  const result = await evaluateJev(jevSmokePacket)
  await scoped(binding, async client => {
    await client.query(`INSERT INTO hq_events(organization_id,id,mandate_id,actor_id,event_type,evidence)
      VALUES($1,$2,'institutional-memory',$3,'jev_smoke_result',$4)`, [binding.organizationId, JEV_SMOKE_ID + '-result', binding.ownerUserId, JSON.stringify(result)])
  })
  return { test_id: JEV_SMOKE_ID, state: 'finished', reused: false, receipt: publicJevReceipt(result) }
}
