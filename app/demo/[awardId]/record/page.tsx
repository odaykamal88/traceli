import type { Metadata } from 'next'
import AwardDesk from '../../award-desk'
import { awardDeskScenario } from '@/lib/award-desk'

export const metadata: Metadata = {
  title: `Decision record · ${awardDeskScenario.rfp}`,
  description: 'Fictional shareable record of a reconstructed award decision — requirement, evidence state, agent prep and human judgment.',
  alternates: { canonical: `/demo/${awardDeskScenario.slug}/record` },
}

export default function DecisionRecordPage() {
  return <AwardDesk screen="record" />
}
