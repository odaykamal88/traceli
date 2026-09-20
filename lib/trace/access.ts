import 'server-only'

import { getWorkOS, withAuth } from '@workos-inc/authkit-nextjs'
import { headers } from 'next/headers'
import { isWorkOSConfigured } from '@/lib/workspace-access'
import type { WorkspaceViewer } from '@/lib/workspace-viewer'
import { isLoopbackHost, localTraceEnabled, traceRole } from '@/lib/trace/access-policy'

export class TraceAccessError extends Error {
  constructor() { super('Trace is unavailable for this session. Sign in with an active workspace role.') }
}

export async function requireTraceViewer(): Promise<WorkspaceViewer> {
  if (localTraceEnabled(process.env)) {
    const host = (await headers()).get('host') || ''
    let loopback = false
    try { loopback = isLoopbackHost(new URL(`http://${host}`).hostname) } catch { /* deny */ }
    if (!loopback) throw new TraceAccessError()
    return { id: 'fixture-reviewer', organizationId: 'org_trace_local', name: 'Local fixture reviewer',
      email: 'fixture@example.invalid', role: 'Procurement Director', mode: 'demo' }
  }
  if (process.env.TRACELI_TRACE_MODE !== 'workos' || !isWorkOSConfigured()) throw new TraceAccessError()
  try {
    const session = await withAuth()
    if (!session.user?.emailVerified || !session.organizationId || session.impersonator) throw new TraceAccessError()
    const workos = getWorkOS()
    const [user, memberships] = await Promise.all([
      workos.userManagement.getUser(session.user.id),
      workos.userManagement.listOrganizationMemberships({ userId: session.user.id,
        organizationId: session.organizationId, statuses: ['active'], limit: 100 }),
    ])
    const role = traceRole(memberships.data, session.user.id, session.organizationId)
    if (!role || user.id !== session.user.id || !user.emailVerified) throw new TraceAccessError()
    return { id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      email: user.email, organizationId: session.organizationId, role, mode: 'workos' }
  } catch { throw new TraceAccessError() }
}
