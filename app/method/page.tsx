import type { Metadata } from 'next'
import { buildPublicDemoPacket } from '@/lib/trace/public-demo-data'
import PublicTraceDemo from './public-trace-demo'

export const metadata: Metadata = {
  title: 'How Trace reasons',
  description: 'Inspect fictional evidence through a rule check, human review and downloadable Trace record. Secondary to the Award desk demo.',
  alternates: { canonical: '/method' },
}

export default function MethodPage() {
  return <PublicTraceDemo packet={buildPublicDemoPacket()} />
}
