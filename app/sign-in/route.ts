import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

import { isWorkOSConfigured } from '@/lib/workspace-access'
import { tenderWorkspacesEnabled } from '@/lib/tenders/config'
import { redirectToDeskSignIn } from '@/lib/auth/desk-auth'

export const GET = async (request: Request) => {
  if (tenderWorkspacesEnabled()) await redirectToDeskSignIn(request)
  if (!isWorkOSConfigured()) {
    redirect('/demo?auth=unavailable')
  }

  redirect(await getSignInUrl())
}
