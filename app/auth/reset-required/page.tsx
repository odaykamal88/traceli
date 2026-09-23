import type { Metadata } from 'next'

import { AuthClosedNote, authUnavailable } from '../closed-note'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reset your password',
  description: 'Open the password reset link from your email to choose a new Trace-li password.',
  robots: { index: false, follow: false },
}

export default async function ResetRequiredPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string | string[] }>
}) {
  const { auth } = await searchParams
  return (
    <AuthClosedNote
      title="Open the link in your reset email"
      lede="That link lets you choose a new password, then returns you to the upload desk. If you already have a password, sign in."
      unavailable={authUnavailable(auth)}
    />
  )
}
