import 'server-only'
import { getWorkOS, withAuth } from '@workos-inc/authkit-nextjs'
import { notFound, redirect } from 'next/navigation'
import { isWorkOSConfigured } from '@/lib/workspace-access'
import { hqAccessMode, hqBinding, isActiveHQOwner, isBoundHQSession } from '@/lib/hq/access-policy'

// Read access only. This is deliberately not a database principal or an approval capability.
export async function requireHQViewer(): Promise<{ mode: 'local' | 'workos' }> {
  const mode = hqAccessMode(process.env)
  if (mode === 'local') return { mode }
  const binding = hqBinding(process.env)
  if (mode !== 'workos' || !binding || !isWorkOSConfigured()) notFound()

  const session = await withAuth()
  if (!session.user) redirect('/hq/sign-in')
  if (!isBoundHQSession(binding, session)) notFound()

  // Recheck current membership on every read so a removed role is not authorized
  // by an old session claim. Provider errors fail closed; no private data is read.
  let authorized = false
  try {
    const workos = getWorkOS()
    const [user, memberships] = await Promise.all([
      workos.userManagement.getUser(binding.ownerUserId),
      workos.userManagement.listOrganizationMemberships({
        userId: binding.ownerUserId,
        organizationId: binding.organizationId,
        statuses: ['active'],
        limit: 100,
      }),
    ])
    authorized = isActiveHQOwner(binding, user, memberships.data)
  } catch {
    console.error('HQ identity verification unavailable; access denied.')
  }
  if (!authorized) notFound()
  return { mode }
}
