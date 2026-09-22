import { getSignInUrl, withAuth } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

import { isWorkOSConfigured } from '@/lib/workspace-access'

export const dynamic = 'force-dynamic'

/**
 * AuthKit sign-in for the upload desk.
 * The sealed return path is `/desk`. The callback stays `/auth/callback`.
 */
export const GET = async () => {
  if (!isWorkOSConfigured()) {
    redirect('/desk?auth=unavailable')
  }

  const session = await withAuth()
  if (session.user) {
    redirect('/desk')
  }

  redirect(await getSignInUrl({ returnTo: '/desk' }))
}
