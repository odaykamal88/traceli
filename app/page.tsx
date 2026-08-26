import type { Metadata } from 'next'

import LandingPage from '@/components/landing-page'

export const metadata: Metadata = {
  title: 'Traceli — Every award, audit ready',
  description:
    'Draft from your rules, run the evaluation and preserve the source-linked proof behind every procurement award.',
}

export default function Page() {
  return <LandingPage />
}
