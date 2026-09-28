import { retentionJobScope } from '@/lib/tenders/retention-job'
import { expireTenderBatch } from '@/lib/tenders/store'
import { privateHeaders } from '@/lib/tenders/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 180

/** Retention continues when the UI rollout is disabled. Never accept scope from the request. */
export async function GET(request: Request) {
  try {
    const organizations = retentionJobScope(request)
    if (!organizations) return Response.json({ error: 'Unavailable.' }, { status: 401, headers: privateHeaders })
    let deleted = 0, receiptsExpired = 0, failed = 0
    for (const organizationId of organizations) {
      try {
        const result = await expireTenderBatch(organizationId, { limit: 25 })
        deleted += result.deleted; receiptsExpired += result.receiptsExpired
      } catch { failed++ }
    }
    return Response.json({ ok: failed === 0, deleted, receiptsExpired, failed }, { status: failed ? 503 : 200, headers: privateHeaders })
  } catch {
    return Response.json({ error: 'Retention cleanup is unavailable.' }, { status: 503, headers: privateHeaders })
  }
}
