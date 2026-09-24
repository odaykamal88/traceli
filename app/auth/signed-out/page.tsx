import type { Metadata } from 'next'

import { DeskSignedOut } from '@/app/desk/shell'

export const metadata: Metadata = {
  title: 'Signed out',
  description: 'You are signed out of Trace-li. Sign in again when you are ready, or open the public walkthrough.',
  robots: { index: false, follow: false },
}

export default function SignedOutPage() {
  return <DeskSignedOut />
}
