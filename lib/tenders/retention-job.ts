import 'server-only'
import { timingSafeEqual } from 'node:crypto'

/** Only deployment configuration determines the tenants processed by the expiry job. */
export function retentionJobScope(request: Request, env: NodeJS.ProcessEnv = process.env): string[] | null {
  const secret = env.CRON_SECRET
  const supplied = request.headers.get('authorization') ?? ''
  if (!secret || secret.length < 32) return null
  const expected = `Bearer ${secret}`
  if (Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return null
  const organizations = [...new Set((env.TRACELI_TENDER_ORGANIZATIONS ?? '').split(',').map(value => value.trim()).filter(Boolean))]
  if (!organizations.length || organizations.length > 50 || organizations.some(value => !/^org_[A-Za-z0-9_-]{1,120}$/.test(value))) {
    throw new Error('Tender expiry organizations are not configured.')
  }
  return organizations
}
