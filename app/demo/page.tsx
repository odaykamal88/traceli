import type { Metadata } from 'next'
import { Suspense } from 'react'
import AwardDesk, { AwardDeskFromQuery } from './award-desk'

export const metadata: Metadata = {
  title: 'Award desk',
  description: 'Reconstruct a fictional award: overnight agent prep, a named evidence gap, and a human disposition on a shareable decision record.',
  alternates: { canonical: '/demo' },
}

export default function DemoPage() {
  return (
    <Suspense fallback={<AwardDesk screen="desk" />}>
      <AwardDeskFromQuery screen="desk" />
    </Suspense>
  )
}
