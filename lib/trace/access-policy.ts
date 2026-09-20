import { workspaceRoleLabels } from '@/lib/workspace-policy'

export function isLoopbackHost(host: string): boolean {
  return ['127.0.0.1', 'localhost', '[::1]'].includes(host)
}

export function localTraceEnabled(env: Record<string, string | undefined>): boolean {
  if (env.TRACELI_TRACE_MODE !== 'local' || env.NODE_ENV !== 'development' || env.VERCEL) return false
  try {
    const url = new URL(env.DATABASE_URL || '')
    // Reject connection query overrides (including host/service/SSL options).
    return ['postgres:', 'postgresql:'].includes(url.protocol) && isLoopbackHost(url.hostname) &&
      !url.search && !url.hash && url.pathname.length > 1
  } catch { return false }
}

export function traceRole(memberships: {
  userId: string; organizationId: string; status: string
  role?: { slug: string }; roles?: { slug: string }[]
}[], userId: string, organizationId: string): string | null {
  const active = memberships.filter(m => m.userId === userId && m.organizationId === organizationId && m.status === 'active')
  // Multiple active membership records are ambiguous; do not combine their privileges.
  if (active.length !== 1) return null
  const roles = new Set([active[0].role?.slug, ...(active[0].roles || []).map(r => r.slug)])
  const ordered = ['workspace-admin', 'procurement-director', 'procurement-officer', 'panel-member', 'auditor']
  const slug = ordered.find(r => roles.has(r))
  return slug ? workspaceRoleLabels[slug] : null
}
