import { signOut } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

import { accountSwitchReturnTo } from '@/lib/auth/public-origin'
import { isWorkOSConfigured } from '@/lib/workspace-access'

export const dynamic = 'force-dynamic'

/** Clears the session, then lands on `/auth/switch` to start a different sign-in. */
export async function POST(request: Request) {
  if (!isWorkOSConfigured()) {
    redirect('/auth/signed-out')
  }

  await signOut({ returnTo: accountSwitchReturnTo(request) })
}
