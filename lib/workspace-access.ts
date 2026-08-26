import 'server-only'

import { withAuth } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

import type { WorkspaceViewer } from '@/lib/workspace-viewer'

const requiredWorkOSEnvironmentVariables = [
  'WORKOS_CLIENT_ID',
  'WORKOS_API_KEY',
  'WORKOS_COOKIE_PASSWORD',
  'NEXT_PUBLIC_WORKOS_REDIRECT_URI',
] as const

const roleLabels: Record<string, string> = {
  'procurement-officer': 'Procurement Officer',
  'panel-member': 'Panel Member',
  'procurement-director': 'Procurement Director',
  auditor: 'Auditor',
  'workspace-admin': 'Workspace Admin',
  admin: 'Admin',
  member: 'Member',
}

const allowedWorkspaceRoles = new Set([
  'procurement-officer',
  'panel-member',
  'procurement-director',
  'auditor',
  'workspace-admin',
])

export function isWorkOSConfigured() {
  return requiredWorkOSEnvironmentVariables.every((name) => Boolean(process.env[name]))
}

export async function getWorkspaceViewer(): Promise<WorkspaceViewer> {
  if (!isWorkOSConfigured()) {
    redirect('/demo?workspace=unavailable')
  }

  const { user, organizationId, role } = await withAuth({ ensureSignedIn: true })

  if (!organizationId || !role || !allowedWorkspaceRoles.has(role)) {
    redirect('/workspace/access-required')
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  return {
    id: user.id,
    name: fullName || user.email,
    email: user.email,
    organizationId,
    role: roleLabels[role] ?? role,
    mode: 'workos',
  }
}
