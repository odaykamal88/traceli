import 'server-only'

import { withAuth } from '@workos-inc/authkit-nextjs'

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

export function isWorkOSConfigured() {
  return requiredWorkOSEnvironmentVariables.every((name) => Boolean(process.env[name]))
}

export async function getWorkspaceViewer(): Promise<WorkspaceViewer> {
  if (!isWorkOSConfigured()) {
    return {
      id: 'demo-user-procurement-officer',
      name: 'Leila Mansour',
      email: 'fictional.demo@traceli.app',
      organizationId: 'demo-humanitarian-organization',
      role: 'Procurement Officer',
      mode: 'demo',
    }
  }

  const { user, organizationId, role } = await withAuth({ ensureSignedIn: true })
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  return {
    id: user.id,
    name: fullName || user.email,
    email: user.email,
    organizationId: organizationId ?? 'unassigned-organization',
    role: role ? (roleLabels[role] ?? role) : 'Member',
    mode: 'workos',
  }
}
