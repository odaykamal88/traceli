import type { Metadata } from 'next'

import LandingPage from '@/components/landing-page'

export const metadata: Metadata = {
  title: 'Traceli — Prove the award before you sign it',
  description:
    'Award assurance for donor-funded procurement: connect governing rules, supplier evidence, human judgment and approvals before sign-off.',
}

export default function Page() {
  return <LandingPage />
}
