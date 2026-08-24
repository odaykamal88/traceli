import { getSignUpUrl } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

import { isWorkOSConfigured } from '@/lib/workspace-access'

export const GET = async () => {
  if (!isWorkOSConfigured()) {
    redirect('/workspace')
  }

  redirect(await getSignUpUrl())
}
