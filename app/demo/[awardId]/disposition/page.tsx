import type { Metadata } from 'next'
import { Suspense } from 'react'
import AwardDesk, { AwardDeskFromQuery } from '../../award-desk'
import { awardDeskScenario } from '@/lib/award-desk'

export const metadata: Metadata = {
  title: `Record disposition · ${awardDeskScenario.rfp}`,
  description: 'Record a fictional human disposition against overnight agent prep for this award.',
  robots: { index: false, follow: true },
}

export default function DispositionPage() {
  return (
    <Suspense fallback={<AwardDesk screen="disposition" />}>
      <AwardDeskFromQuery screen="disposition" />
    </Suspense>
  )
}
