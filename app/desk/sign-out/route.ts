import { signOut } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

import { isWorkOSConfigured } from '@/lib/workspace-access'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isWorkOSConfigured()) {
    redirect('/login')
  }

  const url = new URL(request.url)
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const proto = forwarded === 'http' || forwarded === 'https' ? forwarded : url.protocol.replace(':', '')
  const host = request.headers.get('host')?.trim() || url.host
  await signOut({ returnTo: `${proto}://${host}/login` })
}
