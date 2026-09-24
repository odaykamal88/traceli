import { signOut } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

import { signOutReturnTo } from '@/lib/auth/public-origin'
import { isWorkOSConfigured } from '@/lib/workspace-access'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isWorkOSConfigured()) {
    redirect('/auth/signed-out')
  }

  await signOut({ returnTo: signOutReturnTo(request) })
}
