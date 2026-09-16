import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { notFound, redirect } from 'next/navigation'
import { hqAccessMode, hqBinding } from '@/lib/hq/access-policy'
import { isWorkOSConfigured } from '@/lib/workspace-access'

export const dynamic = 'force-dynamic'

export async function GET() {
  const binding = hqBinding(process.env)
  if (hqAccessMode(process.env) !== 'workos' || !binding || !isWorkOSConfigured()) notFound()
  // Fixed destination and organization; never accept returnTo or role from a URL.
  redirect(await getSignInUrl({ organizationId: binding.organizationId, returnTo: '/hq' }))
}
