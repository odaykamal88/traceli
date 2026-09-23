import type { Metadata } from 'next'

import { AuthClosedNote, authUnavailable } from '../closed-note'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Invitation required',
  description: 'Trace-li accounts are issued by invitation.',
  robots: { index: false, follow: false },
}

export default async function InviteOnlyPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string | string[] }>
}) {
  const { auth } = await searchParams
  return (
    <AuthClosedNote
      title="Accounts are by invitation"
      lede="Use the link in your invitation email. It joins you to your organization, then returns you to the upload desk. An administrator assigns the procurement role after you accept."
      unavailable={authUnavailable(auth)}
    />
  )
}
